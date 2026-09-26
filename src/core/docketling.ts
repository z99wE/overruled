/**
 * Docketling — a pixel-art companion that grows as the reader works through
 * their own documents.
 *
 * The art is stored as character grids rather than image files: it ships inside
 * the JS bundle, scales to any size, themes from the existing CSS variables, and
 * costs nothing to host. No sprite sheet, no CDN, no binary pipeline.
 */

export type StageId = 'unfiled' | 'petitioner' | 'clerk' | 'counsel' | 'bench';

export interface Stage {
  id: StageId;
  name: string;
  /** Shown when the creature has just changed. */
  blurb: string;
}

/** Legal vocabulary as a growth ladder. */
export const STAGES: Stage[] = [
  { id: 'unfiled', name: 'Unfiled', blurb: 'Sealed and unread. Open your first document.' },
  { id: 'petitioner', name: 'Petitioner', blurb: 'Hatched. You read your first document.' },
  { id: 'clerk', name: 'Clerk', blurb: 'Wearing a collar. You have audited a document for risk.' },
  { id: 'counsel', name: 'Counsel', blurb: 'In wig. You have compared two versions.' },
  { id: 'bench', name: 'Bench', blurb: 'Adjourned with full standing. Keep reading.' },
];

/** Documents understood, not documents opened: only real analysis counts. */
export function stageFor(documentsUnderstood: number): Stage {
  // NaN fails every comparison below, which would silently promote the reader
  // to the final stage. Coerce anything unusable to zero.
  const n = Number.isFinite(documentsUnderstood) ? Math.max(0, Math.floor(documentsUnderstood)) : 0;
  if (n <= 0) return STAGES[0];
  if (n === 1) return STAGES[1];
  if (n <= 3) return STAGES[2];
  if (n <= 5) return STAGES[3];
  return STAGES[4];
}

export function nextStageFor(documentsUnderstood: number): Stage | null {
  const current = stageFor(documentsUnderstood).id;
  const idx = STAGES.findIndex((s) => s.id === current);
  return idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
}

/* ------------------------------------------------------------------ *
 * Sprite data. '.' is transparent; every other glyph maps to a token
 * in PALETTE below, so the art themes with the app instead of being
 * baked into a PNG.
 * ------------------------------------------------------------------ */

export const PALETTE: Record<string, string> = {
  k: 'var(--color-ink)',
  c: 'var(--color-cream)',
  d: 'var(--color-cream-dim)',
  e: 'var(--color-ink)',
  g: 'var(--color-chip-gold)',
  r: 'var(--color-poker-red)',
  f: 'var(--color-felt-700)',
};

/**
 * Each stage is authored as a complete grid rather than composed from
 * overlays. Overlays silently overwrite body outline and eye pixels, which
 * broke the silhouette; full grids keep every stage legible on its own.
 * Shared invariants, checked by tests: eyes are 2x2 at rows 3-4, the beak is
 * centred at row 6, and the outline is closed on every edge.
 */
const EGG = [
  '....kkkk....',
  '..kkcccckk..',
  '.kcccggcccck',
  '.kccggggccck',
  '.kccggggccck',
  '.kcccggcccck',
  '.kcccccccck.',
  '.kcccccccck.',
  '..kccccccck.',
  '..kccccccck.',
  '.kkccccccckk',
  '..kkkkkkkk..',
];

const PETITIONER = [
  '...kkkkkk...',
  '..kcccccck..',
  '.kcccccccck.',
  '.kceecceeck.',
  '.kceecceeck.',
  '.kcccccccck.',
  '.kcccggcccck',
  '..kccccccck.',
  '..kccccccck.',
  '...kccccck..',
  '...kccccck..',
  '..kkk..kkk..',
];

/** Clerk: a gold collar, placed clear of the beak. */
const CLERK = [
  '...kkkkkk...',
  '..kcccccck..',
  '.kcccccccck.',
  '.kceecceeck.',
  '.kceecceeck.',
  '.kcccccccck.',
  '.kcccggcccck',
  '..kccccccck.',
  '..kkkkkkkk..',
  '..kggggggk..',
  '...kkkkkk...',
  '..kkk..kkk..',
];

/** Counsel: the face narrows inside the wig rolls. */
const COUNSEL = [
  '..kkkkkkkk..',
  '.kcccccccck.',
  'kkcccccccckk',
  'kcceecceecck',
  'kcceecceecck',
  'kcccccccccck',
  'kccccggcccck',
  '.kcccccccck.',
  '..kcccccck..',
  '..kcccccck..',
  '...kcccck...',
  '..kkk..kkk..',
];

/** The bench: wig band plus the red robe. */
const BENCH = [
  '..kkkkkkkk..',
  '.kggggggggk.',
  'kkcccccccckk',
  'kcceecceecck',
  'kcceecceecck',
  'kcccccccccck',
  'kccccggcccck',
  '.kcccccccck.',
  '..kkkkkkkk..',
  '..krrrrrrk..',
  '...kkkkkk...',
  '..kkk..kkk..',
];

const SPRITES: Record<StageId, string[]> = {
  unfiled: EGG,
  petitioner: PETITIONER,
  clerk: CLERK,
  counsel: COUNSEL,
  bench: BENCH,
};

export function spriteFor(stage: StageId): string[] {
  return SPRITES[stage];
}

export function spriteSize(stage: StageId): number {
  return SPRITES[stage][0].length;
}
