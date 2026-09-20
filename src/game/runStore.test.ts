import { describe, expect, it, beforeEach } from 'vitest';
import {
  RUN_STORAGE_KEY,
  LEGACY_V1_KEY,
  blankRun,
  normalizeRun,
  loadRun,
  saveRun,
  clearRun,
  ensureCaseOfDay,
} from './runStore';
import type { RunState } from './runStore';

describe('normalizeRun', () => {
  it('fills missing fields from blankRun', () => {
    const run = normalizeRun({});
    expect(run).toEqual(blankRun());
  });

  it('preserves valid fields and coerces jokers', () => {
    const run = normalizeRun({ chips: 12, xp: 40, jokers: 'not-an-array' } as unknown as Partial<RunState>);
    expect(run.chips).toBe(12);
    expect(run.xp).toBe(40);
    expect(run.jokers).toEqual([]);
  });

  it('keeps well-formed jokers and chips, drops null matterChips', () => {
    const run = normalizeRun({ jokers: ['double-xp' as never], matterChips: null } as unknown as Partial<RunState>);
    expect(run.jokers).toEqual(['double-xp']);
    expect(run.matterChips).toEqual({});
  });

  it('survives unknown extra keys', () => {
    const run = normalizeRun({ bossesDefeated: ['static-england'], surprise: 1 } as unknown as Partial<RunState>);
    expect(run.bossesDefeated).toEqual(['static-england']);
  });
});

describe('loadRun / saveRun / clearRun', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns blankRun when storage is empty', () => {
    expect(loadRun()).toEqual(blankRun());
  });

  it('normalizes a stored v2 run', () => {
    saveRun({ chips: 5, xp: 9, bestStreak: 3, bossesDefeated: [], jokers: [], matterChips: {}, caseOfDay: null });
    expect(loadRun().chips).toBe(5);
  });

  it('returns blankRun on corrupt JSON', () => {
    localStorage.setItem(RUN_STORAGE_KEY, '{not json');
    expect(loadRun()).toEqual(blankRun());
  });

  it('migrates a v1 run and refunds perks as chips, then drops the legacy key', () => {
    localStorage.setItem(
      LEGACY_V1_KEY,
      JSON.stringify({ chips: 10, xp: 3, bestStreak: 2, bossesDefeated: [], perks: ['junior', 'bogus-perk'] }),
    );
    const run = loadRun();
    expect(run.chips).toBe(130);
    expect(run.xp).toBe(3);
    expect(localStorage.getItem(LEGACY_V1_KEY)).toBeNull();
  });

  it('clearRun removes the stored run', () => {
    saveRun(blankRun());
    clearRun();
    expect(localStorage.getItem(RUN_STORAGE_KEY)).toBeNull();
  });
});

describe('ensureCaseOfDay', () => {
  it('returns the pinned case for the same date', () => {
    const run: RunState = { ...blankRun(), caseOfDay: { date: '2026-09-20', scenarioId: 'abc' } };
    expect(ensureCaseOfDay(run, '2026-09-20', ['abc', 'generated-x'])).toBe('abc');
  });

  it('pins a fresh case and excludes generated scenarios', () => {
    const run = blankRun();
    const pick = ensureCaseOfDay(run, '2026-09-21', ['generated-g1', 'hands']);
    expect(pick).toBe('hands');
    expect(run.caseOfDay).toEqual({ date: '2026-09-21', scenarioId: 'hands' });
  });

  it('pins empty when only generated scenarios exist', () => {
    const run = blankRun();
    expect(ensureCaseOfDay(run, '2026-09-22', ['generated-g1', 'generated-g2'])).toBe('');
  });
});