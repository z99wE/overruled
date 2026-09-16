import MiniSearch from 'minisearch';
import type {
  CitationMatch,
  CorpusEntry,
  LegalCorpus,
  PrecedentCard,
  StatuteReference,
  ValidationResult,
} from '../types/legal';

const NORMALIZE_RE = /[^0-9a-z\u0900-\u097F]+/g;
const STOP = new Set([
  'the', 'vs', 'v', 'vs.', 'in', 're', 'ltd', 'or', 'of', 'a', 'an',
  'uoi', 'union', 'state', 'india', 'supreme', 'court', 'corporation',
  'and', 'for', 'with', 'per', 'under', 'relies', 'rely', 'case', 'matter',
  'my', 'your', 'this', 'that', 'from', 'into', 'upon', 'section',
]);

const SCC_RE = /\((\d{4})\)\s+(\d+)\s*SCC\s+(\d+)/i;
const SECTION_RE = /\b(?:§|(?:sec(?:tion)?\.?))\s*([0-9]{1,3}(?:\.[0-9]{1,2})?[A-Z]?(?:\([0-9ivx]+\))?)/i;
const NON_ALNUM_RE = /[^0-9a-z]/g;

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(NORMALIZE_RE, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function tokenSet(text: string): Set<string> {
  return new Set(tokens(text));
}

interface CaseBundle extends CorpusEntry {
  headTokens: Set<string>;
  fullTokens: Set<string>;
  nameTokens: Set<string>;
  citationTokens: Set<string>;
}

interface StatuteBundle extends StatuteReference {
  headTokens: Set<string>;
  fullTokens: Set<string>;
}

function buildCaseBundle(c: CorpusEntry): CaseBundle {
  const words = [c.aliases.join(' '), c.caseName, c.citation, c.ratioDecidendi, ...c.statutoryProvisions, ...c.keyTags].join(' ');
  const head = tokenSet([c.aliases.join(' '), c.caseName, c.citation].join(' '));
  return {
    ...c,
    headTokens: head,
    fullTokens: tokenSet(words),
    nameTokens: tokenSet(c.caseName),
    citationTokens: tokenSet(c.citation),
  };
}

function buildStatuteBundle(s: StatuteReference): StatuteBundle {
  const head = tokenSet([s.citation, s.name, ...s.keyTags].join(' '));
  const full = tokenSet(
    [s.citation, s.name, ...s.keyTags, ...s.sections.map((x) => `${x.section} ${x.title} ${x.principle}`)].join(' '),
  );
  return { ...s, headTokens: head, fullTokens: full };
}

function intersectSize(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n += 1;
  return n;
}

/**
 * Coverage-weighted similarity on the query's distinctive tokens.
 * score = 0.65 * (head intersection / query size) + 0.35 * (full intersection / query size)
 */
function caseScore(q: Set<string>, b: CaseBundle): { score: number; count: number } {
  const headInter = intersectSize(q, b.headTokens);
  const fullInter = intersectSize(q, b.fullTokens);
  const score = (0.65 * headInter + 0.35 * fullInter) / Math.max(1, q.size);
  return { score, count: fullInter };
}

export class CitationIndex {
  private mini: MiniSearch<CorpusEntry>;
  private cases: CaseBundle[];
  private caseById: Map<string, CaseBundle>;
  private statuteById: Map<string, StatuteBundle>;

  constructor(corpus: LegalCorpus) {
    this.cases = corpus.cases.map(buildCaseBundle);
    this.caseById = new Map(this.cases.map((c) => [c.id, c]));
    this.statuteById = new Map(corpus.statutes.map((s) => [s.id, buildStatuteBundle(s)]));
    this.mini = new MiniSearch<CorpusEntry>({
      fields: ['caseName', 'citation', 'ratioDecidendi', 'keyTags'],
      storeFields: ['id', 'caseName', 'citation', 'year', 'court', 'ratioDecidendi', 'statutoryProvisions', 'keyTags', 'domain'],
      idField: 'id',
      searchOptions: { fuzzy: 0.4, prefix: true, boost: { caseName: 4, citation: 3, keyTags: 1 } },
    });
    this.mini.addAll(corpus.cases);
  }

  get size(): number {
    return this.cases.length;
  }

  getCaseById(id: string): CorpusEntry | undefined {
    return this.caseById.get(id);
  }

  getStatuteById(id: string): StatuteReference | undefined {
    return this.statuteById.get(id);
  }

  search(query: string, limit = 6): CitationMatch[] {
    const q = tokens(query).join(' ');
    const qSet = tokenSet(query);
    const results: CitationMatch[] = [];

    if (q) {
      for (const hit of this.mini.search(q, { combineWith: 'OR' }).slice(0, limit * 2)) {
        const entry = this.caseById.get(hit.id);
        if (!entry) continue;
        const sc = caseScore(qSet, entry);
        results.push({
          kind: 'case',
          entry,
          score: (hit.score ?? 0) * 0.5 + sc.score,
        });
      }
    }

    if (qSet.size > 0) {
      for (const s of this.statuteById.values()) {
        const count = intersectSize(qSet, s.fullTokens);
        if (count >= 2) {
          results.push({ kind: 'statute', entry: s, score: 0.6 + 0.4 * (count / qSet.size) });
        }
      }
    }

    const deduped = new Map<string, CitationMatch>();
    for (const r of results) {
      const key = r.kind + ':' + r.entry.id;
      const prev = deduped.get(key);
      if (!prev || r.score > prev.score) deduped.set(key, r);
    }

    return Array.from(deduped.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  validateCitation(rawText: string): ValidationResult {
    const lc = rawText.toLowerCase();
    const qSet = tokenSet(rawText);

    const citationScc = lc.match(SCC_RE)?.slice(1) ?? null;
    const sectionMatch = lc.match(SECTION_RE);

    // 1. Statute matching: section-level precision first (strongest signal).
    const statuteHits = this.statuteById.values();
    const statuteScores = new Map<StatuteBundle, { head: number; full: number }>();
    for (const s of statuteHits) {
      statuteScores.set(s, { head: intersectSize(qSet, s.headTokens), full: intersectSize(qSet, s.fullTokens) });
    }
    const scoringStatutes = Array.from(statuteScores.entries()).filter(
      ([, n]) => n.full >= 2 || n.head >= 1,
    );

    if (sectionMatch) {
      const codeGroup = sectionMatch[1].toLowerCase().replace(NON_ALNUM_RE, '');
      for (const [s] of scoringStatutes) {
        const sect = s.sections.find(
          (x) => x.section.toLowerCase().replace(NON_ALNUM_RE, '') === codeGroup,
        );
        if (sect) return { citedStatute: s, verified: true, suggestion: `${s.name} ${sect.section} — ${sect.title}` };
      }
    }

    // 2. Case matching: alias/name/citation weighted coverage.
    let best: { bundle: CaseBundle; score: number; count: number } | undefined;

    for (const c of this.cases) {
      const sc = caseScore(qSet, c);
      const surnameBonus = [...qSet].some((t) => c.nameTokens.has(t)) ? 0.1 : 0;
      const sccBonus =
        citationScc &&
        citationScc[0] === String(c.year) &&
        c.citationTokens.has(citationScc[2])
          ? 0.15
          : 0;
      const total = sc.score + surnameBonus + sccBonus;
      const pass =
        (sc.count >= 2 && total >= 0.38) ||
        (citationScc != null && sc.count >= 2 && total >= 0.3);
      if (pass && (!best || total > best.score)) {
        best = { bundle: c, score: total, count: sc.count };
      }
    }

    if (best) {
      const c = best.bundle;
      const card: PrecedentCard = {
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
      return { citedPrecedent: card, verified: true };
    }

    // 3. Statute without a resolvable section: require a decent name overlap.
    const informalStatuteHits = scoringStatutes
      .map(([s, n]) => ({ s, count: n.full }))
      .filter(({ count }) => count >= 3)
      .sort((a, b) => b.count - a.count);

    if (informalStatuteHits.length) {
      return { citedStatute: informalStatuteHits[0].s, verified: true };
    }

    const suggestion = this.search(rawText, 1)[0];
    return {
      verified: false,
      suggestion:
        suggestion?.kind === 'case'
          ? (suggestion.entry as CorpusEntry).caseName
          : (suggestion?.entry as StatuteReference | undefined)?.citation,
    };
  }
}

export function buildIndex(corpus: LegalCorpus): CitationIndex {
  return new CitationIndex(corpus);
}