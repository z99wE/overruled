import { describe, expect, it } from 'vitest';
import { newDuel, remainingCards, resolveDuelRound, toOpponentCard } from './duel';
import type { PrecedentCard } from '../types/legal';

const deck: PrecedentCard[] = [
  {
    id: 'oakes', citation: '[1986] 1 SCR 103', caseName: 'R v Oakes', year: 1986,
    court: 'SCC', jurisdiction: 'CA',
    ratioDecidendi: 'Proportionality test for rights limits.',
    statutoryProvisions: ['Charter s. 1'], keyTags: ['proportionality', 'charter'], domain: 'Constitutional',
  },
  {
    id: 'jordan', citation: '2016 SCC 27', caseName: 'R v Jordan', year: 2016,
    court: 'SCC', jurisdiction: 'CA',
    ratioDecidendi: 'Trial delay ceilings; beyond them delay is presumptively unreasonable.',
    statutoryProvisions: ['Charter s. 11(b)'], keyTags: ['delay', 'charter'], domain: 'Criminal',
  },
  {
    id: 'stinchcombe', citation: '[1991] 3 SCR 326', caseName: 'R v Stinchcombe', year: 1991,
    court: 'SCC', jurisdiction: 'CA',
    ratioDecidendi: 'Crown duty to disclose all relevant information to the defence.',
    statutoryProvisions: ['Charter s. 7'], keyTags: ['disclosure', 'charter'], domain: 'Criminal',
  },
];

describe('duel', () => {
  it('resolves deterministically and explains the matchup from real holdings', () => {
    const s0 = newDuel(deck, 3);
    const r1 = resolveDuelRound(s0, 'oakes', 'jordan');
    const again = resolveDuelRound(newDuel(deck, 3), 'oakes', 'jordan');
    expect(r1.round.winner).toBe(again.round.winner);
    expect(r1.round.reason).toBe(again.round.reason);
    expect(r1.round.reason).toContain('R v');
  });

  it('burns both cards and tracks the score', () => {
    let s = newDuel(deck, 5);
    const before = remainingCards(s).length;
    s = resolveDuelRound(s, 'oakes', 'jordan').state;
    expect(remainingCards(s).length).toBe(before - 2);
    expect(s.history).toHaveLength(1);
    expect(s.round).toBe(2);
  });

  it('ends when a player clinches the majority', () => {
    let s = newDuel(deck, 5);
    // oakes-vs-jordan winner is deterministic; feed rounds until someone hits 3
    // or the deck runs dry.
    for (let i = 0; i < 10 && !s.done; i++) {
      const rem = remainingCards(s);
      if (rem.length < 2) break;
      s = resolveDuelRound(s, rem[0].id, rem[1].id).state;
    }
    expect(s.done).toBe(true);
  });

  it('rejects picks outside the deck', () => {
    const s = newDuel(deck, 3);
    expect(() => resolveDuelRound(s, 'nope', 'jordan')).toThrow();
  });

  it('ties are possible and score nobody', () => {
    const s0 = newDuel(deck, 5);
    const out = resolveDuelRound(s0, 'jordan', 'stinchcombe');
    if (out.round.winner === 'tie') {
      expect(out.state.scoreA).toBe(0);
      expect(out.state.scoreB).toBe(0);
    } else {
      expect([out.state.scoreA, out.state.scoreB]).toContain(1);
    }
  });

  it('toOpponentCard preserves the real citation', () => {
    const oc = toOpponentCard(deck[0]);
    expect(oc.citation).toBe('[1986] 1 SCR 103');
    expect(oc.ratio).toContain('Proportionality');
  });
});
