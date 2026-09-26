import { STATUTORY_NOTICE } from '../types/legal';

export function StatutoryNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={`rounded-2xl border border-slate-200/90 bg-white/90 text-slate-600 leading-relaxed shadow-xs backdrop-blur-md font-sans ${compact ? 'px-4 py-3 text-[11px]' : 'px-5 py-4 text-xs'}`}
    >
      <span className="font-bold text-slate-900 mr-2">Legal &amp; Statutory Notice:</span>
      {STATUTORY_NOTICE}
    </div>
  );
}
