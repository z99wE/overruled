import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAllScenarios, loadLibrary, loadScenario, hydrateScenario } from './dataLoader';
import { CitationIndex } from './searchIndex';
import type { LegalCorpus, ScenarioManifest } from '../types/legal';

const corpus = {
  cases: [
    {
      id: 'case-a',
      citation: '(2020) 1 SCC 1',
      caseName: 'Alpha v. Beta',
      year: 2020,
      court: 'Supreme Court of India' as const,
      ratioDecidendi: 'A decisive holding.',
      statutoryProvisions: ['Art. 21'],
      keyTags: ['privacy'],
      domain: 'Constitutional' as const,
      aliases: ['alpha case'],
    },
    {
      id: 'case-b',
      citation: '(2020) 1 SCC 2',
      caseName: 'Gamma v. Delta',
      year: 2020,
      court: 'High Court' as const,
      ratioDecidendi: 'Another holding.',
      statutoryProvisions: [],
      keyTags: ['tenancy'],
      domain: 'Tenancy' as const,
      aliases: ['gamma case'],
    },
  ],
  statutes: [
    {
      id: 'stat-x',
      citation: 'Some Act, 2001',
      name: 'Some Act 2001',
      year: 2001,
      keyTags: ['some'],
      domain: 'Environmental' as const,
      sections: [{ section: '§1', title: 'Short title', principle: 'Applies.' }],
    },
  ],
} as unknown as LegalCorpus;

const manifests: ScenarioManifest[] = [
  {
    id: 'scenario-1',
    title: 'Matter One',
    clientName: 'Client A',
    bench: 'High Court',
    factualBackground: 'Facts.',
    coreDispute: 'Dispute.',
    initialJudicialFavor: 50,
    maxTurns: 4,
    precedentIds: ['case-a', 'case-a', 'case-b', 'case-ghost'],
    statuteIds: ['stat-x', 'stat-ghost'],
    opposingCounselPersona: { name: 'OC', style: 'Aggressive', initialOpeningStatement: 'I oppose.' },
    closingPrompt: 'Close.',
  },
];

const casesJson = JSON.stringify(corpus);

function mockFetch(envelope: boolean) {
  const scenariosBody = envelope ? JSON.stringify({ scenarios: manifests }) : JSON.stringify(manifests);
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/indian_cases.json')) return new Response(casesJson, { status: 200 });
    if (url.endsWith('/scenarios.json')) return new Response(scenariosBody, { status: 200 });
    return new Response('not found', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('loadLibrary', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads a bare-array scenario manifest', async () => {
    mockFetch(false);
    const { payload, index } = await loadLibrary(true);
    expect(payload.scenarios).toHaveLength(1);
    expect(index).toBeInstanceOf(CitationIndex);
  });

  it('loads an { scenarios } envelope manifest', async () => {
    mockFetch(true);
    const { payload } = await loadLibrary(true);
    expect(payload.scenarios).toHaveLength(1);
    expect(payload.corpus.cases).toHaveLength(2);
  });

  it('throws a friendly error on a failed fetch', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadLibrary(true)).rejects.toThrow(/HTTP 503/);
  });

  it('throws a friendly error on non-JSON payloads', async () => {
    const fetchMock = vi.fn(async () => new Response('<html>oops</html>', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadLibrary(true)).rejects.toThrow(/Failed to parse/);
  });

  it('respects the cached result unless force is passed', async () => {
    const fetchMock = mockFetch(false);
    const first = await loadLibrary(true);
    const second = await loadLibrary();
    expect(second).toBe(first);
    const third = await loadLibrary(true);
    expect(third).not.toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(4); // 2 per load (corpus + scenarios)
  });
});

describe('hydrateScenario', () => {
  it('deduplicates precedent ids and skips unknown ids', () => {
    const bundle = hydrateScenario(manifests[0], corpus);
    expect(bundle.availablePrecedents.map((p) => p.id)).toEqual(['case-a', 'case-b']);
    expect(bundle.statuteReferences.map((s) => s.id)).toEqual(['stat-x']);
  });

  it('carries over the full scenario surface', () => {
    const bundle = hydrateScenario(manifests[0], corpus);
    expect(bundle.id).toBe('scenario-1');
    expect(bundle.maxTurns).toBe(4);
    expect(bundle.opposingCounselPersona.name).toBe('OC');
    expect(bundle.manifesto).toBe(manifests[0]);
    expect(bundle.statuteReferences[0].id).toBe('stat-x');
  });
});

describe('loadScenario / loadAllScenarios', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves an unknown scenario id to undefined', async () => {
    mockFetch(false);
    expect(await loadScenario('nope')).toBeUndefined();
  });

  it('loads a single scenario by id', async () => {
    mockFetch(false);
    const bundle = await loadScenario('scenario-1');
    expect(bundle?.title).toBe('Matter One');
  });

  it('hydrates every manifest into a bundle', async () => {
    mockFetch(false);
    const all = await loadAllScenarios();
    expect(all).toHaveLength(1);
    expect(all[0].availablePrecedents.length).toBe(2);
  });
});