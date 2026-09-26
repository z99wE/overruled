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
import { trialReducer, INITIAL_TRIAL_STATE } from '../src/core/useTrial';
import { resolveTurnSparring } from '../src/game/localJudge';
import type { PlayerAction } from '../src/types/legal';

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

/* ── 4. A REAL keyless trial, driven through the actual reducer ─ */
section('4. Courtroom — full keyless trial through trialReducer');
const scenarios = await loadAllScenarios();
check(scenarios.length > 0, 'scenarios load', `${scenarios.length} matters`);
const bundle = scenarios[0];
check(bundle.availablePrecedents.length > 0, 'precedent cards dealt', `${bundle.availablePrecedents.length} cards`);

let state = trialReducer(INITIAL_TRIAL_STATE, { type: 'START', scenario: bundle });
check(state.phase === 'awaiting' && state.turn === 1, 'START -> awaiting on turn 1', `phase=${state.phase} turn=${state.turn}`);

// Play every card in the hand, one per turn, exactly as the controller does:
// validate the citation, resolve with the Local Judge, then VERDICT + NEXT_TURN.
let localJudgeRulings = 0;
const hand = bundle.availablePrecedents.slice(0, Math.min(3, bundle.availablePrecedents.length));
for (let i = 0; i < hand.length; i += 1) {
  const card = hand[i]!;
  const validation = index.validateCitation(`${card.caseName} ${card.citation}`);
  const action: PlayerAction = {
    kind: 'precedent_card',
    precedentCardId: card.id,
    rawText: `${card.caseName} ${card.citation}`,
  };

  state = trialReducer(state, { type: 'RESOLVING' });
  check(state.phase === 'resolving', `turn ${i + 1}: RESOLVING`, state.phase);

  // The keyless bench: no LLM, deterministic Local Judge.
  const { resolution } = await resolveTurnSparring({
    scenario: bundle,
    action,
    validation,
    turnNumber: state.turn,
    maxTurns: state.maxTurns,
    history: state.history,
    streak: state.streak,
  });
  localJudgeRulings += 1;

  state = trialReducer(state, { type: 'VERDICT', scenario: bundle, record: { turnNumber: state.turn, playerAction: action, citedPrecedent: card, resolution, rawModelOutput: 'local' } });
  check(state.phase === 'verdict' && state.last !== null, `turn ${i + 1}: VERDICT recorded`, `${resolution.bench_verdict_tag} favor ${state.favor}`);
  check(resolution.judge_dialogue.length > 0 && resolution.opposing_advocate_strike.length > 0, `turn ${i + 1}: Local Judge spoke`, `"${resolution.judge_dialogue.slice(0, 40)}…"`);

  state = trialReducer(state, { type: 'NEXT_TURN', scenario: bundle });
}

check(localJudgeRulings === hand.length, 'every turn resolved keylessly', `${localJudgeRulings} rulings, no LLM`);
check(state.history.length === hand.length, 'history accumulated one record per turn', `${state.history.length} records`);
check(new Set(state.playedCardIds).size === state.playedCardIds.length, 'no card replayed across turns', state.playedCardIds.join(', '));
check(state.favor > 0 && state.favor !== 50, 'favor moved off the neutral start', `${state.favor}/100`);
check(state.pot > 0, 'pot accumulated', String(state.pot));
check(state.streak >= 1, 'streak tracked', String(state.streak));

const summary4 = state.summary ?? buildSessionSummary({ scenario: bundle, turnRecords: state.history, finalFavor: state.favor });
check(summary4.turnRecords.length === state.history.length, 'summary built from real history', `${summary4.turnRecords.length} turns`);
check(summary4.admittedPrecedents.length > 0, 'admitted precedents recorded', summary4.admittedPrecedents.map((a) => `${a.caseName ?? '?'}`).join(' | ').slice(0, 54));
const questions4 = fallbackConsultationQuestions(summary4);
check(questions4.length > 0, 'consultation questions generated', `${questions4.length} questions`);
const md4 = serializeDocketMarkdown(summary4);
check(md4.includes('# Advocate Consultation Docket') && md4.length > 400, 'docket exports as markdown', `${md4.length} chars`);
check(md4.includes(bundle.clientName), 'docket names the client', bundle.clientName);

// A spent card must stay spent: REVERT rewinds the phase only, so a card
// already on the record can never be replayed. (REVERT returning to 'awaiting'
// without clearing playedCardIds is the whole point.)
const spentId = state.playedCardIds[0]!;
state = trialReducer(state, { type: 'REVERT' });
check(state.phase === 'awaiting', 'REVERT returns to awaiting', state.phase);
check(state.playedCardIds.includes(spentId), 'REVERT cannot resurrect a spent card', `${spentId} still spent`);
check(state.history.length === hand.length, 'REVERT does not erase the record', `${state.history.length} turns still on the record`);

state = trialReducer(state, { type: 'END_TRIAL', scenario: bundle });
check(state.phase === 'docket' && state.summary !== null, 'END_TRIAL -> docket with summary flushed', `phase=${state.phase}`);

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
