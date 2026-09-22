import type {
  LLMConfig,
  OpponentPlayedCard,
  OpposingBrief,
  PlayerAction,
  ScenarioBundle,
  TurnRecord,
  TurnResolution,
  ValidationResult,
} from '../types/legal';
import { LLMOrchestratorError } from '../core/providerCall';

/**
 * LOCAL JUDGE — keyless sparring mode.
 *
 * A deterministic, client-side bench so the full game loop is playable with
 * zero setup. It also plays the opposing agent's counter-cards. The real LLM
 * bench remains the 'pro circuit' once a key is armed; this judge never
 * fabricates law — it argues only from the scenario's real corpus deck.
 */

export const SPARRING_MARKER = '[SPARRING BENCH — LOCAL JUDGE]';

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function isSparringBrief(brief?: OpposingBrief | null): boolean {
  return brief?.origin === 'sparring' || (!!brief?.strike && brief.strike.includes(SPARRING_MARKER));
}

/** Cards still in the player's deck (not yet played to the record). */
function unplayedDeck(scenario: ScenarioBundle, history: TurnRecord[]): OpponentPlayedCard[] {
  const played = new Set(
    history
      .map((r) => r.playerAction.precedentCardId)
      .filter((x): x is string => !!x),
  );
  return scenario.availablePrecedents
    .filter((c) => !played.has(c.id))
    .map((c) => ({
      citation: c.citation,
      caseName: c.caseName,
      year: c.year,
      court: c.court,
      jurisdiction: c.jurisdiction,
      ratio: c.ratioDecidendi,
    }));
}

/**
 * Opponent counter-card selection: prefers same-domain authority that can be
 * read against the player's case, else the strongest procedural attack.
 */
export function pickOpponentCard(
  scenario: ScenarioBundle,
  action: PlayerAction,
  history: TurnRecord[],
  turnNumber: number,
): OpponentPlayedCard | null {
  const deck = unplayedDeck(scenario, history);
  if (!deck.length) return null;

  const playerText = action.rawText.toLowerCase();
  const lastTag = history.length ? history[history.length - 1].resolution.bench_verdict_tag : '';

  // If the player is winning too hard, the opponent burns their best card.
  if (lastTag === 'SUSTAINED' || turnNumber <= 1) {
    const idx = hashStr(`${scenario.id}:${turnNumber}`) % deck.length;
    return deck[idx];
  }
  // Otherwise the opponent probes with a card matching the player's theme.
  const themed = deck.find((c) =>
    c.ratio.toLowerCase().split(/[.;]/).some((clause) =>
      playerText.includes(clause.trim().split(' ').slice(0, 4).join(' ').toLowerCase()),
    ),
  );
  const fallbackIdx = hashStr(`${scenario.id}:${turnNumber}:probe`) % deck.length;
  return themed ?? deck[fallbackIdx];
}

export interface LocalVerdictArgs {
  scenario: ScenarioBundle;
  action: PlayerAction;
  validation: ValidationResult;
  turnNumber: number;
  maxTurns: number;
  history: TurnRecord[];
  streak: number;
}

export interface LocalVerdict {
  resolution: TurnResolution;
  brief: OpposingBrief;
}

const MAX_FAVOR_DELTA = 25;

export function localVerdict(args: LocalVerdictArgs): LocalVerdict {
  const { scenario, action, validation, turnNumber, maxTurns, history, streak } = args;
  const playedCard = action.kind === 'precedent_card' && !!action.precedentCardId;
  const text = action.rawText.trim();
  const words = text.split(/\s+/).filter(Boolean).length;

  const opponentCard = pickOpponentCard(scenario, action, history, turnNumber);

  // --- Ruling -------------------------------------------------------------
  let tag: TurnResolution['bench_verdict_tag'];
  let delta: number;
  let judgeDialogue: string;
  let strike: string;
  let hint: string;

  if (playedCard && validation.verified) {
    tag = 'SUSTAINED';
    delta = 12 + Math.min(8, words / 10);
    judgeDialogue = `Counsel's authority goes to the heart of the dispute. ${opponentCard ? `The counter-authority of ${opponentCard.caseName} is noted, but the ratio fits the facts before me.` : 'No counter-authority disturbs it.'} The application is sustained.`;
    strike = opponentCard
      ? `Then the bench will hear ${opponentCard.citation}: its ratio cuts the other way on these facts, and my friend has not distinguished it.`
      : 'The bench is with my friend — for now. Our case will be answered on the law, not on adjectives.';
    hint = opponentCard
      ? `Distinguish ${opponentCard.caseName} on facts before the next turn, or the court will read it against us.`
      : 'Press the advantage: the same line of authority will sustain the closing.';
  } else if (validation.verified || text.length > 120) {
    tag = 'NOTED_FOR_RECORD';
    delta = 2 + Math.min(5, words / 20);
    judgeDialogue = `The submission is heard and partly accepted. ${validation.verified ? 'The authority cited stands in the record.' : 'No authority was cited, but the argument has substance.'} The bench reserves on weight.`;
    strike = opponentCard
      ? `If the bench is reserving, it should also read ${opponentCard.citation} — which my friend's application conveniently ignores.`
      : 'Reserving is generous. Our position stands un-rebutted on the record.';
    hint = validation.verified
      ? 'A card played cleanly would have sustained this. Play the authority, not the adjectives.'
      : 'Cite a verified precedent card next turn — the bench reserves on unsupported argument.';
  } else {
    tag = 'BENCH_WARNING';
    delta = -3;
    judgeDialogue = 'Counsel, this Chamber requires precision: either authority or a concrete application of the facts. Rhetoric alone will not move the bench.';
    strike = opponentCard
      ? `Gladly. The bench should have ${opponentCard.citation} in front of it while counsel improvises.`
      : 'The bench is being patient. We will not need to be.';

    hint = 'Open the deck and play a verified precedent card — warnings cost favor.';
  }

  if (tag !== 'SUSTAINED' && streak >= 3) {
    delta -= 1;
  }

  // Closing turn amplifies stakes.
  if (turnNumber >= maxTurns) {
    if (tag === 'SUSTAINED') delta += 4;
    if (tag === 'BENCH_WARNING') delta -= 3;
    judgeDialogue += ' This being the final submission, the bench fixes its position on the record as argued.';
  }

  delta = Math.max(-MAX_FAVOR_DELTA, Math.min(MAX_FAVOR_DELTA, Math.round(delta)));

  const opponentCite =
    opponentCard && tag !== 'SUSTAINED'
      ? ` Opposing counsel put ${opponentCard.citation} on the table and it weighs against the application.`
      : '';

  const resolution: TurnResolution = {
    citation_valid: validation.verified,
    bench_verdict_tag: tag,
    judicial_favor_delta: delta,
    judge_dialogue: `${judgeDialogue}${opponentCite}`,
    opposing_advocate_strike: strike,
    co_counsel_tactical_hint: hint,
    trial_terminated: false,
  };

  const brief: OpposingBrief = {
    strike: strike || 'Opposing counsel looks on.',
    raw: `${SPARRING_MARKER} local sparring response`,
    origin: 'sparring',
    opponentCard,
  };

  return { resolution, brief };
}

/** Drop-in async mirror of the LLM turn resolution for the sparring branch. */
export async function resolveTurnSparring(args: LocalVerdictArgs): Promise<{ resolution: TurnResolution; raw: string; brief: OpposingBrief }> {
  const { resolution, brief } = localVerdict(args);
  return { resolution, raw: `${SPARRING_MARKER} deterministic local verdict`, brief };
}

/** Guard so sparring helpers never masquerade as real LLM paths. */
export function assertNotLLMConfig(config: LLMConfig | null): void {
  if (config) throw new LLMOrchestratorError('Sparring mode must not receive an LLM config.', 'config');
}
