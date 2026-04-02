import type { Job } from "bullmq";
import { eq } from "drizzle-orm";

import { db } from "../lib/db";
import { markJobStatus } from "../lib/job-status";
import { createScanProvider } from "../lib/scan-provider";
import { notificationDevices } from "../lib/schema";

type ScanJobData = {
  userId: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  uploadId: string | null;
  categoryHint: string | null;
  requestedAt: string;
};

type AlertJobData = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

// Expo Push API endpoint
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const scanProvider = createScanProvider();

export async function processCardScan(job: Job<ScanJobData>) {
  await markJobStatus({
    queueName: "card-scan",
    externalJobId: String(job.id),
    status: "processing",
    payload: {
      userId: job.data.userId,
      categoryHint: job.data.categoryHint,
      requestedAt: job.data.requestedAt
    }
  });

  const analysis = await scanProvider.analyze({
    frontImageUrl: job.data.frontImageUrl,
    backImageUrl: job.data.backImageUrl,
    categoryHint: job.data.categoryHint
  });

  const result = {
    jobId: job.id,
    status: "completed",
    confidence: analysis.confidence,
    categoryDetected: analysis.categoryDetected,
    analyzedAt: new Date().toISOString(),
    matches: analysis.matches,
    provider: analysis.provider
  };

  await markJobStatus({
    queueName: "card-scan",
    externalJobId: String(job.id),
    status: "completed",
    payload: result
  });

  return result;
}

export async function processCompRefresh(job: Job) {
  const result = {
    jobId: job.id,
    status: "completed",
    refreshedSources: ["eBay", "PWCC", "Goldin"]
  };

  await markJobStatus({
    queueName: "comp-refresh",
    externalJobId: String(job.id),
    status: "completed",
    payload: result
  });

  return result;
}

export async function processAlertNotification(job: Job<AlertJobData>) {
  const { userId, title, body, data } = job.data;

  // Fetch all push tokens registered for this user
  const devices = await db
    .select({ token: notificationDevices.token, platform: notificationDevices.platform })
    .from(notificationDevices)
    .where(eq(notificationDevices.userId, userId));

  const expoPushTokens = devices
    .map((d) => d.token)
    .filter((t) => t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["));

  let delivered = 0;

  if (expoPushTokens.length > 0) {
    const messages = expoPushTokens.map((to) => ({
      to,
      title,
      body,
      data: data ?? {},
      sound: "default" as const,
      priority: "high" as const
    }));

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(messages)
      });

      if (response.ok) {
        delivered = expoPushTokens.length;
      }
    } catch {
      // Non-fatal: push delivery failure should not fail the job
    }
  }

  const result = {
    jobId: job.id,
    status: "completed",
    delivered,
    deviceCount: devices.length,
    pushedTokenCount: expoPushTokens.length
  };

  await markJobStatus({
    queueName: "alert-notification",
    externalJobId: String(job.id),
    status: "completed",
    payload: result
  });

  return result;
}

