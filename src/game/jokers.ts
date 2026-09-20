import type { BenchVerdictTag } from '../types/legal';

export type Rarity = 'common' | 'rare' | 'legendary';

export type JokerId =
  | 'amici'
  | 'bare-act'
  | 'bar-expansion'
  | 'clean-hands'
  | 'nuisance-value'
  | 'bad-faith'
  | 'distinguished-counsel'
  | 'bench-intimidator'
  | 'eleventh-hour'
  | 'loose-citation'
  | 'old-money'
  | 'silk';

export interface JokerDef {
  id: JokerId;
  name: string;
  rarity: Rarity;
  cost: number;
  blurb: string;
}

export const JOKERS: JokerDef[] = [
  { id: 'amici', name: 'Amici Briefs', rarity: 'common', cost: 100, blurb: '+30 chips whenever you play a card from your deck.' },
  { id: 'bar-expansion', name: 'Bar Expansion', rarity: 'common', cost: 140, blurb: '+2 cards in every dealt deck.' },
  { id: 'bare-act', name: 'The Bare Act', rarity: 'common', cost: 110, blurb: '+1 mult on NOTED FOR RECORD — weak wins still count.' },
  { id: 'clean-hands', name: 'Clean Hands', rarity: 'common', cost: 120, blurb: 'BENCH WARNING no longer breaks your streak.' },
  { id: 'nuisance-value', name: 'Nuisance Value', rarity: 'common', cost: 90, blurb: 'Even OVERRULED turns bank 40 chips.' },
  { id: 'bad-faith', name: 'Bad Faith Objection', rarity: 'rare', cost: 180, blurb: '+2 mult every turn the opposing agent strikes.' },
  { id: 'distinguished-counsel', name: 'Distinguished Counsel', rarity: 'rare', cost: 200, blurb: '×2 mult while your streak is 3 or higher.' },
  { id: 'bench-intimidator', name: 'Bench Intimidator', rarity: 'rare', cost: 170, blurb: 'The opening turn of every matter scores ×2.' },
  { id: 'eleventh-hour', name: 'Eleventh Hour', rarity: 'rare', cost: 210, blurb: 'The final turn scores ×3.' },
  { id: 'loose-citation', name: 'The Loose Citator', rarity: 'legendary', cost: 280, blurb: 'Unverified citations score as if verified. The bench suspects nothing.' },
  { id: 'old-money', name: 'Old Money', rarity: 'rare', cost: 190, blurb: '+50% chips from every matter payout.' },
  { id: 'silk', name: 'Taking Silk', rarity: 'legendary', cost: 320, blurb: 'While a boss rule is punishing you, score ×2.' },
];

export function jokerById(id: JokerId): JokerDef | undefined {
  return JOKERS.find((j) => j.id === id);
}

const RARITY_CLS: Record<Rarity, string> = {
  common: 'bg-felt-700 text-cream',
  rare: 'bg-poker-blue-deep text-cream',
  legendary: 'bg-chip-gold text-ink',
};

export function rarityCls(r: Rarity): string {
  return RARITY_CLS[r];
}

/** Streak carry: misses reset, unless Clean Hands spares a warning. */
export function nextStreak(prev: number, tag: BenchVerdictTag, jokers: JokerId[]): number {
  if (tag === 'SUSTAINED') return prev + 1;
  if (tag === 'BENCH_WARNING' && jokers.includes('clean-hands')) return prev;
  return 0;
}

/** Payout multiplier from jokers. */
export function payoutMultiplier(jokers: JokerId[]): number {
  return jokers.includes('old-money') ? 1.5 : 1;
}
