import { describe, expect, it } from 'vitest';
import type { Domain, Jurisdiction, OpponentPlayedCard, PrecedentCard, TurnRecord } from '../types/legal';
import {
  authorityWeight,
  computeWinner,
  dealHand,
  domainSuit,
  faceOf,
  JURISDICTION_CODE,
  seededShuffle,
} from './cardMeta';

const card = (over: Partial<PrecedentCard>): PrecedentCard => ({
  id: 'c1',
  citation: '(1973) 4 SCC 225',
  caseName: 'Kesavananda Bharati',
  year: 1973,
  court: 'Supreme Court of India',
  jurisdiction: 'IN',
  ratioDecidendi: 'Basic structure doctrine binds Parliament.',
  statutoryProvisions: [],
  keyTags: [],
  domain: 'Constitutional',
  ...over,
});

const deck: PrecedentCard[] = [1, 2, 3, 4, 5].map((n) => card({ id: `c${n}`, caseName: `Case ${n}` }));

describe('seededShuffle', () => {
  it('returns a permutation of all items', () => {
    const out = seededShuffle(deck, 'midnight-sweep');
    expect(out).toHaveLength(deck.length);
    expect([...out].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...deck].sort((a, b) => a.id.localeCompare(b.id)));
  });

  it('is deterministic for the same seed and stable across calls', () => {
    const a = seededShuffle(deck, 'x');
    const b = seededShuffle(deck, 'x');
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });

  it('varies across seeds', () => {
    const a = seededShuffle(deck, 'one').map((c) => c.id).join('');
    const b = seededShuffle(deck, 'two').map((c) => c.id).join('');
    expect(a).not.toBe(b);
  });
});

describe('dealHand', () => {
  it('deals the full verified deck in seeded order', () => {
    const hand = dealHand(deck, 'frozen-transfers');
    expect(hand.map((c) => c.id)).toEqual(seededShuffle(deck, 'frozen-transfers').map((c) => c.id));
  });

  it('keeps the same order across repeated calls for one matter', () => {
    expect(dealHand(deck, 'lands-that-never-emptied').map((c) => c.id)).toEqual(
      dealHand(deck, 'lands-that-never-emptied').map((c) => c.id),
    );
  });

  it('varies the order between different matters', () => {
    const a = dealHand(deck, 'bottle-on-the-shelf').map((c) => c.id).join('');
    const b = dealHand(deck, 'thirty-month-trial').map((c) => c.id).join('');
    expect(a).not.toBe(b);
  });
});

describe('authorityWeight', () => {
  it('ranks apex courts at five', () => {
    expect(authorityWeight('Supreme Court of India')).toBe(5);
    expect(authorityWeight('Supreme Court of the United States')).toBe(5);
    expect(authorityWeight('UK Supreme Court')).toBe(5);
    expect(authorityWeight('House of Lords')).toBe(5);
  });

  it('ranks supreme and constitutional courts at four', () => {
    expect(authorityWeight('Constitutional Court of South Africa')).toBe(4);
    expect(authorityWeight('High Court of Australia')).toBe(3);
  });

  it('ranks appellate and high courts at three, tribunals at two, others at one', () => {
    expect(authorityWeight('Court of Appeal of England and Wales')).toBe(3);
    expect(authorityWeight('National Green Tribunal')).toBe(2);
    expect(authorityWeight('Jurisdictional Court of First Instance')).toBe(1);
  });
});

describe('domainSuit', () => {
  const domains: Domain[] = [
    'Environmental', 'Constitutional', 'Digital_Rights', 'Labor', 'Tenancy',
    'Criminal', 'Administrative', 'Property', 'Tort', 'Contract', 'Indigenous',
  ];
  it('always returns a suit glyph for every domain', () => {
    for (const d of domains) {
      expect(['♠', '♥', '♦', '♣']).toContain(domainSuit(d));
    }
  });
  it('groups related domains on the same suit', () => {
    expect(domainSuit('Environmental')).toBe(domainSuit('Indigenous'));
  });
});

describe('computeWinner', () => {
  const rec = (over: Partial<TurnRecord>): TurnRecord => ({
    turnNumber: 1,
    playerAction: { kind: 'precedent_card', precedentCardId: 'c1', freeformText: '', rawText: 'x' },
    resolution: {
      citation_valid: true,
      bench_verdict_tag: 'NOTED_FOR_RECORD',
      judicial_favor_delta: 0,
      judge_dialogue: '',
      opposing_advocate_strike: '',
      co_counsel_tactical_hint: '',
      trial_terminated: false,
    },
    rawModelOutput: '',
    ...over,
  });

  it('awards the player on a sustained, verified citation', () => {
    expect(computeWinner(rec({ resolution: { ...rec({}).resolution, bench_verdict_tag: 'SUSTAINED', judicial_favor_delta: 8 } }))).toBe('player');
  });

  it('awards the opponent when favor moves against a counter-card', () => {
    const opponentCard: OpponentPlayedCard = {
      citation: '(2023) 1 SCC 1', caseName: 'Counter', year: 2023, court: 'SC', ratio: 'cuts the other way',
    };
    const r = rec({
      opposingBrief: { strike: '', raw: '', opponentCard },
      resolution: { ...rec({}).resolution, bench_verdict_tag: 'NOTED_FOR_RECORD', judicial_favor_delta: -6 },
    });
    expect(computeWinner(r)).toBe('opponent');
  });

  it('returns none for a neutral record', () => {
    expect(computeWinner(rec({ resolution: { ...rec({}).resolution, judicial_favor_delta: 1, citation_valid: false } }))).toBe('none');
  });
});

describe('faceOf', () => {
  it('merges authored and opponent card shapes', () => {
    const authored = faceOf(deck[0]);
    expect(authored.ratio).toBe('Basic structure doctrine binds Parliament.');
    expect(authored.sourceUrl).toBeUndefined();

    const dealt: OpponentPlayedCard = {
      citation: '(9) 2 SCC 11', caseName: 'Opp', year: 1990, court: 'SC', jurisdiction: 'IN', ratio: 'opposite rule',
    };
    const merged = faceOf(dealt);
    expect(merged.ratio).toBe('opposite rule');
    expect(merged.domain).toBeUndefined();
  });
});

describe('JURISDICTION_CODE', () => {
  it('covers every jurisdiction enum', () => {
    const jurisdictions: Jurisdiction[] = ['US', 'UK', 'EU', 'CA', 'AU', 'ZA', 'IN'];
    for (const j of jurisdictions) expect(JURISDICTION_CODE[j]).toBeTruthy();
  });
});