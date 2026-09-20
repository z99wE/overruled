import { useEffect, useMemo, useState } from 'react';

export interface ScoreEventView {
  label: string;
  chips: number;
  mult: number;
}

export function ScorePopup({
  events,
  chips,
  mult,
  total,
  bossName,
  bossRule,
  bossMod,
  visible,
}: {
  events: ScoreEventView[];
  chips: number;
  mult: number;
  total: number;
  bossName?: string | null;
  bossRule?: string | null;
  bossMod?: number | null;
  visible: boolean;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!visible) {
      setShown(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setShown(Math.round(total * (1 - Math.pow(1 - p, 3))));
      if (t - start < 950) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [total, visible]);

  if (!visible) return null;
  return (
    <div className="score-popup">
      {bossName && (
        <div className="score-popup-boss">
          <span className="font-display text-[10px] uppercase tracking-widest text-poker-red">{bossName}</span>
          <span className="font-mono text-[9px] text-cream/60">
            {bossRule}
            {bossMod != null && bossMod !== 1 ? ` ×${bossMod}` : ''}
          </span>
        </div>
      )}
      {events.map((e, i) => (
        <div key={i} className="score-popup-event">
          <span>{e.label}</span>
          <span className="font-mono text-[10px]">
            {e.chips ? `+${e.chips}` : ''}
            {e.mult !== 1 ? ` ×${e.mult}` : ''}
          </span>
        </div>
      ))}
      <div className="score-popup-total">
        <span className="font-mono text-[10px] text-cream/70">
          {chips} × {mult}
        </span>
        <span className="font-display text-2xl text-chip-gold tabular-nums">{shown}</span>
      </div>
    </div>
  );
}

const BURST_COLORS = ['#e6b95c', '#e05252', '#f4efe3', '#3ba371'];

export function ChipBurst({ fire }: { fire: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: `${fire}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 0.15,
        dur: 0.9 + Math.random() * 0.7,
        color: BURST_COLORS[i % BURST_COLORS.length],
        rot: Math.random() * 360,
        size: 6 + Math.random() * 6,
      })),
    [fire],
  );
  if (!fire) return null;
  return (
    <div className="chip-burst" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="chip-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            transform: `rotate(${p.rot}deg)`,
            width: p.size,
            height: p.size * 0.45,
          }}
        />
      ))}
    </div>
  );
}

export function useScreenShake(trigger: unknown): boolean {
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setShaking(true);
    const t = window.setTimeout(() => setShaking(false), 420);
    return () => window.clearTimeout(t);
  }, [trigger]);
  return shaking;
}
