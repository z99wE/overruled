import type {
  LLMConfig,
  PlayerAction,
  ScenarioBundle,
  TurnRecord,
  TurnResolution,
  ValidationResult,
  BenchVerdictTag,
} from '../types/legal';
import { VERDICT_TAGS } from '../types/legal';
import { LLMOrchestratorError, requestChat } from './providerCall';

export { LLMOrchestratorError } from './providerCall';

const RESOLUTION_KEYS = [
  'citation_valid',
  'bench_verdict_tag',
  'judicial_favor_delta',
  'judge_dialogue',
  'opposing_advocate_strike',
  'co_counsel_tactical_hint',
  'trial_terminated',
] as const;

const VERDICT_TAG_SET: ReadonlySet<string> = new Set(VERDICT_TAGS);

const SYSTEM_INSTRUCTION = [
  'You are the presiding intelligence of "Overrool", an adversarial legal strategy simulation set in Indian courts.',
  'You embody three voices in ONE response: the Presiding Judge, an Opposing Senior Advocate, and a Co-Counsel whispering to the human lawyer.',
  '',
  'GROUND TRUTH RULES:',
  '- The "citation_valid" field MUST reflect the locally verified result. If the player cites a case/statute that was NOT verified against the Indian legal corpus, set citation_valid=false, and the judge must call the fabrication out.',
  '- A citation verified in the corpus must be treated as an admissible Indian authority within its actual scope.',
  '- NEVER fabricate case citations, sections or rulings. If you need to reference law, reference only the IPC/precedent names already grounded in the conversation or the user-visible corpus, and describe them in accurate, general terms.',
  '- The judge evaluates: precise statutory citation, factual anchoring to the scenario record, and procedural posture.',
  '',
  'SCORING:',
  '- SUSTAINED (strong, precise, verified citation for your client): favor +10 to +25.',
  '- NOTED_FOR_RECORD (fair but not decisive): +0 to +8.',
  '- BENCH_WARNING (procedural flaw or unverified citation): 0 to -5.',
  '- OVERRULED (mis-citation, bad law, incoherent logic, fabrication): -10 to -25.',
  '- Keep judicial_favor_delta within the given bounds.',
  '',
  'STYLE: Each voice must be in character. The Judge is formal, judicial, and demands exact section numbers and precedent alignment. The Opposing Advocate attacks with counter-precedents and procedural hurdles. Co-Counsel gives ONE crisp tactical hint for the next turn.',
  'The judge_dialogue, opposing_advocate_strike and co_counsel_tactical_hint must each be 2-4 sentences.',
  '',
  'RESPOND WITH A SINGLE JSON OBJECT ONLY, using this exact schema:',
  '{"citation_valid": boolean, "bench_verdict_tag": one of SUSTAINED|OVERRULED|BENCH_WARNING|NOTED_FOR_RECORD, "judicial_favor_delta": integer between -25 and 25, "judge_dialogue": string, "opposing_advocate_strike": string, "co_counsel_tactical_hint": string, "trial_terminated": boolean}',
  'Do not add text outside the JSON object.',
].join('\n');

export function buildUserPrompt(args: {
  scenario: ScenarioBundle;
  favorBefore: number;
  turnNumber: number;
  maxTurns: number;
  history: TurnRecord[];
  action: PlayerAction;
  validation: ValidationResult;
}): string {
  const { scenario, favorBefore, turnNumber, maxTurns, history, action, validation } = args;
  const opp = scenario.opposingCounselPersona;
  const lines: string[] = [];

  lines.push(`CASE: ${scenario.title}`);
  lines.push(`CLIENT: ${scenario.clientName}`);
  lines.push(`BENCH: ${scenario.bench}`);
  lines.push(`FACTUAL BACKGROUND: ${scenario.factualBackground}`);
  lines.push(`CORE DISPUTE: ${scenario.coreDispute}`);
  lines.push(`OPPOSING COUNSEL: ${opp.name} (style: ${opp.style})`);
  lines.push(`OPENING STATEMENT: ${opp.initialOpeningStatement}`);
  if (opp.interlocutoryAttackTheme) lines.push(`INTERLOCUTORY ATTACK THEME: ${opp.interlocutoryAttackTheme}`);
  lines.push(`CLOSING REFERENCE: ${scenario.closingPrompt}`);
  lines.push(`JUDICIAL FAVOR BEFORE THIS TURN: ${favorBefore} / 100`);
  lines.push(`TURN: ${turnNumber} of ${maxTurns}`);
  lines.push('');

  if (history.length) {
    lines.push('--- PRIOR PROCEEDINGS ---');
    for (const rec of history) {
      lines.push(`Turn ${rec.turnNumber}: lawyer said: "${rec.playerAction.rawText}"`);
      lines.push(`  -> bench recorded: ${rec.resolution.bench_verdict_tag} (delta ${rec.resolution.judicial_favor_delta}), citation_valid=${rec.resolution.citation_valid}`);
      lines.push(`  -> judge: ${rec.resolution.judge_dialogue}`);
      lines.push(`  -> opponent: ${rec.resolution.opposing_advocate_strike}`);
    }
    lines.push('');
  }

  lines.push('--- CURRENT PLAYER ACTION ---');
  lines.push(action.rawText);
  if (action.kind === 'precedent_card' && action.precedentCardId) {
    lines.push('(This was submitted as an in-game Precedent Card.)');
  }
  lines.push('');

  lines.push('--- LOCAL CITATION VALIDATION ---');
  if (validation.verified && validation.citedPrecedent) {
    const c = validation.citedPrecedent;
    lines.push(`VERIFIED precedent: ${c.citation} — ${c.caseName} (${c.court}, ${c.year})`);
    lines.push(`Holding: ${c.ratioDecidendi}`);
    lines.push(`Statutory hooks: ${c.statutoryProvisions.join(', ')}`);
  } else if (validation.verified && validation.citedStatute) {
    const s = validation.citedStatute;
    lines.push(`VERIFIED statute: ${s.citation}`);
    for (const sec of s.sections) lines.push(`   ${sec.section} ${sec.title}: ${sec.principle}`);
  } else {
    lines.push('UNVERIFIED citation — no reliable match in the Indian legal corpus.');
    if (validation.suggestion) lines.push(`Closest corpus entry (may still be what the lawyer meant): ${validation.suggestion}`);
  }
  lines.push('');
  lines.push('Render your single JSON resolution now.');

  return lines.join('\n');
}

const RESOLUTION_SCHEMA = {
  type: 'object',
  properties: {
    citation_valid: { type: 'boolean' },
    bench_verdict_tag: { type: 'string', enum: VERDICT_TAGS },
    judicial_favor_delta: { type: 'integer', minimum: -25, maximum: 25 },
    judge_dialogue: { type: 'string' },
    opposing_advocate_strike: { type: 'string' },
    co_counsel_tactical_hint: { type: 'string' },
    trial_terminated: { type: 'boolean' },
  },
  required: RESOLUTION_KEYS,
};

export function parseResolution(raw: string): TurnResolution {
  let cleaned = raw.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) cleaned = fence[1].trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new LLMOrchestratorError('Model output contained no JSON object.', 'parser');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new LLMOrchestratorError('Model output contained malformed JSON.', 'parser');
  }

  for (const k of RESOLUTION_KEYS) {
    if (!(k in parsed)) throw new LLMOrchestratorError(`Model output missing required field: ${k}`, 'parser');
  }

  const tagRaw = String(parsed.bench_verdict_tag ?? '').toUpperCase();
  const tag: BenchVerdictTag = VERDICT_TAG_SET.has(tagRaw) ? (tagRaw as BenchVerdictTag) : 'NOTED_FOR_RECORD';
  const deltaRaw = Number(parsed.judicial_favor_delta);
  const delta = Number.isFinite(deltaRaw) ? Math.max(-25, Math.min(25, Math.round(deltaRaw))) : 0;

  return {
    citation_valid: Boolean(parsed.citation_valid),
    bench_verdict_tag: tag,
    judicial_favor_delta: delta,
    judge_dialogue: String(parsed.judge_dialogue ?? '').trim(),
    opposing_advocate_strike: String(parsed.opposing_advocate_strike ?? '').trim(),
    co_counsel_tactical_hint: String(parsed.co_counsel_tactical_hint ?? '').trim(),
    trial_terminated: Boolean(parsed.trial_terminated),
  };
}

export async function resolveTurn(args: {
  config: LLMConfig;
  scenario: ScenarioBundle;
  favorBefore: number;
  turnNumber: number;
  history: TurnRecord[];
  action: PlayerAction;
  validation: ValidationResult;
}): Promise<{ resolution: TurnResolution; raw: string }> {
  const user = buildUserPrompt({ ...args, maxTurns: args.scenario.maxTurns });
  const raw = await requestChat({
    config: args.config,
    system: SYSTEM_INSTRUCTION,
    user,
    temperature: 0.4,
    jsonSchema: RESOLUTION_SCHEMA,
    maxTokens: 1024,
  });
  const resolution = parseResolution(raw);
  return { resolution, raw };
}