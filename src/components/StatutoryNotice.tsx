import { STATUTORY_NOTICE } from '../types/legal';

export function StatutoryNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={`rounded border border-noir-700 bg-noir-900/70 text-noir-500 leading-relaxed ${compact ? 'px-3 py-2 text-[10px]' : 'px-4 py-3 text-xs'}`}
    >
      <span className="mr-2 font-semibold uppercase tracking-widest text-gold">Statutory Notice</span>
      {STATUTORY_NOTICE}
    </div>
  );
}