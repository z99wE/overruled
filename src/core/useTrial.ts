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
import { LLMOrchestratorError, resolveTurn } from './llmOrchestrator';
import { buildSessionSummary } from './docket';
import { createKeyManager } from './storage';

export type TrialPhase = 'opening' | 'awaiting' | 'resolving' | 'verdict' | 'docket';

export interface TrialState {
  phase: TrialPhase;
  favor: number;
  turn: number;
  history: TurnRecord[];
  last: TurnRecord | null;
  summary: SessionSummary | null;
  maxTurns: number;
}

type TrialAction =
  | { type: 'START'; scenario: ScenarioBundle }
  | { type: 'RESOLVING' }
  | { type: 'VERDICT'; scenario: ScenarioBundle; record: TurnRecord }
  | { type: 'NEXT_TURN'; scenario: ScenarioBundle }
  | { type: 'REVERT' }
  | { type: 'END_TRIAL'; scenario: ScenarioBundle };

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
      return {
        phase: 'opening',
        favor: action.scenario.initialJudicialFavor,
        turn: 1,
        history: [],
        last: null,
        summary: null,
        maxTurns: action.scenario.maxTurns,
      };
    case 'RESOLVING':
      return { ...state, phase: 'resolving' };
    case 'VERDICT': {
      const history = [...state.history, action.record];
      const favor = Math.max(0, Math.min(100, state.favor + action.record.resolution.judicial_favor_delta));
      return { ...state, history, favor, last: action.record, phase: 'verdict' };
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
  phase: 'opening',
  favor: 50,
  turn: 1,
  history: [],
  last: null,
  summary: null,
  maxTurns: 5,
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

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    dispatch({ type: 'START', scenario });
  }, [scenario.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitAction = useCallback(async (action: PlayerAction) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    dispatch({ type: 'RESOLVING' });
    try {
      const km = kmRef.current;
      const config: LLMConfig | null = await km.loadConfig();
      if (!config) throw new LLMOrchestratorError('No provider key configured. Open the Key Vault and add your BYOK key.', 'config');

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
      const resolved = await resolveTurn({
        config,
        scenario: now,
        favorBefore: stateRef.current.favor,
        turnNumber: stateRef.current.turn,
        history: stateRef.current.history,
        action,
        validation,
      });

      let citedPrecedent;
      if (action.kind === 'precedent_card' && action.precedentCardId) {
        citedPrecedent = now.availablePrecedents.find((p) => p.id === action.precedentCardId)
          ?? validation.citedPrecedent;
      } else {
        citedPrecedent = validation.citedPrecedent;
      }

      const record: TurnRecord = {
        turnNumber: stateRef.current.turn,
        playerAction: action,
        resolution: resolved.resolution,
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
    dispatch({ type: 'START', scenario: scenarioRef.current });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({ state, submitAction, advance, endTrial, restart, error, clearError }),
    [state, submitAction, advance, endTrial, restart, error, clearError],
  );
}