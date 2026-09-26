import { Gavel, Landmark, Sparkles, Scale } from 'lucide-react';
import type { TurnRecord } from '../../types/legal';

export const VERDICT_STYLE: Record<
  TurnRecord['resolution']['bench_verdict_tag'],
  { label: string; cls: string; flash: string }
> = {
  SUSTAINED: {
    label: 'Sustained',
    cls: 'bg-amber-400/20 text-amber-300 border border-amber-400/40',
    flash: 'bg-amber-400 text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.4)]',
  },
  OVERRULED: {
    label: 'Overruled',
    cls: 'bg-rose-950/40 text-rose-300 border border-rose-500/30',
    flash: 'bg-rose-900/90 text-rose-100 border border-rose-400/40 shadow-[0_0_30px_rgba(244,63,94,0.35)]',
  },
  BENCH_WARNING: {
    label: 'Bench Warning',
    cls: 'bg-orange-950/40 text-orange-300 border border-orange-500/30',
    flash: 'bg-orange-400 text-slate-950 shadow-[0_0_30px_rgba(249,115,22,0.4)]',
  },
  NOTED_FOR_RECORD: {
    label: 'Noted for Record',
    cls: 'bg-slate-800/60 text-slate-300 border border-slate-600/40',
    flash: 'bg-slate-800 text-slate-100 border border-slate-600 shadow-[0_0_30px_rgba(100,116,139,0.35)]',
  },
};

export function VerdictFlash({ record }: { record: TurnRecord }) {
  const style = VERDICT_STYLE[record.resolution.bench_verdict_tag];
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm">
      <div className={`anim-slam flex flex-col items-center gap-2 rounded-3xl border border-white/20 px-12 py-8 shadow-2xl ${style.flash}`}>
        <Scale className="h-10 w-10" strokeWidth={2.2} />
        <span className="font-display text-4xl font-bold tracking-tight">
          {style.label}
        </span>
        <span className="font-mono text-sm tracking-wide opacity-90">
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
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/15 text-amber-300 shadow-md">
        <Gavel className="h-4 w-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <p className="font-sans text-xs font-semibold text-amber-300">The Bench</p>
          {meta && <p className="font-mono text-[10px] text-slate-400">{meta}</p>}
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-slate-900/80 p-3.5 text-[13px] leading-relaxed text-slate-200 shadow-lg backdrop-blur">
          {text}
        </div>
      </div>
    </div>
  );
}

export function OpponentMessage({ from, text, style, attack }: { from: string; text: string; style: string; attack?: string }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="max-w-full truncate text-right font-sans text-xs font-semibold text-rose-300">{from}</p>
      <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-rose-500/20 bg-rose-950/30 p-3.5 shadow-lg backdrop-blur">
        {from.includes('AI bench') && (
          <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-rose-900/50 px-2 py-0.5 font-mono text-[9px] text-rose-200">⚡ AI Bench</p>
        )}
        <p className="text-[13px] leading-relaxed text-slate-200">{text}</p>
      </div>
      {attack && (
        <p className="max-w-[88%] rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300">
          Targeting: <span className="text-amber-300">{attack}</span>
        </p>
      )}
      <span className="max-w-full pr-1 text-right font-mono text-[10px] text-slate-400">
        Style · {style.replace(/_/g, ' ')}
      </span>
    </div>
  );
}

export function PlayerMessage({ text, verified, tag }: { text: string; verified: boolean; tag?: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%]">
        <p className="mb-1 truncate text-right font-sans text-xs font-semibold text-emerald-300">Counsel for {tag ?? 'your client'}</p>
        <div className="rounded-2xl rounded-tr-sm border border-emerald-500/20 bg-emerald-950/30 p-3.5 shadow-lg backdrop-blur">
          <p className="text-[13px] leading-relaxed text-slate-100">{text}</p>
          {verified && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 font-mono text-[9px] text-emerald-200">
              <Landmark className="h-3 w-3" /> Verified Precedent
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CoCounselMessage({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-400/15 text-purple-300 shadow-md">
        <Sparkles className="h-4 w-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 font-sans text-xs font-semibold text-purple-300">Co-Counsel · Tactical Whisper</p>
        <div className="rounded-2xl rounded-tl-sm border border-purple-400/20 bg-slate-900/60 p-3.5 text-xs italic leading-relaxed text-purple-200/90 backdrop-blur">
          {text}
        </div>
      </div>
    </div>
  );
}
