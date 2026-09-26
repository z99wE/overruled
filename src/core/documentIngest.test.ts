import { describe, expect, it } from 'vitest';
import { IngestError, MAX_DOC_BYTES, detectKind, ingestFile, normalise } from './documentIngest';

function file(name: string, body: string, type = 'text/plain'): File {
  return new File([body], name, { type });
}

describe('detectKind', () => {
  it('maps the extensions the desk accepts', () => {
    expect(detectKind('lease.pdf')).toBe('pdf');
    expect(detectKind('contract.docx')).toBe('docx');
    expect(detectKind('notes.txt')).toBe('text');
    expect(detectKind('README.md')).toBe('text');
  });

  it('is case-insensitive', () => {
    expect(detectKind('LEASE.PDF')).toBe('pdf');
    expect(detectKind('Contract.DocX')).toBe('docx');
  });

  it('prefers a trusted MIME type over a wrong extension', () => {
    expect(detectKind('mystery.bin', 'application/pdf')).toBe('pdf');
  });

  it('rejects legacy .doc with an actionable message', () => {
    expect(() => detectKind('old.doc')).toThrow(/Legacy \.doc/);
  });

  it('returns null for an unknown type', () => {
    expect(detectKind('photo.png', 'image/png')).toBeNull();
    expect(detectKind('noextension')).toBeNull();
  });
});

describe('normalise', () => {
  it('never eats real spaces', () => {
    expect(normalise('The Tenant shall pay rent.')).toBe('The Tenant shall pay rent.');
  });

  it('converts CRLF to LF', () => {
    expect(normalise('one\r\ntwo')).toBe('one\ntwo');
  });

  it('strips soft hyphens and zero-width characters', () => {
    expect(normalise('ter\u00ADmin\u00ADation')).toBe('termination');
    expect(normalise('a\u200Db\uFEFFc')).toBe('abc');
  });

  it('collapses runs of blank lines', () => {
    expect(normalise('a\n\n\n\n\n\nb')).toBe('a\n\n\nb');
  });

  it('trims the ends', () => {
    expect(normalise('  \n hello \n  ')).toBe('hello');
  });
});

describe('ingestFile', () => {
  it('reads a plain-text file', async () => {
    const out = await ingestFile(file('lease.txt', 'The Tenant shall pay rent.'));
    expect(out.kind).toBe('text');
    expect(out.text).toBe('The Tenant shall pay rent.');
    expect(out.name).toBe('lease.txt');
  });

  it('rejects an empty file', async () => {
    await expect(ingestFile(file('empty.txt', ''))).rejects.toThrow(/empty/i);
  });

  it('rejects an unsupported type', async () => {
    await expect(ingestFile(file('scan.png', 'binary', 'image/png'))).rejects.toBeInstanceOf(IngestError);
  });

  it('rejects a file over the size ceiling', async () => {
    const big = { size: MAX_DOC_BYTES + 1, name: 'huge.txt', type: 'text/plain' } as File;
    await expect(ingestFile(big)).rejects.toThrow(/limit is 20 MB/);
  });

  it('rejects a file that yields no readable text', async () => {
    await expect(ingestFile(file('blank.txt', '   \n  \n '))).rejects.toThrow(/No readable text/);
  });

  it('surfaces a legacy .doc refusal as an IngestError', async () => {
    await expect(ingestFile(file('legacy.doc', 'text'))).rejects.toBeInstanceOf(IngestError);
  });
});
