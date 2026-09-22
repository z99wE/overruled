import { beforeEach, describe, expect, it } from 'vitest';
import { CREDIT_COSTS, DEFAULT_DAILY_CREDITS, creditsToday, resetMeterForTests, spendCredits } from './meter';

const SCOPE = 'email-f00';

describe('daily credit meter', () => {
  beforeEach(() => {
    resetMeterForTests(SCOPE);
  });

  it('charges a trial (10) and a desk op (2) against the daily allowance', () => {
    const trial = spendCredits(CREDIT_COSTS.trial, 'trial:one', SCOPE);
    expect(trial.ok).toBe(true);
    expect(trial.cost).toBe(10);
    expect(trial.used).toBe(10);
    expect(trial.remaining).toBe(DEFAULT_DAILY_CREDITS - 10);

    const desk = spendCredits(CREDIT_COSTS.deskOp, undefined, SCOPE);
    expect(desk.ok).toBe(true);
    expect(desk.used).toBe(12);
    expect(creditsToday(SCOPE).used).toBe(12);
  });

  it('never double-bills the same one-time tag in a day', () => {
    spendCredits(10, 'trial:shared', SCOPE);
    const replay = spendCredits(10, 'trial:shared', SCOPE);
    expect(replay.ok).toBe(true);
    expect(replay.cost).toBe(0);
    expect(replay.used).toBe(10);
    expect(creditsToday(SCOPE).used).toBe(10);
  });

  it('refuses charges beyond the daily cap', () => {
    spendCredits(10, undefined, SCOPE);
    const blocked = spendCredits(DEFAULT_DAILY_CREDITS - 5, undefined, SCOPE);
    expect(blocked.ok).toBe(false);
    expect(blocked.code).toBe('daily_cap');
    expect(blocked.remaining).toBe(0);
  });

  it('a new trial id still bills after the cap is reached (id is rejected, not reset)', () => {
    for (let i = 0; i < DEFAULT_DAILY_CREDITS / 10; i++) spendCredits(10, `trial:${i}`, SCOPE);
    const over = spendCredits(10, 'trial:99', SCOPE);
    expect(over.ok).toBe(false);
    expect(over.code).toBe('daily_cap');
  });
});