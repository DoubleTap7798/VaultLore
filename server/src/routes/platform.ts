import { notificationDeviceSchema } from "@vaultlore/shared";
import type { FastifyPluginAsync } from "fastify";

import { db } from "../db/client";
import { notificationDevices } from "../db/schema";
import { requireAuthUser } from "../lib/auth";

export const platformRoutes: FastifyPluginAsync = async (app) => {
  app.get("/subscriptions/status", async () => ({
    plan: "premium-trial",
    scansRemaining: "unlimited",
    renewsAt: "2026-04-10T00:00:00.000Z"
  }));

  app.post("/notifications/register-device", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    const parsed = notificationDeviceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const inserted = await db
      .insert(notificationDevices)
      .values({
        userId: auth.userId,
        token: parsed.data.token,
        platform: parsed.data.platform,
        appVersion: parsed.data.appVersion
      })
      .returning({
        id: notificationDevices.id,
        platform: notificationDevices.platform,
        token: notificationDevices.token,
        appVersion: notificationDevices.appVersion
      });

    return reply.code(201).send(inserted[0]);
  });

  app.get("/admin/health", async () => ({
    status: "ok",
    queues: [
      { name: "card-scan", healthy: true },
      { name: "comp-refresh", healthy: true },
      { name: "alert-notification", healthy: true }
    ]
  }));
};
