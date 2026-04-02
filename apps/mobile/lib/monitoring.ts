import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const environment = process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? "development";
const tracesSampleRate = Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1");

let initialized = false;

export function initMobileMonitoring() {
  if (!dsn || initialized) {
    return;
  }

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate,
    sendDefaultPii: false
  });

  initialized = true;
}

export function captureMobileError(error: unknown, context?: Record<string, unknown>) {
  if (!dsn) {
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
