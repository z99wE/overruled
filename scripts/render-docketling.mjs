/**
 * Dev-only: rasterise the Docketling sprites so the pixel art can actually be
 * eyeballed. Not part of the build or CI.
 *   node scripts/render-docketling.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const dir = mkdtempSync(join(tmpdir(), 'docket-'));
const out = join(dir, 'docketling.mjs');
await build({ entryPoints: ['src/core/docketling.ts'], outfile: out, format: 'esm', platform: 'node' });
const { spriteFor, STAGES, PALETTE, spriteSize } = await import(pathToFileURL(out).href);

const CONCRETE = {
  k: '#06130d',
  c: '#fdf6e3',
  d: '#e8dcc0',
  e: '#06130d',
  g: '#d4af37',
  r: '#8b1a1a',
  f: '#1c3b2a',
};

const SCALE = 14;
const PAD = 14;
let bad = 0;

for (const stage of STAGES) {
  const rows = spriteFor(stage.id);
  const w = spriteSize(stage.id);
  rows.forEach((r, i) => {
    if (r.length !== w) {
      console.error(`  RAGGED  ${stage.id} row ${i}: ${r.length} cols, expected ${w}`);
      bad += 1;
    }
    for (const ch of r) {
      if (ch !== '.' && !(ch in PALETTE)) {
        console.error(`  UNKNOWN GLYPH ${JSON.stringify(ch)} in ${stage.id} row ${i}`);
        bad += 1;
      }
    }
  });
  if (rows.length !== w) {
    console.error(`  NOT SQUARE ${stage.id}: ${rows.length} rows x ${w} cols`);
    bad += 1;
  }
}

if (bad) {
  console.error(`\n${bad} sprite geometry problem(s) — fix before rendering.`);
  process.exit(1);
}
console.log('  geometry ok: all sprites square, uniform, known glyphs only\n');

const tiles = [];
let offset = 0;
for (const stage of STAGES) {
  const rows = spriteFor(stage.id);
  const w = spriteSize(stage.id);
  let rects = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      const ch = row[x];
      if (ch === '.') {
        x += 1;
        continue;
      }
      let run = 1;
      while (x + run < w && row[x + run] === ch) run += 1;
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${CONCRETE[ch]}"/>`;
      x += run;
    }
  });
  const tw = w * SCALE;
  tiles.push(
    `<g transform="translate(${offset},0)">${rects}<text x="${tw / 2}" y="${w * SCALE + 13}" font-family="monospace" font-size="11" fill="#888" text-anchor="middle">${stage.name.toUpperCase()}</text></g>`
  );
  offset += tw + PAD;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${offset - PAD}" height="${12 * SCALE + 18}">${tiles.join('')}</svg>`;
const file = join(tmpdir(), 'docketling-preview.png');
await sharp(Buffer.from(svg)).png().toFile(file);
console.log(`  wrote ${file}`);
