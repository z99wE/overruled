import { describe, expect, it } from 'vitest';
import { trialReducer, type TrialState } from './useTrial';
import type { ScenarioBundle, TurnRecord } from '../types/legal';

const scenario: ScenarioBundle = {
  id: 'svc-1',
  title: 'Some Matter',
  clientName: 'Client',
  bench: 'High Court',
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
  manifesto: {
    id: 'svc-1',
    title: 'Some Matter',
    clientName: 'Client',
    bench: 'High Court',
    factualBackground: 'Facts.',
    coreDispute: 'Dispute.',
    initialJudicialFavor: 42,
    maxTurns: 3,
    precedentIds: [],
    statuteIds: [],
    opposingCounselPersona: {
      name: 'OC',
      style: 'Aggressive',
      initialOpeningStatement: 'I oppose.',
    },
    closingPrompt: 'Close.',
  },
};

function record(delta: number, opts: Partial<TurnRecord['resolution']> = {}): TurnRecord {
  return {
    turnNumber: 1,
    playerAction: { kind: 'freeform_motion', rawText: 'Argue.' },
    resolution: {
      citation_valid: true,
      bench_verdict_tag: 'SUSTAINED',
      judicial_favor_delta: delta,
      judge_dialogue: 'Noted.',
      opposing_advocate_strike: 'Against.',
      co_counsel_tactical_hint: 'Persist.',
      trial_terminated: false,
      ...opts,
    },
    rawModelOutput: '{}',
  };
}

function started(): TrialState {
  return trialReducer({} as TrialState, { type: 'START', scenario });
}

describe('trialReducer', () => {
  it('START initialises the case posture', () => {
    const s = started();
    expect(s.phase).toBe('opening');
    expect(s.favor).toBe(42);
    expect(s.turn).toBe(1);
    expect(s.history).toEqual([]);
    expect(s.maxTurns).toBe(scenario.maxTurns);
  });

  it('RESOLVING flips the phase without mutating the record', () => {
    const s = trialReducer(started(), { type: 'RESOLVING' });
    expect(s.phase).toBe('resolving');
    expect(s.history).toEqual([]);
  });

  it('VERDICT appends the record and clamps favor to [0, 100]', () => {
    const base = trialReducer(started(), { type: 'RESOLVING' });
    const high = trialReducer(base, { type: 'VERDICT', scenario, record: record(60) });
    expect(high.favor).toBe(100);
    expect(high.last?.resolution.judicial_favor_delta).toBe(60);
    expect(high.phase).toBe('verdict');
    const low = trialReducer(base, { type: 'VERDICT', scenario, record: record(-200) });
    expect(low.favor).toBe(0);
  });

  it('NEXT_TURN advances until an expiry condition trips', () => {
    const afterVerdict = trialReducer(started(), { type: 'VERDICT', scenario, record: record(5) });
    const next = trialReducer(afterVerdict, { type: 'NEXT_TURN', scenario });
    expect(next.phase).toBe('awaiting');
    expect(next.turn).toBe(2);
  });

  it('NEXT_TURN ends the trial when the bench terminates it', () => {
    const afterVerdict = trialReducer(started(), {
      type: 'VERDICT',
      scenario,
      record: record(5, { trial_terminated: true }),
    });
    const ended = trialReducer(afterVerdict, { type: 'NEXT_TURN', scenario });
    expect(ended.phase).toBe('docket');
    expect(ended.summary?.finalFavor).toBe(47);
  });

  it('NEXT_TURN ends the trial on the final turn', () => {
    const late = trialReducer(started(), { type: 'START', scenario });
    const lastTurn = trialReducer(late, { type: 'VERDICT', scenario, record: record(1) });
    const forced = { ...lastTurn, turn: scenario.maxTurns } as TrialState;
    const ended = trialReducer(forced, { type: 'NEXT_TURN', scenario });
    expect(ended.phase).toBe('docket');
    expect(ended.summary).toBeTruthy();
  });

  it('NEXT_TURN ends the trial when favor bottoms out or maxes out', () => {
    const zero = trialReducer(started(), { type: 'VERDICT', scenario, record: record(-50) });
    expect(trialReducer(zero, { type: 'NEXT_TURN', scenario }).phase).toBe('docket');

    const hundred = trialReducer(started(), { type: 'VERDICT', scenario, record: record(60) });
    expect(trialReducer(hundred, { type: 'NEXT_TURN', scenario }).phase).toBe('docket');
  });

  it('REVERT returns to the awaiting phase (failed resolution)', () => {
    const resolving = trialReducer(started(), { type: 'RESOLVING' });
    const reverted = trialReducer(resolving, { type: 'REVERT' });
    expect(reverted.phase).toBe('awaiting');
  });

  it('END_TRIAL flushes a session summary', () => {
    const afterVerdict = trialReducer(started(), { type: 'VERDICT', scenario, record: record(8) });
    const ended = trialReducer(afterVerdict, { type: 'END_TRIAL', scenario });
    expect(ended.phase).toBe('docket');
    expect(ended.summary?.caseTitle).toBe(scenario.title);
    expect(ended.summary?.turnRecords).toHaveLength(1);
  });
});