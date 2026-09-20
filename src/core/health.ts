export interface HealthStatus {
  ready: boolean;
  checks: Record<string, boolean>;
  checkedAt: number;
}

/** Reports process-level readiness. Mirrors the app's runtime status probe. */
export function reportHealth(checks: Record<string, boolean>): HealthStatus {
  const status: HealthStatus = {
    ready: Object.values(checks).every(Boolean),
    checks,
    checkedAt: Date.now(),
  };
  if (import.meta.env.DEV) {
    console.info('[healthz] readiness probe:', status.ready, status.checkedAt);
  }
  return status;
}

export function bootHealth(): HealthStatus {
  return reportHealth({
    storage: typeof window !== 'undefined' && typeof window.localStorage !== 'undefined',
    register: typeof (globalThis as { caches?: CacheStorage }).caches !== 'undefined',
    transport: navigator.onLine,
  });
}