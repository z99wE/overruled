import { describe, expect, it } from 'vitest';
import {
  extractJson,
  localAsk,
  localCompare,
  localDeskAnalysis,
  localLawyer,
  localRisks,
  localSimplify,
} from './docEngine';

const WRONGY = [
  'The Employee shall provide services to the Company. In no event shall the Company liability exceed the Fees paid.',
  'All personal data shall be processed in the United States. Nothing in this clause limits liability for breaches of data.',
  'Notwithstanding the above, the Company may terminate this agreement without cause on 30 days notice.',
].join('\n\n');

describe('extractJson', () => {
  it('parses a bare JSON object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });
  it('tolerates prose and fences around JSON', () => {
    expect(extractJson('Here you go:\n```json\n{"ok":true,"n":2}\n```\n\nHope that helps.')).toEqual({ ok: true, n: 2 });
  });
  it('returns null when there is no object', () => {
    expect(extractJson('the model rambled')).toBeNull();
  });
  it('returns null on malformed JSON', () => {
    expect(extractJson('{ nope }')).toBeNull();
  });
});

describe('Local Rules Analyst — simplify', () => {
  const r = localSimplify(WRONGY);
  it('returns strings and a glossary', () => {
    expect(r.bottomLine.length).toBeGreaterThan(10);
    expect(Array.isArray(r.overview)).toBe(true);
    expect(r.glossary.length).toBeGreaterThan(0);
  });
  it('explains at least the liability term in plain words', () => {
    expect(r.glossary.map((g) => g.term.toLowerCase()).join(' ')).toContain('liability');
  });
});

describe('Local Rules Analyst — risks', () => {
  const r = localRisks(WRONGY);
  it('flags the cap, data, and inconsistent termination clauses', () => {
    const kinds = r.findings.map((f) => f.kind);
    expect(kinds).toContain('risk');
    expect(kinds).toContain('inconsistency');
    expect(r.findings.length).toBeGreaterThanOrEqual(3);
  });
  it('keeps severities within 1..5', () => {
    for (const f of r.findings) {
      expect([1, 2, 3, 4, 5]).toContain(f.severity);
    }
  });
});

describe('Local Rules Analyst — compare / ask / lawyer', () => {
  it('compares two documents', () => {
    const r = localCompare(WRONGY, 'The Company shall not be liable for indirect damages.');
    expect(Array.isArray(r.differences)).toBe(true);
  });
  it('answers with a quoted sentence when it can', () => {
    const r = localAsk(WRONGY, 'What happens to my personal data?');
    expect(['medium', 'low', 'high']).toContain(r.confidence);
    expect(r.answer.length).toBeGreaterThan(0);
  });
  it('produces lawyer-prep questions tied to the document', () => {
    const r = localLawyer(WRONGY);
    expect(r.questions.length).toBeGreaterThanOrEqual(4);
    expect(r.bringDocuments.length).toBeGreaterThan(1);
  });
  it('localDeskAnalysis dispatches all ops deterministically', () => {
    expect('overview' in localDeskAnalysis('simplify', WRONGY)).toBe(true);
    expect('findings' in localDeskAnalysis('risks', WRONGY)).toBe(true);
    expect('differences' in localDeskAnalysis('compare', WRONGY, { docB: 'x' })).toBe(true);
    expect('answer' in localDeskAnalysis('ask', WRONGY, { question: 'q?' })).toBe(true);
    expect('questions' in localDeskAnalysis('lawyer', WRONGY)).toBe(true);
  });
});