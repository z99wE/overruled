import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { INDIA_EXTRA_CASES } from './corpus/inExtra';
import { US_EXTRA_CASES, EU_EXTRA_CASES } from './corpus/usEuExtra';
import { UK_EXTRA_CASES, CA_EXTRA_CASES } from './corpus/ukCaExtra';
import { AU_EXTRA_CASES, ZA_EXTRA_CASES } from './corpus/auZaExtra';
import {
  LABOR_IN_EXTRA_CASES,
  LABOR_US_EXTRA_CASES,
  LABOR_UK_EXTRA_CASES,
} from './corpus/laborExtra';
import type { CorpusEntry } from '../types/legal';

interface SlimCase {
  id: string;
  caseName: string;
  sourceUrl?: string;
}

const baseCorpus = JSON.parse(
  readFileSync(join(__dirname, '../../public/data/global_cases.json'), 'utf-8'),
) as { cases: SlimCase[] };

const expansion: CorpusEntry[] = [
  ...INDIA_EXTRA_CASES,
  ...US_EXTRA_CASES,
  ...EU_EXTRA_CASES,
  ...UK_EXTRA_CASES,
  ...CA_EXTRA_CASES,
  ...AU_EXTRA_CASES,
  ...ZA_EXTRA_CASES,
  ...LABOR_IN_EXTRA_CASES,
  ...LABOR_US_EXTRA_CASES,
  ...LABOR_UK_EXTRA_CASES,
];

const allCases: SlimCase[] = [...baseCorpus.cases, ...expansion];

/** Cases with no free authoritative full text online — they must carry NO link rather than a fake one. */
const NO_FREE_TEXT = new Set(['boots-display', 'cundy-lindsay']);

const HOSTS = [
  'justia.com',
  'bailii.org',
  'eur-lex.europa.eu',
  'canlii.org',
  'austlii.edu.au',
  'saflii.org',
  'indiankanoon.org',
];

describe('corpus source links', () => {
  it('the expansion ships real cases', () => {
    expect(expansion.length).toBeGreaterThanOrEqual(85);
  });

  it('the labor/contract depth batch covers all three priority jurisdictions', () => {
    expect(LABOR_IN_EXTRA_CASES.length).toBeGreaterThanOrEqual(8);
    expect(LABOR_US_EXTRA_CASES.length).toBeGreaterThanOrEqual(8);
    expect(LABOR_UK_EXTRA_CASES.length).toBeGreaterThanOrEqual(4);
  });

  it('every case carries a full-text sourceUrl except the known two', () => {
    const missing = allCases.filter((c) => !NO_FREE_TEXT.has(c.id) && !c.sourceUrl);
    expect(missing.map((c) => `${c.id} (${c.caseName})`)).toEqual([]);
  });

  it('cases without free full text carry no link at all', () => {
    for (const c of allCases) {
      if (NO_FREE_TEXT.has(c.id)) {
        expect(c.sourceUrl, `${c.id} should have no fabricated link`).toBeUndefined();
      }
    }
  });

  it('all sourceUrls are https links to recognized free law-report hosts', () => {
    for (const c of allCases) {
      if (!c.sourceUrl) continue;
      expect(c.sourceUrl.startsWith('https://'), c.id).toBe(true);
      const host = new URL(c.sourceUrl).hostname;
      expect(
        HOSTS.some((h) => host === h || host.endsWith('.' + h)),
        `${c.id} -> ${c.sourceUrl}`,
      ).toBe(true);
    }
  });

  it('no two cases share a sourceUrl', () => {
    const urls = allCases.map((c) => c.sourceUrl).filter(Boolean) as string[];
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('no two cases share an id across base and expansion', () => {
    const ids = allCases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every expansion case is a complete card', () => {
    for (const c of expansion) {
      expect(c.citation, c.id).toBeTruthy();
      expect(c.caseName, c.id).toBeTruthy();
      expect(c.year, c.id).toBeGreaterThan(1800);
      expect(c.ratioDecidendi.length, c.id).toBeGreaterThan(40);
      expect(c.keyTags.length, c.id).toBeGreaterThan(0);
      expect(c.aliases.length, c.id).toBeGreaterThan(0);
    }
  });
});
