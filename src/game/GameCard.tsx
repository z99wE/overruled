import type { CSSProperties } from 'react';
import { authorityWeight, domainSuit, faceOf, JURISDICTION_CODE, type CardFaceLike } from './cardMeta';

export type GameCardSize = 'sm' | 'md' | 'lg';

export type GameCardFlipMode = 'both' | 'toggled';

interface GameCardProps {
  card: CardFaceLike;
  size?: GameCardSize;
  faceDown?: boolean;
  burned?: boolean;
  selected?: boolean;
  playable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  showSource?: boolean;
  label?: string;
  flipMode?: GameCardFlipMode;
  flipDelay?: number;
}

const SIZE: Record<GameCardSize, { w: string; hg: string; name: string; ratio: string; meta: string }> = {
  sm: { w: 'w-[150px] sm:w-[175px]', hg: 'aspect-[5/7.2]', name: 'text-[12px] sm:text-[13px]', ratio: 'line-clamp-4 text-[10px] sm:text-[11px]', meta: 'text-[9px]' },
  md: { w: 'w-[200px] sm:w-[230px]', hg: 'aspect-[5/7.2]', name: 'text-[14px] sm:text-[15px]', ratio: 'line-clamp-5 text-[11px] sm:text-[12px]', meta: 'text-[10px]' },
  lg: { w: 'w-[270px] sm:w-[310px]', hg: 'aspect-[5/7.2]', name: 'text-[16px] sm:text-[17px]', ratio: 'line-clamp-6 text-[12px] sm:text-[13px]', meta: 'text-[11px]' },
};

function BackFace({ burned = false }: { burned?: boolean }) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-xl border border-amber-400/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-lg ${
        burned ? 'grayscale opacity-40' : ''
      }`}
      aria-hidden
    >
      <div
        className="absolute inset-[4px] rounded-lg border border-amber-400/20"
        style={{ backgroundImage: 'radial-gradient(circle at center, rgba(251,191,36,0.12) 0%, rgba(15,23,42,0.8) 70%)' }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="font-serif text-base font-bold text-amber-300/90">§</span>
        <span className="font-display text-[8px] font-bold tracking-widest text-amber-200/90">
          OVERROOL
        </span>
      </div>
      <span className="absolute left-1.5 top-1.5 font-mono text-[9px] text-amber-300/60">§</span>
      <span className="absolute bottom-1.5 right-1.5 rotate-180 font-mono text-[9px] text-amber-300/60">§</span>
    </div>
  );
}

export function GameCard({
  card,
  size = 'md',
  faceDown = false,
  burned = false,
  selected = false,
  playable = false,
  disabled = false,
  onClick,
  showSource = false,
  label,
  flipMode,
  flipDelay,
}: GameCardProps) {
  const face = faceOf(card);
  const weight = authorityWeight(face.court);
  const suit = face.domain ? domainSuit(face.domain) : '◆';
  const jTag = face.jurisdiction ? JURISDICTION_CODE[face.jurisdiction] : 'Law';
  const s = SIZE[size];
  const faceUp = !faceDown && !burned;

  const faceContent = (
    <button
      type="button"
      aria-label={label ?? `Play ${face.caseName}`}
      aria-pressed={selected}
      disabled={disabled || !playable}
      onClick={onClick}
      className={[
        'group relative block h-full w-full overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-b from-amber-50/95 via-slate-50 to-amber-50/90 text-left shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all duration-250',
        playable && !disabled ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_28px_rgba(251,191,36,0.35)] hover:border-amber-400' : 'cursor-default',
        selected ? 'ring-4 ring-amber-400 border-amber-500 shadow-[0_12px_32px_rgba(251,191,36,0.45)] -translate-y-2' : '',
      ].join(' ')}
    >
      {/* Corner authority glyphs */}
      <span className="pointer-events-none absolute left-1.5 top-1 flex items-center gap-0.5 font-mono text-[10px] font-bold text-amber-900/80">
        {suit}
        <span className="text-[8px] uppercase tracking-wider font-semibold">{jTag}</span>
      </span>

      <div className="flex h-full flex-col">
        {/* Soft pastel banner strip */}
        <div className="flex items-center justify-end border-b border-amber-900/15 bg-gradient-to-r from-amber-200/50 via-slate-200/60 to-amber-100/50 px-2 py-1">
          <span className="truncate font-mono text-[8px] font-semibold text-slate-800">{face.citation}</span>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col gap-1.5 p-2 sm:p-2.5">
          <div className="min-w-0">
            <p className={`${s.name} font-display font-bold leading-tight text-slate-950`}>
              {face.caseName}
            </p>
            <p className={`${s.meta} mt-0.5 font-mono text-slate-600`}>
              {face.court} · {face.year}
            </p>
          </div>

          <p className={`${s.ratio} leading-snug text-slate-700 font-sans`}>
            {face.ratio}
          </p>

          <div className="mt-auto flex items-center justify-between gap-1 border-t border-slate-200/80 pt-1.5">
            <span className="flex items-center gap-0.5" aria-label={`Authority weight ${weight} of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 w-2.5 rounded-full ${n <= weight ? 'bg-amber-500 shadow-sm' : 'bg-slate-300'}`}
                />
              ))}
            </span>
            <span className="font-mono text-[8px] font-medium text-slate-500">
              {face.domain ?? 'General'}
            </span>
          </div>
        </div>
      </div>

      {selected && (
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-400 font-bold text-xs text-slate-950 shadow-md">
          ✓
        </span>
      )}
    </button>
  );

  const sourceBadge =
    showSource && card.sourceUrl ? (
      <a
        href={card.sourceUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Read the full judgment of ${face.caseName}`}
        className="absolute -right-1 -top-2 z-10 flex items-center gap-1 rounded-full border border-amber-300 bg-slate-900 px-2 py-0.5 font-mono text-[8px] font-semibold text-amber-200 shadow-md hover:bg-amber-400 hover:text-slate-950 transition-colors"
      >
        Full ↗
      </a>
    ) : null;

  if (!flipMode) {
    if (!faceUp) {
      return (
        <div className={`${s.w} ${s.hg} transition-all duration-300 ${burned ? 'grayscale opacity-40' : ''}`}>
          <BackFace burned={burned} />
          {burned && (
            <p className="mt-1 text-center font-mono text-[8px] font-semibold tracking-wider text-slate-400">Spent</p>
          )}
        </div>
      );
    }
    return (
      <div className="relative transition-transform duration-200">
        {faceContent}
        {sourceBadge}
      </div>
    );
  }

  return (
    <div
      className={`card3d relative ${s.w} ${s.hg} ${flipMode === 'both' ? 'card3d-deal' : ''}`}
      style={{ '--flip-delay': flipDelay ? `${flipDelay}ms` : '0ms' } as CSSProperties}
    >
      <div className={`card3d-inner ${faceUp ? 'faceUp' : ''}`}>
        <div className="card3d-side card3d-back">
          <BackFace burned={burned} />
        </div>
        <div className="card3d-side card3d-front">
          {faceContent}
          {sourceBadge}
        </div>
      </div>
      {burned && (
        <p className="relative z-10 mt-1 text-center font-mono text-[8px] font-semibold tracking-wider text-slate-400">
          Spent
        </p>
      )}
    </div>
  );
}