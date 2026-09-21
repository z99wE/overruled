import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Gavel, KeyRound } from 'lucide-react';
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

interface CourtroomChamberProps {
  scenario: ScenarioBundle;
  index: CitationIndex;
  /** Run-layer id: static matters carry the 'static-' boss prefix, generated ones are their seed id. */
  gameScenarioId: string;
  onExit: () => void;
  onOpenKeys: () => void;
}

export function CourtroomChamber({ scenario, index, gameScenarioId, onExit, onOpenKeys }: CourtroomChamberProps) {
  const { state, submitAction, advance, endTrial, restart, error, clearError } = useTrial(scenario, index);
  const [mode, setMode] = useState<'cards' | 'freeform'>('cards');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [motion, setMotion] = useState('');
  const [fileOpen, setFileOpen] = useState(false);
  // Deck exhaustion is reducer-owned (state.playedCardIds): it survives REVERT,
  // turn advances and remounts, and only a full restart re-deals the deck.
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

  useEffect(() => {
    if (state.phase === 'verdict' && state.last) {
      const t = window.setTimeout(() => advance(), 2600);
      return () => window.clearTimeout(t);
    }
  }, [state.phase, state.last?.rawModelOutput, advance]);

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
    setSelectedCardId(null);
    setMotion('');
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
    <div className={`felt-bg felt-noise flex h-full flex-col ${shake ? 'screen-shake' : ''}`}>
      <ChamberHeader scenario={scenario} state={state} onExit={onExit} />

      {boss && (
        <div className="border-b-2 border-ink bg-ink/30 px-4 py-1.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-poker-red">
            {boss.name} · target {boss.target} chips
            <span className="text-cream/50"> — {boss.special}</span>
          </p>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ChamberSidebar
          scenario={scenario}
          fileOpen={fileOpen}
          mode={mode}
          selectedCardId={selectedCardId}
          phase={state.phase}
          playedCardIds={state.playedCardIds}
          onSelectCard={handleCardSelect}
        />

        <section className="flex min-h-0 flex-1 flex-col">
          {error && (
            <div className="sticky top-0 z-30 mx-4 mt-3 flex items-start gap-3 rounded-xl border-2 border-ink bg-poker-red p-3 shadow-[0_4px_0_0_var(--color-ink)]">
              <div className="flex-1 text-[12px] leading-relaxed text-cream">
                <strong className="font-display uppercase">Argue failed:</strong> {error}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" onClick={onOpenKeys} aria-label="Open key vault" className="rounded-lg border-2 border-ink bg-felt-800 px-2 py-1 font-display text-[10px] uppercase text-cream">
                  <KeyRound className="inline h-3 w-3" /> Key Vault
                </button>
                <button type="button" onClick={clearError} aria-label="Dismiss error" className="rounded-lg border-2 border-ink bg-ink/40 px-2 py-1 font-display text-[10px] uppercase text-cream">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <button
            aria-label={fileOpen ? 'Close case file' : 'Open case file and precedent deck'}
            type="button"
            onClick={() => { void notifyTap(); setFileOpen((v) => !v); }}
            className="btn-3d mx-4 mt-3 flex items-center justify-center gap-2 rounded-lg border-2 border-ink bg-felt-800 py-2 font-display text-[11px] uppercase tracking-wider text-chip-gold lg:hidden"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${fileOpen ? 'rotate-180' : ''}`} />
            {fileOpen ? 'Close case file' : 'Open case file & precedent deck'}
          </button>

          <div ref={transcriptRef} className="rail-panel min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 lg:px-8">
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
                text={`Counsel for ${scenario.clientName}, the Bench awaits your ${isFinalTurn ? 'final' : 'next'} submission. Cite your authority with precision, or file a motion on the record. What is your position?`}
              />
            )}

            {state.phase === 'resolving' && (
              <div className="flex items-center gap-3 py-6">
                <Gavel className="anim-float h-5 w-5 text-chip-gold" />
                <span className="font-display text-sm uppercase tracking-widest text-cream/70">The Bench is deliberating…</span>
              </div>
            )}

            <div className="h-2" />
          </div>

          <ChamberActionBar
            scenario={scenario}
            state={state}
            mode={mode}
            allowFreeform={isFlagEnabled('freeformMotion')}
            selectedCardId={selectedCardId}
            motion={motion}
            canSubmit={canSubmit}
            isFinalTurn={isFinalTurn}
            onSetMode={setMode}
            onSelectCard={handleCardSelect}
            onMotionChange={setMotion}
            onKeyDown={handleKeyDown}
            onSubmit={() => void handleSubmittable()}
            onContinue={advance}
            onRetry={() => { void notifyTap(); restart(); }}
          />
        </section>
      </main>

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
