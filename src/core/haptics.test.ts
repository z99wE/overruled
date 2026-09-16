import { describe, expect, it } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { initHaptics, notifyTap, notifyVerdict } from './haptics';

describe('haptics on the web', () => {
  it('initialises without enabling native haptics', async () => {
    await initHaptics();
    expect(Capacitor.isNativePlatform()).toBe(false);
  });

  it('no-ops verdict and tap notifications safely', async () => {
    await expect(notifyVerdict('SUSTAINED', 15)).resolves.toBeUndefined();
    await expect(notifyVerdict('OVERRULED', -20)).resolves.toBeUndefined();
    await expect(notifyTap()).resolves.toBeUndefined();
  });
});