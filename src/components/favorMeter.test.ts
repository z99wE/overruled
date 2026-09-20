import { describe, expect, it } from 'vitest';
import { favorColor, lerpColor } from '../components/FavorMeter';

describe('favorColor', () => {
  it('interpolates through the danger → amber → gold ramp across 0–100', () => {
    expect(favorColor(0)).toBe('rgb(208, 48, 48)');
    expect(favorColor(50)).toBe('rgb(232, 131, 58)');
    expect(favorColor(100)).toBe('rgb(244, 180, 27)');
  });

  it('moves monotonically toward gold as favor rises', () => {
    const low = favorColor(10);
    const mid = favorColor(50);
    const high = favorColor(90);
    expect(low).not.toBe(mid);
    expect(mid).not.toBe(high);
  });
});

describe('lerpColor', () => {
  it('reaches endpoints at t = 0 and t = 1', () => {
    const a: [number, number, number] = [10, 20, 30];
    const b: [number, number, number] = [100, 200, 300];
    expect(lerpColor(a, b, 0)).toBe('rgb(10, 20, 30)');
    expect(lerpColor(a, b, 1)).toBe('rgb(100, 200, 300)');
  });

  it('interpolates halfway', () => {
    const a: [number, number, number] = [0, 0, 0];
    const b: [number, number, number] = [200, 100, 0];
    expect(lerpColor(a, b, 0.5)).toBe('rgb(100, 50, 0)');
  });
});