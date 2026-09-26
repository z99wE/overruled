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
    <div className="shrink-0 border-t border-slate-200/80 bg-white/90 p-3.5 shadow-xl backdrop-blur-xl lg:p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        {state.phase === 'awaiting' ? (
          <>
            <div className="flex gap-2.5">
              <button
                aria-label="Play a precedent card from your hand"
                type="button"
                onClick={() => onSetMode('cards')}
                className={`m3-btn flex-1 py-2 text-xs font-bold transition-all cursor-pointer ${
                  mode === 'cards'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Deploy Precedent ({handLeft} in hand)
              </button>
              {allowFreeform && (
                <button
                  aria-label="File a freeform motion"
                  type="button"
                  onClick={() => onSetMode('freeform')}
                  className={`m3-btn flex-1 py-2 text-xs font-bold transition-all cursor-pointer ${
                    mode === 'freeform'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Freeform Motion
                </button>
              )}
            </div>

            {mode === 'cards' ? (
              <p className="text-center font-sans text-xs font-medium text-slate-500">
                Select a precedent card from your deck below to advance your submission.
              </p>
            ) : (
              <textarea
                value={motion}
                onChange={(e) => onMotionChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={`Compose a motion for the record. Anchor it in authorities on this table — e.g. "Miranda v. Arizona requires suppression of the statement..."`}
                rows={3}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 font-mono text-[11px] text-slate-500">
                {mode === 'freeform'
                  ? `${motion.trim().length} chars · cite an authority precisely`
                  : '1 verified card per turn'}
                {mode === 'freeform' && <span className="mx-1 text-slate-400">·</span>}
                {mode === 'freeform' && <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-0.5 text-[10px] text-slate-700">Ctrl+Enter</kbd>}
              </p>
              <button
                aria-label={isFinalTurn ? 'Submit final submission' : 'Play the hand and address the bench'}
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                className={`m3-btn px-6 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  canSubmit
                    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                {isFinalTurn ? 'Final Submission' : 'Submit Argument'}
              </button>
            </div>
          </>
        ) : state.phase === 'verdict' && state.last ? (
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 font-sans text-xs font-bold text-slate-900">
              {state.turn >= state.maxTurns ? 'Final turn recorded. The Clerk will read the verdict.' : 'The Bench has ruled on the record.'}
            </p>
            <button
              aria-label="Continue to next turn"
              type="button"
              onClick={onContinue}
              className="m3-btn px-6 py-2 text-xs font-bold bg-blue-600 text-white shadow-sm hover:bg-blue-700 cursor-pointer"
            >
              Continue
            </button>
          </div>
        ) : state.phase === 'resolving' ? (
          <div className="flex items-center justify-center gap-2 py-2 text-center font-sans text-xs font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            Opposing counsel answers · Bench deliberating…
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 py-2">
            <button
              aria-label="Retry trial"
              type="button"
              onClick={onRetry}
              className="m3-btn px-5 py-2 text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-xs hover:bg-slate-50 cursor-pointer"
            >
              Retry Trial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}