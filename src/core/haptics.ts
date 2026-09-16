import type { BenchVerdictTag } from '../types/legal';

type ImpactStyle = 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'RIGID' | 'SOFT';

interface HapticsPluginLike {
  impact: (opts: { style: ImpactStyle }) => Promise<void>;
}

let nativeReady = false;
let impact: HapticsPluginLike['impact'] | undefined;

export async function initHaptics(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const mod = await import('@capacitor/haptics');
    impact = (mod.Haptics as unknown as HapticsPluginLike).impact.bind(mod.Haptics);
    nativeReady = true;
  } catch {
    nativeReady = false;
  }
}

export async function notifyVerdict(tag: BenchVerdictTag, delta: number): Promise<void> {
  if (!nativeReady || !impact) return;
  const style: ImpactStyle =
    tag === 'OVERRULED' || delta <= -10
      ? 'HEAVY'
      : delta >= 10
        ? 'MEDIUM'
        : tag === 'BENCH_WARNING'
          ? 'RIGID'
          : 'LIGHT';
  try {
    await impact({ style });
  } catch {
    /* haptics best-effort */
  }
}

export async function notifyTap(): Promise<void> {
  if (!nativeReady || !impact) return;
  try {
    await impact({ style: 'LIGHT' });
  } catch {
    /* noop */
  }
}