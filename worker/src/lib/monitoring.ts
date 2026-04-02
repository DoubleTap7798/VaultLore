import * as Sentry from "@sentry/node";

const workerDsn = process.env.SENTRY_DSN_WORKER;
const sentryEnvironment = process.env.SENTRY_ENVIRONMENT ?? "development";
const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1");

export function initWorkerMonitoring() {
  if (!workerDsn) {
    return;
  }

  Sentry.init({
    dsn: workerDsn,
    environment: sentryEnvironment,
    tracesSampleRate,
    sendDefaultPii: false
  });
}

export function captureWorkerError(error: unknown, context?: Record<string, unknown>) {
  if (!workerDsn) {
    return;
  }
  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}
