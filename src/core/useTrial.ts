import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type {
  LLMConfig,
  PlayerAction,
  ScenarioBundle,
  SessionSummary,
  TurnRecord,
} from '../types/legal';
import type { ValidationResult } from '../types/legal';
import { CitationIndex } from './searchIndex';
import { resolveTurn, sendOpponentBrief } from './llmOrchestrator';
import { buildSessionSummary } from './docket';
import { createKeyManager } from './storage';
import { pickOpponentCard, resolveTurnSparring } from '../game/localJudge';
import { CREDIT_COSTS, spendCredits } from './meter';

export type TrialPhase = 'awaiting' | 'resolving' | 'verdict' | 'docket';

export interface TrialState {
  phase: TrialPhase;
  favor: number;
  turn: number;
  history: TurnRecord[];
  last: TurnRecord | null;
  summary: SessionSummary | null;
  maxTurns: number;
  streak: number;
  pot: number;
  /** Precedent cards consumed this trial — reducer-owned so a restart or remount cannot resurrect them. */
  playedCardIds: string[];
}

type TrialAction =
  | { type: 'START'; scenario: ScenarioBundle }
  | { type: 'RESOLVING' }
  | { type: 'VERDICT'; scenario: ScenarioBundle; record: TurnRecord }
  | { type: 'NEXT_TURN'; scenario: ScenarioBundle }
  | { type: 'REVERT' }
  | { type: 'END_TRIAL'; scenario: ScenarioBundle };

function newTrialId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function flushSummary(scenario: ScenarioBundle, state: TrialState): SessionSummary {
  return buildSessionSummary({
    scenario,
    turnRecords: state.history,
    finalFavor: state.favor,
  });
}

export function trialReducer(state: TrialState, action: TrialAction): TrialState {
  switch (action.type) {
    case 'START':
      // The trial opens straight into 'awaiting' — the chamber renders the
      // opening statement itself and the first turn is immediately arguable.
      return {
        phase: 'awaiting',
        favor: action.scenario.initialJudicialFavor,
        turn: 1,
        history: [],
        last: null,
        summary: null,
        maxTurns: action.scenario.maxTurns,
        streak: 0,
        pot: 0,
        playedCardIds: [],
      };
    case 'RESOLVING':
      return { ...state, phase: 'resolving' };
    case 'VERDICT': {
      const history = [...state.history, action.record];
      const favor = Math.max(0, Math.min(100, state.favor + action.record.resolution.judicial_favor_delta));
      // Gamification: a SUSTAINED turn with a verified citation is a "won hand"
      // — it grows the streak and pushes its delta into the pot.
      const won =
        action.record.resolution.bench_verdict_tag === 'SUSTAINED' && action.record.resolution.citation_valid;
      const streak = won ? state.streak + 1 : 0;
      const pot = state.pot + (won ? Math.max(0, action.record.resolution.judicial_favor_delta) : 0);
      // Deck exhaustion lives HERE, not in component state: once a card is
      // played on the record it stays played through REVERT, NEXT_TURN and
      // remounts. Only a full restart (START) re-deals the deck.
      const playedCardId = action.record.playerAction.precedentCardId;
      const playedCardIds =
        playedCardId && !state.playedCardIds.includes(playedCardId)
          ? [...state.playedCardIds, playedCardId]
          : state.playedCardIds;
      return { ...state, history, favor, last: action.record, phase: 'verdict', streak, pot, playedCardIds };
    }
    case 'NEXT_TURN': {
      const last = state.last;
      const terminated =
        !!last?.resolution.trial_terminated || state.turn >= state.maxTurns || state.favor <= 0 || state.favor >= 100;
      if (terminated) {
        return { ...state, phase: 'docket', summary: flushSummary(action.scenario, state) };
      }
      return { ...state, turn: state.turn + 1, phase: 'awaiting' };
    }
    case 'END_TRIAL':
      return { ...state, phase: 'docket', summary: flushSummary(action.scenario, state) };
    case 'REVERT':
      return { ...state, phase: 'awaiting' };
    default:
      return state;
  }
}

const initialState: TrialState = {
  phase: 'awaiting',
  favor: 50,
  turn: 1,
  history: [],
  last: null,
  summary: null,
  maxTurns: 5,
  streak: 0,
  pot: 0,
  playedCardIds: [],
};

export interface TrialController {
  state: TrialState;
  submitAction: (action: PlayerAction) => Promise<void>;
  advance: () => void;
  endTrial: () => void;
  restart: () => void;
  error: string | null;
  clearError: () => void;
}

export function useTrial(scenario: ScenarioBundle, index: CitationIndex): TrialController {
  const [state, dispatch] = useReducer(trialReducer, initialState);
  const [error, setError] = useState<string | null>(null);
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const indexRef = useRef(index);
  indexRef.current = index;
  const busyRef = useRef(false);
  const kmRef = useRef(createKeyManager());
  // One toll per trial run, charged against the daily credit meter. Reseeded on
  // restart so a brand-new trial pays again (and a re-run of the SAME id in a
  // day is never double-billed).
  const trialIdRef = useRef(newTrialId());

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    trialIdRef.current = newTrialId();
    dispatch({ type: 'START', scenario });
  }, [scenario.id]);  

  const submitAction = useCallback(async (action: PlayerAction) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    dispatch({ type: 'RESOLVING' });
    try {
      const km = kmRef.current;
      const config: LLMConfig | null = await km.loadConfig();

      let validation: ValidationResult;
      try {
        if (action.kind === 'precedent_card' && action.precedentCardId) {
          // Card plays come straight from the verified deck — verify locally by id,
          // never by fuzzy text matching (the deck text is not a citation string).
          const card = indexRef.current.getCaseById(action.precedentCardId);
          validation = card ? { citedPrecedent: card, verified: true } : { verified: false };
        } else {
          validation = indexRef.current.validateCitation(action.rawText);
        }
      } catch {
        validation = { verified: false };
      }

      const now = scenarioRef.current;

      // KEYLESS SPARRING: no key armed means the local deterministic bench
      // rules instantly and plays the opponent's counter-cards itself. The
      // LLM path below remains the 'pro circuit'.
      if (!config) {
        const sparring = await resolveTurnSparring({
          scenario: now,
          action,
          validation,
          turnNumber: stateRef.current.turn,
          maxTurns: now.maxTurns,
          history: stateRef.current.history,
          streak: 0,
        });
        const citedPrecedentSparring = validation.verified
          ? action.kind === 'precedent_card' && action.precedentCardId
            ? (now.availablePrecedents.find((p) => p.id === action.precedentCardId) ?? validation.citedPrecedent)
            : validation.citedPrecedent
          : undefined;
        const recordSparring: TurnRecord = {
          turnNumber: stateRef.current.turn,
          playerAction: action,
          resolution: sparring.resolution,
          opposingBrief: sparring.brief,
          citedPrecedent: citedPrecedentSparring,
          rawModelOutput: sparring.raw,
        };
        dispatch({ type: 'VERDICT', scenario: now, record: recordSparring });
        return;
      }

      // AGENTIC WIRING, CALL 1: the opponent agent strikes FIRST, with the trial
      // state pushed into their context. If this call fails, the trial survives —
      // the strike degrades to the persona's standing attack theme.
      const toll = spendCredits(CREDIT_COSTS.trial, `trial:${trialIdRef.current}`);
      if (!toll.ok) {
        throw new Error(
          `Daily credit limit reached (${toll.used}/${toll.cap} used). The free keyless bench still rules instantly — clear your key, or start a new trial tomorrow.`,
        );
      }
      let opposingBrief;
      try {
        opposingBrief = await sendOpponentBrief({
          config,
          scenario: now,
          turnNumber: stateRef.current.turn,
          history: stateRef.current.history,
          action,
          validation,
          deck: now.availablePrecedents,
        });
      } catch {
        opposingBrief = {
          strike: now.opposingCounselPersona.interlocutoryAttackTheme
            ? `Falls back to the standing theme: ${now.opposingCounselPersona.interlocutoryAttackTheme}.`
            : 'Opposing counsel rests on the opening.',
          raw: '',
        };
      }

      // CARD-PLAYING OPPONENT: the agent picks and justifies its own
      // counter-card (verified against the deck in parseOpponentReply — an
      // invented citation is discarded). The local selector fills in only
      // when the agent declined to play or its call failed.
      opposingBrief = {
        ...opposingBrief,
        opponentCard:
          opposingBrief.opponentCard ??
          pickOpponentCard(now, action, stateRef.current.history, stateRef.current.turn),
      };

      // CALL 2: the judge rules second, with BOTH the submission and the
      // opponent's live brief in front of them.
      const resolved = await resolveTurn({
        config,
        scenario: now,
        favorBefore: stateRef.current.favor,
        turnNumber: stateRef.current.turn,
        history: stateRef.current.history,
        action,
        validation,
        opponentBrief: opposingBrief.strike,
      });

      // INTEGRITY GATE: only a locally VERIFIED citation is attached to the
      // record. validation.citedPrecedent may hold a fuzzy nearest-match even
      // when verified=false — that suggestion must never enter the permanent
      // docket as though the lawyer cited it successfully.
      let citedPrecedent;
      if (validation.verified) {
        citedPrecedent =
          action.kind === 'precedent_card' && action.precedentCardId
            ? (now.availablePrecedents.find((p) => p.id === action.precedentCardId) ??
              validation.citedPrecedent)
            : validation.citedPrecedent;
      }

      const record: TurnRecord = {
        turnNumber: stateRef.current.turn,
        playerAction: action,
        resolution: resolved.resolution,
        opposingBrief,
        citedPrecedent,
        rawModelOutput: resolved.raw,
      };
      dispatch({ type: 'VERDICT', scenario: now, record });
    } catch (err) {
      dispatch({ type: 'REVERT' });
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      busyRef.current = false;
    }
  }, []);

  const advance = useCallback(() => {
    dispatch({ type: 'NEXT_TURN', scenario: scenarioRef.current });
  }, []);

  const endTrial = useCallback(() => {
    dispatch({ type: 'END_TRIAL', scenario: scenarioRef.current });
  }, []);

  const restart = useCallback(() => {
    trialIdRef.current = newTrialId();
    dispatch({ type: 'START', scenario: scenarioRef.current });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({ state, submitAction, advance, endTrial, restart, error, clearError }),
    [state, submitAction, advance, endTrial, restart, error, clearError],
  );
}