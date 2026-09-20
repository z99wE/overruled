import type { Jurisdiction } from '../types/legal';

/**
 * BOSS BENCHES — the ante structure of the run.
 *
 * Each static matter gets a boss personality tied to its real legal system.
 * Defeat the boss by banking chips past their target. `special` describes
 * the bench rule they enforce, shown on the boss banner and honoured by the
 * client-side scoring (never by the trial engine itself).
 */

export interface BossDef {
  name: string;
  target: number;
  /** One-line bench rule, in game language. */
  special: string;
  /** Chips modifier applied by the boss's bench rule. */
  mod: (ctx: BossScoreContext) => number;
}

export interface BossScoreContext {
  playedCard: boolean;
  citationValid: boolean;
  verdictTag: string;
  freeformChars: number;
  jurisdiction: Jurisdiction;
}

const BOSSES: Record<Jurisdiction, BossDef> = {
  US: {
    name: 'The Original-Jurisdiction Bench',
    target: 65,
    special: 'Verbal virtuosity earns nothing here — cards only.',
    mod: (c) => (c.playedCard ? 1 : 0.25),
  },
  UK: {
    name: "The Common-Sense Division",
    target: 60,
    special: 'Unverified authority is frowned upon: citation invalid halves mult.',
    mod: (c) => (c.citationValid ? 1 : 0.5),
  },
  EU: {
    name: 'The Proportionality Chamber',
    target: 70,
    special: 'Overwrought prose annoys the bench: freeform over 600 chars halves chips.',
    mod: (c) => (c.freeformChars > 600 ? 0.5 : 1),
  },
  CA: {
    name: 'The Jordan Clock',
    target: 60,
    special: 'Delay is death: every turn banked below par trims mult by 0.25.',
    mod: (c) => (c.verdictTag === 'SUSTAINED' ? 1 : 0.8),
  },
  AU: {
    name: 'The Full High Court',
    target: 70,
    special: 'Unanimity demanded: only SUSTAINED verdicts score in full.',
    mod: (c) => (c.verdictTag === 'SUSTAINED' ? 1 : 0.6),
  },
  ZA: {
    name: 'The Transformative Court',
    target: 60,
    special: 'Dignity first: BENCH_WARNING costs double chips.',
    mod: (c) => (c.verdictTag === 'BENCH_WARNING' ? 0.5 : 1),
  },
  IN: {
    name: 'The Epistolary Bench',
    target: 65,
    special: 'Article 21 vigilance: unverified citations score zero chips.',
    mod: (c) => (c.citationValid ? 1 : 0),
  },
};

export function bossForJurisdiction(j: Jurisdiction): BossDef {
  return BOSSES[j];
}
