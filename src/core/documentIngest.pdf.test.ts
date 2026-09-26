import { describe, expect, it, vi } from 'vitest';

// Under Vitest there is no browser Worker, so pdfjs falls back to a fake worker
// and needs a node-resolvable module path instead of the emitted asset URL.
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', async () => {
  const { pathToFileURL } = await import('node:url');
  const { resolve } = await import('node:path');
  const href = pathToFileURL(resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
  return { default: href };
});

import { ingestFile } from './documentIngest';

/** Build a minimal but structurally valid single-page PDF containing extractable text. */
function buildPdf(lines: string[]): Uint8Array {
  const text = lines.map((l, i) => `BT /F1 14 Tf 72 ${700 - i * 20} Td (${l.replace(/[()\\]/g, '')}) Tj ET`).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

describe('ingestFile — real PDF extraction', () => {
  it('extracts text from a genuine PDF via the lazy pdfjs path', async () => {
    const bytes = buildPdf(['The Tenant shall pay rent.', 'Late payment incurs a penalty.']);
    const out = await ingestFile(new File([bytes as BlobPart], 'lease.pdf', { type: 'application/pdf' }));
    expect(out.kind).toBe('pdf');
    expect(out.text).toContain('The Tenant shall pay rent.');
    expect(out.text).toContain('Late payment incurs a penalty.');
  }, 30_000);
});
