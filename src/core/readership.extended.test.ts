/**
 * Extended coverage tests for readership.ts — covers loadReadingLog and
 * saveReadingLog which were 0% covered in the initial audit.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { loadReadingLog, saveReadingLog, recordUnderstood, hashText, docKey } from './readership';

describe('loadReadingLog', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns an empty array when nothing is stored', () => {
    expect(loadReadingLog()).toEqual([]);
  });

  it('round-trips a saved log', () => {
    const log = ['lib:doc-1', 'lib:doc-2'];
    saveReadingLog(log);
    expect(loadReadingLog()).toEqual(log);
  });

  it('returns an empty array for malformed JSON in storage', () => {
    localStorage.setItem('overrool.reading.v1', '{not-json}');
    expect(loadReadingLog()).toEqual([]);
  });

  it('returns an empty array when stored value is not an array', () => {
    localStorage.setItem('overrool.reading.v1', JSON.stringify({ foo: 'bar' }));
    expect(loadReadingLog()).toEqual([]);
  });

  it('filters out non-string entries from stored array', () => {
    localStorage.setItem('overrool.reading.v1', JSON.stringify(['valid', 42, null, 'also-valid']));
    expect(loadReadingLog()).toEqual(['valid', 'also-valid']);
  });
});

describe('saveReadingLog', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists the log so loadReadingLog returns the same value', () => {
    const log = ['lib:doc-a', 'txt:abc123'];
    saveReadingLog(log);
    expect(loadReadingLog()).toEqual(log);
  });

  it('overwrites a previous log', () => {
    saveReadingLog(['old']);
    saveReadingLog(['new']);
    expect(loadReadingLog()).toEqual(['new']);
  });

  it('handles an empty log', () => {
    saveReadingLog([]);
    expect(loadReadingLog()).toEqual([]);
  });
});

describe('hashText determinism', () => {
  it('is deterministic across multiple calls', () => {
    const inputs = ['', 'a', 'hello world', '日本語', 'special chars !@#$%^&*()'];
    for (const input of inputs) {
      expect(hashText(input)).toBe(hashText(input));
    }
  });

  it('returns a non-empty string', () => {
    expect(hashText('test').length).toBeGreaterThan(0);
  });

  it('handles an empty string without throwing', () => {
    expect(() => hashText('')).not.toThrow();
  });
});

describe('docKey edge cases', () => {
  it('falls back to hash when libraryId is an empty string (falsy)', () => {
    // An empty string is falsy in JS, so docKey treats it the same as null
    expect(docKey('some text', '')).toBe(`txt:${hashText('some text')}`);
  });

  it('uses hash when libraryId is undefined', () => {
    const result = docKey('hello', undefined);
    expect(result).toBe(`txt:${hashText('hello')}`);
  });
});

describe('recordUnderstood preserves tail on overflow', () => {
  it('the most recent entries survive a cap overflow', () => {
    let log: string[] = [];
    for (let i = 0; i < 250; i++) {
      log = recordUnderstood(log, `doc-${i}`);
    }
    // The newest 200 must be present
    expect(log).toContain('doc-249');
    expect(log).toContain('doc-50'); // 249 - 199 = 50
    expect(log.length).toBe(200);
  });
});
