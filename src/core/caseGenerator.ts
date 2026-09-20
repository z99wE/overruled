import type {
  Jurisdiction,
  LegalCorpus,
  ScenarioBundle,
  ScenarioManifest,
} from '../types/legal';

/**
 * PROCEDURAL CASE GENERATOR
 *
 * Design contract (the one that matters):
 *  - Party names are ALWAYS fictional, drawn from surname/given-name pools below.
 *    They are deliberately NOT the names of any real litigant.
 *  - Every precedent in a generated deck is a REAL case copied verbatim from the
 *    bundled corpus (global_cases.json). The generator never invents a citation,
 *    a holding, or a court.
 *  - The same seed always regenerates the identical matter (mulberry32 PRNG),
 *    so a docket can be reproduced bit-for-bit from its matter number.
 */

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickMany<T>(rng: () => number, arr: readonly T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (pool.length && out.length < n) {
    out.push(...pool.splice(Math.floor(rng() * pool.length), 1));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Fictional name banks. Common surnames per jurisdiction; none of these
// combinations are real reported parties.
// ---------------------------------------------------------------------------
const GIVEN_NAMES = [
  'Aria', 'Dev', 'Maya', 'Ines', 'Tomas', 'Nadia', 'Felix', 'Priya', 'Omar', 'Lena',
  'Ravi', 'June', 'Kofi', 'Anya', 'Marco', 'Zara', 'Ivan', 'Cleo', 'Sana', 'Theo',
] as const;

const SURNAMES: Record<Jurisdiction, readonly string[]> = {
  US: ['Calloway', 'Mercer', 'Whitlock', 'Ibarra', 'Dunphy', 'Kowalski', 'Reyes', 'Boone'],
  UK: ['Ashworth', 'Prentice', 'Mellor', 'Okafor', 'Swinford', 'Doyle', 'Farrell', 'Kaur'],
  EU: ['Lindqvist', 'Marchetti', 'De Vries', 'Kowalczyk', 'Ferreira', 'Novak', 'Andersen', 'Petrov'],
  CA: ['Tremblay', 'MacAllister', 'Nkemelu', 'Boudreau', 'Sandhu', 'Whitford', 'Charron', 'Osei'],
  AU: ['Barrowcliffe', 'Nguyen', 'Kirkbright', 'O\'Halloran', 'Dunmore', 'Taliauli', 'Redmayne', 'Cooray'],
  ZA: ['Mokoena', 'Van Wyk', 'Naidoo', 'Botha', 'Dlamini', 'Jacobs', 'Mahlangu', 'Pillay'],
  IN: ['Deshpande', 'Kulkarni', 'Sengupta', 'Iyer', 'Chatterjee', 'Rathod', 'Bhatnagar', 'Menon'],
};

const CLIENT_ROLES = [
  'a night-shift warehouse worker',
  'a district hospital nurse',
  'the operator of a family-run shipping agency',
  'a municipal schoolteacher',
  'a freelance data analyst',
  'the caretaker of a coastal guest house',
  'a long-haul driver',
  'a smallholder farmer',
] as const;

const EMPLOYERS = [
  'Northgate Logistics', 'Veltrona Media', 'Harborline Freight', 'Meridian Foods',
  'Cobalt Ridge Mining', 'Ashgrove Energy', 'Pinebrook Council', 'Redcote Manufacturing',
  'Solventis Waterworks', 'Trellis Hospitality Group',
] as const;

const HARM_EVENTS = [
  'was summarily dismissed after flagging a safety breach, effective by text message',
  'had their operating licence revoked over an unsigned inspection memo',
  'was locked out of the premises overnight along with their belongings',
  'received a compliance fine computed by a formula nobody will disclose',
  'was removed from the duty roster without pay for "attitude record" reasons',
  'had years of records transferred to a third-party vendor without consent',
] as const;

const DISPUTES: Record<Jurisdiction, readonly string[]> = {
  US: [
    'whether the dismissal and its evidentiary basis survive due-process and investigative-disclosure scrutiny',
    'whether the search and seizure of personal effects during the lockout exceeded lawful bounds',
  ],
  UK: [
    'whether the authority owed and breached a duty of care, and whether procedural fairness was a dead letter',
    'whether the decision-maker acted ultra vires the enabling statute and in breach of natural justice',
  ],
  EU: [
    'whether the cross-border transfer of the claimant\'s records respected data-protection law and the right to an effective remedy',
    'whether the automated compliance decision is reviewable and proportionate under Union law',
  ],
  CA: [
    'whether the delay and process failures offend the claimant\'s life, liberty and security interests',
    'whether the state\'s evidence was withheld in breach of disclosure obligations',
  ],
  AU: [
    'whether the determination affected traditional interests without procedural fairness or just terms',
    'whether the impugned decision was attended by a genuine opportunity to be heard',
  ],
  ZA: [
    'whether the conduct degraded the claimant\'s dignity and equality rights under the Bill of Rights',
    'whether the state fulfilled its negative and positive obligations to the most vulnerable',
  ],
  IN: [
    'whether the action is arbitrary under Article 14 and robs the claimant of livelihood under Article 21',
    'whether the decision, taken without notice or hearing, is void for violation of natural justice',
  ],
};

const BENCHES: Record<Jurisdiction, string> = {
  US: 'A federal district court, single judge, cold bench',
  UK: "The High Court, King's Bench Division",
  EU: 'The General Court of the European Union',
  CA: 'A provincial superior court hearing an urgent Charter application',
  AU: 'A state Supreme Court in its original jurisdiction',
  ZA: 'A provincial High Court sitting as a court of first instance',
  IN: 'A High Court hearing an urgent Article 226 petition',
};

const STYLES = [
  'aggressive trap-setting',
  'technically procedural',
  'theatrical bombast',
  'cold and incremental',
] as const;

const ATTACK_THEMES = [
  'standing of the claimant',
  'prematurity of the challenge',
  'finality of the administrative order',
  'the public-interest justification',
  'proportionality of the remedy sought',
] as const;

const OPENERS = [
  'My Lords, this is a billboard, not a brief. The authority was exercised within a lawful discretion, the claimant has no proprietary stake, and the delay alone should sink the matter. The only emergency here is manufactured.',
  'The claimant wants this Court to relitigate a compliance decision on feelings. The record is thin, the remedy is disproportionate, and the authorities my friend will wave about are distinguishable at the first paragraph. We invite dismissal with costs.',
  'There is no live dispute — only a performance. The decision was intra vires, procedurally flawless, and taken for reasons that enjoy a presumption of regularity. We will take the Court through each one.',
] as const;

const TITLE_A = [
  'The Halcyon', 'The Ironbound', 'The Quiet Parapet', 'The Glass Meridian',
  'The Cinder', 'The Longwharf', 'The Pale Orchard', 'The Salt Lantern',
] as const;

const TITLE_B = ['Filing', 'Demolition', 'Dismissal', 'Levy', 'Interdiction', 'Lockout', 'Retrieval', 'Transfer'] as const;

/** Corpus statute ids are curated project data with jurisdiction-encoded ids. */
export const STATUTE_JURISDICTION: Record<string, Jurisdiction> = {
  'eu-gdpr': 'EU',
  'us-first-amendment': 'US',
  'us-fourth-amendment': 'US',
  'charter-canada': 'CA',
  'uk-human-rights-act': 'UK',
  'native-title-act': 'AU',
  'constitution-south-africa': 'ZA',
  'constitution-india': 'IN',
  'fra-2006': 'IN',
  'ucc-common-carrier': 'US',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'September', 'October', 'November'] as const;

// ---------------------------------------------------------------------------
// Deck selection: real corpus cases only. Same-jurisdiction first; backfill
// from other jurisdictions ONLY when the local bench is too thin (the judge
// prompt already treats cross-jurisdiction authority as persuasive).
// ---------------------------------------------------------------------------
function buildDeck(corpus: LegalCorpus, rng: () => number, j: Jurisdiction, domain: string, extra = 0) {
  const local = corpus.cases.filter((c) => c.jurisdiction === j);
  const wanted = Math.min(9, Math.max(5, Math.floor(rng() * 3) + 5) + extra);
  // Domain affinity: the deal leads with authority that actually matches the
  // matter's domain (~70% when available), then fills from the rest of the
  // jurisdiction's corpus. Seeded, so the same seed replays the same deck.
  const matched = local.filter((c) => c.domain === domain);
  const others = local.filter((c) => c.domain !== domain);
  const deck = pickMany(rng, matched, Math.min(matched.length, Math.ceil(wanted * 0.7)));
  deck.push(...pickMany(rng, others, wanted - deck.length));

  if (deck.length < 5) {
    const elsewhere = corpus.cases
      .filter((c) => c.jurisdiction !== j && !deck.includes(c))
      .sort((a, b) => (b.domain === domain ? 1 : 0) - (a.domain === domain ? 1 : 0));
    deck.push(...pickMany(rng, elsewhere, 5 - deck.length));
  }
  return deck;
}

export function generateScenario(
  corpus: LegalCorpus,
  seed: number,
  opts?: { extraDeckCards?: number },
): ScenarioBundle {
  const rng = mulberry32(seed);
  const jurisdiction = pick(rng, Object.keys(SURNAMES) as Jurisdiction[]);
  const surPool = SURNAMES[jurisdiction];

  const clientFirst = pick(rng, GIVEN_NAMES);
  const clientLast = pick(rng, surPool);
  const oppFirst = pick(rng, GIVEN_NAMES);
  let oppLast = pick(rng, surPool);
  if (oppLast === clientLast) oppLast = pick(rng, surPool.filter((s) => s !== clientLast));

  const clientName = `${clientFirst} ${clientLast}, ${pick(rng, CLIENT_ROLES)}`;
  const employer = pick(rng, EMPLOYERS);
  const event = pick(rng, HARM_EVENTS);
  const month = pick(rng, MONTHS);
  const day = 2 + Math.floor(rng() * 26);
  const domain = pick(rng, ['Constitutional', 'Criminal', 'Administrative']);

  const deck = buildDeck(corpus, rng, jurisdiction, domain, opts?.extraDeckCards ?? 0);
  const statutes = corpus.statutes
    .filter((s) => STATUTE_JURISDICTION[s.id] === jurisdiction)
    .slice(0, 2);

  const title = `${pick(rng, TITLE_A)} ${pick(rng, TITLE_B)}`;
  const matterNo = `G-${seed.toString(36).toUpperCase()}`;
  const coreDispute = pick(rng, DISPUTES[jurisdiction]);

  const factualBackground =
    `On the night of ${month} ${day}, ${employer} — acting under an internal directive no one on site can produce — ` +
    `moved against ${clientFirst} ${clientLast}, ${pick(rng, CLIENT_ROLES)}. ${clientLast} ${event}. ` +
    `No notice was given, no hearing was offered, and the paper trail stops at a single unsigned memo. ` +
    `${clientLast} has instructed counsel to fight, and the file landed on our desk at 6 a.m.`;

  const manifest: ScenarioManifest = {
    id: `generated-${seed}`,
    title: `${title} — Matter ${matterNo}`,
    clientName,
    bench: BENCHES[jurisdiction],
    jurisdiction,
    factualBackground,
    coreDispute: `${coreDispute[0].toUpperCase()}${coreDispute.slice(1)}.`,
    initialJudicialFavor: 35 + Math.floor(rng() * 25),
    maxTurns: 4 + Math.floor(rng() * 3),
    precedentIds: deck.map((c) => c.id),
    statuteIds: statutes.map((s) => s.id),
    opposingCounselPersona: {
      name: `${oppFirst} ${oppLast}`,
      style: pick(rng, STYLES),
      initialOpeningStatement: pick(rng, OPENERS),
      interlocutoryAttackTheme: pick(rng, ATTACK_THEMES),
    },
    closingPrompt:
      'Closing: the bench wants one paragraph on why the remedy follows from the authority — say it in real citations or not at all.',
  };

  return {
    id: manifest.id,
    title: manifest.title,
    clientName,
    bench: manifest.bench,
    jurisdiction,
    factualBackground,
    coreDispute: manifest.coreDispute,
    initialJudicialFavor: manifest.initialJudicialFavor,
    maxTurns: manifest.maxTurns,
    availablePrecedents: deck.map((c) => ({
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
    })),
    opposingCounselPersona: manifest.opposingCounselPersona,
    closingPrompt: manifest.closingPrompt,
    statuteReferences: statutes,
    manifesto: manifest,
  };
}

export function randomSeed(): number {
  return ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0) || 1;
}
