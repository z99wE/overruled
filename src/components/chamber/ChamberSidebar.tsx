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
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs">
        <h2 className="font-display text-sm font-bold text-slate-900">
          Case File
        </h2>
        <div className="space-y-3 text-xs leading-relaxed text-slate-600">
          <div>
            <p className="font-mono text-[10px] font-bold text-slate-500">Client</p>
            <p className="font-bold text-slate-900 mt-0.5">{scenario.clientName}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold text-slate-500">Factual Matrix</p>
            <p className="mt-0.5 text-slate-700">{scenario.factualBackground}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold text-slate-500">Core Dispute</p>
            <p className="font-bold text-blue-900 mt-0.5">{scenario.coreDispute}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-sm font-bold text-slate-900">
          Precedent Authority Deck
        </h2>
        <p className="font-sans text-xs text-slate-500">
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
          <h3 className="font-mono text-[10px] font-bold text-slate-500">Statutory Provisions</h3>
          <ul className="space-y-2">
            {scenario.statuteReferences.map((st) => (
              <li key={st.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                <p className="text-xs font-bold text-slate-900">{st.name}</p>
                <p className="mt-1 font-mono text-[10px] text-blue-700">{st.sections.map((s) => s.section).join(' · ')}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}