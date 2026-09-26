/**
 * Solo knuckle test — does the demo actually WORK, not just compile?
 * Exercises the exact keyless path a judge would be shown, in Node.
 *   node scripts/smoke-demo.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = mkdtempSync(join(tmpdir(), 'smoke-'));
const out = join(dir, 'bundle.mjs');
await build({
  entryPoints: ['scripts/smoke-entry.ts'],
  outfile: out,
  bundle: true,
  format: 'esm',
  platform: 'node',
  external: ['pdfjs-dist', 'mammoth'],
});
await import(pathToFileURL(out).href);
