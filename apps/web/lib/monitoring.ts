let initialized = false;

export async function initWebMonitoring() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || initialized) {
    return;
  }

  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "development",
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    sendDefaultPii: false
  });

  initialized = true;
}

export async function captureWebError(error: unknown, context?: Record<string, unknown>) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  const Sentry = await import("@sentry/nextjs");
  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}
