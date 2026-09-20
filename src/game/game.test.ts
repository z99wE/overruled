import { describe, expect, it } from 'vitest';
import { baseHand, bossTargetFor, caseOfTheDayFor, payoutForFavor, rankForXp, scoreTurn } from './economy';
import { bossForJurisdiction } from './bosses';
import { nextStreak, payoutMultiplier } from './jokers';
import { applyMatterPayout, applyTurnScore, blankRun, ensureCaseOfDay, loadRun, saveRun } from './runStore';
import type { TurnResolution } from '../types/legal';

function res(overrides: Partial<TurnResolution> = {}): TurnResolution {
  return {
    citation_valid: true,
    bench_verdict_tag: 'SUSTAINED',
    judicial_favor_delta: 12,
    judge_dialogue: '…',
    opposing_advocate_strike: '…',
    co_counsel_tactical_hint: '…',
    trial_terminated: false,
    ...overrides,
  };
}

describe('economy scoring', () => {
  it('scores a clean verified SUSTAINED card play', () => {
    const s = scoreTurn(res(), { streak: 0, playedCard: true });
    expect(s.chips).toBe(60 + 25 + 15);
    expect(s.mult).toBeCloseTo(3 * 1 * 1, 5);
    expect(s.total).toBe(100 * 3);
  });

  it('multiplies streak chips into the total', () => {
    const s = scoreTurn(res(), { streak: 2, playedCard: true });
    expect(s.chips).toBe(60 + 25 + 15 + 20);
  });

  it('scores OVERRULED as a busted hand — zero, no bonuses', () => {
    const s = scoreTurn(res({ bench_verdict_tag: 'OVERRULED', citation_valid: false }), { streak: 3, playedCard: true });
    expect(s.total).toBe(0);
    expect(s.events).toHaveLength(1); // just the busted base hand
  });

  it('Nuisance Value salvages exactly 40 chips from an OVERRULED bust', () => {
    const s = scoreTurn(res({ bench_verdict_tag: 'OVERRULED', citation_valid: false }), { streak: 3, playedCard: true, jokers: ['nuisance-value'] });
    expect(s.total).toBe(40);
  });

  it('jokers compose multiplicatively into the total', () => {
    // SUSTAINED + verified + card = 100 chips, 3 mult; Bad Faith ×2 → 600.
    const s = scoreTurn(res(), { streak: 0, playedCard: true, jokers: ['bad-faith'] });
    expect(s.total).toBe(600);
  });

  it('Eleventh Hour and Distinguished Counsel stack', () => {
    // streak 4 → chips 60+25+15+40 = 140; mult 3 × 3 × 2 = 18 → 2520.
    const s = scoreTurn(res(), { streak: 4, playedCard: true, jokers: ['eleventh-hour', 'distinguished-counsel'], turnNumber: 5, maxTurns: 5 });
    expect(s.total).toBe(2520);
  });

  it('baseHand covers all four verdict tags', () => {
    for (const tag of ['SUSTAINED', 'NOTED_FOR_RECORD', 'BENCH_WARNING', 'OVERRULED'] as const) {
      expect(baseHand(res({ bench_verdict_tag: tag })).chips).toBeGreaterThanOrEqual(0);
    }
  });

  it('payout ramps with favor', () => {
    expect(payoutForFavor(95)).toBe(250);
    expect(payoutForFavor(0)).toBe(0);
  });

  it('ranks ascend with xp and cap out', () => {
    expect(rankForXp(0).title).toBe('Fresh Advocate');
    expect(rankForXp(600).title).toBe('Senior Counsel');
    expect(rankForXp(99999).nextAt).toBeNull();
  });

  it('boss targets are stable per scenario and scale with level', () => {
    expect(bossTargetFor('static-india-midnight-sweep', 1)).toBe(bossTargetFor('static-india-midnight-sweep', 1));
    expect(bossTargetFor('static-india-midnight-sweep', 5)).toBeGreaterThan(bossTargetFor('static-india-midnight-sweep', 1));
  });

  it('case of the day is deterministic and skips generated ids', () => {
    const ids = ['static-a', 'static-b', 'generated-123'];
    expect(caseOfTheDayFor('2026-09-19', ids)).toBe(caseOfTheDayFor('2026-09-19', ids));
    expect(caseOfTheDayFor('2026-09-19', ids)).not.toBe('generated-123');
  });
});

describe('bosses', () => {
  it('every jurisdiction has a boss with a positive target', () => {
    for (const j of ['US', 'UK', 'EU', 'CA', 'AU', 'ZA', 'IN'] as const) {
      const b = bossForJurisdiction(j);
      expect(b.target).toBeGreaterThan(0);
      expect(b.special.length).toBeGreaterThan(0);
    }
  });

  it('the US boss crushes freeform-only play', () => {
    const b = bossForJurisdiction('US');
    expect(b.mod({ playedCard: false, citationValid: true, verdictTag: 'SUSTAINED', freeformChars: 50, jurisdiction: 'US' })).toBe(0.25);
  });

  it('the Indian bench zeroes unverified citations', () => {
    const b = bossForJurisdiction('IN');
    expect(b.mod({ playedCard: true, citationValid: false, verdictTag: 'SUSTAINED', freeformChars: 10, jurisdiction: 'IN' })).toBe(0);
  });
});

describe('perks', () => {
  it('Old Money lifts payout by half', () => {
    expect(payoutMultiplier([])).toBe(1);
    expect(payoutMultiplier(['old-money'])).toBeCloseTo(1.5, 5);
  });

  it('Clean Hands holds a streak through a BENCH_WARNING', () => {
    expect(nextStreak(3, 'BENCH_WARNING', [])).toBe(0);
    expect(nextStreak(3, 'BENCH_WARNING', ['clean-hands'])).toBe(3);
    expect(nextStreak(3, 'NOTED_FOR_RECORD', ['clean-hands'])).toBe(0);
    expect(nextStreak(2, 'SUSTAINED', [])).toBe(3);
  });
});

describe('run store', () => {
  it('applies turn score with boss modifier for static matters', () => {
    const run = blankRun();
    const out = applyTurnScore(run, res(), {
      scenarioId: 'static-test',
      jurisdiction: 'IN',
      playedCard: true,
      streak: 0,
      freeformChars: 10,
      turnNumber: 1,
      maxTurns: 5,
    });
    expect(out.bossName).toBeTruthy();
    expect(out.score.total).toBe(100 * 3); // citation verified → ×1 for the IN boss
    expect(run.xp).toBeGreaterThan(0);
    expect(out.streakAfter).toBe(1);
  });

  it('skips boss modifier for generated matters', () => {
    const run = blankRun();
    const out = applyTurnScore(run, res({ citation_valid: false }), {
      scenarioId: 'generated-99',
      jurisdiction: 'IN',
      playedCard: false,
      streak: 0,
      freeformChars: 10,
      turnNumber: 2,
      maxTurns: 5,
    });
    expect(out.bossName).toBeNull();
  });

  it('pays out, records best streak, and awards the boss bounty once', () => {
    const run = blankRun();
    const first = applyMatterPayout(run, {
      scenarioId: 'static-test',
      jurisdiction: 'CA',
      finalFavor: 80,
      turnTotalChips: 300,
      streakBest: 4,
    });
    expect(first.chipsEarned).toBe(150 + 100); // favor payout + boss bounty (no Old Money)
    expect(first.bossDefeated).toBe(true);
    expect(run.bestStreak).toBe(4);

    const again = applyMatterPayout(run, {
      scenarioId: 'static-test',
      jurisdiction: 'CA',
      finalFavor: 80,
      turnTotalChips: 400,
      streakBest: 5,
    });
    expect(again.bossDefeated).toBe(false);
    expect(again.chipsEarned).toBe(150);
    expect(run.bestStreak).toBe(5);
  });

  it('pins the case of the day per date', () => {
    const run = blankRun();
    const a = ensureCaseOfDay(run, '2026-09-19', ['static-x', 'static-y']);
    const b = ensureCaseOfDay(run, '2026-09-19', ['static-x', 'static-y']);
    expect(a).toBe(b);
    expect(run.caseOfDay?.date).toBe('2026-09-19');
  });

  it('round-trips through localStorage', () => {
    const run = blankRun();
    run.chips = 320;
    run.jokers = ['amici'];
    saveRun(run);
    const loaded = loadRun();
    expect(loaded.chips).toBe(320);
    expect(loaded.jokers).toEqual(['amici']);
  });
});
