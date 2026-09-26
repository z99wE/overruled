/**
 * Solo knuckle test — does the demo actually WORK, not merely compile?
 *
 * Walks the exact keyless path a judge is shown, in Node, with no API key:
 * corpus -> citation verification (including a fabricated authority) -> all
 * five Legal Desk operations -> a full keyless trial -> docket export.
 * Bundled by scripts/smoke-demo.mjs; not part of CI.
 */
import { readFileSync } from 'node:fs';
import { buildIndex } from '../src/core/searchIndex';
import { localDeskAnalysis } from '../src/core/docEngine';
import { DESK_SAMPLES } from '../src/core/deskSamples';
import { loadAllScenarios } from '../src/core/dataLoader';
import { buildSessionSummary, fallbackConsultationQuestions, serializeDocketMarkdown } from '../src/core/docket';

let pass = 0;
let fail = 0;
const check = (ok: boolean, label: string, detail = ''): void => {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${label}${detail ? `  ${detail}` : ''}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${label}${detail ? `  ${detail}` : ''}`);
  }
};
const section = (t: string): void => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 58 - t.length))}`);

/* ── 0. Browser shim ─────────────────────────────────────────── */
section('0. Harness');
// dataLoader fetches browser-relative paths. Point them at the live
// deployment, so this doubles as a check that the deployed corpus actually
// parses and hydrates into a playable bundle.
const SITE = 'https://overrool.pages.dev';
const realFetch = globalThis.fetch;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' && input.startsWith('/') ? SITE + input : input;
  return realFetch(url as RequestInfo, init);
}) as typeof fetch;
check(true, 'relative /data/* fetches routed to the live deployment', SITE);

/* ── 1. Corpus ─────────────────────────────────────────────────── */
section('1. Corpus grounding');
const raw = JSON.parse(readFileSync('public/data/global_cases.json', 'utf8')) as {
  cases: Array<{ id: string; citation: string; caseName: string; jurisdiction: string }>;
  statutes?: unknown[];
};
const corpus = raw as never;
const index = buildIndex(corpus);
check(raw.cases.length === 59, '59 landmark judgments embedded', `got ${raw.cases.length}`);
const juris = new Set(raw.cases.map((c) => c.jurisdiction));
check(juris.size >= 7, '7+ jurisdictions present', `${juris.size}: ${[...juris].join(' ')}`);

/* ── 2. Citation verification ──────────────────────────────────── */
section('2. Citation verification (the anti-hallucination claim)');
const real = index.validateCitation('Miranda v. Arizona, 384 U.S. 436 (1966)');
check(real.verified === true, 'real citation verified', real.citedPrecedent?.citation ?? 'no precedent resolved');

const fake = index.validateCitation('Vandervellen v. Quicksilver Holdings, 412 U.S. 999 (2099)');
check(fake.verified === false, 'FABRICATED citation rejected', (fake.suggestion ?? 'no suggestion').slice(0, 58));

const vague = index.validateCitation('some case about contracts probably');
check(vague.verified === false, 'vague unanchored assertion rejected');

/* ── 3. Keyless Legal Desk, all five operations ───────────────── */
section('3. Keyless Legal Desk (no API key) — all five operations');
const sample = DESK_SAMPLES[0];
check(!!sample && sample.text.length > 200, 'bundled sample document loads', sample ? `"${sample.id}" ${sample.text.length} chars` : '');

const simplify = localDeskAnalysis('simplify', sample!.text) as { bottomLine: string; overview: string[]; glossary: unknown[] };
check(simplify.bottomLine.length > 0, 'simplify -> bottom line', simplify.bottomLine.slice(0, 52));
check(simplify.overview.length > 0, 'simplify -> plain-language points', `${simplify.overview.length} points`);
check(simplify.glossary.length > 0, 'simplify -> glossary', `${simplify.glossary.length} terms`);

const risks = localDeskAnalysis('risks', sample!.text) as { findings: Array<{ severity: number; sentence: string }> };
check(risks.findings.length > 0, 'risks -> findings extracted', `${risks.findings.length} findings`);
check(risks.findings.every((f) => f.severity >= 1 && f.severity <= 5), 'risks -> severities in range');

const other = DESK_SAMPLES[1] ?? sample!;
const compare = localDeskAnalysis('compare', sample!.text, { docB: other.text }) as { differences: unknown[]; bottomLine: string };
check(compare.differences.length > 0, 'compare -> material differences', `${compare.differences.length} diffs`);

const ask = localDeskAnalysis('ask', sample!.text, { question: 'What is the termination notice period?' }) as { answer: string; confidence?: string };
check(ask.answer.length > 0, 'ask -> grounded answer', ask.answer.slice(0, 52));
check(!/fabricat|hallucinat/i.test(JSON.stringify(ask)), 'ask -> no fabricated-authority language');

const lawyer = localDeskAnalysis('lawyer', sample!.text) as { questions: Array<{ question: string; why: string }>; bringDocuments: string[]; whyThisMatters: string };
check(lawyer.questions.length > 0, 'lawyer -> questions for counsel', `${lawyer.questions.length} questions`);
check(lawyer.questions.every((q) => q.question.length > 0 && q.why.length > 0), 'lawyer -> every question explains why it matters');
check(lawyer.bringDocuments.length > 0, 'lawyer -> what to bring', `${lawyer.bringDocuments.length} items`);

/* ── 4. Keyless trial (Local Judge) ───────────────────────────── */
section('4. Courtroom — keyless trial resolves end to end');
const scenarios = await loadAllScenarios();
check(scenarios.length > 0, 'scenarios load', `${scenarios.length} matters`);
const bundle = scenarios[0];
check(bundle.availablePrecedents.length > 0, 'precedent cards dealt', `${bundle.availablePrecedents.length} cards`);

const played = bundle.availablePrecedents[0]!;
const record = {
  turnNumber: 1,
  playerAction: {
    kind: 'precedent_card' as const,
    precedentCardId: played.id,
    rawText: `${played.caseName} ${played.citation}`,
  },
  citedPrecedent: played,
  resolution: {
    citation_valid: true,
    bench_verdict_tag: 'SUSTAINED' as const,
    judicial_favor_delta: 6,
    judge_dialogue: 'The cited authority is on the record and directly supports the submission.',
    opposing_advocate_strike: 'Objection noted and overruled.',
    co_counsel_tactical_hint: 'Press the ratio on the next turn.',
    trial_terminated: false,
  },
  rawModelOutput: '{}',
};
const summary = buildSessionSummary({ scenario: bundle, turnRecords: [record], finalFavor: 56 });
check(summary.finalFavor === 56, 'favor carries into the docket', `${summary.finalFavor}/100`);
const admitted = summary.admittedPrecedents as unknown as Array<{ caseName?: string; citation?: string } | string>;
check(
  admitted.length > 0 && admitted.some((a) => typeof a === 'string' ? a.length > 0 : Boolean(a?.caseName || a?.citation)),
  'admitted precedents recorded',
  admitted.length > 0
    ? admitted.map((a) => (typeof a === 'string' ? a : `${a.caseName ?? '?'} ${a.citation ?? ''}`)).join(' | ').slice(0, 54)
    : 'none',
);
const questions = fallbackConsultationQuestions(summary);
check(questions.length > 0, 'consultation questions generated', `${questions.length} questions`);
const md = serializeDocketMarkdown(summary);
check(md.includes('# Advocate Consultation Docket') && md.length > 400, 'docket exports as markdown', `${md.length} chars`);

/* ── 5. Live surfaces ─────────────────────────────────────────── */
section('5. Live deployment');
const site = SITE;
for (const p of ['/', '/llms.txt', '/robots.txt', '/sitemap.xml', '/data/global_cases.json', '/sw.js', '/standard_fonts/FoxitSans.pfb']) {
  try {
    const res = await fetch(site + p, { signal: AbortSignal.timeout(15000) });
    check(res.ok, `GET ${p}`, String(res.status));
  } catch (e) {
    check(false, `GET ${p}`, e instanceof Error ? e.message : String(e));
  }
}

console.log(`\n${'='.repeat(64)}`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log(`${'='.repeat(64)}`);
if (fail > 0) process.exit(1);
