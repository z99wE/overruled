import type { BenchVerdictTag, TurnResolution } from '../types/legal';

/**
 * GAME ECONOMY — pure functions only.
 *
 * Every verdict the bench hands down is scored like a Balatro hand:
 * chips × mult. Chips come from the verdict itself and how it was played;
 * mult comes from quality events (verified citation, streak, card play).
 * Nothing here touches the trial engine — this layer rides on top of it.
 */

export interface ScoreEvent {
  chips: number;
  mult: number;
  label: string;
}

export interface TurnScore {
  events: ScoreEvent[];
  chips: number;
  mult: number;
  total: number;
}

const BASE_HANDS: Record<BenchVerdictTag, ScoreEvent> = {
  SUSTAINED: { chips: 60, mult: 3, label: 'SUSTAINED' },
  NOTED_FOR_RECORD: { chips: 30, mult: 1.5, label: 'NOTED FOR RECORD' },
  BENCH_WARNING: { chips: 15, mult: 1, label: 'BENCH WARNING' },
  OVERRULED: { chips: 0, mult: 0.5, label: 'OVERRULED' },
};

export function baseHand(res: TurnResolution): ScoreEvent {
  return { ...BASE_HANDS[res.bench_verdict_tag] };
}

export interface ScoreContext {
  /** Consecutive verified SUSTAINED verdicts so far in this trial (before this turn). */
  streak: number;
  /** The player played a precedent card from their deck this turn. */
  playedCard: boolean;
  /** Owned jokers — build-around modifiers composed into the scoring. */
  jokers?: import('./jokers').JokerId[];
  /** 1-based turn number of the current turn. */
  turnNumber?: number;
  /** Total turns in the matter. */
  maxTurns?: number;
  /** True when a boss rule is in force (static matters). */
  bossActive?: boolean;
}

export function scoreTurn(res: TurnResolution, ctx: ScoreContext): TurnScore {
  const events: ScoreEvent[] = [baseHand(res)];

  // An OVERRULED argument is a busted hand: nothing banks — no streak chips,
  // no card bonus, no jokers — unless Nuisance Value salvages 40 chips.
  if (res.bench_verdict_tag === 'OVERRULED') {
    if ((ctx.jokers ?? []).includes('nuisance-value')) {
      events.push({ chips: 40, mult: 1, label: 'Nuisance Value' });
      return { events, chips: 40, mult: 1, total: 40 };
    }
    return { events, chips: events[0].chips, mult: events[0].mult, total: 0 };
  }

  if (res.citation_valid) {
    events.push({ chips: 25, mult: 1, label: 'Verified citation' });
  }
  if (ctx.playedCard) {
    events.push({ chips: 15, mult: 1, label: 'Card played from deck' });
  }
  if (ctx.streak > 0) {
    events.push({ chips: 10 * ctx.streak, mult: 1, label: `Streak ×${ctx.streak}` });
  }
  // JOKERS — build-around modifiers. Each joker adds its own named event so
  // the score popup shows exactly what fired, Balatro-style.
  const jokers = ctx.jokers ?? [];
  if (jokers.includes('amici') && ctx.playedCard) {
    events.push({ chips: 30, mult: 1, label: 'Amici Briefs' });
  }
  if (jokers.includes('bare-act') && res.bench_verdict_tag === 'NOTED_FOR_RECORD') {
    events.push({ chips: 0, mult: 2, label: 'The Bare Act' });
  }
  if (jokers.includes('bad-faith')) {
    events.push({ chips: 0, mult: 2, label: 'Bad Faith Objection' });
  }
  if (jokers.includes('distinguished-counsel') && ctx.streak >= 3) {
    events.push({ chips: 0, mult: 2, label: 'Distinguished Counsel' });
  }
  if (jokers.includes('bench-intimidator') && ctx.turnNumber === 1) {
    events.push({ chips: 0, mult: 2, label: 'Bench Intimidator' });
  }
  if (jokers.includes('eleventh-hour') && ctx.maxTurns != null && ctx.turnNumber === ctx.maxTurns) {
    events.push({ chips: 0, mult: 3, label: 'Eleventh Hour' });
  }
  if (jokers.includes('silk') && ctx.bossActive) {
    events.push({ chips: 0, mult: 2, label: 'Taking Silk' });
  }

  const chips = events.reduce((s, e) => s + e.chips, 0);
  const mult = events.reduce((s, e) => s * e.mult, 1);
  return { events, chips, mult, total: Math.round(chips * mult) };
}

/** Chip payout for completing a matter, by final bench favor. */
export function payoutForFavor(favor: number): number {
  if (favor >= 90) return 250;
  if (favor >= 75) return 150;
  if (favor >= 60) return 75;
  if (favor >= 50) return 30;
  if (favor >= 35) return 10;
  return 0;
}

const RANK_TIERS: ReadonlyArray<{ at: number; title: string }> = [
  { at: 0, title: 'Fresh Advocate' },
  { at: 100, title: 'Junior Counsel' },
  { at: 250, title: 'Arguing Counsel' },
  { at: 500, title: 'Senior Counsel' },
  { at: 900, title: 'Senior Advocate' },
  { at: 1500, title: "King's Counsel" },
  { at: 2500, title: 'Legal Eagle' },
  { at: 4000, title: 'The Ruling Hand' },
];

export function rankForXp(xp: number): { level: number; title: string; nextAt: number | null } {
  let level = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (xp >= RANK_TIERS[i].at) level = i;
  }
  const next = RANK_TIERS[level + 1];
  return { level: level + 1, title: RANK_TIERS[level].title, nextAt: next ? next.at : null };
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Boss bench chip target for a matter: stable per scenario id, scaling with
 * the player's progression level. Range 55–85.
 */
export function bossTargetFor(scenarioId: string, level: number): number {
  const roll = djb2(scenarioId) % 26; // 0..25
  return Math.min(92, 55 + roll + level * 2);
}

/** Deterministic case-of-the-day pick from the static matter ids. */
export function caseOfTheDayFor(dateIso: string, scenarioIds: readonly string[]): string {
  const ids = scenarioIds.filter((id) => !id.startsWith('generated-'));
  if (!ids.length) return '';
  return ids[djb2(dateIso) % ids.length];
}
