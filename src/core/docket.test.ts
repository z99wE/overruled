import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LegalCorpus, ScenarioManifest, TurnRecord } from '../types/legal';
import { buildSessionSummary, fallbackConsultationQuestions, serializeDocketMarkdown } from './docket';

const __dirname = dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(readFileSync(join(__dirname, '../../public/data/global_cases.json'), 'utf-8')) as LegalCorpus;
const manifests = JSON.parse(readFileSync(join(__dirname, '../../public/data/scenarios.json'), 'utf-8')) as { scenarios: ScenarioManifest[] };

function scenarioFor(id: string) {
  const m = manifests.scenarios.find((s) => s.id === id)!;
  return {
    id: m.id,
    title: m.title,
    clientName: m.clientName,
    bench: m.bench,
    jurisdiction: m.jurisdiction,
    factualBackground: m.factualBackground,
    coreDispute: m.coreDispute,
    initialJudicialFavor: m.initialJudicialFavor,
    maxTurns: m.maxTurns,
    availablePrecedents: m.precedentIds
      .map((pid) => corpus.cases.find((c) => c.id === pid))
      .filter((c): c is NonNullable<typeof c> => !!c),
    opposingCounselPersona: m.opposingCounselPersona,
    closingPrompt: m.closingPrompt,
    statuteReferences: m.statuteIds
      .map((sid) => corpus.statutes.find((s) => s.id === sid))
      .filter((s): s is NonNullable<typeof s> => !!s),
    manifesto: m,
  } as Parameters<typeof buildSessionSummary>[0]['scenario'];
}

describe('buildSessionSummary', () => {
  const scenario = scenarioFor('midnight-sweep');
  const card = corpus.cases[0];

  const sustained: TurnRecord = {
    turnNumber: 1,
    playerAction: { kind: 'precedent_card', precedentCardId: card.id, rawText: 'Play precedent card' },
    resolution: {
      citation_valid: true,
      bench_verdict_tag: 'SUSTAINED',
      judicial_favor_delta: 15,
      judge_dialogue: 'Held.',
      opposing_advocate_strike: 'I distinguish on facts.',
      co_counsel_tactical_hint: 'Press on section 4(1).',
      trial_terminated: false,
    },
    citedPrecedent: card,
    rawModelOutput: '{}',
  };

  const overruled: TurnRecord = {
    turnNumber: 2,
    playerAction: { kind: 'freeform_motion', rawText: 'Cite the Galaxy Trust case.' },
    resolution: {
      citation_valid: false,
      bench_verdict_tag: 'OVERRULED',
      judicial_favor_delta: -20,
      judge_dialogue: 'Unverified.',
      opposing_advocate_strike: 'Fabrication.',
      co_counsel_tactical_hint: 'Rely on verified law.',
      trial_terminated: true,
    },
    rawModelOutput: '{}',
  };

  it('separates admitted precedents from flagged exposure', () => {
    const summary = buildSessionSummary({ scenario, turnRecords: [sustained, overruled], finalFavor: 45 });
    expect(summary.admittedPrecedents.map((p) => p.id)).toEqual([card.id]);
    expect(summary.exposurePoints.length).toBeGreaterThanOrEqual(2);
    expect(summary.exposurePoints.join(' ').toLowerCase()).toContain('was unverified');
    expect(summary.finalFavor).toBe(45);
  });

  it('produces an indexed docket markdown with the statutory notice', () => {
    const summary = buildSessionSummary({ scenario, turnRecords: [sustained, overruled], finalFavor: 45 });
    summary.consultationQuestions = fallbackConsultationQuestions(summary);
    const md = serializeDocketMarkdown(summary);
    expect(md).toContain('# Advocate Consultation Docket');
    expect(md).toContain('Admitted Legal Precedents');
    expect(md).toContain('Identified Exposure Points');
    expect(md).toContain('Actionable Advocate Consultation Questions');
    expect(md).toContain('published judgments');
    expect(md).toContain(card.citation);
    expect(md.length).toBeGreaterThan(400);
  });

  it('moves exhausted turn expectations into final favor', () => {
    const summary = buildSessionSummary({ scenario, turnRecords: [sustained], finalFavor: 100 });
    expect(summary.finalFavor).toBe(100);
  });
});

describe('buildSessionSummary edge cases', () => {
  const scenario = scenarioFor('midnight-sweep');
  const card = corpus.cases[0];

  function rec(over: Partial<TurnRecord['resolution']>): TurnRecord {
    return {
      turnNumber: 1,
      playerAction: { kind: 'freeform_motion', rawText: 'Argue.' },
      resolution: {
        citation_valid: false,
        bench_verdict_tag: 'NOTED_FOR_RECORD',
        judicial_favor_delta: 0,
        judge_dialogue: '',
        opposing_advocate_strike: '',
        co_counsel_tactical_hint: '',
        trial_terminated: false,
        ...over,
      },
      rawModelOutput: '{}',
    };
  }

  it('flags a BENCH_WARNING as a soft exposure point', () => {
    const warning: TurnRecord = {
      ...rec({ citation_valid: true, bench_verdict_tag: 'BENCH_WARNING', judicial_favor_delta: -5, judge_dialogue: 'Don\u2019t jest.' }),
      citedPrecedent: card,
    };
    const summary = buildSessionSummary({ scenario, turnRecords: [warning], finalFavor: 50 });
    expect(summary.admittedPrecedents.map((p) => p.id)).toEqual([card.id]);
    expect(summary.exposurePoints.join(' ').toLowerCase()).toContain('bench warning');
  });

  it('gives a clean summary for a record with no citations and no dialogue', () => {
    const summary = buildSessionSummary({
      scenario,
      turnRecords: [rec({})],
      finalFavor: 50,
    });
    expect(summary.admittedPrecedents).toHaveLength(0);
    expect(Array.isArray(summary.exposurePoints)).toBe(true);
  });

  it('caps exposure and admitted precedent lists to a sane docket size', () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      i % 2
        ? { ...rec({ citation_valid: true, bench_verdict_tag: 'SUSTAINED', judicial_favor_delta: 1, trial_terminated: false }), citedPrecedent: card }
        : rec({ citation_valid: false, judicial_favor_delta: -1 }),
    );
    const summary = buildSessionSummary({ scenario, turnRecords: many, finalFavor: 50 });
    expect(summary.admittedPrecedents.length).toBeLessThanOrEqual(12);
    expect(summary.exposurePoints.length).toBeLessThanOrEqual(12);
  });

  it('reduces consultation questions to a compact, non-empty set', () => {
    const many = Array.from({ length: 20 }, () => rec({})).map((r, i) => ({ ...r, turnNumber: i + 1 }));
    const summary = buildSessionSummary({ scenario, turnRecords: many, finalFavor: 50 });
    const qs = fallbackConsultationQuestions(summary);
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.length).toBeLessThanOrEqual(5);
    expect(qs.every((q) => q.trim().length > 0)).toBe(true);
  });
});