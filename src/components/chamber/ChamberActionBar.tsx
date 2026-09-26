import { ArrowRight, BookOpen, Loader2, MessageSquareQuote, RotateCcw } from 'lucide-react';
import type { TrialState } from '../../core/useTrial';

interface ChamberActionBarProps {
  state: TrialState;
  mode: 'cards' | 'freeform';
  allowFreeform: boolean;
  motion: string;
  canSubmit: boolean;
  isFinalTurn: boolean;
  handLeft: number;
  onSetMode: (mode: 'cards' | 'freeform') => void;
  onMotionChange: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSubmit: () => void;
  onContinue: () => void;
  onRetry: () => void;
}

export function ChamberActionBar({
  state,
  mode,
  allowFreeform,
  motion,
  canSubmit,
  isFinalTurn,
  handLeft,
  onSetMode,
  onMotionChange,
  onKeyDown,
  onSubmit,
  onContinue,
  onRetry,
}: ChamberActionBarProps) {
  return (
    <div className="shrink-0 border-t-2 border-ink bg-felt-950/95 p-3 backdrop-blur lg:p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        {state.phase === 'awaiting' ? (
          <>
            <div className="flex gap-2">
              <button
                aria-label="Play a precedent card from your hand"
                type="button"
                onClick={() => onSetMode('cards')}
                className={`btn-3d flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-ink px-2 py-2 font-display text-[11px] uppercase tracking-wider ${
                  mode === 'cards' ? 'bg-chip-gold text-ink' : 'bg-felt-800 text-cream/70'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Play Card · {handLeft} in hand
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
              <p className="text-center text-[11px] leading-snug text-cream/60">
                Tap a card from your hand — the Bench reads the record, opposing counsel answers with a counter-card.
              </p>
            ) : (
              <textarea
                value={motion}
                onChange={(e) => onMotionChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={`Compose a motion for the record. Anchor it in authorities on this table — e.g. "Miranda v. Arizona requires suppression of the statement..."`}
                rows={3}
                className="w-full resize-none rounded-xl border-2 border-ink bg-felt-800 p-3 text-[13px] leading-relaxed text-cream outline-none placeholder:text-cream/35 focus:border-chip-gold"
              />
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 text-[11px] leading-snug text-cream/55">
                {mode === 'freeform'
                  ? `${motion.trim().length} chars · cite an authority precisely`
                  : 'One verified card per turn'}
                {mode === 'freeform' && <span className="mx-1 text-cream/20">·</span>}
                {mode === 'freeform' && <kbd className="rounded border border-ink bg-felt-800 px-1 py-0.5">⌘/Ctrl+Enter</kbd>}
              </p>
              <button
                aria-label={isFinalTurn ? 'Submit final submission' : 'Play the hand and address the bench'}
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                className={[
                  'btn-3d inline-flex items-center gap-2 rounded-lg border-2 border-ink px-4 py-2 font-display text-xs uppercase tracking-wider',
                  canSubmit ? 'bg-poker-red text-cream' : 'cursor-not-allowed bg-felt-800 text-cream/30',
                ].join(' ')}
              >
                {isFinalTurn ? 'Final Submission' : 'Play the hand'} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : state.phase === 'verdict' && state.last ? (
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-[11px] leading-snug text-cream/70">
              {state.turn >= state.maxTurns ? 'Final turn recorded. The Clerk will read the verdict.' : 'The Bench has ruled on the record.'}
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
          <div className="flex items-center justify-center gap-2 py-2 text-center text-xs leading-snug text-cream/70">
            <Loader2 className="h-4 w-4 animate-spin text-chip-gold" /> Opposing counsel answers · the Bench deliberates…
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