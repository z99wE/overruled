interface FavorMeterProps {
  value: number;
  delta?: number;
  compact?: boolean;
}

export function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function favorColor(v: number): string {
  // Soft pastel colors: Coral -> Warm Amber -> Fresh Mint
  const coral: [number, number, number] = [251, 113, 133];
  const amber: [number, number, number] = [251, 191, 36];
  const mint: [number, number, number] = [110, 231, 183];
  if (v <= 50) return lerpColor(coral, amber, v / 50);
  return lerpColor(amber, mint, (v - 50) / 50);
}

const CHIP_STEPS = 20;

export function FavorMeter({ value, delta, compact }: FavorMeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  const chips = Math.round(pct / (100 / CHIP_STEPS));
  const verdict =
    value >= 70 ? 'The Bench leans in your favor' : value <= 30 ? 'The Bench remains skeptical' : 'Equally balanced on the record';

  return (
    <div className={`w-full ${compact ? 'space-y-1' : 'space-y-2'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className={`font-sans font-bold tracking-wide ${compact ? 'text-[11px]' : 'text-xs'}`}>
            Bench Favor
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            key={Math.round(value)}
            className={`anim-pop font-display font-extrabold tabular-nums ${compact ? 'text-sm' : 'text-xl'} text-slate-900`}
          >
            {Math.round(value)}
          </span>
          <span className="font-mono text-[10px] text-slate-400">/100</span>
          {delta !== undefined && delta !== 0 && (
            <span
              key={delta}
              className={`anim-pop font-mono text-[10px] font-bold ${delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: CHIP_STEPS }, (_, i) => {
          const lit = i < chips;
          const color = favorColor(((i + 0.5) / CHIP_STEPS) * 100);
          return (
            <span
              key={i}
              className="h-2.5 flex-1 rounded-full border border-slate-200"
              style={{
                backgroundColor: lit ? color : '#e2e8f0',
                boxShadow: lit ? `0 0 6px ${color}55` : 'none',
                transition: 'background-color 200ms ease, box-shadow 200ms ease',
              }}
            />
          );
        })}
      </div>

      {!compact && <p className="font-sans text-xs text-slate-500">{verdict}</p>}
    </div>
  );
}
