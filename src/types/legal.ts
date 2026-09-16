export type Court =
  | 'Supreme Court of India'
  | 'High Court'
  | 'National Green Tribunal';

export type Domain =
  | 'Environmental'
  | 'Constitutional'
  | 'Digital_Rights'
  | 'Labor'
  | 'Tenancy';

export interface PrecedentCard {
  id: string;
  citation: string;
  caseName: string;
  year: number;
  court: Court;
  ratioDecidendi: string;
  statutoryProvisions: string[];
  keyTags: string[];
  domain: Domain;
}

export type OpposingStyle =
  | 'Aggressive'
  | 'Technical_Procedural'
  | 'Constitutional_Statist';

export interface OpposingCounsel {
  name: string;
  style: OpposingStyle;
  initialOpeningStatement: string;
  interlocutoryAttackTheme?: string;
}

export interface ScenarioCase {
  id: string;
  title: string;
  clientName: string;
  bench: string;
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

export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'groq';

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
  rawModelOutput: string;
}

export interface SessionSummary {
  caseTitle: string;
  clientName: string;
  bench: string;
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
  'Overrool is an educational legal literacy and strategic simulation tool under the Information Technology Act, 2000. It does not provide legal advice, does not establish an attorney-client relationship, and cannot replace a certified advocate registered under the Advocates Act, 1961. Simulated rulings reflect algorithmic evaluation of argumentative consistency and precedent alignment.';