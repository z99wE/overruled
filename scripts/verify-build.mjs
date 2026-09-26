/**
 * Post-build assertions. A green `vite build` is not proof the deployable is
 * correct: a plugin can silently stop emitting an asset directory and every
 * document upload breaks in production while the build stays green.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const failures = [];
const note = (ok, msg) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) failures.push(msg);
};

if (!existsSync(DIST)) {
  console.error('dist/ not found — run the build first.');
  process.exit(1);
}

note(existsSync(join(DIST, 'index.html')), 'index.html emitted');

const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const entry = html.match(/src="\/assets\/[^"]+\.js"/)?.[0]?.slice(5, -1);
note(Boolean(entry), `entry chunk referenced by index.html${entry ? ` (${entry})` : ''}`);

if (entry) {
  note(existsSync(join(DIST, entry.slice(1))), `entry chunk present on disk (${entry})`);
}

// pdfjs needs these to read non-embedded-font PDFs. Missing them degrades
// extraction silently, so assert them rather than trusting the plugin.
for (const dir of ['standard_fonts', 'cmaps']) {
  const full = join(DIST, dir);
  const present = existsSync(full) && readdirSync(full).length > 0;
  const count = present ? readdirSync(full).filter((f) => statSync(join(full, f)).isFile()).length : 0;
  note(present, `${dir}/ emitted (${count} files)`);
}

// The parsers must stay out of the first load.
if (entry) {
  const src = readFileSync(join(DIST, entry), 'utf8');
  note(!/from"\.\/pdf-/.test(src), 'pdfjs is not statically imported by the entry chunk');
  note(/import\("\.\/pdf-[^"]+"\)/.test(src), 'pdfjs is lazy-loaded via dynamic import()');
}

// Corpus and crawler surfaces ship as static assets.
for (const asset of ['data/global_cases.json', 'data/scenarios.json', 'llms.txt', 'robots.txt', 'sitemap.xml', 'manifest.webmanifest', 'sw.js']) {
  note(existsSync(join(DIST, asset)), `${asset} shipped`);
}

if (failures.length) {
  console.error(`\n${failures.length} build assertion(s) failed.`);
  process.exit(1);
}
console.log('\nAll build assertions passed.');
