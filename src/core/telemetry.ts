import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

/** Error tracking is opt-in: set VITE_SENTRY_DSN to route runtime errors to Sentry. */
export function initErrorTracking(): void {
  if (!SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE ?? 'production',
  });
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!SENTRY_DSN) return;
  Sentry.withScope((scope) => {
    if (context) scope.setContext('context', context);
    Sentry.captureException(error);
  });
}