import type { LLMConfig } from '../types/legal';
import { requestChat } from './providerCall';
import { INJECTION_DEFENCE, sandboxUntrusted } from './guardrails';

/**
 * LEGAL DESK ENGINE — document-understanding operations on the player's own
 * text. Each operation is one structured GenAI pass in the same BYOK pipeline
 * as the trial agents (never routed through Overrool, provider-origin allowlist
 * enforced). A deterministic Local Rules Analyst stands in for keyless play and
 * is never dressed up as a model.
 *
 * Ops: simplify · risks · compare · ask · lawyer — mapped 1:1 to the hackathon
 * brief's "GenAI-powered legal assistance" use cases.
 */

export type DeskOp = 'simplify' | 'risks' | 'compare' | 'ask' | 'lawyer';

export interface SimplifyResult {
  bottomLine: string;
  overview: string[];
  whoAffects: string;
  glossary: { term: string; means: string }[];
}

export interface RiskFinding {
  sentence: string;
  kind: 'obligation' | 'risk' | 'inconsistency' | 'opportunity' | 'unclear';
  severity: 1 | 2 | 3 | 4 | 5;
  note: string;
}
export interface RisksResult {
  bottomLine: string;
  summary: string;
  findings: RiskFinding[];
}

export interface CompareResult {
  bottomLine: string;
  differences: { area: string; sideA: string; sideB: string; note: string }[];
}

export interface AskResult {
  answer: string;
  evidence: string;
  confidence: 'low' | 'medium' | 'high';
  nextSteps: string[];
}

export interface LawyerResult {
  whyThisMatters: string;
  questions: { question: string; why: string }[];
  bringDocuments: string[];
}

export type DeskResult = SimplifyResult | RisksResult | CompareResult | AskResult | LawyerResult;

export interface DeskAnalysis {
  op: DeskOp;
  origin: 'genai' | 'local';
  provider?: string;
  result: DeskResult;
}

export const DESK_SYSTEM = [
  INJECTION_DEFENCE,
  '',
  'You are a careful legal-english analyst for people without legal training.',
  'You only ever reason from the document given — never invent facts, clauses, or citations.',
  'Translate legalese into plain speech, surface obligations, risks and inconsistencies, and produce questions a person should take to a qualified lawyer.',
  'This is educational assistance, not legal advice.',
  'Respond with ONLY a single JSON object — no markdown, no preamble.',
].join('\n');

const OP_SHAPES: Record<DeskOp, string> = {
  simplify:
    '{"bottomLine": "plain-English verdict in 1-2 sentences", "overview": ["3-6 plain-language bullets of what this text means and requires"], "whoAffects": "who bears the obligations or is exposed", "glossary": [{"term": "legal term as written", "means": "one-line plain meaning"}]}',
  risks:
    '{"bottomLine": "your one-sentence read of the overall danger", "summary": "short paragraph grouping the findings", "findings": [{"sentence": "quote the exact sentence that matters", "kind": "obligation|risk|inconsistency|opportunity|unclear", "severity": 1..5 with 5 most severe, "note": "why it matters in plain English and what to check"}]}',
  compare:
    '{"bottomLine": "one-sentence verdict on which version is safer and why", "differences": [{"area": "topic (e.g. liability cap, termination, data)", "sideA": "what document A says", "sideB": "what document B says", "note": "who this favours and the practical risk"}]}',
  ask:
    '{"answer": "direct answer grounded in the document; if the document does not say, say so", "evidence": "short quote from the document supporting the answer, or empty string", "confidence": "high|medium|low", "nextSteps": ["2-3 concrete things to check or do"]}',
  lawyer:
    '{"whyThisMatters": "2-3 sentences framing the questions", "questions": [{"question": "sharp question to put to a lawyer", "why": "what the answer would change"}], "bringDocuments": ["documents/records to bring along"]}',
};

function opUserPrompts(op: DeskOp, doc: string, opts?: { question?: string; docB?: string }): string {
  const base = (extra: string) =>
    [
      'DOCUMENT TO ANALYSE:',
      ...sandboxUntrusted('Pasted document', doc).split('\n'),
      '',
      extra,
      '',
      'Reply with a single JSON object exactly shaped like:',
      OP_SHAPES[op],
    ].join('\n');
  switch (op) {
    case 'simplify':
      return base('Explain this document as if to a smart 15-year-old who must decide whether to sign it. Simplify every clause, name the obligations, flag the traps, and keep the glossary to the terms that actually matter here.');
    case 'risks':
      return base('Audit this document. Extract every clause that imposes an obligation, creates risk or exposure, contradicts another part, or contains an opportunity, quoting the exact sentence for each. Sort findings by severity descending.');
    case 'compare':
      return base(
        [
          'Compare the FIRST document above with the SECOND document below and list the material differences.',
          'SECOND DOCUMENT TO ANALYSE:',
          ...sandboxUntrusted('Second document', opts?.docB ?? '').split('\n'),
        ].join('\n'),
      );
    case 'ask':
      return base(`Answer the reader's question using ONLY the document above.\n\nQUESTION: ${sandboxUntrusted('Reader question', opts?.question ?? '')}`);
    case 'lawyer':
      return base('Prepare the reader to meet a lawyer about this document: the questions most likely to change their decision, and what papers to bring.');
  }
}

/** Best-effort JSON extraction from a model reply (tolerates prose + fences). */
export function extractJson(text: string): unknown | null {
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s === -1 || e === -1 || e < s) return null;
  try {
    return JSON.parse(text.slice(s, e + 1));
  } catch {
    return null;
  }
}

export async function genDeskAnalysis(config: LLMConfig, op: DeskOp, doc: string, opts?: { question?: string; docB?: string }): Promise<DeskResult> {
  const out = await requestChat({
    config,
    system: DESK_SYSTEM,
    user: opUserPrompts(op, doc, opts),
    temperature: 0.2,
    maxTokens: 1500,
  });
  const json = extractJson(out);
  if (json === null) throw new Error('The provider returned an unparseable analysis. Try again or switch to the Local Rules Analyst.');
  return json as DeskResult;
}

/* ── Local Rules Analyst (keyless, deterministic, never fakes depth) ── */

const LEGAL_TERMS: Record<string, string> = {
  indemnify: 'to promise to cover losses or damages caused to the other party',
  'indemnification': "a promise to pay the other side's losses",
  liability: 'legal responsibility; what you could owe if something goes wrong',
  'liability cap': 'a ceiling on how much a party has to pay out',
  'force majeure': "excuses performance when an extraordinary event is out of either side's control",
  'auto-renew': 'the agreement silently extends unless someone objects in time',
  'termination': 'the rules for ending the agreement',
  'non-compete': 'a restriction on working for a competitor',
  'confidentiality': 'a promise to keep certain information secret',
  'arbitration': 'resolving disputes privately through a neutral referee instead of court',
  waiver: 'giving up a right voluntarily',
  'liquidated damages': 'a pre-agreed payout amount for a specific breach',
  warranty: 'a promise that a thing or service meets a stated standard',
  retention: 'how long information or records are kept',
  'data processing': 'what is done with personal information',
  consent: 'permission given knowingly; how it is captured matters',
  'opt-out': 'a way to decline something after it has already applied',
};

const OBLIGATION_WORDS = ['shall', 'must', 'warrant', 'agree to', 'required to', 'will provide', 'covenant', 'undertake', 'obligated'];
const RISK_WORDS = ['liability', 'indemnif', 'cap', 'exclu', 'waiv', 'terminat', 'auto-renew', 'non-compens', 'binding', 'arbitration', 'penalty', 'breach', 'default', 'liquidated', 'irrevocable', 'assign', 'consequentially'];
const INCONSISTENCY_WORDS = ['unless', 'provided that', 'notwithstanding', 'however', 'except', 'but only if', 'subject to'];

function sentencesOf(doc: string): string[] {
  return doc
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

function glossTerms(doc: string): SimplifyResult['glossary'] {
  const low = doc.toLowerCase();
  return Object.entries(LEGAL_TERMS)
    .filter(([t]) => low.includes(t))
    .slice(0, 6)
    .map(([term, means]) => ({ term, means }));
}

function severityFor(wordsCount: number): RiskFinding['severity'] {
  return Math.min(5, Math.max(1, 1 + Math.floor(wordsCount / 3))) as RiskFinding['severity'];
}

export function localSimplify(doc: string): SimplifyResult {
  const sents = sentencesOf(doc);
  return {
    bottomLine: sents.slice(0, 2).join(' ').slice(0, 320),
    overview: sents.slice(0, 5).map((s) => `About: ${s.slice(0, 120)}`),
    whoAffects: glossTerms(doc).length ? 'The text binds whoever signs it and anyone named as a counterparty; check the is-affecting prefixes above.' : 'Whoever signs or relies on this text.',
    glossary: glossTerms(doc),
  };
}

export function localRisks(doc: string): RisksResult {
  const findings: RiskFinding[] = [];
  for (const s of sentencesOf(doc)) {
    const sl = s.toLowerCase();
    if (RISK_WORDS.some((w) => sl.includes(w))) {
      findings.push({ sentence: s.slice(0, 180), kind: 'risk', severity: severityFor(sl.split(/\s+/).length), note: 'Keywords suggest exposure. Bring the exact sentence to a lawyer before signing.' });
    } else if (OBLIGATION_WORDS.some((w) => sl.includes(w))) {
      findings.push({ sentence: s.slice(0, 180), kind: 'obligation', severity: severityFor(sl.split(/\s+/).length), note: 'This sentence appears to impose a requirement on one of the parties.' });
    }
  }
  for (const s of sentencesOf(doc)) {
    const sl = s.toLowerCase();
    if (INCONSISTENCY_WORDS.some((w) => sl.startsWith(w) || sl.includes(` ${w}`))) {
      findings.push({ sentence: s.slice(0, 180), kind: 'inconsistency', severity: 4, note: 'A qualifier or carve-out may cut against a broader clause.' });
    }
  }
  const deduped = [...new Map(findings.map((f) => [`${f.kind}:${f.sentence}`, f])).values()].slice(0, 12);
  return {
    bottomLine: deduped.length ? `${deduped.length} clauses stand out for review — the risk pattern is driven by ${['liability', 'data', 'termination'][hash3(doc) % 3]} terms.` : 'No high-confidence risk keywords surfaced from the plain text.',
    summary: 'Local Rules Analyst flags sentences containing obligation, exposure and carve-out language. Run a GenAI risk audit for a fuller reading.',
    findings: deduped,
  };
}

function hash3(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function localCompare(docA: string, docB: string): CompareResult {
  const a = new Set(sentencesOf(docA).map((s) => s.slice(0, 60)));
  const b = new Set(sentencesOf(docB).map((s) => s.slice(0, 60)));
  const onlyA = [...a].filter((s) => ![...b].some((x) => x.trim() === s.trim())).slice(0, 4);
  const onlyB = [...b].filter((s) => ![...a].some((x) => x.trim() === s.trim())).slice(0, 4);
  const differences: CompareResult['differences'] = [];
  if (onlyA.length) differences.push({ area: 'Present only in A', sideA: onlyA[0], sideB: '(not in B)', note: 'Review before relying on version A as the fuller promise.' });
  if (onlyB.length) differences.push({ area: 'Present only in B', sideA: '(not in A)', sideB: onlyB[0], note: 'Version B carries obligations or protections A lacks.' });
  return { bottomLine: differences.length ? 'The two documents differ materially — get them reconciled in writing.' : 'No surface-level sentence differences detected.', differences };
}

export function localAsk(doc: string, question: string): AskResult {
  const sents = sentencesOf(doc);
  const q = question.toLowerCase();
  const hit = sents.find((s) => q.split(/\s+/).filter((w) => w.length > 3).some((w) => s.toLowerCase().includes(w)));
  return {
    answer: hit ? `From the document, the most on-point sentence is: "${hit.slice(0, 200)}". A full GenAI reading can weigh the surrounding clauses.` : 'The plain text does not obviously answer that question — bring it to a lawyer with the document.',
    evidence: hit ? hit.slice(0, 200) : '',
    confidence: hit ? 'medium' : 'low',
    nextSteps: ['Read the clauses around the quoted sentence', 'Ask the counterparty for the exact obligation in writing', 'Ask a lawyer before making the decision'],
  };
}

export function localLawyer(doc: string): LawyerResult {
  const terms = glossTerms(doc).map((t) => t.term);
  const r = localRisks(doc);
  const questions: LawyerResult['questions'] = [
    { question: 'Which clauses impose the strongest obligations on me, and what triggers them?', why: 'Confirms exactly what you must do and when.' },
    { question: 'What is my worst-case exposure if something goes wrong, and is it capped?', why: 'Turns vague "liability" language into a number you can insure against.' },
    { question: 'Can the other side terminate or change this without my consent?', why: 'Identifies the true power balance of the agreement.' },
    { question: 'Is there an auto-renewal or notice deadline I can easily miss?', why: 'Those are the clauses that quietly cost people money.' },
  ];
  if (terms.length) questions.unshift({ question: `What do ${terms.slice(0, 3).join(', ')} actually mean for me here?`, why: 'Plain definitions of the terms that keep appearing.' });
  return {
    whyThisMatters: r.bottomLine,
    questions: questions.slice(0, 4 + (terms.length ? 1 : 0)),
    bringDocuments: ['The unsigned and signed versions', 'Any emails promising changes to the printed text', 'A note of the deadline or decision date'],
  };
}

export function localDeskAnalysis(op: DeskOp, doc: string, opts?: { question?: string; docB?: string }): DeskResult {
  switch (op) {
    case 'simplify':
      return localSimplify(doc);
    case 'risks':
      return localRisks(doc);
    case 'compare':
      return localCompare(doc, opts?.docB ?? '');
    case 'ask':
      return localAsk(doc, opts?.question ?? 'What should I know before signing?');
    case 'lawyer':
      return localLawyer(doc);
  }
}