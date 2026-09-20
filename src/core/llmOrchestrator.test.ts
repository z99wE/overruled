import { afterEach, describe, expect, it, vi } from 'vitest';
import { LLMOrchestratorError, parseResolution, resolveTurn, buildUserPrompt } from './llmOrchestrator';
import type { LLMConfig, ScenarioBundle, ValidationResult } from '../types/legal';

const scenario: ScenarioBundle = {
  id: 'svc-1',
  title: 'Some Matter',
  clientName: 'Client',
  bench: 'High Court',
  jurisdiction: 'US',
  factualBackground: 'Facts.',
  coreDispute: 'Dispute.',
  initialJudicialFavor: 42,
  maxTurns: 3,
  availablePrecedents: [],
  opposingCounselPersona: {
    name: 'OC',
    style: 'Aggressive',
    initialOpeningStatement: 'I oppose.',
  },
  closingPrompt: 'Close.',
  statuteReferences: [],
  manifesto: {} as ScenarioBundle['manifesto'],
};

function resolutionPayload(overrides: Record<string, unknown> = {}) {
  return {
    citation_valid: true,
    bench_verdict_tag: 'SUSTAINED',
    judicial_favor_delta: 12,
    judge_dialogue: 'Noted.',
    opposing_advocate_strike: 'Against.',
    co_counsel_tactical_hint: 'Persist.',
    trial_terminated: false,
    ...overrides,
  };
}

describe('parseResolution', () => {
  it('parses a clean verbatim JSON response', () => {
    const raw = JSON.stringify({
      citation_valid: true,
      bench_verdict_tag: 'SUSTAINED',
      judicial_favor_delta: 15,
      judge_dialogue: 'Well argued.',
      opposing_advocate_strike: 'I distinguish this ruling.',
      co_counsel_tactical_hint: 'Press on the statutory hook.',
      trial_terminated: false,
    });
    const r = parseResolution(raw);
    expect(r.bench_verdict_tag).toBe('SUSTAINED');
    expect(r.judicial_favor_delta).toBe(15);
    expect(r.citation_valid).toBe(true);
    expect(r.trial_terminated).toBe(false);
  });

  it('strips markdown fences and surrounding prose', () => {
    const raw = [
      'Here is the resolution:',
      '```json',
      '{"citation_valid":false,"bench_verdict_tag":"OVERRULED","judicial_favor_delta":-20,"judge_dialogue":"Fabrication on the record.", "opposing_advocate_strike":"Unmoored citation.", "co_counsel_tactical_hint":"Cure the gap.", "trial_terminated":true}',
      '```',
      'Please advise the court.',
    ].join('\n');
    const r = parseResolution(raw);
    expect(r.bench_verdict_tag).toBe('OVERRULED');
    expect(r.judicial_favor_delta).toBe(-20);
    expect(r.trial_terminated).toBe(true);
  });

  it('clamps the favor delta to the schema bounds', () => {
    const raw = JSON.stringify({
      citation_valid: true,
      bench_verdict_tag: 'SUSTAINED',
      judicial_favor_delta: 999,
      judge_dialogue: 'a',
      opposing_advocate_strike: 'b',
      co_counsel_tactical_hint: 'c',
      trial_terminated: false,
      // unknown extra fields are ignored
      junk: true,
    });
    expect(parseResolution(raw).judicial_favor_delta).toBe(25);
  });

  it('normalises an unknown verdict tag', () => {
    const raw = JSON.stringify({
      citation_valid: true,
      bench_verdict_tag: 'CONCEDED',
      judicial_favor_delta: 3,
      judge_dialogue: 'a',
      opposing_advocate_strike: 'b',
      co_counsel_tactical_hint: 'c',
      trial_terminated: false,
    });
    expect(parseResolution(raw).bench_verdict_tag).toBe('NOTED_FOR_RECORD');
  });

  it('throws on missing required fields', () => {
    expect(() => parseResolution('{"citation_valid":true}')).toThrow(LLMOrchestratorError);
  });

  it('throws when no JSON object is present', () => {
    expect(() => parseResolution('the bench has nothing to say')).toThrow(LLMOrchestratorError);
  });

  it('throws a typed parser error (not a bare SyntaxError) for malformed JSON', () => {
    expect(() => parseResolution('the retort was {"citation_valid": true, } and nothing else')).toThrow(
      LLMOrchestratorError,
    );
  });

  it('clamps a negative overshoot to -25', () => {
    const r = parseResolution(JSON.stringify(resolutionPayload({ judicial_favor_delta: -999 })));
    expect(r.judicial_favor_delta).toBe(-25);
  });

  it('coerces a non-numeric delta to zero', () => {
    const r = parseResolution(JSON.stringify(resolutionPayload({ judicial_favor_delta: 'generous' })));
    expect(r.judicial_favor_delta).toBe(0);
  });

  it('treats a stringy terminator as truthy', () => {
    const r = parseResolution(JSON.stringify(resolutionPayload({ trial_terminated: 'true' })));
    expect(r.trial_terminated).toBe(true);
  });

  it('treats the string "false" as false for citation_valid and trial_terminated', () => {
    const r = parseResolution(JSON.stringify(resolutionPayload({ citation_valid: 'false', trial_terminated: 'false' })));
    expect(r.citation_valid).toBe(false);
    expect(r.trial_terminated).toBe(false);
  });

  it('treats non-boolean junk as false for boolean fields', () => {
    const r = parseResolution(JSON.stringify(resolutionPayload({ citation_valid: 'junk', trial_terminated: 0 })));
    expect(r.citation_valid).toBe(false);
    expect(r.trial_terminated).toBe(false);
  });

  it('normalises a missing or nonsense verdict tag', () => {
    for (const tag of ['CONCEDED', '', 'SUSTAINED!']) {
      const r = parseResolution(JSON.stringify(resolutionPayload({ bench_verdict_tag: tag })));
      expect(r.bench_verdict_tag).toBe('NOTED_FOR_RECORD');
    }
  });
});

describe('buildUserPrompt', () => {
  const validation: ValidationResult = { verified: false };

  it('includes the record posture and the current action', () => {
    const prompt = buildUserPrompt({
      scenario,
      favorBefore: 40,
      turnNumber: 1,
      maxTurns: 3,
      history: [],
      action: { kind: 'freeform_motion', rawText: 'Move to strike.' },
      validation,
    });
    expect(prompt).toContain('CORE DISPUTE: Dispute.');
    expect(prompt).toContain('JUDICIAL FAVOR BEFORE THIS TURN: 40 / 100');
    expect(prompt).toContain('Move to strike.');
    expect(prompt).toContain('UNVERIFIED citation');
  });

  it('renders verified statute authority into the grounding block', () => {
    const validation: ValidationResult = {
      verified: true,
      citedStatute: {
        id: 'st',
        citation: 'Statute Act 2001',
        name: 'Statute Act 2001',
        year: 2001,
        keyTags: [],
        domain: 'Environmental',
        sections: [{ section: '§4(1)', title: 'Consent', principle: 'Gram sabha consent required.' }],
      },
    };
    const prompt = buildUserPrompt({
      scenario,
      favorBefore: 40,
      turnNumber: 1,
      maxTurns: 3,
      history: [],
      action: { kind: 'precedent_card', precedentCardId: 'x', rawText: 'Apply the statute.' },
      validation,
    });
    expect(prompt).toContain('VERIFIED statute: Statute Act 2001');
    expect(prompt).toContain('§4(1)');
  });
});

describe('resolveTurn', () => {
  const config: LLMConfig = { provider: 'openai', apiKey: 'k', model: 'm' };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the parsed resolution alongside the raw model output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(resolutionPayload()) } }] }), {
          status: 200,
        }),
      ),
    );
    const { resolution, raw } = await resolveTurn({
      config,
      scenario,
      favorBefore: 40,
      turnNumber: 1,
      history: [],
      action: { kind: 'freeform_motion', rawText: 'Argue.' },
      validation: { verified: false },
    });
    expect(resolution.bench_verdict_tag).toBe('SUSTAINED');
    expect(resolution.citation_valid).toBe(true);
    expect(raw).toContain('SUSTAINED');
  });

  it('retries once with a repair prompt when the first response is unparseable, and recovers', async () => {
    const responses = [
      'The bench is inclined to sustain the motion but declines JSON entirely.',
      JSON.stringify(resolutionPayload({ bench_verdict_tag: 'SUSTAINED' })),
    ];
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: responses.shift() } }] }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { resolution, raw } = await resolveTurn({
      config,
      scenario,
      favorBefore: 40,
      turnNumber: 1,
      history: [],
      action: { kind: 'freeform_motion', rawText: 'Argue.' },
      validation: { verified: false },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const repairCall = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(repairCall.messages[1].content).toContain('could not be parsed');
    expect(repairCall.messages[1].content).toContain('no JSON object');
    expect(resolution.bench_verdict_tag).toBe('SUSTAINED');
    expect(raw).toContain('SUSTAINED');
  });

  it('propagates the error after a failed repair attempt', async () => {
    const bad = 'still not json, your honour';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: bad } }] }), { status: 200 }),
      ),
    );
    await expect(
      resolveTurn({
        config,
        scenario,
        favorBefore: 40,
        turnNumber: 1,
        history: [],
        action: { kind: 'freeform_motion', rawText: 'Argue.' },
        validation: { verified: false },
      }),
    ).rejects.toThrow(LLMOrchestratorError);
  });
});