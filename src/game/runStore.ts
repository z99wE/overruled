import type { Jurisdiction, TurnResolution } from '../types/legal';
import { isFlagEnabled } from '../core/flags';
import { bossForJurisdiction } from './bosses';
import { caseOfTheDayFor, payoutForFavor, rankForXp, scoreTurn, type TurnScore } from './economy';
import { nextStreak, payoutMultiplier, type JokerId } from './jokers';

export interface RunState {
  chips: number;
  xp: number;
  bestStreak: number;
  bossesDefeated: string[];
  jokers: JokerId[];
  matterChips: Record<string, number>;
  caseOfDay: { date: string; scenarioId: string } | null;
}

export const RUN_STORAGE_KEY = 'overrool.run.v2';
export const LEGACY_V1_KEY = 'overrool.run.v1';

/** v1 flat perks, retired — holders get their money back as chips. */
const V1_PERK_REFUND: Record<string, number> = {
  junior: 120,
  microbrief: 150,
  citator: 180,
  verifier: 160,
  lobbyist: 200,
  registry: 140,
  injunction: 100,
  'bar-expansion': 220,
};

export function blankRun(): RunState {
  return { chips: 0, xp: 0, bestStreak: 0, bossesDefeated: [], jokers: [], matterChips: {}, caseOfDay: null };
}

/** Coerce an untrusted run payload (localStorage or remote sync) into a valid shape. */
export function normalizeRun(parsed: Partial<RunState>): RunState {
  return {
    ...blankRun(),
    ...parsed,
    jokers: Array.isArray(parsed.jokers) ? (parsed.jokers as JokerId[]) : [],
    matterChips: parsed.matterChips ?? {},
  };
}

export function loadRun(): RunState {
  try {
    const raw = localStorage.getItem(RUN_STORAGE_KEY);
    if (raw) {
      return normalizeRun(JSON.parse(raw) as Partial<RunState>);
    }
    // v1 → v2 migration: refund retired flat perks as chips, keep progress.
    const legacy = localStorage.getItem(LEGACY_V1_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as Partial<RunState> & { perks?: string[] };
      const run = blankRun();
      run.chips = (old.chips ?? 0) + (old.perks ?? []).reduce((s, p) => s + (V1_PERK_REFUND[p] ?? 0), 0);
      run.xp = old.xp ?? 0;
      run.bestStreak = old.bestStreak ?? 0;
      run.bossesDefeated = old.bossesDefeated ?? [];
      run.matterChips = old.matterChips ?? {};
      run.caseOfDay = old.caseOfDay ?? null;
      saveRun(run);
      localStorage.removeItem(LEGACY_V1_KEY);
      return run;
    }
    return blankRun();
  } catch {
    return blankRun();
  }
}

export function saveRun(state: RunState): void {
  try {
    localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — run stays in memory only */
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(RUN_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

// ---------------------------------------------------------------------------
// Scoring application
// ---------------------------------------------------------------------------

export interface TurnGameResult {
  score: TurnScore;
  bossName: string | null;
  bossRuleText: string | null;
  bossModifier: number | null;
  streakAfter: number;
  levelledUp: boolean;
  rankAfter: { level: number; title: string; nextAt: number | null };
}

export function applyTurnScore(
  run: RunState,
  res: TurnResolution,
  ctx: {
    scenarioId: string;
    jurisdiction: Jurisdiction;
    playedCard: boolean;
    streak: number;
    freeformChars: number;
    turnNumber: number;
    maxTurns: number;
  },
): TurnGameResult {
  const jokers = run.jokers;
  const score = scoreTurn(res, {
    streak: ctx.streak,
    playedCard: ctx.playedCard,
    jokers,
    turnNumber: ctx.turnNumber,
    maxTurns: ctx.maxTurns,
    bossActive: ctx.scenarioId.startsWith('static-'),
  });

  let bossName: string | null = null;
  let bossRuleText: string | null = null;
  let bossModifier: number | null = null;
  let bossMultiplier = 1;
  if (ctx.scenarioId.startsWith('static-')) {
    const boss = bossForJurisdiction(ctx.jurisdiction);
    bossName = boss.name;
    bossRuleText = boss.special;
    bossModifier = boss.mod({
      playedCard: ctx.playedCard,
      citationValid: res.citation_valid,
      verdictTag: res.bench_verdict_tag,
      freeformChars: ctx.freeformChars,
      jurisdiction: ctx.jurisdiction,
    });
    bossMultiplier = bossModifier;
  }

  const total = Math.max(0, Math.round(score.total * bossMultiplier));

  const rankBefore = rankForXp(run.xp);
  run.xp += 5 + Math.round(total / 8);
  const rankAfter = rankForXp(run.xp);
  const levelledUp = rankAfter.level > rankBefore.level;

  const streakAfter = nextStreak(ctx.streak, res.bench_verdict_tag, run.jokers);

  return {
    score: { ...score, total },
    bossName,
    bossRuleText,
    bossModifier,
    streakAfter,
    levelledUp,
    rankAfter,
  };
}

export interface MatterPayout {
  chipsEarned: number;
  xpEarned: number;
  bossDefeated: boolean;
  rankAfter: { level: number; title: string; nextAt: number | null };
  levelledUp: boolean;
}

export function applyMatterPayout(
  run: RunState,
  args: {
    scenarioId: string;
    jurisdiction: Jurisdiction;
    finalFavor: number;
    turnTotalChips: number;
    streakBest: number;
  },
): MatterPayout {
  const payout = Math.round(
    payoutForFavor(args.finalFavor) * payoutMultiplier(run.jokers),
  );
  const rankBefore = rankForXp(run.xp);
  run.chips += payout;
  const xpEarned = 25 + args.turnTotalChips;
  run.xp += xpEarned;
  if (args.streakBest > run.bestStreak) run.bestStreak = args.streakBest;

  run.matterChips[args.scenarioId] = Math.max(
    run.matterChips[args.scenarioId] ?? 0,
    args.turnTotalChips,
  );

  let bossDefeated = false;
  if (args.scenarioId.startsWith('static-')) {
    const boss = bossForJurisdiction(args.jurisdiction);
    if (args.turnTotalChips >= boss.target && !run.bossesDefeated.includes(args.scenarioId)) {
      run.bossesDefeated.push(args.scenarioId);
      bossDefeated = true;
      if (isFlagEnabled('bossBounties')) {
        run.chips += 100; // boss bounty
      }
    }
  }

  const rankAfter = rankForXp(run.xp);
  return {
    chipsEarned: payout + (bossDefeated ? 100 : 0),
    xpEarned,
    bossDefeated,
    rankAfter,
    levelledUp: rankAfter.level > rankBefore.level,
  };
}

/** Deterministic case-of-the-day pick for the given date (pure — no mutation). */
export function ensureCaseOfDay(run: RunState, dateIso: string, scenarioIds: readonly string[]): string {
  if (run.caseOfDay && run.caseOfDay.date === dateIso) return run.caseOfDay.scenarioId;
  const ids = scenarioIds.filter((id) => !id.startsWith('generated-'));
  return ids.length ? caseOfTheDayFor(dateIso, ids) : '';
}