/**
 * Opt-in live provider check. Proves the real BYOK path works end to end:
 * origin allowlist -> request shape -> provider response -> JSON parse -> DeskResult.
 *
 * The key is read from the environment ONLY. It is never written to disk, never
 * logged, and never committed. Pass it inline, e.g.
 *
 *   GEMINI_API_KEY=<key> node scripts/live-provider-check.mjs
 *
 * This is deliberately NOT part of `npm test`: it costs money, needs a secret,
 * and is non-deterministic. Unit tests stay hermetic and mock the network.
 */
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROVIDER = process.env.LIVE_PROVIDER ?? 'gemini';
const MODEL_OVERRIDE = process.env.LIVE_MODEL || null;
const keyEnv = { gemini: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY', anthropic: 'ANTHROPIC_API_KEY', groq: 'GROQ_API_KEY' }[PROVIDER];
const apiKey = process.env[keyEnv];

if (!apiKey) {
  console.error(`No ${keyEnv} in the environment. Nothing sent.`);
  process.exit(2);
}

// A short, unambiguous lease clause: if the model invents a statute number that
// does not exist, we will see it. This is the highest-risk failure mode.
const DOC = `The tenant gave the landlord 14 days written notice to vacate the flat at 9 Riverbank Road.
The tenancy agreement was signed on 3 March 2021 and states a 12-month fixed term.
The deposit was GBP 1,150. No inventory was signed by either party.
The flat has damp on the bedroom ceiling, which the landlord says appeared last month.`;

const dir = mkdtempSync(join(tmpdir(), 'live-provider-'));
const outfile = join(dir, 'entry.mjs');
await build({
  entryPoints: ['scripts/live-entry.ts'],
  outfile,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  external: ['pdfjs-dist', 'mammoth'],
  logLevel: 'error',
});

const { runLiveCheck } = await import(pathToFileURL(outfile).href);
// Free-tier keys get rate limited and capacity throttled. Retry the whole check
// so a 429/503 does not read as a broken integration.
let code = 1;
for (let attempt = 1; attempt <= 6; attempt += 1) {
  code = await runLiveCheck({ provider: PROVIDER, apiKey, doc: DOC, model: MODEL_OVERRIDE });
  if (code !== 2) break;
  if (attempt < 6) {
    const wait = attempt * 20;
    console.log(`  (transient provider failure — retrying in ${wait}s)`);
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
}
process.exit(code);
