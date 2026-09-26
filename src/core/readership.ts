/**
 * Tracks which documents the reader has actually worked through, so the
 * companion can grow from real activity rather than page visits.
 *
 * Local only, capped, and keyed by library id where one exists so the same
 * document is never counted twice. A pasted document falls back to a content
 * hash, which means re-reading the same text does not inflate the count.
 */

const KEY = 'overrool.reading.v1';
/** Bound the stored set: a long-term reader must not grow localStorage forever. */
const CAP = 200;

export function hashText(text: string): string {
  // FNV-1a: short, stable, and adequate for de-duplicating local text.
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

export function docKey(text: string, libraryId?: string | null): string {
  return libraryId ? `lib:${libraryId}` : `txt:${hashText(text.trim())}`;
}

export type ReadingLog = string[];

export function recordUnderstood(log: ReadingLog, key: string): ReadingLog {
  if (log.includes(key)) return log;
  const next = [...log, key];
  return next.length > CAP ? next.slice(next.length - CAP) : next;
}

function store(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadReadingLog(): ReadingLog {
  try {
    const raw = store()?.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveReadingLog(log: ReadingLog): void {
  try {
    store()?.setItem(KEY, JSON.stringify(log));
  } catch {
    /* private mode or quota exhausted: the companion still works this session */
  }
}
