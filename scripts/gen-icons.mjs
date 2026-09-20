import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const OUT = 'public/icons';

await mkdir(OUT, { recursive: true });

const tile = sharp('public/icon.svg');

await tile.clone().resize(192, 192).png().toFile(`${OUT}/icon-192.png`);
await tile.clone().resize(512, 512, { fit: 'contain', background: '#06130d' }).png().toFile(`${OUT}/icon-512.png`);

// Maskable-safe: felt-green background bleeds to every edge; the tile sits in
// the 80% safe zone so platform masks don't crop the glyph.
const maskable = sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: '#06130d',
  },
});
await sharp('public/icon.svg')
  .resize(410, 410)
  .png()
  .toBuffer()
  .then((buf) =>
    maskable
      .composite([{ input: buf, left: 51, top: 51 }])
      .png()
      .toFile(`${OUT}/maskable-512.png`),
  );

await tile.clone().resize(180, 180).png().toFile(`${OUT}/apple-touch-icon.png`);

console.log('icons written to public/icons/');