import { X, Flame } from 'lucide-react';
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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/85 px-4 py-3 shadow-lg backdrop-blur-xl lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Exit trial"
            type="button"
            onClick={onExit}
            className="m3-btn m3-btn-tonal flex h-9 w-9 shrink-0 items-center justify-center p-0 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-sm sm:text-base font-bold text-white">
                {scenario.title}
              </h1>
              <span className="hidden shrink-0 m3-chip text-[9px] sm:inline-flex">
                Turn {state.turn} of {state.maxTurns}
              </span>
            </div>
            <p className="truncate font-sans text-xs text-slate-400">{scenario.bench}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(state.streak > 0 || state.pot > 0) && (
            <div className="hidden items-center gap-2 sm:flex">
              {state.streak > 0 && (
                <span className="streak-flame inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 font-mono text-[11px] font-semibold text-amber-300">
                  <Flame className="h-3 w-3" /> ×{state.streak}
                </span>
              )}
              {state.pot > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-300">
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
