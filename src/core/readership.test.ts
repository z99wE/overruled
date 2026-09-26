import { describe, expect, it } from 'vitest';
import { docKey, hashText, recordUnderstood } from './readership';

describe('hashText', () => {
  it('is stable for the same input', () => {
    expect(hashText('a lease')).toBe(hashText('a lease'));
  });

  it('separates different inputs', () => {
    expect(hashText('a lease')).not.toBe(hashText('a lease '));
    expect(hashText('clause one')).not.toBe(hashText('clause two'));
  });
});

describe('docKey', () => {
  it('prefers the library id so the same document is not counted twice', () => {
    expect(docKey('some text', 'doc-7')).toBe('lib:doc-7');
  });

  it('falls back to a content hash for pasted text', () => {
    expect(docKey('pasted', null)).toBe(`txt:${hashText('pasted')}`);
  });

  it('ignores surrounding whitespace when hashing', () => {
    expect(docKey('  padded  ', null)).toBe(docKey('padded', null));
  });
});

describe('recordUnderstood', () => {
  it('counts a document once', () => {
    const one = recordUnderstood([], 'a');
    expect(recordUnderstood(one, 'a')).toBe(one);
    expect(recordUnderstood(one, 'a')).toHaveLength(1);
  });

  it('counts distinct documents', () => {
    expect(recordUnderstood(recordUnderstood([], 'a'), 'b')).toHaveLength(2);
  });

  it('is bounded so localStorage cannot grow without limit', () => {
    let log: string[] = [];
    for (let i = 0; i < 500; i += 1) log = recordUnderstood(log, `doc-${i}`);
    expect(log.length).toBeLessThanOrEqual(200);
    expect(log).toContain('doc-499');
    expect(log).not.toContain('doc-0');
  });
});
