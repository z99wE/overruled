import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { addDoc, createCaseFile, createIdbStore, emptyLibrary, findDoc, libraryStats } from './library';

/**
 * The IndexedDB path holds the user's legal documents, so it is the one piece of
 * the library that must not be assumed. fake-indexeddb gives a real IDB
 * implementation in tests; it is a devDependency and never ships.
 */
const g = globalThis as unknown as { indexedDB?: IDBFactory; IDBKeyRange?: unknown };
let originalIDB: IDBFactory | undefined;
let originalRange: unknown;

beforeEach(() => {
  originalIDB = g.indexedDB;
  originalRange = g.IDBKeyRange;
  g.indexedDB = new IDBFactory();
});

afterEach(() => {
  g.indexedDB = originalIDB;
  g.IDBKeyRange = originalRange;
});

const draft = { name: 'lease.txt', kind: 'text' as const, text: 'The Tenant shall pay rent.', bytes: 28 };

describe('createIdbStore', () => {
  it('reads null before anything is written', async () => {
    const lib = await createIdbStore().read();
    expect(lib).toEqual(emptyLibrary());
  });

  it('round-trips a case file with documents', async () => {
    const store = createIdbStore();
    let lib = createCaseFile('Tenancy', emptyLibrary());
    lib = addDoc(lib.files[0].id, draft, lib);
    await store.write(lib);

    const back = await store.read();
    expect(back).not.toBeNull();
    expect(back!.files[0].name).toBe('Tenancy');
    expect(back!.docs[0].text).toBe('The Tenant shall pay rent.');
    expect(findDoc(back!.files[0].docIds[0], back!)?.name).toBe('lease.txt');
  });

  it('survives a store restart (new store instance, same database)', async () => {
    let lib = createCaseFile('Persisted', emptyLibrary());
    lib = addDoc(lib.files[0].id, draft, lib);
    await createIdbStore().write(lib);

    // a fresh store object must see the previously written value
    const reopened = await createIdbStore().read();
    expect(reopened!.files[0].name).toBe('Persisted');
    expect(libraryStats(reopened!)).toMatchObject({ files: 1, docs: 1 });
  });

  it('overwrites rather than duplicating on a second write', async () => {
    const store = createIdbStore();
    let lib = createCaseFile('One', emptyLibrary());
    await store.write(lib);
    lib = createCaseFile('Two', lib);
    await store.write(lib);

    const back = await store.read();
    expect(back!.files.map((f) => f.name)).toEqual(['One', 'Two']);
  });

  it('revives a stored payload that has gone stale or corrupt', async () => {
    const store = createIdbStore();
    await store.write({ version: 1, files: [{ id: 'f', name: 'Case', docIds: ['ghost'] }], docs: [] } as never);
    const back = await store.read();
    expect(back!.files[0].docIds).toEqual([]);
  });

  it('returns null instead of throwing when IndexedDB is unavailable', async () => {
    g.indexedDB = undefined;
    const store = createIdbStore();
    await expect(store.read()).resolves.toBeNull();
  });
});
