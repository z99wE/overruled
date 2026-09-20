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
  const red: [number, number, number] = [208, 48, 48];
  const orange: [number, number, number] = [232, 131, 58];
  const gold: [number, number, number] = [244, 180, 27];
  if (v <= 50) return lerpColor(red, orange, v / 50);
  return lerpColor(orange, gold, (v - 50) / 50);
}

const CHIP_STEPS = 20;

export function FavorMeter({ value, delta, compact }: FavorMeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  const chips = Math.round(pct / (100 / CHIP_STEPS));
  const verdict =
    value >= 70 ? 'THE BENCH LEANS YOUR WAY' : value <= 30 ? 'THE BENCH IS HOSTILE' : 'ALL TO PLAY FOR';

  return (
    <div className={`w-full ${compact ? 'space-y-1' : 'space-y-2'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-chip-gold">
          <Scale className={compact ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={2.5} />
          <span className={`font-display uppercase tracking-widest ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Bench Favor
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            key={Math.round(value)}
            className={`anim-pop font-display tabular-nums ${compact ? 'text-base' : 'text-2xl'} text-cream`}
            style={{ textShadow: '2px 2px 0 var(--color-ink)' }}
          >
            {Math.round(value)}
          </span>
          <span className="font-mono text-[10px] text-cream/50">/100</span>
          {delta !== undefined && delta !== 0 && (
            <span
              key={`${delta}-${Math.random()}`}
              className={`anim-pop font-display text-[11px] ${delta > 0 ? 'text-felt-200' : 'text-poker-red'}`}
              style={{ textShadow: '1px 1px 0 var(--color-ink)' }}
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
              className="h-4 flex-1 rounded-full border border-ink"
              style={{
                backgroundColor: lit ? color : 'rgba(6, 19, 13, 0.55)',
                boxShadow: lit ? `inset 0 -2px 0 rgba(6,19,13,0.45), inset 0 2px 0 rgba(253,246,227,0.25)` : 'inset 0 1px 0 rgba(253,246,227,0.08)',
                transition: 'background-color 250ms ease',
              }}
            />
          );
        })}
      </div>

      {!compact && <p className="font-display text-[10px] tracking-widest text-cream/60">{verdict}</p>}
    </div>
  );
}
