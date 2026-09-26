import { describe, expect, it } from 'vitest';
import {
  addDoc,
  createCaseFile,
  createMemoryStore,
  deleteCaseFile,
  docsInFile,
  emptyLibrary,
  findDoc,
  libraryStats,
  removeDoc,
  renameCaseFile,
  renameDoc,
  reviveLibrary,
} from './library';

const draft = { name: 'lease.txt', kind: 'text' as const, text: 'The Tenant shall pay rent.', bytes: 28 };

describe('case files', () => {
  it('creates a named file with no documents', () => {
    const lib = createCaseFile('Flat tenancy', emptyLibrary());
    expect(lib.files).toHaveLength(1);
    expect(lib.files[0].name).toBe('Flat tenancy');
    expect(lib.files[0].docIds).toEqual([]);
  });

  it('falls back to a placeholder name rather than creating a blank one', () => {
    expect(createCaseFile('   ', emptyLibrary()).files[0].name).toBe('Untitled case file');
  });

  it('renames without losing documents', () => {
    let lib = createCaseFile('Old name', emptyLibrary());
    lib = addDoc(lib.files[0].id, draft, lib);
    lib = renameCaseFile(lib.files[0].id, 'New name', lib);
    expect(lib.files[0].name).toBe('New name');
    expect(docsInFile(lib.files[0].id, lib)).toHaveLength(1);
  });

  it('ignores a rename of a file that does not exist', () => {
    const lib = createCaseFile('A', emptyLibrary());
    expect(renameCaseFile('nope', 'B', lib)).toBe(lib);
  });
});

describe('documents', () => {
  it('adds a document and links it to the case file', () => {
    let lib = createCaseFile('Case', emptyLibrary());
    lib = addDoc(lib.files[0].id, draft, lib);
    const [doc] = docsInFile(lib.files[0].id, lib);
    expect(doc.name).toBe('lease.txt');
    expect(doc.text).toContain('Tenant');
    expect(findDoc(doc.id, lib)?.id).toBe(doc.id);
  });

  it('refuses to add to a case file that does not exist', () => {
    const lib = emptyLibrary();
    expect(addDoc('ghost', draft, lib)).toBe(lib);
  });

  it('groups several documents under one case file', () => {
    let lib = createCaseFile('Case', emptyLibrary());
    const id = lib.files[0].id;
    lib = addDoc(id, draft, lib);
    lib = addDoc(id, { ...draft, name: 'amendment.txt' }, lib);
    expect(docsInFile(id, lib).map((d) => d.name)).toEqual(['lease.txt', 'amendment.txt']);
  });

  it('unlinks a removed document from its case file', () => {
    let lib = createCaseFile('Case', emptyLibrary());
    const id = lib.files[0].id;
    lib = addDoc(id, draft, lib);
    const docId = lib.docs[0].id;
    lib = removeDoc(docId, lib);
    expect(findDoc(docId, lib)).toBeNull();
    expect(docsInFile(id, lib)).toHaveLength(0);
  });

  it('renames a document', () => {
    let lib = createCaseFile('Case', emptyLibrary());
    lib = addDoc(lib.files[0].id, draft, lib);
    lib = renameDoc(lib.docs[0].id, 'Signed lease.txt', lib);
    expect(lib.docs[0].name).toBe('Signed lease.txt');
  });
});

describe('deleteCaseFile', () => {
  it('deletes its documents too, leaving nothing orphaned', () => {
    let lib = createCaseFile('Doomed', emptyLibrary());
    const doomed = lib.files[0].id;
    lib = addDoc(doomed, draft, lib);
    lib = createCaseFile('Survivor', lib);
    lib = addDoc(lib.files[1].id, { ...draft, name: 'other.txt' }, lib);
    expect(libraryStats(lib)).toMatchObject({ files: 2, docs: 2 });

    lib = deleteCaseFile(doomed, lib);

    expect(libraryStats(lib)).toMatchObject({ files: 1, docs: 1 });
    expect(lib.files[0].name).toBe('Survivor');
    expect(lib.docs[0].name).toBe('other.txt');
  });

  it('is a no-op for an unknown id', () => {
    const lib = createCaseFile('Keep', emptyLibrary());
    expect(deleteCaseFile('nope', lib)).toBe(lib);
  });
});

describe('reviveLibrary', () => {
  it('returns an empty library for junk', () => {
    expect(reviveLibrary(null)).toEqual(emptyLibrary());
    expect(reviveLibrary('nope')).toEqual(emptyLibrary());
    expect(reviveLibrary({ version: 1 })).toEqual(emptyLibrary());
  });

  it('drops malformed documents but keeps valid ones', () => {
    const lib = reviveLibrary({ version: 1, files: [], docs: [{ id: 'a', name: 'ok', text: 'x' }, { name: 'no id' }, 42] });
    expect(lib.docs).toHaveLength(1);
  });

  it('drops case files that reference a missing document', () => {
    const lib = reviveLibrary({
      version: 1,
      docs: [{ id: 'a', name: 'ok', text: 'x' }],
      files: [{ id: 'f', name: 'Case', docIds: ['a', 'ghost'] }],
    });
    expect(lib.files[0].docIds).toEqual(['a']);
  });

  it('backfills missing timestamps', () => {
    const lib = reviveLibrary({ version: 1, docs: [], files: [{ id: 'f', name: 'Case', docIds: [] }] });
    expect(typeof lib.files[0].createdAt).toBe('number');
  });
});

describe('memory store', () => {
  it('round-trips a library', async () => {
    const store = createMemoryStore();
    expect(await store.read()).toBeNull();
    let lib = createCaseFile('Case', emptyLibrary());
    lib = addDoc(lib.files[0].id, draft, lib);
    await store.write(lib);
    expect((await store.read())?.docs[0].name).toBe('lease.txt');
  });
});
