import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LegalCorpus } from '../types/legal';
import { CitationIndex } from './searchIndex';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, '../../public/data/indian_cases.json'), 'utf-8');
const corpus = JSON.parse(raw) as LegalCorpus;

describe('CitationIndex.validateCitation', () => {
  const index = new CitationIndex(corpus);

  it('recognises a plainly-cited landmark precedent', () => {
    const r = index.validateCitation('I rely on Orissa Mining Corporation v. MoEF, (2013) 6 SCC 476');
    expect(r.verified).toBe(true);
    expect(r.citedPrecedent?.id).toBe('orissa-mining');
  });

  it('recognises an alias-based reference to the Niyamgiri ruling', () => {
    const r = index.validateCitation('The gram sabha consent principle from the Niyamgiri judgment protects my client');
    expect(r.verified).toBe(true);
    expect(r.citedPrecedent?.id).toBe('orissa-mining');
  });

  it('recognises an exact statutory section reference', () => {
    const r = index.validateCitation('Section 4(1) of the FRA 2006 requires gram sabha consent');
    expect(r.verified).toBe(true);
    expect(r.citedStatute?.id).toBe('fra-2006');
    expect(r.suggestion).toContain('§4(1)');
  });

  it('recognises an internet shutdown precedent', () => {
    const r = index.validateCitation('Anuradha Bhasin v. Union of India requires proportionality review of shutdown orders');
    expect(r.verified).toBe(true);
    expect(r.citedPrecedent?.id).toBe('anuradha-bhasin');
  });

  it('marks fabricated authority as unverified', () => {
    const r = index.validateCitation('per the precedent of Sharma v. The Chairman of the Galaxy Mining Trust, 1777');
    expect(r.verified).toBe(false);
  });

  it('resolves a near-miss citation to its verified source', () => {
    const r = index.validateCitation('Puttaswamy right to privacy case');
    expect(r.verified).toBe(true);
    expect(r.citedPrecedent?.id).toBe('puttaswamy-privacy');
  });

  it('resolves a decimal subsection of the MV Aggregator Guidelines', () => {
    const r = index.validateCitation(
      'Section 1.1 of the MV Aggregator Guidelines requires fair treatment of driver partners',
    );
    expect(r.verified).toBe(true);
    expect(r.citedStatute?.id).toBe('mv-aggregator-guidelines');
    expect(r.suggestion).toContain('1.1');
  });

  it('leaves genuinely ambiguous citations unverified with a suggestion', () => {
    const r = index.validateCitation('the obscure ruling of the madras harbour authority about rivers of 1845');
    expect(r.verified).toBe(false);
    expect(r.suggestion).toBeTruthy();
  });

  it('resolves a statute by name and tags alone when no section matches', () => {
    const r = index.validateCitation('protection from deactivation for driver partners under the guidelines');
    expect(r.verified).toBe(true);
    expect(r.citedStatute?.id).toBe('mv-aggregator-guidelines');
  });
});

describe('CitationIndex lookups', () => {
  const index = new CitationIndex(corpus);

  it('getCaseById returns undefined for unknown ids', () => {
    expect(index.getCaseById('nope')).toBeUndefined();
  });

  it('getStatuteById returns undefined for unknown ids', () => {
    expect(index.getStatuteById('nope')).toBeUndefined();
  });

  it('search returns no results for an empty query', () => {
    expect(index.search('')).toEqual([]);
    expect(index.search('   ')).toEqual([]);
  });

  it('search returns no results for a query of only stopwords', () => {
    expect(index.search('The A and of the')).toEqual([]);
  });

  it('search yields a single entry per precedent even with a repeated citation', () => {
    const hits = index.search('(2013) 6 SCC 476 ORISSA MINING (2013) 6 SCC 476');
    expect(hits.length).toBeGreaterThan(0);
    const ids = hits.map((h) => h.entry.id);
    expect(ids.length).toBe(new Set(ids).size);
    expect(ids.includes('orissa-mining')).toBe(true);
    expect(ids.filter((id) => id === 'orissa-mining')).toHaveLength(1);
  });
});

describe('CitationIndex.search', () => {
  const index = new CitationIndex(corpus);

  it('returns ranked matches for a statutory query', () => {
    const hits = index.search('internet shutdown suspension rules');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].score).toBeGreaterThan(0);
  });

  it('covers all scenario precedent ids', () => {
    const scenarios = JSON.parse(readFileSync(join(__dirname, '../../public/data/scenarios.json'), 'utf-8')) as {
      scenarios: Array<{ precedentIds: string[]; statuteIds: string[] }>;
    };
    for (const s of scenarios.scenarios) {
      for (const id of s.precedentIds) {
        expect(index.getCaseById(id)?.id).toBe(id);
      }
      for (const id of s.statuteIds) {
        expect(index.getStatuteById(id)?.id).toBe(id);
      }
    }
  });
});