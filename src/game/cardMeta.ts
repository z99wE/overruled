import type { Domain, Jurisdiction, OpponentPlayedCard, PrecedentCard, TurnRecord } from '../types/legal';

/**
 * CARD META + HAND DEAL — deterministic, pure logic for the case-table card
 * game. Authority weight, domain suits, and the seeded hand deal (so a
 * matter's 5 cards keep their order across turns, remounts and restarts,
 * while still varying per scenario).
 */

export const JURISDICTION_CODE: Record<Jurisdiction, string> = {
  US: 'U.S.',
  UK: 'U.K.',
  EU: 'E.U.',
  CA: 'CAN',
  AU: 'AUS',
  ZA: 'RSA',
  IN: 'IND',
};

const SUITS = ['♠', '♥', '♦', '♣'] as const;
const DOMAIN_SUIT_INDEX: Record<Domain, number> = {
  Constitutional: 0,
  Criminal: 1,
  Digital_Rights: 2,
  Environmental: 3,
  Indigenous: 3,
  Administrative: 0,
  Property: 2,
  Tort: 1,
  Contract: 3,
  Labor: 0,
  Tenancy: 1,
};

export function domainSuit(domain: Domain): string {
  return SUITS[DOMAIN_SUIT_INDEX[domain] ?? 0];
}

/** Court seniority → authority weight (1–5), shown as gold pips on the card. */
export function authorityWeight(court: string): number {
  const c = court.toLowerCase();
  if (
    c.includes('supreme court of india') ||
    c.includes('supreme court of the united states') ||
    c.includes('uk supreme court') ||
    c.includes('house of lords')
  ) {
    return 5;
  }
  if (c.includes('constitutional court') || c.includes('supreme court')) return 4;
  if (c.includes('court of appeal') || c.includes('high court')) return 3;
  if (c.includes('tribunal')) return 2;
  return 1;
}

/** Deterministic string hash → PRNG (xmur3 + mulberry32) so deals are stable. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const a = [...items];
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Deal the matter's hand: the verified deck in seeded order. With 5 precedents
 * and 5 turns, the full deck is dealt as the hand — play one card per turn.
 * Exhausted (played) cards read from `playedIds` and render burned, never
 * re-dealt.
 */
export function dealHand(cards: readonly PrecedentCard[], scenarioId: string): PrecedentCard[] {
  return seededShuffle(cards, scenarioId);
}

export function isBurned(id: string, playedIds: ReadonlySet<string>): boolean {
  return playedIds.has(id);
}

/** Whose card carried the turn — used by the table showdown and the log. */
export function computeWinner(record: TurnRecord): 'player' | 'opponent' | 'none' {
  const r = record.resolution;
  const oppCard = record.opposingBrief?.opponentCard ?? null;
  if (r.bench_verdict_tag === 'SUSTAINED' || (r.judicial_favor_delta > 0 && r.citation_valid)) return 'player';
  if (r.judicial_favor_delta < 0 && oppCard) return 'opponent';
  return 'none';
}

/** Card face fields shared between authored precedents and dealt opponent cards. */
export interface CardFaceLike {
  citation: string;
  caseName: string;
  year: number;
  court: string;
  jurisdiction?: Jurisdiction;
  ratioDecidendi?: string;
  ratio?: string;
  domain?: Domain;
  sourceUrl?: string;
}

export function faceOf(card: CardFaceLike | PrecedentCard | OpponentPlayedCard): {
  citation: string;
  caseName: string;
  year: number;
  court: string;
  jurisdiction?: Jurisdiction;
  ratio: string;
  domain?: Domain;
  sourceUrl?: string;
} {
  const merged = card as PrecedentCard & { ratio?: string };
  return {
    citation: card.citation,
    caseName: card.caseName,
    year: card.year,
    court: card.court,
    jurisdiction: card.jurisdiction,
    ratio: merged.ratioDecidendi ?? merged.ratio ?? '',
    domain: (card as PrecedentCard).domain,
    sourceUrl: (card as PrecedentCard).sourceUrl,
  };
}