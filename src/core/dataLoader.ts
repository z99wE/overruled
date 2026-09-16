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
    fetchJson<LegalCorpus>('/data/indian_cases.json'),
    fetchJson<ScenarioManifest[] | { scenarios: ScenarioManifest[] }>('/data/scenarios.json'),
  ]);
  // Tolerate both a bare array and a { scenarios: [...] } envelope.
  const scenarios = Array.isArray(scenariosRaw) ? scenariosRaw : scenariosRaw?.scenarios ?? [];
  const payload: LibraryPayload = { corpus, scenarios };
  const index = buildIndex(corpus);
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
    ratioDecidendi: c.ratioDecidendi,
    statutoryProvisions: c.statutoryProvisions,
    keyTags: c.keyTags,
    domain: c.domain,
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