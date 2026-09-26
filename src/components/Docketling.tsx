import { PALETTE, STAGES, nextStageFor, spriteFor, stageFor } from '../core/docketling';

interface DocketlingProps {
  /** Documents the reader has actually worked through, not merely opened. */
  documentsUnderstood: number;
}

export function Docketling({ documentsUnderstood }: DocketlingProps) {
  const stage = stageFor(documentsUnderstood);
  const next = nextStageFor(documentsUnderstood);
  const rows = spriteFor(stage.id);
  const size = rows[0]?.length ?? 12;

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
      className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4"
    >
      <div className="flex items-center gap-4">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="anim-float h-14 w-14 shrink-0"
          style={{ imageRendering: 'pixelated' }}
          role="img"
          aria-label={`A pixel-art companion at the ${stage.name} stage`}
        >
          {rects.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
          ))}
        </svg>
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Legal Audit Companion</p>
          <p className="font-display text-base font-extrabold uppercase text-slate-900">{stage.name}</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-600">{stage.blurb}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5" aria-hidden>
        {STAGES.map((s, i) => (
          <span
            key={s.id}
            title={s.name}
            className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-blue-600' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
        {next
          ? `Next Rank: ${next.name} — ${next.blurb}`
          : 'Fully Certified. It stays active with every contract audit.'}
      </p>
    </aside>
  );
}
