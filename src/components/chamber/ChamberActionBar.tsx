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
    <div className="shrink-0 border-t border-white/10 bg-slate-950/90 p-3.5 shadow-2xl backdrop-blur-xl lg:p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        {state.phase === 'awaiting' ? (
          <>
            <div className="flex gap-2.5">
              <button
                aria-label="Play a precedent card from your hand"
                type="button"
                onClick={() => onSetMode('cards')}
                className={`m3-btn flex-1 py-2 text-xs gap-1.5 ${
                  mode === 'cards' ? 'm3-btn-primary' : 'm3-btn-tonal text-slate-300'
                }`}
              >
                Deploy Precedent · {handLeft} in hand
              </button>
              {allowFreeform && (
                <button
                  aria-label="File a freeform motion"
                  type="button"
                  onClick={() => onSetMode('freeform')}
                  className={`m3-btn flex-1 py-2 text-xs gap-1.5 ${
                    mode === 'freeform' ? 'm3-btn-primary' : 'm3-btn-tonal text-slate-300'
                  }`}
                >
                  Freeform Motion
                </button>
              )}
            </div>

            {mode === 'cards' ? (
              <p className="text-center font-sans text-xs text-slate-400">
                Select a precedent card from your deck below to advance your submission.
              </p>
            ) : (
              <textarea
                value={motion}
                onChange={(e) => onMotionChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={`Compose a motion for the record. Anchor it in authorities on this table — e.g. "Miranda v. Arizona requires suppression of the statement..."`}
                rows={3}
                className="m3-input font-mono text-xs"
              />
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 font-mono text-[11px] text-slate-400">
                {mode === 'freeform'
                  ? `${motion.trim().length} chars · cite an authority precisely`
                  : '1 verified card per turn'}
                {mode === 'freeform' && <span className="mx-1 text-slate-600">·</span>}
                {mode === 'freeform' && <kbd className="rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-[10px]">⌘/Ctrl+Enter</kbd>}
              </p>
              <button
                aria-label={isFinalTurn ? 'Submit final submission' : 'Play the hand and address the bench'}
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                className={`m3-btn px-6 py-2.5 text-xs ${
                  canSubmit ? 'm3-btn-primary' : 'm3-btn-outlined'
                }`}
              >
                {isFinalTurn ? 'Final Submission ▸' : 'Submit Argument ▸'}
              </button>
            </div>
          </>
        ) : state.phase === 'verdict' && state.last ? (
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 font-sans text-xs font-semibold text-amber-300">
              {state.turn >= state.maxTurns ? 'Final turn recorded. The Clerk will read the verdict.' : 'The Bench has ruled on the record.'}
            </p>
            <button
              aria-label="Continue to next turn"
              type="button"
              onClick={onContinue}
              className="m3-btn m3-btn-primary px-6 py-2 text-xs"
            >
              Continue ▸
            </button>
          </div>
        ) : state.phase === 'resolving' ? (
          <div className="flex items-center justify-center gap-2 py-2 text-center font-sans text-xs font-medium text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            Opposing counsel answers · Bench deliberating…
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 py-2">
            <button
              aria-label="Retry trial"
              type="button"
              onClick={onRetry}
              className="m3-btn m3-btn-tonal px-5 py-2 text-xs text-white"
            >
              Retry Trial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}