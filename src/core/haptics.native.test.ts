import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initHaptics, notifyTap, notifyVerdict } from './haptics';

const { impactMock } = vi.hoisted(() => ({ impactMock: vi.fn(async () => undefined) }));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: impactMock },
}));

describe('haptics on a native platform', () => {
  beforeEach(async () => {
    impactMock.mockClear();
    vi.resetModules();
    await initHaptics();
  });

  it('maps an OVERRULED blow to a heavy impact', async () => {
    await notifyVerdict('OVERRULED', -20);
    expect(impactMock).toHaveBeenCalledWith({ style: 'HEAVY' });
  });

  it('maps a SUSTAINED win to a medium impact', async () => {
    await notifyVerdict('SUSTAINED', 15);
    expect(impactMock).toHaveBeenCalledWith({ style: 'MEDIUM' });
  });

  it('maps a bench warning to a rigid impact', async () => {
    await notifyVerdict('BENCH_WARNING', -3);
    expect(impactMock).toHaveBeenCalledWith({ style: 'RIGID' });
  });

  it('maps a neutral note to a light impact', async () => {
    await notifyVerdict('NOTED_FOR_RECORD', 2);
    expect(impactMock).toHaveBeenCalledWith({ style: 'LIGHT' });
  });

  it('notifyTap uses a light impact', async () => {
    await notifyTap();
    expect(impactMock).toHaveBeenCalledWith({ style: 'LIGHT' });
  });
});