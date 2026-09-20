import { X } from 'lucide-react';
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
    <header className="sticky top-0 z-20 border-b-2 border-ink bg-felt-950/90 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Exit trial"
            type="button"
            onClick={onExit}
            className="btn-3d flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-felt-800 text-cream"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className="truncate font-display text-sm text-cream"
                style={{ textShadow: '1px 1px 0 var(--color-ink)' }}
              >
                {scenario.title}
              </h1>
              <span className="hidden shrink-0 rounded border-2 border-ink bg-ink/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cream/70 sm:inline">
                Turn {state.turn}/{state.maxTurns}
              </span>
            </div>
            <p className="truncate text-[10px] text-cream/50">{scenario.bench}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(state.streak > 0 || state.pot > 0) && (
            <div className="hidden items-center gap-2 sm:flex">
              {state.streak > 0 && (
                <span className="streak-flame inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-chip-orange px-2 py-1 font-display text-[11px] text-ink shadow-[0_3px_0_0_var(--color-ink)]">
                  🔥×{state.streak}
                </span>
              )}
              {state.pot > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg border-2 border-ink bg-chip-gold px-2 py-1 font-display text-[11px] text-ink shadow-[0_3px_0_0_var(--color-ink)]">
                  POT {state.pot}
                </span>
              )}
            </div>
          )}
          <div className="w-40 shrink-0 sm:w-56 lg:w-72">
            <FavorMeter value={state.favor} delta={state.last?.resolution.judicial_favor_delta} compact />
          </div>
        </div>
      </div>
    </header>
  );
}
