import { PALETTE, STAGES, nextStageFor, spriteFor, stageFor } from '../core/docketling';

interface DocketlingProps {
  /** Documents the reader has actually worked through, not merely opened. */
  documentsUnderstood: number;
}

/**
 * A companion, not a mechanic. It never decays, never punishes inactivity and
 * never nags: if you stop reading, it simply waits. The only thing it rewards
 * is reading, and it says so in the vocabulary of the thing itself.
 */
export function Docketling({ documentsUnderstood }: DocketlingProps) {
  const stage = stageFor(documentsUnderstood);
  const next = nextStageFor(documentsUnderstood);
  const rows = spriteFor(stage.id);
  const size = rows[0]?.length ?? 12;

  // Run-length encode each row so the SVG stays small: a 12x12 sprite is a
  // handful of rects, not 144.
  const rects: Array<{ x: number; y: number; w: number; fill: string }> = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < size) {
      const ch = row[x] ?? '.';
      if (ch === '.') {
        x += 1;
        continue;
      }
      let run = 1;
      while (x + run < size && row[x + run] === ch) run += 1;
      rects.push({ x, y, w: run, fill: PALETTE[ch] ?? 'currentColor' });
      x += run;
    }
  });

  const idx = STAGES.findIndex((s) => s.id === stage.id);

  return (
    <aside
      aria-label="Docketling, your reading companion"
      className="rounded-xl border-2 border-ink bg-felt-900/70 p-4"
    >
      <div className="flex items-center gap-4">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="anim-float h-16 w-16 shrink-0"
          style={{ imageRendering: 'pixelated' }}
          role="img"
          aria-label={`A pixel-art companion at the ${stage.name} stage`}
        >
          {rects.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
          ))}
        </svg>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">Your companion</p>
          <p className="font-display text-lg uppercase text-chip-gold">{stage.name}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-cream/70">{stage.blurb}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5" aria-hidden>
        {STAGES.map((s, i) => (
          <span
            key={s.id}
            title={s.name}
            className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-chip-gold' : 'bg-cream/15'}`}
          />
        ))}
      </div>

      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-cream/35">
        {next
          ? `Next: ${next.name} — ${next.blurb}`
          : 'Fully standing. It stays as long as you keep reading.'}
      </p>
    </aside>
  );
}
