import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Gavel, KeyRound, X } from 'lucide-react';
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
import { CardTable } from '../game/CardTable';
import { computeWinner, dealHand } from '../game/cardMeta';

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
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
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
      setPendingCardId(null);
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
    setPendingCardId(null);
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
    setPendingCardId(cardId ?? null);
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

  // Table choreography.
  const tableCardId = pendingCardId ?? state.last?.playerAction.precedentCardId ?? null;
  const tablePlayerCard = tableCardId
    ? (scenario.availablePrecedents.find((p) => p.id === tableCardId) ?? null)
    : null;
  const tableOpponentCard = state.last?.opposingBrief?.opponentCard ?? null;
  const tableStage: 'idle' | 'resolving' | 'verdict' =
    state.phase === 'verdict' ? 'verdict' : state.phase === 'resolving' ? 'resolving' : 'idle';
  const tableWinner = state.phase === 'verdict' && state.last ? computeWinner(state.last) : 'none';
  const tableReplayKey = `${state.turn}-${tableCardId ?? 'motion'}`;

  return (
    <div className={`felt-bg felt-noise flex h-full flex-col ${shake ? 'screen-shake' : ''}`}>
      <ChamberHeader scenario={scenario} state={state} onExit={() => onExit(run)} />

      {boss && (
        <div className="border-b border-white/10 bg-slate-950/70 px-4 py-2 backdrop-blur">
          <p className="text-xs leading-snug font-sans">
            <span className="font-mono text-[11px] font-semibold text-rose-300">
              {boss.name} · Target {boss.target} chips
            </span>
            <span className="text-slate-300"> — {boss.special}</span>
          </p>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
        {/* ── The table strip ─────────────────────────────────────── */}
        <div className="shrink-0 space-y-2.5 px-3 pt-3 lg:px-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-400/40 bg-rose-950/60 font-sans text-xs font-bold text-rose-200 shadow-sm">
                {scenario.opposingCounselPersona.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-sans text-xs font-semibold text-rose-300">
                  {scenario.opposingCounselPersona.name}
                </p>
                <p className="truncate font-mono text-[10px] text-slate-400">
                  Style · {scenario.opposingCounselPersona.style.replace(/_/g, ' ')}
                  {scenario.opposingCounselPersona.interlocutoryAttackTheme
                    ? ` · targeting ${scenario.opposingCounselPersona.interlocutoryAttackTheme}`
                    : ''}
                </p>
              </div>
            </div>
            <span className="min-w-0 max-w-[45%] shrink-0 truncate rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-right font-mono text-[10px] text-slate-300">
              {scenario.bench}
            </span>
          </div>

          <CardTable
            stage={tableStage}
            playerCard={tablePlayerCard}
            opponentCard={tableOpponentCard}
            winner={tableWinner}
            record={state.last}
            clientName={scenario.clientName}
            replayKey={tableReplayKey}
          />
        </div>

        {/* ── Case file toggle + trial transcript ─────────────────── */}
        <div className="shrink-0 px-3 pt-3 lg:px-6">
          {error && (
            <div className="mb-3 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/80 p-3.5 shadow-lg backdrop-blur text-rose-200">
              <div className="flex-1 text-xs leading-relaxed">
                <strong className="font-semibold">Submission Note:</strong> {error}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={onOpenKeys} aria-label="Open key vault" className="m3-btn m3-btn-tonal px-3 py-1 text-xs text-white">
                  <KeyRound className="inline h-3 w-3" /> Key Vault
                </button>
                <button type="button" onClick={clearError} aria-label="Dismiss error" className="m3-btn m3-btn-outlined px-3 py-1 text-xs text-slate-300">
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <button
            aria-label={fileOpen ? 'Close the case file' : 'Open the case file and authority board'}
            type="button"
            onClick={() => { void notifyTap(); setFileOpen((v) => !v); }}
            className="m3-btn m3-btn-tonal w-full py-2.5 text-xs text-amber-300 shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" /> {fileOpen ? 'Close the Case File' : 'Open the Case File & Precedent Archive'}
          </button>
        </div>

        {/* Capped scrollable transcript */}
        <div ref={transcriptRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 lg:max-h-[34vh] lg:px-6">
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
              <Gavel className="anim-float h-5 w-5 text-amber-300" />
              <span className="font-sans text-xs font-medium text-slate-300">Clerk · the Bench is recording your authority…</span>
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
          onRetry={() => { void notifyTap(); setPendingCardId(null); setSelectedCardId(null); restart(); }}
        />
      </main>

      {/* ── Case file drawer ──────────────────────────────────────── */}
      <div className={`fixed inset-0 z-40 ${fileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!fileOpen}>
        <div
          className={`absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity ${fileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setFileOpen(false)}
          aria-hidden
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[min(92vw,400px)] flex-col border-l border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ${fileOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <p className="font-display text-sm font-bold text-amber-300">The Case File &amp; Authorities</p>
            <button
              type="button"
              aria-label="Close the case file"
              onClick={() => setFileOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
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