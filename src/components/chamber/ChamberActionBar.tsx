import { ArrowRight, BookOpen, Loader2, MessageSquareQuote, RotateCcw } from 'lucide-react';
import type { ScenarioBundle } from '../../types/legal';
import { PrecedentCard } from '../PrecedentCard';
import type { TrialState } from '../../core/useTrial';

interface ChamberActionBarProps {
  scenario: ScenarioBundle;
  state: TrialState;
  mode: 'cards' | 'freeform';
  allowFreeform: boolean;
  selectedCardId: string | null;
  motion: string;
  canSubmit: boolean;
  isFinalTurn: boolean;
  onSetMode: (mode: 'cards' | 'freeform') => void;
  onSelectCard: (cardId: string) => void;
  onMotionChange: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSubmit: () => void;
  onContinue: () => void;
  onRetry: () => void;
}

export function ChamberActionBar({
  scenario,
  state,
  mode,
  allowFreeform,
  selectedCardId,
  motion,
  canSubmit,
  isFinalTurn,
  onSetMode,
  onSelectCard,
  onMotionChange,
  onKeyDown,
  onSubmit,
  onContinue,
  onRetry,
}: ChamberActionBarProps) {
  return (
    <div className="sticky bottom-0 border-t-2 border-ink bg-felt-950/95 p-3 backdrop-blur lg:p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        {state.phase === 'awaiting' ? (
          <>
            <div className="flex gap-2">
              <button
                aria-label="Play a precedent card"
                type="button"
                onClick={() => onSetMode('cards')}
                className={`btn-3d flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-ink px-2 py-2 font-display text-[11px] uppercase tracking-wider ${
                  mode === 'cards' ? 'bg-chip-gold text-ink' : 'bg-felt-800 text-cream/70'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Precedent Card
              </button>
              {allowFreeform && (
                <button
                  aria-label="File a freeform motion"
                  type="button"
                  onClick={() => onSetMode('freeform')}
                  className={`btn-3d flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-ink px-2 py-2 font-display text-[11px] uppercase tracking-wider ${
                    mode === 'freeform' ? 'bg-chip-gold text-ink' : 'bg-felt-800 text-cream/70'
                  }`}
                >
                  <MessageSquareQuote className="h-3.5 w-3.5" /> Freeform Motion
                </button>
              )}
            </div>

            {mode === 'cards' ? (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {scenario.availablePrecedents.map((c) => (
                  <PrecedentCard
                    key={c.id}
                    card={c}
                    selected={selectedCardId === c.id}
                    exhausted={state.playedCardIds.includes(c.id)}
                    disabled={state.playedCardIds.includes(c.id)}
                    onSelect={() => onSelectCard(c.id)}
                  />
                ))}
              </div>
            ) : (
              <textarea
                value={motion}
                onChange={(e) => onMotionChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={`Compose a motion for ${scenario.clientName}. Anchor it in authorities already on record — e.g. "Miranda v. Arizona requires suppression of the statement..."`}
                rows={3}
                className="w-full resize-none rounded-xl border-2 border-ink bg-felt-800 p-3 text-[13px] leading-relaxed text-cream outline-none placeholder:text-cream/35 focus:border-chip-gold"
              />
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] text-cream/45">
                {mode === 'freeform'
                  ? `${motion.trim().length} chars · cite an authority precisely`
                  : 'One verified card per turn'}
                {mode === 'freeform' && <span className="mx-1 text-cream/20">·</span>}
                {mode === 'freeform' && <kbd className="rounded border border-ink bg-felt-800 px-1 py-0.5">⌘/Ctrl+Enter</kbd>}
              </p>
              <button
                aria-label={isFinalTurn ? 'Submit final submission' : 'Address the bench'}
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                className={[
                  'btn-3d inline-flex items-center gap-2 rounded-lg border-2 border-ink px-4 py-2 font-display text-xs uppercase tracking-wider',
                  canSubmit ? 'bg-poker-red text-cream' : 'cursor-not-allowed bg-felt-800 text-cream/30',
                ].join(' ')}
              >
                {isFinalTurn ? 'Final Submission' : 'Address the Bench'} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : state.phase === 'verdict' && state.last ? (
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] text-cream/60">
              {state.turn >= state.maxTurns ? 'Final turn recorded.' : 'Advancing docket…'}
            </p>
            <button
              aria-label="Continue to next turn"
              type="button"
              onClick={onContinue}
              className="btn-3d inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-chip-gold px-4 py-2 font-display text-xs uppercase tracking-wider text-ink"
            >
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : state.phase === 'resolving' ? (
          <div className="flex items-center justify-center gap-2 py-2 font-display text-xs uppercase tracking-wider text-cream/60">
            <Loader2 className="h-4 w-4 animate-spin text-chip-gold" /> The bench is deliberating…
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 py-2">
            <button
              aria-label="Retry trial"
              type="button"
              onClick={onRetry}
              className="btn-3d inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-felt-800 px-4 py-2 font-display text-xs uppercase tracking-wider text-cream"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry trial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
