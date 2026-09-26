import { describe, expect, it } from 'vitest';
import { PALETTE, STAGES, nextStageFor, spriteFor, spriteSize, stageFor } from './docketling';

describe('stageFor', () => {
  it('starts sealed at zero documents', () => {
    expect(stageFor(0).id).toBe('unfiled');
  });

  it('never goes backwards for negative or nonsense input', () => {
    expect(stageFor(-5).id).toBe('unfiled');
    expect(stageFor(Number.NaN).id).toBe('unfiled');
  });

  it('advances through the legal ladder', () => {
    expect(stageFor(1).id).toBe('petitioner');
    expect(stageFor(2).id).toBe('clerk');
    expect(stageFor(4).id).toBe('counsel');
    expect(stageFor(9).id).toBe('bench');
  });

  it('is monotonic as documents increase', () => {
    let prev = -1;
    for (let n = 0; n <= 30; n += 1) {
      const idx = STAGES.findIndex((s) => s.id === stageFor(n).id);
      expect(idx).toBeGreaterThanOrEqual(prev);
      prev = idx;
    }
  });

  it('caps at the final stage', () => {
    expect(stageFor(10_000).id).toBe('bench');
    expect(nextStageFor(10_000)).toBeNull();
  });

  it('points at the next stage while one remains', () => {
    expect(nextStageFor(0)?.id).toBe('petitioner');
    expect(nextStageFor(3)?.id).toBe('counsel');
  });
});

describe('sprites', () => {
  const hatched = STAGES.filter((s) => s.id !== 'unfiled');

  it.each(STAGES.map((s) => s.id))('%s is square, uniform and uses known glyphs', (id) => {
    const rows = spriteFor(id);
    const w = spriteSize(id);
    expect(rows).toHaveLength(w);
    for (const row of rows) {
      expect(row).toHaveLength(w);
      for (const ch of row) {
        if (ch === '.') continue;
        expect(Object.keys(PALETTE)).toContain(ch);
      }
    }
  });

  it.each(hatched.map((s) => s.id))('%s keeps two symmetric 2x2 eyes', (id) => {
    const rows = spriteFor(id);
    for (const y of [3, 4]) {
      const row = rows[y] ?? '';
      const eyeXs = [...row].map((ch, x) => (ch === 'e' ? x : -1)).filter((x) => x >= 0);
      expect(eyeXs.length).toBe(4);
      // grouped as two pairs, mirrored about the centre
      expect(eyeXs.slice(0, 2)).toEqual([eyeXs[1]! - 1, eyeXs[1]!]);
      expect(eyeXs[3]! - eyeXs[2]!).toBe(1);
    }
  });

  it.each(hatched.map((s) => s.id))('%s keeps a centred beak', (id) => {
    const beak = spriteFor(id)[6] ?? '';
    const xs = [...beak].map((ch, x) => (ch === 'g' ? x : -1)).filter((x) => x >= 0);
    expect(xs.length).toBe(2);
    expect(xs[1]! - xs[0]!).toBe(1);
    const mid = (beak.length - 1) / 2;
    expect((xs[0]! + xs[1]!) / 2).toBe(mid);
  });

  it('gives every stage a distinct sprite', () => {
    const rendered = STAGES.map((s) => spriteFor(s.id).join('|'));
    expect(new Set(rendered).size).toBe(STAGES.length);
  });

  it('does not let a collar or robe overwrite the beak', () => {
    for (const id of ['clerk', 'counsel', 'bench'] as const) {
      expect([...(spriteFor(id)[6] ?? [])].filter((c) => c === 'g').length).toBe(2);
    }
  });
});
