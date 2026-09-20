import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateScenario, randomSeed, STATUTE_JURISDICTION } from './caseGenerator';
import type { LegalCorpus } from '../types/legal';

const corpus = JSON.parse(
  readFileSync(join(__dirname, '../../public/data/global_cases.json'), 'utf-8'),
) as LegalCorpus;

describe('caseGenerator', () => {
  it('produces a matter whose deck cites only REAL corpus cases, verbatim', () => {
    const matter = generateScenario(corpus, 1234);

    expect(matter.availablePrecedents.length).toBeGreaterThanOrEqual(5);
    const corpusIds = new Set(corpus.cases.map((c) => c.id));
    const corpusById = new Map(corpus.cases.map((c) => [c.id, c]));
    for (const card of matter.availablePrecedents) {
      expect(corpusIds.has(card.id)).toBe(true);
      const real = corpusById.get(card.id)!;
      expect(card.citation).toBe(real.citation);
      expect(card.caseName).toBe(real.caseName);
    }
  });

  it('never places a real litigant name in the party fields', () => {
    const corpusNames = corpus.cases.map((c) => c.caseName.toLowerCase());

    for (let seed = 1; seed <= 30; seed++) {
      const m = generateScenario(corpus, seed);
      for (const field of [m.clientName, m.opposingCounselPersona.name]) {
        for (const realName of corpusNames) {
          expect(field.toLowerCase().includes(realName)).toBe(false);
        }
      }
    }
  }, 20_000);

  it('is deterministic per seed and varies across seeds', () => {
    const a = generateScenario(corpus, 777);
    const b = generateScenario(corpus, 777);
    const c = generateScenario(corpus, 778);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it('keeps statutes jurisdiction-locked and favors local precedent', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const m = generateScenario(corpus, seed);
      for (const st of m.statuteReferences) {
        expect(STATUTE_JURISDICTION[st.id]).toBe(m.jurisdiction);
      }
      const local = m.availablePrecedents.filter((c) => c.jurisdiction === m.jurisdiction);
      expect(local.length).toBeGreaterThanOrEqual(Math.ceil(m.availablePrecedents.length / 2));
    }
  }, 20_000);

  it('generates a usable fresh seed', () => {
    const s1 = randomSeed();
    const s2 = randomSeed();
    expect(s1).toBeGreaterThan(0);
    expect(s2).toBeGreaterThan(0);
    expect(s1).not.toBe(s2);
  });
});
