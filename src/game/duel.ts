import type { Domain, Jurisdiction, OpponentPlayedCard } from '../types/legal';
import type { PrecedentCard } from '../types/legal';

/**
 * PASS-AND-PLAY DUEL — two humans, one device, card vs card.
 *
 * Each round both players secretly pick a case from the shared real corpus
 * deck; the phones pass; the cards hit the felt together. The pure judge
 * below resolves the matchup deterministically from the real holdings.
 */

export type DuelSide = 'A' | 'B';

export interface DuelRound {
  aCardId: string;
  bCardId: string;
  winner: DuelSide | 'tie';
  reason: string;
}

export interface DuelState {
  deck: PrecedentCard[];
  round: number;
  bestOf: number;
  scoreA: number;
  scoreB: number;
  usedIds: string[];
  history: DuelRound[];
  done: boolean;
}

export function newDuel(deck: PrecedentCard[], bestOf = 5): DuelState {
  return { deck, round: 1, bestOf, scoreA: 0, scoreB: 0, usedIds: [], history: [], done: false };
}

export function remainingCards(state: DuelState): PrecedentCard[] {
  return state.deck.filter((c) => !state.usedIds.includes(c.id));
}

function domainAffinity(a: Domain, b: Domain): number {
  return a === b ? 1 : 0;
}

/**
 * Matchup scoring: how hard does `attack` hit `defense`?
 * Real-holding-driven heuristics:
 *  - same-domain authority argues better (ratio actually applies),
 *  - more statutory hooks = more attack surface,
 *  - older authority is more vulnerable to being read narrowly.
 */
function attackScore(attack: PrecedentCard, defense: PrecedentCard): number {
  let s = 0;
  s += domainAffinity(attack.domain, defense.domain) * 2;
  s += Math.min(3, attack.statutoryProvisions.length) * 0.4;
  s += (attack.keyTags.some((t) => defense.keyTags.includes(t)) ? 1 : 0) * 1.2;
  // Newer authority carries more weight against an older one.
  s += (attack.year - defense.year) * 0.02;
  return s;
}

/**
 * Resolve a round. Deterministic: same picks, same outcome, same reason —
 * so two players can argue about the law rather than about the referee.
 */
export function resolveDuelRound(state: DuelState, aCardId: string, bCardId: string): { state: DuelState; round: DuelRound } {
  const a = state.deck.find((c) => c.id === aCardId);
  const b = state.deck.find((c) => c.id === bCardId);
  if (!a || !b) throw new Error('Duel picks must come from the shared deck.');

  const aAttack = attackScore(a, b);
  const bAttack = attackScore(b, a);
  let winner: DuelSide | 'tie';
  let reason: string;

  if (Math.abs(aAttack - bAttack) < 0.5) {
    winner = 'tie';
    reason = `Both authorities land with equal force — the bench splits on ${a.domain.toLowerCase()} vs ${b.domain.toLowerCase()}.`;
  } else if (aAttack > bAttack) {
    winner = 'A';
    reason = `${a.caseName} cuts harder against ${b.caseName}: same-domain pressure and overlapping grounds beat a narrower holding.`;
  } else {
    winner = 'B';
    reason = `${b.caseName} cuts harder against ${a.caseName}: the counter-authority's ratio reaches further on these facts.`;
  }

  const round: DuelRound = { aCardId, bCardId, winner, reason };
  const usedIds = [...state.usedIds, aCardId, bCardId];
  const scoreA = state.scoreA + (winner === 'A' ? 1 : 0);
  const scoreB = state.scoreB + (winner === 'B' ? 1 : 0);
  const roundsPlayed = state.history.length + 1;
  const majority = Math.floor(state.bestOf / 2) + 1;
  const remainingAfter = state.deck.length - usedIds.length;

  return {
    state: {
      ...state,
      round: state.round + 1,
      scoreA,
      scoreB,
      usedIds,
      history: [...state.history, round],
      // A duel ends on majority, after bestOf rounds, or when the deck is
      // too dry to deal the next matchup.
      done:
        scoreA >= majority ||
        scoreB >= majority ||
        roundsPlayed >= state.bestOf ||
        remainingAfter < 2,
    },
    round,
  };
}

/** Convenience: convert a corpus case into the opponent-card view shape. */
export function toOpponentCard(c: PrecedentCard): OpponentPlayedCard {
  return {
    citation: c.citation,
    caseName: c.caseName,
    year: c.year,
    court: c.court,
    jurisdiction: c.jurisdiction as Jurisdiction | undefined,
    ratio: c.ratioDecidendi,
  };
}
