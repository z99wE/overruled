import { Scale } from 'lucide-react';

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
  const crimson: [number, number, number] = [225, 29, 72];
  const amber: [number, number, number] = [245, 158, 11];
  const gold: [number, number, number] = [250, 204, 21];
  if (v <= 50) return lerpColor(crimson, amber, v / 50);
  return lerpColor(amber, gold, (v - 50) / 50);
}

export function FavorMeter({ value, delta, compact }: FavorMeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  const color = favorColor(pct);
  const verdict = value >= 70 ? 'Court looks favourably on your client' : value <= 30 ? 'The Bench is hostile' : 'Proceeding is finely balanced';

  return (
    <div className={`w-full ${compact ? 'space-y-1' : 'space-y-2'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gold">
          <Scale className={compact ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={2} />
          <span className={`font-serif font-semibold uppercase tracking-widest ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Judicial Favor
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`font-serif font-bold tabular-nums ${compact ? 'text-sm' : 'text-lg'}`} style={{ color }}>
            {Math.round(value)}
          </span>
          <span className="text-[10px] text-noir-500">/ 100</span>
          {delta !== undefined && delta !== 0 && (
            <span
              className={`font-mono text-[11px] font-semibold ${delta > 0 ? 'text-gold' : 'text-crimson'}`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
        </div>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-noir-800">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 12px ${color}55` }}
        />
        <div
          className="absolute top-1/2 h-3 w-1.5 -translate-y-1/2 rounded-sm bg-cream shadow"
          style={{ left: `calc(${pct}% - 3px)` }}
        />
      </div>

      {!compact && <p className="text-[10px] italic text-noir-500">{verdict}</p>}
    </div>
  );
}