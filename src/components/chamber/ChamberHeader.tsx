import type { ScenarioBundle } from '../../types/legal';
import type { TrialState } from '../../core/useTrial';
import { FavorMeter } from '../FavorMeter';

interface ChamberHeaderProps {
  scenario: ScenarioBundle;
  state: TrialState;
  onExit: () => void;
}

export function ChamberHeader({ scenario, state, onExit }: ChamberHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 px-4 py-3 shadow-xs backdrop-blur-xl lg:px-8 font-sans">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Exit trial"
            type="button"
            onClick={onExit}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-mono text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-sm sm:text-base font-extrabold text-slate-900">
                {scenario.title}
              </h1>
              <span className="hidden shrink-0 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-mono text-[10px] font-bold text-blue-700 sm:inline-flex">
                Turn {state.turn} of {state.maxTurns}
              </span>
            </div>
            <p className="truncate font-sans text-xs text-slate-500 font-medium">{scenario.bench}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(state.streak > 0 || state.pot > 0) && (
            <div className="hidden items-center gap-2 sm:flex">
              {state.streak > 0 && (
                <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 font-mono text-[11px] font-bold text-amber-950">
                  Streak {state.streak}x
                </span>
              )}
              {state.pot > 0 && (
                <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-mono text-[11px] font-bold text-emerald-950">
                  Pot {state.pot}
                </span>
              )}
            </div>
          )}
          <div className="w-44 shrink-0 sm:w-60 lg:w-72">
            <FavorMeter value={state.favor} delta={state.last?.resolution.judicial_favor_delta} compact />
          </div>
        </div>
      </div>
    </header>
  );
}
