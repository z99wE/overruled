import type {
  CorpusEntry,
  LegalCorpus,
  LibraryPayload,
  PrecedentCard,
  ScenarioBundle,
  ScenarioCase,
  ScenarioManifest,
  StatuteReference,
} from '../types/legal';
import { CitationIndex, buildIndex } from './searchIndex';
import { INDIA_EXTRA_CASES } from './corpus/inExtra';
import { US_EXTRA_CASES, EU_EXTRA_CASES } from './corpus/usEuExtra';
import { UK_EXTRA_CASES, CA_EXTRA_CASES } from './corpus/ukCaExtra';
import { AU_EXTRA_CASES, ZA_EXTRA_CASES } from './corpus/auZaExtra';
import {
  LABOR_IN_EXTRA_CASES,
  LABOR_US_EXTRA_CASES,
  LABOR_UK_EXTRA_CASES,
} from './corpus/laborExtra';

/**
 * Verified expansion cases shipped as typed modules: every entry carries a
 * sourceUrl that was individually looked up and checked before entry.
 * The JSON corpus remains the base; ids here never collide with it.
 */
const EXPANSION_CASES: CorpusEntry[] = [
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

function mergeCorpus(base: LegalCorpus): LegalCorpus {
  const seen = new Set<string>();
  const cases: CorpusEntry[] = [];
  for (const entry of [...base.cases, ...EXPANSION_CASES]) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    cases.push(entry);
  }
  return { ...base, cases };
}

let cache: { payload: LibraryPayload; index: CitationIndex } | undefined;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url} (HTTP ${res.status}). Offline corpus unavailable.`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error(`Failed to parse ${url} as JSON.`);
  }
}

export async function loadLibrary(force = false): Promise<{ payload: LibraryPayload; index: CitationIndex }> {
  if (cache && !force) return cache;
  const [corpus, scenariosRaw] = await Promise.all([
    fetchJson<LegalCorpus>('/data/global_cases.json'),
    fetchJson<ScenarioManifest[] | { scenarios: ScenarioManifest[] }>('/data/scenarios.json'),
  ]);
  // Tolerate both a bare array and a { scenarios: [...] } envelope.
  const scenarios = Array.isArray(scenariosRaw) ? scenariosRaw : scenariosRaw?.scenarios ?? [];
  const mergedCorpus = mergeCorpus(corpus);
  const payload: LibraryPayload = { corpus: mergedCorpus, scenarios };
  const index = buildIndex(mergedCorpus);
  cache = { payload, index };
  return cache;
}

function toPrecedentCard(c: CorpusEntry): PrecedentCard {
  return {
    id: c.id,
    citation: c.citation,
    caseName: c.caseName,
    year: c.year,
    court: c.court,
    jurisdiction: c.jurisdiction,
    ratioDecidendi: c.ratioDecidendi,
    statutoryProvisions: c.statutoryProvisions,
    keyTags: c.keyTags,
    domain: c.domain,
    sourceUrl: c.sourceUrl,
  };
}

export function hydrateScenario(manifest: ScenarioManifest, corpus: LegalCorpus): ScenarioBundle {
  const caseById = new Map(corpus.cases.map((c) => [c.id, c]));
  const statutesById = new Map(corpus.statutes.map((s) => [s.id, s]));

  const precedents: PrecedentCard[] = [];
  const seen = new Set<string>();
  const statuteReferences: StatuteReference[] = [];
  for (const id of manifest.precedentIds) {
    const entry = caseById.get(id);
    if (entry && !seen.has(id)) {
      seen.add(id);
      precedents.push(toPrecedentCard(entry));
    }
  }
  for (const id of manifest.statuteIds) {
    const st = statutesById.get(id);
    if (st) statuteReferences.push(st);
  }

  const scenario: ScenarioCase = {
    id: manifest.id,
    title: manifest.title,
    clientName: manifest.clientName,
    bench: manifest.bench,
    jurisdiction: manifest.jurisdiction,
    factualBackground: manifest.factualBackground,
    coreDispute: manifest.coreDispute,
    initialJudicialFavor: manifest.initialJudicialFavor,
    maxTurns: manifest.maxTurns,
    availablePrecedents: precedents,
    opposingCounselPersona: manifest.opposingCounselPersona,
    closingPrompt: manifest.closingPrompt,
  };

  return {
    ...scenario,
    statuteReferences,
    manifesto: manifest,
  };
}

export async function loadScenario(id: string): Promise<ScenarioBundle | undefined> {
  const { payload } = await loadLibrary();
  const manifest = payload.scenarios.find((s) => s.id === id);
  if (!manifest) return undefined;
  return hydrateScenario(manifest, payload.corpus);
}

export async function loadAllScenarios(): Promise<ScenarioBundle[]> {
  const { payload } = await loadLibrary();
  return payload.scenarios.map((s) => hydrateScenario(s, payload.corpus));
}