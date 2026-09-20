import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LegalCorpus } from '../types/legal';
import { CitationIndex } from './searchIndex';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, '../../public/data/global_cases.json'), 'utf-8');
const corpus = JSON.parse(raw) as LegalCorpus;

describe('CitationIndex.validateCitation', () => {
  const index = new CitationIndex(corpus);

  it('recognises a plainly-cited landmark precedent', () => {
    const r = index.validateCitation('I rely on Miranda v. Arizona, 384 U.S. 436');
    expect(r.verified).toBe(true);
    expect(r.citedPrecedent?.id).toBe('miranda-arizona');
  });

  it('recognises an alias-based reference to the snail-in-the-bottle case', () => {
    const r = index.validateCitation('The neighbour principle from the snail in the bottle case protects my client');
    expect(r.verified).toBe(true);
    expect(r.citedPrecedent?.id).toBe('donoghue-stevenson');
  });

  it('recognises an exact statutory section reference', () => {
    const r = index.validateCitation('Article 17 of the GDPR gives my client a right to erasure');
    expect(r.verified).toBe(true);
    expect(r.citedStatute?.id).toBe('eu-gdpr');
    expect(r.suggestion).toContain('Art. 17');
  });

  it('recognises an internet shutdown precedent', () => {
    const r = index.validateCitation('Anuradha Bhasin v Union of India requires proportionality review of shutdown orders');
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

  it('resolves a decimal-free Charter section reference', () => {
    const r = index.validateCitation('Section 11(b) of the Charter guarantees a trial within a reasonable time');
    expect(r.verified).toBe(true);
    expect(r.citedStatute?.id).toBe('charter-canada');
    expect(r.suggestion).toContain('11(b)');
  });

  it('leaves genuinely ambiguous citations unverified', () => {
    const r = index.validateCitation('the obscure ruling of the madras harbour authority about rivers of 1845');
    expect(r.verified).toBe(false);
  });

  it('resolves a statute by name and tags alone when no section matches', () => {
    const r = index.validateCitation('the human rights act binds every public authority in this matter');
    expect(r.verified).toBe(true);
    expect(r.citedStatute?.id).toBe('uk-human-rights-act');
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
    const hits = index.search('384 U.S. 436 MIRANDA 384 U.S. 436');
    expect(hits.length).toBeGreaterThan(0);
    const ids = hits.map((h) => h.entry.id);
    expect(ids.length).toBe(new Set(ids).size);
    expect(ids.includes('miranda-arizona')).toBe(true);
    expect(ids.filter((id) => id === 'miranda-arizona')).toHaveLength(1);
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