export type Jurisdiction = 'US' | 'UK' | 'EU' | 'CA' | 'AU' | 'ZA' | 'IN';

export type Domain =
  | 'Environmental'
  | 'Constitutional'
  | 'Digital_Rights'
  | 'Labor'
  | 'Tenancy'
  | 'Criminal'
  | 'Administrative'
  | 'Property'
  | 'Tort'
  | 'Contract'
  | 'Indigenous';

export interface PrecedentCard {
  id: string;
  citation: string;
  caseName: string;
  year: number;
  court: string;
  jurisdiction?: Jurisdiction;
  ratioDecidendi: string;
  statutoryProvisions: string[];
  keyTags: string[];
  domain: Domain;
  /** Free full-text source for the real judgment (Justia, BAILII, EUR-Lex, CanLII, AustLII, SafLII, Indian Kanoon). */
  sourceUrl?: string;
}

export type OpposingStyle =
  | 'Aggressive'
  | 'Technical_Procedural'
  | 'Constitutional_Statist'
  | (string & {});

export interface OpposingCounsel {
  name: string;
  style: OpposingStyle;
  initialOpeningStatement: string;
  interlocutoryAttackTheme?: string;
}

/** A precedent card the opposing side plays back at the lawyer. */
export interface OpponentPlayedCard {
  citation: string;
  caseName: string;
  year: number;
  court: string;
  jurisdiction?: Jurisdiction;
  ratio: string;
}

/** Output of the independent opposing-counsel agent for one turn. */
export interface OpposingBrief {
  strike: string;
  raw: string;
  /** 'agent' = live LLM opponent, 'sparring' = the local deterministic judge. */
  origin?: 'agent' | 'sparring';
  /** The counter-card opposing counsel put on the table this turn, if any. */
  opponentCard?: OpponentPlayedCard | null;
}

export interface ScenarioCase {
  id: string;
  title: string;
  clientName: string;
  bench: string;
  jurisdiction: Jurisdiction;
  factualBackground: string;
  coreDispute: string;
  initialJudicialFavor: number;
  maxTurns: number;
  availablePrecedents: PrecedentCard[];
  opposingCounselPersona: OpposingCounsel;
  closingPrompt: string;
}

export type BenchVerdictTag =
  | 'SUSTAINED'
  | 'OVERRULED'
  | 'BENCH_WARNING'
  | 'NOTED_FOR_RECORD';

export interface TurnResolution {
  citation_valid: boolean;
  bench_verdict_tag: BenchVerdictTag;
  judicial_favor_delta: number;
  judge_dialogue: string;
  opposing_advocate_strike: string;
  co_counsel_tactical_hint: string;
  trial_terminated: boolean;
}

export interface PlayerAction {
  kind: 'precedent_card' | 'freeform_motion';
  precedentCardId?: string;
  freeformText?: string;
  rawText: string;
}

export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'hosted';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

export interface TurnRecord {
  turnNumber: number;
  playerAction: PlayerAction;
  resolution: TurnResolution;
  citedPrecedent?: PrecedentCard;
  opposingBrief?: OpposingBrief;
  rawModelOutput: string;
}

export interface SessionSummary {
  caseTitle: string;
  clientName: string;
  bench: string;
  jurisdiction?: Jurisdiction;
  turnRecords: TurnRecord[];
  finalFavor: number;
  admittedPrecedents: PrecedentCard[];
  exposurePoints: string[];
  consultationQuestions: string[];
  completedAt: string;
}

export const VERDICT_TAGS: BenchVerdictTag[] = [
  'SUSTAINED',
  'OVERRULED',
  'BENCH_WARNING',
  'NOTED_FOR_RECORD',
] as const;

export interface StatutorySection {
  section: string;
  title: string;
  principle: string;
}

export interface StatuteReference {
  id: string;
  citation: string;
  name: string;
  year: number;
  keyTags: string[];
  domain: Domain;
  sections: StatutorySection[];
}

export interface CorpusEntry extends PrecedentCard {
  aliases: string[];
}

export interface LegalCorpus {
  cases: CorpusEntry[];
  statutes: StatuteReference[];
}

export interface ScenarioManifest {
  id: string;
  title: string;
  clientName: string;
  bench: string;
  jurisdiction: Jurisdiction;
  factualBackground: string;
  coreDispute: string;
  initialJudicialFavor: number;
  maxTurns: number;
  precedentIds: string[];
  statuteIds: string[];
  opposingCounselPersona: OpposingCounsel;
  closingPrompt: string;
}

export interface ScenarioBundle extends ScenarioCase {
  statuteReferences: StatuteReference[];
  manifesto: ScenarioManifest;
}

export interface LibraryPayload {
  corpus: LegalCorpus;
  scenarios: ScenarioManifest[];
}

export interface CitationMatch {
  kind: 'case' | 'statute';
  entry: CorpusEntry | StatuteReference;
  score: number;
}

export interface ValidationResult {
  citedPrecedent?: PrecedentCard;
  citedStatute?: StatuteReference;
  verified: boolean;
  suggestion?: string;
}

export const STATUTORY_NOTICE =
  'Overrool is an educational legal-strategy simulation built on real, published judgments from the United States, the United Kingdom, the European Union, Canada, Australia, South Africa and India. It does not provide legal advice, creates no attorney-client relationship, and cannot replace a qualified advocate, solicitor, or attorney admitted in your jurisdiction. Simulated rulings are algorithmic argument-evaluation, not judicial decisions. Verify every citation against certified law reports before relying on it.';
