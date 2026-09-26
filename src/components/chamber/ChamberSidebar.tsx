import type { ScenarioBundle } from '../../types/legal';
import { PrecedentCard } from '../PrecedentCard';

interface ChamberSidebarProps {
  scenario: ScenarioBundle;
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
}

/** Case file + authority board — rendered inside the chamber's drawer. */
export function ChamberSidebar({ scenario, selectedCardId, onSelectCard }: ChamberSidebarProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
      <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur">
        <h2 className="font-display text-sm font-bold text-amber-300">
          Case File
        </h2>
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <div>
            <p className="font-mono text-[10px] text-slate-400">Client</p>
            <p className="font-semibold text-white mt-0.5">{scenario.clientName}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-slate-400">Factual Matrix</p>
            <p className="mt-0.5">{scenario.factualBackground}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-slate-400">Core Dispute</p>
            <p className="font-semibold text-amber-200 mt-0.5">{scenario.coreDispute}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-sm font-bold text-amber-300">
          Precedent Authority Board
        </h2>
        <p className="font-sans text-xs text-slate-400">
          All {scenario.availablePrecedents.length} verified precedents admitted to your side
        </p>
        <div className="grid gap-3">
          {scenario.availablePrecedents.map((c) => (
            <PrecedentCard
              key={c.id}
              card={c}
              selected={selectedCardId === c.id}
              onSelect={() => onSelectCard(c.id)}
            />
          ))}
        </div>
      </section>

      {scenario.statuteReferences.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-mono text-[10px] text-slate-400">Statutory Anchors</h3>
          <ul className="space-y-2">
            {scenario.statuteReferences.map((st) => (
              <li key={st.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                <p className="text-xs font-semibold text-slate-200">{st.name}</p>
                <p className="mt-1 font-mono text-[10px] text-amber-300/90">{st.sections.map((s) => s.section).join(' · ')}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}