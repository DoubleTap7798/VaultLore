import * as Sentry from "@sentry/node";

import { env } from "../config/env";

export function initApiMonitoring() {
  if (!env.SENTRY_DSN_API) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN_API,
    environment: env.SENTRY_ENVIRONMENT,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false
  });
}

export function captureApiError(error: unknown, context?: Record<string, unknown>) {
  if (!env.SENTRY_DSN_API) {
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
