import { STATUTORY_NOTICE } from '../types/legal';

export function StatutoryNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={`rounded-lg border-2 border-ink bg-felt-950/70 text-cream/60 leading-relaxed ${compact ? 'px-3 py-2 text-[10px]' : 'px-4 py-3 text-[11px]'}`}
    >
      <span className="mr-2 font-display uppercase tracking-widest text-chip-gold">House Rules</span>
      {STATUTORY_NOTICE}
    </div>
  );
}
