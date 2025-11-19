let sentryInited = false;

export function initSentry() {
  if (sentryInited) return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs');
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
    sentryInited = true;
  } catch {
    // ignore
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs');
    if (Sentry?.captureException) {
      Sentry.captureException(error, { extra: context });
    }
  } catch {
    // ignore
  }
}


