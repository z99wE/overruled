import { describe, expect, it } from 'vitest';
import { buildPrintHtml, escapeHtml } from '../components/DocketExportModal';
import type { ScenarioBundle, SessionSummary } from '../types/legal';

const scenario: ScenarioBundle = {
  id: 'svc-1',
  title: 'Matter <script>alert(1)</script>',
  clientName: 'Client & Co',
  bench: 'High Court',
  factualBackground: 'Facts.',
  coreDispute: 'Dispute.',
  initialJudicialFavor: 42,
  maxTurns: 3,
  availablePrecedents: [],
  opposingCounselPersona: { name: 'OC', style: 'Aggressive', initialOpeningStatement: 'I oppose.' },
  closingPrompt: 'Close.',
  statuteReferences: [],
  manifesto: {} as ScenarioBundle['manifesto'],
};

const summary: SessionSummary = {
  finalFavor: 62,
  completedAt: new Date('2026-01-02T10:00:00Z').toISOString(),
  caseTitle: 'Matter',
  clientName: 'Client & Co',
  bench: 'High Court',
  turnRecords: [
    {
      turnNumber: 1,
      playerAction: { kind: 'freeform_motion', rawText: 'Move <script>Alert(0)</script>' },
      resolution: {
        citation_valid: true,
        bench_verdict_tag: 'SUSTAINED',
        judicial_favor_delta: 12,
        judge_dialogue: 'Noted.',
        opposing_advocate_strike: 'Against.',
        co_counsel_tactical_hint: 'Persist.',
        trial_terminated: false,
      },
      rawModelOutput: '{}',
    },
  ],
  admittedPrecedents: [
    {
      id: 'c1',
      citation: '(2013) 6 SCC 476',
      caseName: 'Orissa <b>Mining</b>',
      year: 2013,
      court: 'Supreme Court of India',
      ratioDecidendi: '"The consent" principle & such',
      statutoryProvisions: [],
      keyTags: [],
      domain: 'Constitutional',
    },
  ],
  exposurePoints: ['Unverified citation <img onerror=alert(1) src=x>'],
  consultationQuestions: [],
};

describe('escapeHtml', () => {
  it('escapes the four HTML-special characters', () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});

describe('buildPrintHtml', () => {
  it('neutralises script injection across every interpolated field', () => {
    const html = buildPrintHtml(scenario, summary);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('</a>');
    expect(html).toContain('Matter &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('Move &lt;script&gt;Alert(0)&lt;/script&gt;');
    expect(html).toContain('Orissa &lt;b&gt;Mining&lt;/b&gt;');
    expect(html).toContain('Client &amp; Co');
  });

  it('prints the fallback prompt when consultation questions are empty', () => {
    const html = buildPrintHtml(scenario, summary);
    expect(html).toContain('Run refinement to populate this section.');
  });

  it('renders consultation questions when present', () => {
    const withQs = { ...summary, consultationQuestions: ['Should we challenge venue? <b>bold</b>', 'Any limitation risk?'] };
    const html = buildPrintHtml(scenario, withQs);
    expect(html).toContain('Should we challenge venue? &lt;b&gt;bold&lt;/b&gt;');
    expect(html).not.toContain('Run refinement to populate this section.');
  });

  it('embeds the statutory disclaimer and exposure list', () => {
    const html = buildPrintHtml(scenario, summary);
    expect(html).toContain('does not provide legal advice');
    expect(html).toContain('Unverified citation &lt;img onerror=alert(1) src=x&gt;');
    expect(html).toContain('SUSTAINED');
  });
});