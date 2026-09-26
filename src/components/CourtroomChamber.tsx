import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ScenarioBundle } from '../types/legal';
import type { CitationIndex } from '../core/searchIndex';
import { useTrial } from '../core/useTrial';
import { DocketExportModal } from './DocketExportModal';
import { ChamberHeader } from './chamber/ChamberHeader';
import { notifyTap, notifyVerdict } from '../core/haptics';
import { applyMatterPayout, applyTurnScore, loadRun, saveRun, type MatterPayout, type RunState } from '../game/runStore';
import { bossForJurisdiction } from '../game/bosses';
import { notifyVerdictSfx, sfx } from '../game/sfx';
import { ChipBurst, ScorePopup, useScreenShake } from '../game/juice';
import { ShopModal } from '../game/ShopModal';
import type { JokerId } from '../game/jokers';
import { isFlagEnabled } from '../core/flags';
import { VerdictFlash, JudgeMessage, OpponentMessage, PlayerMessage } from './chamber/messages';
import { ResolutionBlock } from './chamber/ResolutionBlock';
import { ChamberSidebar } from './chamber/ChamberSidebar';
import { ChamberActionBar } from './chamber/ChamberActionBar';
import { HandFan } from '../game/HandFan';
import { dealHand } from '../game/cardMeta';

interface CourtroomChamberProps {
  scenario: ScenarioBundle;
  index: CitationIndex;
  /** Run-layer id: static matters carry the 'static-' boss prefix, generated ones are their seed id. */
  gameScenarioId: string;
  onExit: (run: RunState) => void;
  onOpenKeys: () => void;
}

export function CourtroomChamber({ scenario, index, gameScenarioId, onExit, onOpenKeys }: CourtroomChamberProps) {
  const { state, submitAction, advance, endTrial, restart, error, clearError } = useTrial(scenario, index);
  const [mode, setMode] = useState<'cards' | 'freeform'>('cards');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [motion, setMotion] = useState('');
  const [fileOpen, setFileOpen] = useState(false);
  const [run, setRun] = useState<RunState>(() => loadRun());
  const [turnGame, setTurnGame] = useState<ReturnType<typeof applyTurnScore> | null>(null);
  const [payout, setPayout] = useState<MatterPayout | null>(null);
  const [burst, setBurst] = useState(0);
  const [shopOpen, setShopOpen] = useState(false);
  const streakRef = useRef(0);
  const trialChipsRef = useRef(0);
  const trialStreakBestRef = useRef(0);
  const shake = useScreenShake(state.phase === 'verdict' ? state.last?.rawModelOutput : null);
  const isStaticMatter = gameScenarioId.startsWith('static-');
  const boss = isStaticMatter ? bossForJurisdiction(scenario.jurisdiction) : null;
  const transcriptRef = useRef<HTMLDivElement>(null);

  // The matter's verified deck is dealt as a fanned hand, in seeded order —
  // stable across turns, remounts and restarts of the same matter.
  const hand = useMemo(() => dealHand(scenario.availablePrecedents, scenario.id), [scenario]);
  const playedIds = useMemo(() => new Set(state.playedCardIds), [state.playedCardIds]);

  useEffect(() => {
    if (state.phase === 'awaiting' && state.turn === 1 && state.history.length === 0) {
      setSelectedCardId(null);
      setMotion('');
      setMode('cards');
      setTurnGame(null);
      setPayout(null);
      streakRef.current = 0;
      trialChipsRef.current = 0;
      trialStreakBestRef.current = 0;
    }
  }, [state.phase, state.turn, state.history.length]);

  useEffect(() => {
    if (state.last && state.phase === 'verdict') {
      void notifyVerdict(state.last.resolution.bench_verdict_tag, state.last.resolution.judicial_favor_delta);
      notifyVerdictSfx(state.last.resolution.bench_verdict_tag);

      const result = applyTurnScore(run, state.last.resolution, {
        scenarioId: gameScenarioId,
        jurisdiction: scenario.jurisdiction,
        playedCard: state.last.playerAction.kind === 'precedent_card',
        streak: streakRef.current,
        freeformChars: state.last.playerAction.rawText.length,
        turnNumber: state.last.turnNumber,
        maxTurns: scenario.maxTurns,
      });
      streakRef.current = result.streakAfter;
      trialChipsRef.current += result.score.total;
      if (result.streakAfter > trialStreakBestRef.current) trialStreakBestRef.current = result.streakAfter;
      saveRun(run);
      setRun({ ...run });
      setTurnGame(result);
      if (result.score.total > 0) {
        setBurst((b) => b + 1);
        sfx.chips();
      }
    }
  }, [state.last?.rawModelOutput, state.phase]);

  useEffect(() => {
    if (state.phase === 'docket' && state.summary && !payout) {
      const result = applyMatterPayout(run, {
        scenarioId: gameScenarioId,
        jurisdiction: scenario.jurisdiction,
        finalFavor: state.summary.finalFavor,
        turnTotalChips: trialChipsRef.current,
        streakBest: trialStreakBestRef.current,
      });
      saveRun(run);
      setRun({ ...run });
      setPayout(result);
      setBurst((b) => b + 1);
      sfx.win();
    }
  }, [state.phase, state.summary]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.history.length, state.phase, state.last?.rawModelOutput]);

  const handleAdvance = useCallback(() => {
    setSelectedCardId(null);
    advance();
  }, [advance]);

  useEffect(() => {
    if (state.phase === 'verdict' && state.last) {
      const t = window.setTimeout(() => handleAdvance(), 2600);
      return () => window.clearTimeout(t);
    }
  }, [state.phase, state.last?.rawModelOutput, handleAdvance]);

  const selectedCard = useMemo(
    () => scenario.availablePrecedents.find((c) => c.id === selectedCardId),
    [scenario, selectedCardId],
  );

  const canSubmit = mode === 'cards'
    ? !!selectedCard && !state.playedCardIds.includes(selectedCard.id)
    : motion.trim().length >= 12;

  const handleSubmittable = async () => {
    if (state.phase !== 'awaiting') return;
    const card = selectedCard;
    if (mode === 'cards' && card && state.playedCardIds.includes(card.id)) return;
    let actionText: string;
    if (mode === 'cards' && card) {
      actionText = `Move: apply ${card.citation} — ${card.caseName}. ${card.ratioDecidendi} Ground: this client's facts fall directly within this ruling; statutory hooks ${card.statutoryProvisions.join(', ')}.`;
    } else {
      actionText = motion.trim();
    }
    const cardId = mode === 'cards' && card ? card.id : undefined;
    await submitAction({
      kind: cardId ? 'precedent_card' : 'freeform_motion',
      precedentCardId: cardId,
      freeformText: actionText,
      rawText: actionText,
    });
  };

  const handleCardSelect = (cardId: string) => {
    void notifyTap();
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (canSubmit) void handleSubmittable();
    }
  };

  const isFinalTurn = state.turn >= state.maxTurns;
  const verdictFlashVisible = state.phase === 'verdict' && !!state.last;

  return (
    <div className={`min-h-screen bg-slate-50 flex h-full flex-col text-slate-900 ${shake ? 'screen-shake' : ''}`}>
      <ChamberHeader
        scenario={scenario}
        state={state}
        onExit={() => onExit(run)}
        fileOpen={fileOpen}
        onToggleFile={() => { void notifyTap(); setFileOpen((v) => !v); }}
      />

      {boss && (
        <div className="border-b border-slate-200/80 bg-white/80 px-4 py-2 backdrop-blur-md">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-700 font-medium">
            <span className="font-bold text-slate-900">
              {boss.name} · Target {boss.target} chips
            </span>
            <span className="text-slate-500">{boss.special}</span>
          </div>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
        {error && (
          <div className="shrink-0 px-3 pt-2.5 lg:px-6 max-w-5xl mx-auto w-full">
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 shadow-sm text-rose-900">
              <div className="flex-1 text-xs leading-relaxed">
                <strong className="font-bold">Submission Note:</strong> {error}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={onOpenKeys} aria-label="Open key vault" className="m3-btn m3-btn-tonal px-3 py-1 text-xs bg-white text-slate-800 border border-slate-200">
                  Key Vault
                </button>
                <button type="button" onClick={clearError} aria-label="Dismiss error" className="m3-btn m3-btn-outlined px-3 py-1 text-xs text-slate-600 border border-slate-200">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Capped scrollable transcript */}
        <div ref={transcriptRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 lg:max-h-[34vh] lg:px-6 max-w-5xl mx-auto w-full">
          <OpponentMessage
            from={scenario.opposingCounselPersona.name ?? 'Opposing Senior Advocate'}
            text={scenario.opposingCounselPersona.initialOpeningStatement}
            style={scenario.opposingCounselPersona.style}
            attack={scenario.opposingCounselPersona.interlocutoryAttackTheme}
          />
          <JudgeMessage meta="Preliminary direction" text={`The Bench has taken up the matter. The record before us establishes standing; we shall hear ${scenario.clientName} on the core dispute. On the record so far, this Court is neutral as to the eventual disposition. Counsel, you have ${state.maxTurns} opportunities to move this Bench. Begin.`} />

          {state.history.map((rec) => (
            <PlayerMessage
              key={`p-${rec.turnNumber}`}
              text={rec.playerAction.rawText}
              verified={rec.resolution.citation_valid}
              tag={scenario.clientName}
            />
          ))}

          {state.phase !== 'verdict' ? (
            state.history.map((rec) => <ResolutionBlock key={`r-${rec.turnNumber}`} record={rec} />)
          ) : (
            state.last && (
              <div key={`r-live-${state.last.turnNumber}-${state.last.rawModelOutput.length}`} className="anim-deal">
                <ResolutionBlock record={state.last} />
              </div>
            )
          )}

          {state.phase === 'awaiting' && (
            <JudgeMessage
              meta={`Turn ${state.turn} of ${state.maxTurns}${isFinalTurn ? ' · final opportunity' : ''}`}
              text={`Counsel for ${scenario.clientName}, the Bench awaits your ${isFinalTurn ? 'final' : 'next'} submission. Play a precedent from your hand, or file a motion on the record. What is your position?`}
            />
          )}

          {state.phase === 'resolving' && (
            <div className="flex items-center gap-3 py-4">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping" />
              <span className="font-sans text-xs font-semibold text-slate-700">Clerk · the Bench is recording your authority…</span>
            </div>
          )}

          <div className="h-2" />
        </div>

        {/* ── Your hand ───────────────────────────────────────────── */}
        <HandFan
          cards={hand}
          playedIds={playedIds}
          selectedId={selectedCardId}
          active={mode === 'cards' && state.phase === 'awaiting'}
          onSelect={handleCardSelect}
          pot={state.pot}
          streak={state.streak}
          clientName={scenario.clientName}
        />

        <ChamberActionBar
          state={state}
          mode={mode}
          allowFreeform={isFlagEnabled('freeformMotion')}
          motion={motion}
          canSubmit={canSubmit}
          isFinalTurn={isFinalTurn}
          handLeft={hand.length - state.playedCardIds.length}
          onSetMode={(m) => { void notifyTap(); setMode(m); }}
          onMotionChange={setMotion}
          onKeyDown={handleKeyDown}
          onSubmit={() => void handleSubmittable()}
          onContinue={handleAdvance}
          onRetry={() => { void notifyTap(); setSelectedCardId(null); restart(); }}
        />
      </main>

      {/* ── Case file drawer ──────────────────────────────────────── */}
      <div className={`fixed inset-0 z-40 ${fileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!fileOpen}>
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity ${fileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setFileOpen(false)}
          aria-hidden
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[min(92vw,440px)] flex-col border-l border-slate-200 bg-white/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ${fileOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <p className="font-display text-sm font-bold text-slate-900">Case File &amp; Authority Deck</p>
            <button
              type="button"
              aria-label="Close the case file"
              onClick={() => setFileOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-mono font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <ChamberSidebar scenario={scenario} selectedCardId={selectedCardId} onSelectCard={handleCardSelect} />
        </aside>
      </div>

      {verdictFlashVisible && state.last && <VerdictFlash record={state.last} />}
      {verdictFlashVisible && turnGame && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center">
          <ScorePopup
            visible
            events={turnGame.score.events}
            chips={turnGame.score.chips}
            mult={turnGame.score.mult}
            total={turnGame.score.total}
            bossName={turnGame.bossName}
            bossRule={turnGame.bossRuleText}
            bossMod={turnGame.bossModifier}
          />
        </div>
      )}
      <ChipBurst fire={burst} />
      {shopOpen && (
        <ShopModal
          chips={run.chips}
          owned={run.jokers}
          onBuy={(id, cost) => {
            const next = { ...run, chips: run.chips - cost, jokers: [...run.jokers, id as JokerId] };
            saveRun(next);
            setRun(next);
          }}
          onClose={() => setShopOpen(false)}
        />
      )}
      {state.phase === 'docket' && state.summary && (
        <DocketExportModal
          scenario={scenario}
          onClose={endTrial}
          summary={state.summary}
          onRestart={restart}
        />
      )}
    </div>
  );
}