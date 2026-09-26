import type { IngestKind } from './documentIngest';

export interface LibraryDoc {
  id: string;
  name: string;
  kind: IngestKind;
  text: string;
  bytes: number;
  addedAt: number;
}

export interface CaseFile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  docIds: string[];
}

export interface Library {
  version: 1;
  files: CaseFile[];
  docs: LibraryDoc[];
}

export const LIBRARY_VERSION = 1 as const;
const DB_NAME = 'overrool-library';
const DB_STORE = 'library';
const DB_KEY = 'current';

export function emptyLibrary(): Library {
  return { version: LIBRARY_VERSION, files: [], docs: [] };
}

function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isCaseFile(v: unknown): v is CaseFile {
  if (typeof v !== 'object' || v === null) return false;
  const f = v as Record<string, unknown>;
  return typeof f.id === 'string' && typeof f.name === 'string' && Array.isArray(f.docIds);
}

export function isLibraryDoc(v: unknown): v is LibraryDoc {
  if (typeof v !== 'object' || v === null) return false;
  const d = v as Record<string, unknown>;
  return typeof d.id === 'string' && typeof d.name === 'string' && typeof d.text === 'string';
}

/** Tolerant of corrupt or partial payloads: drop junk, keep whatever is well-formed. */
export function reviveLibrary(raw: unknown): Library {
  if (typeof raw !== 'object' || raw === null) return emptyLibrary();
  const r = raw as Record<string, unknown>;
  const docs = Array.isArray(r.docs) ? r.docs.filter(isLibraryDoc) : [];
  const known = new Set(docs.map((d) => d.id));
  const files = Array.isArray(r.files)
    ? r.files.filter(isCaseFile).map((f) => ({
        id: f.id,
        name: f.name,
        createdAt: typeof f.createdAt === 'number' ? f.createdAt : Date.now(),
        updatedAt: typeof f.updatedAt === 'number' ? f.updatedAt : Date.now(),
        // never keep a dangling reference to a document that failed validation
        docIds: f.docIds.filter((id): id is string => typeof id === 'string' && known.has(id)),
      }))
    : [];
  return { version: LIBRARY_VERSION, files, docs };
}

export function createCaseFile(name: string, existing: Library): Library {
  const trimmed = name.trim() || 'Untitled case file';
  const now = Date.now();
  const file: CaseFile = { id: uid(), name: trimmed, createdAt: now, updatedAt: now, docIds: [] };
  return { ...existing, files: [...existing.files, file] };
}

export function renameCaseFile(id: string, name: string, lib: Library): Library {
  if (!lib.files.some((f) => f.id === id)) return lib;
  return {
    ...lib,
    files: lib.files.map((f) => (f.id === id ? { ...f, name: name.trim() || f.name, updatedAt: Date.now() } : f)),
  };
}

/** Deleting a case file removes its documents too — nothing is orphaned. */
export function deleteCaseFile(id: string, lib: Library): Library {
  const target = lib.files.find((f) => f.id === id);
  if (!target) return lib;
  const removed = new Set(target.docIds);
  return {
    ...lib,
    files: lib.files.filter((f) => f.id !== id),
    docs: lib.docs.filter((d) => !removed.has(d.id)),
  };
}

export function addDoc(fileId: string, doc: Omit<LibraryDoc, 'id' | 'addedAt'>, lib: Library): Library {
  if (!lib.files.some((f) => f.id === fileId)) return lib;
  const entry: LibraryDoc = { ...doc, id: uid(), addedAt: Date.now() };
  return {
    version: LIBRARY_VERSION,
    docs: [...lib.docs, entry],
    files: lib.files.map((f) => (f.id === fileId ? { ...f, docIds: [...f.docIds, entry.id], updatedAt: Date.now() } : f)),
  };
}

export function removeDoc(docId: string, lib: Library): Library {
  return {
    version: LIBRARY_VERSION,
    docs: lib.docs.filter((d) => d.id !== docId),
    files: lib.files.map((f) =>
      f.docIds.includes(docId) ? { ...f, docIds: f.docIds.filter((id) => id !== docId), updatedAt: Date.now() } : f,
    ),
  };
}

export function renameDoc(docId: string, name: string, lib: Library): Library {
  if (!lib.docs.some((d) => d.id === docId)) return lib;
  return { ...lib, docs: lib.docs.map((d) => (d.id === docId ? { ...d, name: name.trim() || d.name } : d)) };
}

export function docsInFile(fileId: string, lib: Library): LibraryDoc[] {
  const file = lib.files.find((f) => f.id === fileId);
  if (!file) return [];
  return file.docIds
    .map((id) => lib.docs.find((d) => d.id === id))
    .filter((d): d is LibraryDoc => Boolean(d));
}

export function findDoc(docId: string, lib: Library): LibraryDoc | null {
  return lib.docs.find((d) => d.id === docId) ?? null;
}

export function libraryStats(lib: Library): { files: number; docs: number; chars: number } {
  return { files: lib.files.length, docs: lib.docs.length, chars: lib.docs.reduce((n, d) => n + d.text.length, 0) };
}

export interface LibraryStore {
  read(): Promise<Library | null>;
  write(lib: Library): Promise<void>;
}

export function createMemoryStore(initial: Library | null = null): LibraryStore {
  let current = initial;
  return {
    async read() {
      return current;
    },
    async write(lib) {
      current = lib;
    },
  };
}

function idbFactory(): IDBFactory | null {
  try {
    return typeof indexedDB !== 'undefined' ? indexedDB : null;
  } catch {
    return null;
  }
}

/**
 * IndexedDB holds the document text: a single 40-page contract is far past the
 * ~5 MB localStorage ceiling, and this is precisely the data that must survive
 * a reload. Falls back to memory when IndexedDB is unavailable (private mode,
 * older WebViews, tests) so the desk still works for the current session.
 */
export function createIdbStore(): LibraryStore {
  const factory = idbFactory();
  if (!factory) return createMemoryStore();

  const open = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
      const req = factory.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(DB_STORE)) req.result.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
    });

  return {
    async read() {
      try {
        const db = await open();
        return await new Promise<Library | null>((resolve, reject) => {
          const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(DB_KEY);
          req.onsuccess = () => resolve(reviveLibrary(req.result));
          req.onerror = () => reject(req.error);
        });
      } catch {
        return null;
      }
    },
    async write(lib) {
      const db = await open();
      await new Promise<void>((resolve, reject) => {
        const req = db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).put(lib, DB_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    },
  };
}
