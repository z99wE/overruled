import { BookOpen, FileText } from 'lucide-react';
import type { ScenarioBundle } from '../../types/legal';
import { PrecedentCard } from '../PrecedentCard';

interface ChamberSidebarProps {
  scenario: ScenarioBundle;
  fileOpen: boolean;
  mode: 'cards' | 'freeform';
  selectedCardId: string | null;
  phase: string;
  playedCardIds: string[];
  onSelectCard: (cardId: string) => void;
}

export function ChamberSidebar({ scenario, fileOpen, mode, selectedCardId, phase, playedCardIds, onSelectCard }: ChamberSidebarProps) {
  return (
    <aside
      className={`${fileOpen ? 'block' : 'hidden'} min-h-0 flex-1 flex-col overflow-hidden border-b-2 border-ink bg-felt-900/60 lg:flex lg:w-[340px] lg:flex-none lg:border-b-0 lg:border-r-2`}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <section className="space-y-2 rounded-xl border-2 border-ink bg-felt-800/70 p-3.5">
          <h2 className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-chip-gold">
            <FileText className="h-3.5 w-3.5" /> Case File
          </h2>
          <div className="space-y-3 text-[12px] leading-relaxed text-cream/80">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-cream/40">Client</p>
              <p className="font-semibold">{scenario.clientName}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-cream/40">Facts</p>
              <p>{scenario.factualBackground}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-cream/40">Core dispute</p>
              <p className="font-semibold">{scenario.coreDispute}</p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-chip-gold">
            <BookOpen className="h-3.5 w-3.5" /> Precedent Deck
          </h2>
          <div className="grid gap-2.5">
            {scenario.availablePrecedents.map((c) => (
              <PrecedentCard
                key={c.id}
                card={c}
                selected={selectedCardId === c.id && mode === 'cards'}
                exhausted={playedCardIds.includes(c.id)}
                disabled={phase !== 'awaiting' || playedCardIds.includes(c.id)}
                onSelect={() => onSelectCard(c.id)}
              />
            ))}
          </div>
        </section>

        {scenario.statuteReferences.length > 0 && (
          <section className="space-y-1.5">
            <h3 className="font-mono text-[9px] uppercase tracking-widest text-cream/40">Statutory anchors in this matter</h3>
            <ul className="space-y-1.5">
              {scenario.statuteReferences.map((st) => (
                <li key={st.id} className="rounded-lg border-2 border-ink bg-felt-800/70 px-2.5 py-2">
                  <p className="text-[11px] font-semibold text-cream/85">{st.name}</p>
                  <p className="mt-1 font-mono text-[9px] text-chip-gold/90">{st.sections.map((s) => s.section).join(' · ')}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
