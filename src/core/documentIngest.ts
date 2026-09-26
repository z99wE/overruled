export type IngestKind = 'pdf' | 'docx' | 'text';

export interface IngestedDoc {
  name: string;
  kind: IngestKind;
  text: string;
  bytes: number;
}

export class IngestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IngestError';
  }
}

/** Hard ceiling on a single file. A 40-page contract lands far below this. */
export const MAX_DOC_BYTES = 20 * 1024 * 1024;
/** A model context window is finite; refuse rather than silently truncate. */
export const MAX_DOC_CHARS = 2_000_000;

const EXT_KIND: Record<string, IngestKind> = {
  pdf: 'pdf',
  docx: 'docx',
  doc: 'docx',
  txt: 'text',
  text: 'text',
  md: 'text',
  markdown: 'text',
};

const MIME_KIND: Record<string, IngestKind> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
  'text/plain': 'text',
  'text/markdown': 'text',
};

/** The formats the Legal Desk accepts. Legacy .doc is detected so we can reject it clearly. */
export const ACCEPT_ATTR = '.pdf,.docx,.txt,.md,.text,application/pdf,text/plain';

export function detectKind(name: string, mimeType?: string): IngestKind | null {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'doc') {
    throw new IngestError('Legacy .doc files are not supported. Save it as .docx or PDF and try again.');
  }
  const byMime = mimeType ? MIME_KIND[mimeType.toLowerCase()] : undefined;
  if (byMime) return byMime;
  return EXT_KIND[ext] ?? null;
}

/** Strip characters that break sentence splitting downstream, without touching real spaces. */
export function normalise(raw: string): string {
  // Soft hyphen, ZWNJ, ZWJ, BOM. Written as escapes so no invisible
  // characters live in the source file itself.
  // eslint-disable-next-line no-misleading-character-class -- targeting ZWNJ/ZWJ joiners is the intent, not a mistake
  const INVISIBLE = new RegExp('[\\u00AD\\u200C\\u200D\\uFEFF]', 'g');
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(INVISIBLE, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

/** `File.text()` and `File.arrayBuffer()` are missing on older Android WebViews. */
async function readBytes(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return await file.arrayBuffer();
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsArrayBuffer(file);
  });
}

/** `File.text()` is missing on older Android WebViews (Capacitor) and in jsdom. */
async function readTextFile(file: File): Promise<string> {
  if (typeof file.text === 'function') return await file.text();
  return new TextDecoder().decode(await readBytes(file));
}

async function readPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const data = new Uint8Array(await readBytes(file));
  const pdf = await pdfjs.getDocument({
    data,
    // self-hosted pdfjs assets (emitted by the pdfjs-assets Vite plugin)
    standardFontDataUrl: '/standard_fonts/',
    cMapUrl: '/cmaps/',
    cMapPacked: true,
  }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (line) pages.push(line);
  }
  return pages.join('\n\n');
}

async function readDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const bytes = await readBytes(file);
  // mammoth's browser build reads `arrayBuffer`, its node build reads `buffer`.
  // Supplying both keeps DOCX working under any bundler resolution.
  const result = await mammoth.extractRawText({
    arrayBuffer: bytes,
    buffer: bytes,
  } as unknown as Parameters<typeof mammoth.extractRawText>[0]);
  return result.value;
}

/**
 * Turn a dropped file into plain text the desk can analyse.
 * Parsers are imported on demand so a text-only session never downloads them.
 */
export async function ingestFile(file: File): Promise<IngestedDoc> {
  if (file.size === 0) {
    throw new IngestError('That file is empty.');
  }
  if (file.size > MAX_DOC_BYTES) {
    throw new IngestError(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_DOC_BYTES / 1024 / 1024} MB.`);
  }
  const kind = detectKind(file.name, file.type);
  if (!kind) {
    throw new IngestError('Unsupported file type. Upload a PDF, .docx, or plain-text file.');
  }

  let text: string;
  try {
    if (kind === 'pdf') text = await readPdf(file);
    else if (kind === 'docx') text = await readDocx(file);
    else text = await readTextFile(file);
  } catch (err) {
    if (err instanceof IngestError) throw err;
    const detail = err instanceof Error ? err.message : String(err);
    throw new IngestError(`Could not read ${file.name}. ${detail || 'The file may be corrupt or password-protected.'}`);
  }

  const clean = normalise(text ?? '');
  if (!clean) {
    throw new IngestError(
      kind === 'pdf'
        ? 'No text found in that PDF. It is probably a scan or image — run OCR on it first, then upload the text.'
        : 'No readable text found in that file.',
    );
  }
  if (clean.length > MAX_DOC_CHARS) {
    throw new IngestError(`That document is ${clean.length.toLocaleString()} characters. The limit is ${MAX_DOC_CHARS.toLocaleString()} — split it into parts.`);
  }

  return { name: file.name, kind, text: clean, bytes: file.size };
}
