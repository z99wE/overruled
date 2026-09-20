import { describe, expect, it } from 'vitest';
import { localVerdict, pickOpponentCard } from './localJudge';
import type { PlayerAction, PrecedentCard, ScenarioBundle, TurnRecord } from '../types/legal';

const deck: PrecedentCard[] = [
  {
    id: 'a',
    citation: '[1986] 1 SCR 103',
    caseName: 'R v Oakes',
    year: 1986,
    court: 'Supreme Court of Canada',
    jurisdiction: 'CA',
    ratioDecidendi: 'Limits on rights must be demonstrably justified: pressing objective, rational connection, minimal impairment, proportionality.',
    statutoryProvisions: ['Charter s. 1'],
    keyTags: ['proportionality'],
    domain: 'Constitutional',
  },
  {
    id: 'b',
    citation: '2016 SCC 27',
    caseName: 'R v Jordan',
    year: 2016,
    court: 'Supreme Court of Canada',
    jurisdiction: 'CA',
    ratioDecidendi: 'Reasonable trial delay is capped; beyond the ceiling the delay is presumptively unreasonable.',
    statutoryProvisions: ['Charter s. 11(b)'],
    keyTags: ['delay'],
    domain: 'Criminal',
  },
];

const scenario: ScenarioBundle = {
  id: 'svc-1',
  title: 'Some Matter',
  clientName: 'Client',
  bench: 'High Court',
  jurisdiction: 'CA',
  factualBackground: 'Facts.',
  coreDispute: 'Dispute.',
  initialJudicialFavor: 50,
  maxTurns: 4,
  availablePrecedents: deck,
  opposingCounselPersona: { name: 'OC', style: 'Aggressive', initialOpeningStatement: 'I oppose.' },
  closingPrompt: 'Close.',
  statuteReferences: [],
  manifesto: {} as ScenarioBundle['manifesto'],
};

function cardAction(): PlayerAction {
  return {
    kind: 'precedent_card',
    precedentCardId: 'a',
    rawText: 'Move: apply [1986] 1 SCR 103 — R v Oakes. The measure fails minimal impairment.',
  };
}

function validation(verified = true) {
  return verified
    ? { verified: true, citedPrecedent: deck[0] }
    : { verified: false };
}

describe('localJudge', () => {
  it('sustains a verified card play with a positive delta and a counter-card', () => {
    const v = localVerdict({
      scenario,
      action: cardAction(),
      validation: validation(true),
      turnNumber: 1,
      maxTurns: 4,
      history: [],
      streak: 0,
    });
    expect(v.resolution.bench_verdict_tag).toBe('SUSTAINED');
    expect(v.resolution.judicial_favor_delta).toBeGreaterThan(0);
    expect(v.resolution.citation_valid).toBe(true);
    expect(v.brief.origin).toBe('sparring');
    expect(v.brief.opponentCard).toBeTruthy();
    // The counter-card must be a REAL deck case, never invented.
    expect(deck.map((c) => c.citation)).toContain(v.brief.opponentCard!.citation);
  });

  it('downgrades unverified prose to NOTED or WARNING and never verifies it', () => {
    const action: PlayerAction = { kind: 'freeform_motion', rawText: 'The delay offends fundamental justice in this matter, on reflection.' };
    const v = localVerdict({
      scenario,
      action,
      validation: validation(false),
      turnNumber: 2,
      maxTurns: 4,
      history: [],
      streak: 0,
    });
    expect(v.resolution.citation_valid).toBe(false);
    expect(['NOTED_FOR_RECORD', 'BENCH_WARNING']).toContain(v.resolution.bench_verdict_tag);
  });

  it('is deterministic for identical inputs', () => {
    const args = {
      scenario,
      action: cardAction(),
      validation: validation(true),
      turnNumber: 2,
      maxTurns: 4,
      history: [] as TurnRecord[],
      streak: 0,
    };
    const a = localVerdict(args);
    const b = localVerdict(args);
    expect(a.resolution.judge_dialogue).toBe(b.resolution.judge_dialogue);
    expect(a.brief.opponentCard?.citation).toBe(b.brief.opponentCard?.citation);
  });

  it('pickOpponentCard never deals a card the player already exhausted', () => {
    const history: TurnRecord[] = [
      {
        turnNumber: 1,
        playerAction: { kind: 'precedent_card', precedentCardId: 'a', rawText: 'apply a' },
        resolution: {
          citation_valid: true,
          bench_verdict_tag: 'SUSTAINED',
          judicial_favor_delta: 12,
          judge_dialogue: 'x',
          opposing_advocate_strike: 'y',
          co_counsel_tactical_hint: 'z',
          trial_terminated: false,
        },
        rawModelOutput: '',
      },
    ];
    for (let turn = 2; turn < 8; turn++) {
      const card = pickOpponentCard(scenario, cardAction(), history, turn);
      if (card) expect(card.citation).toBe('2016 SCC 27'); // 'a' is played; only 'b' remains
    }
  });

  it('final-turn submissions carry amplified stakes', () => {
    const gentle = localVerdict({
      scenario,
      action: cardAction(),
      validation: validation(true),
      turnNumber: 3,
      maxTurns: 4,
      history: [],
      streak: 0,
    });
    const final = localVerdict({
      scenario,
      action: cardAction(),
      validation: validation(true),
      turnNumber: 4,
      maxTurns: 4,
      history: [],
      streak: 0,
    });
    expect(final.resolution.judicial_favor_delta).toBeGreaterThan(gentle.resolution.judicial_favor_delta);
  });
});
