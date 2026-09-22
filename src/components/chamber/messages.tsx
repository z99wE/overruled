import { Gavel, Landmark, Sparkles } from 'lucide-react';
import type { TurnRecord } from '../../types/legal';

export const VERDICT_STYLE: Record<
  TurnRecord['resolution']['bench_verdict_tag'],
  { label: string; cls: string; flash: string }
> = {
  SUSTAINED: { label: 'SUSTAINED', cls: 'bg-chip-gold text-ink', flash: 'bg-chip-gold text-ink' },
  OVERRULED: { label: 'OVERRULED', cls: 'bg-poker-red text-cream', flash: 'bg-poker-red text-cream' },
  BENCH_WARNING: { label: 'BENCH WARNING', cls: 'bg-chip-orange text-ink', flash: 'bg-chip-orange text-ink' },
  NOTED_FOR_RECORD: { label: 'NOTED FOR RECORD', cls: 'bg-felt-700 text-cream', flash: 'bg-felt-700 text-cream' },
};

export function VerdictFlash({ record }: { record: TurnRecord }) {
  const style = VERDICT_STYLE[record.resolution.bench_verdict_tag];
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
      <div className={`anim-slam flex flex-col items-center gap-2 rounded-2xl border-4 border-ink px-12 py-7 shadow-[0_10px_0_0_var(--color-ink)] ${style.flash}`}>
        <Gavel className="h-10 w-10" strokeWidth={2.5} />
        <span className="font-display text-5xl tracking-wide" style={{ textShadow: '3px 3px 0 var(--color-ink)' }}>
          {style.label}
        </span>
        <span className="font-display text-sm tracking-wider opacity-90">
          {record.resolution.judicial_favor_delta > 0
            ? `+${record.resolution.judicial_favor_delta} FAVOR`
            : record.resolution.judicial_favor_delta < 0
              ? `${record.resolution.judicial_favor_delta} FAVOR`
              : 'FAVOR HOLDS'}
        </span>
      </div>
    </div>
  );
}

export function JudgeMessage({ text, meta }: { text: string; meta?: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-chip-gold text-ink shadow-[0_3px_0_0_var(--color-ink)]">
        <Gavel className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 font-display text-[10px] uppercase tracking-widest text-chip-gold">The Bench</p>
        {meta && <p className="mb-0.5 font-mono text-[10px] uppercase tracking-wide text-cream/40">{meta}</p>}
        <p className="rounded-xl rounded-tl-sm border-2 border-ink bg-paper p-3 text-[13px] leading-relaxed text-ink shadow-[0_3px_0_0_var(--color-ink)]">
          {text}
        </p>
      </div>
    </div>
  );
}

export function OpponentMessage({ from, text, style, attack }: { from: string; text: string; style: string; attack?: string }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <p className="text-right font-display text-[10px] uppercase tracking-widest text-poker-red">{from}</p>
      <div className="max-w-[88%] rounded-xl rounded-tr-sm border-2 border-ink bg-poker-red-deep/40 p-3 shadow-[0_3px_0_0_var(--color-ink)]">
        {from.includes('AI bench') && (
          <p className="mb-1 inline-flex items-center gap-1 rounded bg-ink/60 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-poker-red">⚡ AI bench</p>
        )}
        <p className="text-[13px] leading-relaxed text-cream/90">{text}</p>
      </div>
      {attack && (
        <p className="max-w-[88%] rounded-lg border border-ink bg-ink/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-cream/50">
          Hitting at: {attack}
        </p>
      )}
      <span className="pr-1 font-mono text-[9px] uppercase tracking-widest text-cream/35">Style · {style.replace(/_/g, ' ')}</span>
    </div>
  );
}

export function PlayerMessage({ text, verified, tag }: { text: string; verified: boolean; tag?: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%]">
        <p className="mb-1 text-right font-display text-[10px] uppercase tracking-widest text-felt-200">Counsel for {tag ?? 'your client'}</p>
        <div className="rounded-xl rounded-tr-sm border-2 border-ink bg-poker-blue-deep/50 p-3 shadow-[0_3px_0_0_var(--color-ink)]">
          <p className="text-[13px] leading-relaxed text-cream/95">{text}</p>
          {verified && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-sm bg-felt-600 px-1.5 py-0.5 font-display text-[8px] uppercase tracking-wider text-cream">
              <Landmark className="h-2.5 w-2.5" /> Verified in corpus
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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-felt-700 text-cream shadow-[0_3px_0_0_var(--color-ink)]">
        <Sparkles className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 font-display text-[10px] uppercase tracking-widest text-cream/50">Co-Counsel · Whisper</p>
        <p className="rounded-xl rounded-tl-sm border-2 border-dashed border-cream/30 bg-ink/40 p-3 text-[12px] italic leading-relaxed text-cream/65">
          {text}
        </p>
      </div>
    </div>
  );
}
