import type { TurnRecord } from '../../types/legal';

export const VERDICT_STYLE: Record<
  TurnRecord['resolution']['bench_verdict_tag'],
  { label: string; cls: string; flash: string }
> = {
  SUSTAINED: {
    label: 'Sustained',
    cls: 'bg-emerald-50 text-emerald-900 border border-emerald-300',
    flash: 'bg-emerald-500 text-white shadow-[0_10px_40px_rgba(16,185,129,0.4)]',
  },
  OVERRULED: {
    label: 'Overruled',
    cls: 'bg-rose-50 text-rose-900 border border-rose-300',
    flash: 'bg-rose-500 text-white shadow-[0_10px_40px_rgba(244,63,94,0.4)]',
  },
  BENCH_WARNING: {
    label: 'Bench Warning',
    cls: 'bg-amber-50 text-amber-900 border border-amber-300',
    flash: 'bg-amber-500 text-slate-950 shadow-[0_10px_40px_rgba(245,158,11,0.4)]',
  },
  NOTED_FOR_RECORD: {
    label: 'Noted for Record',
    cls: 'bg-slate-100 text-slate-800 border border-slate-300',
    flash: 'bg-slate-800 text-white shadow-[0_10px_40px_rgba(30,41,59,0.4)]',
  },
};

export function VerdictFlash({ record }: { record: TurnRecord }) {
  const style = VERDICT_STYLE[record.resolution.bench_verdict_tag];
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm">
      <div className={`anim-slam flex flex-col items-center gap-2 rounded-3xl border px-12 py-8 shadow-2xl ${style.flash}`}>
        <span className="font-display text-4xl font-black tracking-tight">
          {style.label}
        </span>
        <span className="font-mono text-sm tracking-wide font-bold">
          {record.resolution.judicial_favor_delta > 0
            ? `+${record.resolution.judicial_favor_delta} favor`
            : record.resolution.judicial_favor_delta < 0
              ? `${record.resolution.judicial_favor_delta} favor`
              : 'favor holds'}
        </span>
      </div>
    </div>
  );
}

export function JudgeMessage({ text, meta }: { text: string; meta?: string }) {
  return (
    <div className="flex gap-3.5 items-start">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 font-display text-sm font-black text-slate-950 shadow-xs">
        J
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <p className="font-sans text-xs font-bold text-amber-900">The Bench</p>
          {meta && <p className="font-mono text-[10px] text-slate-400 font-medium">{meta}</p>}
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-amber-200/70 bg-amber-50/50 p-4 text-[13px] leading-relaxed text-slate-800 shadow-2xs backdrop-blur-sm">
          {text}
        </div>
      </div>
    </div>
  );
}

export function OpponentMessage({ from, text, style, attack }: { from: string; text: string; style: string; attack?: string }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="max-w-full truncate text-right font-sans text-xs font-bold text-slate-700">{from}</p>
      <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-slate-200 bg-white p-4 shadow-xs">
        {from.includes('AI bench') && (
          <p className="mb-1 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-700">AI Bench</p>
        )}
        <p className="text-[13px] leading-relaxed text-slate-800">{text}</p>
      </div>
      {attack && (
        <p className="max-w-[88%] rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-1 text-xs text-amber-950 font-medium">
          Targeting: <span className="font-bold text-amber-900">{attack}</span>
        </p>
      )}
      <span className="max-w-full pr-1 text-right font-mono text-[10px] text-slate-400">
        Style: {style.replace(/_/g, ' ')}
      </span>
    </div>
  );
}

export function PlayerMessage({ text, verified, tag }: { text: string; verified: boolean; tag?: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%]">
        <p className="mb-1 truncate text-right font-sans text-xs font-bold text-emerald-800">Counsel for {tag ?? 'your client'}</p>
        <div className="rounded-2xl rounded-tr-sm border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
          <p className="text-[13px] leading-relaxed text-emerald-950 font-medium">{text}</p>
          {verified && (
            <p className="mt-2 inline-flex items-center rounded-full bg-emerald-200/80 border border-emerald-300 px-2.5 py-0.5 font-mono text-[9px] font-bold text-emerald-900">
              Verified Precedent
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CoCounselMessage({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-950">
      <span className="font-bold text-blue-800">Co-Counsel Briefing: </span>
      <span>{text}</span>
    </div>
  );
}
