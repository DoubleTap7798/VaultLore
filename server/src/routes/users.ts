import { eq } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";

import { patchUserSchema } from "@vaultlore/shared";
import { db } from "../db/client";
import { users } from "../db/schema";
import { requireAuthUser } from "../lib/auth";

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.get("/users/me", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) return;

    const found = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        favoriteCategories: users.favoriteCategories,
        collectorLevel: users.collectorLevel,
        collectorGoals: users.collectorGoals,
        alertsEnabled: users.alertsEnabled,
        onboardingCompleted: users.onboardingCompleted
      })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    const user = found[0];
    if (!user) return reply.code(404).send({ error: "User not found" });

    return { ...user, plan: "premium-trial" };
  });

  app.patch("/users/me", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) return;

    const parsed = patchUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const data = parsed.data;
    const updates: Record<string, unknown> = {};
    if (data.displayName !== undefined) updates.displayName = data.displayName;
    if (data.favoriteCategories !== undefined) updates.favoriteCategories = data.favoriteCategories;
    if (data.collectorLevel !== undefined) updates.collectorLevel = data.collectorLevel;
    if (data.collectorGoals !== undefined) updates.collectorGoals = data.collectorGoals;
    if (data.alertsEnabled !== undefined) updates.alertsEnabled = data.alertsEnabled;
    if (data.onboardingCompleted !== undefined) updates.onboardingCompleted = data.onboardingCompleted;

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ error: "No valid fields provided" });
    }

    const updated = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, auth.userId))
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        favoriteCategories: users.favoriteCategories,
        collectorLevel: users.collectorLevel,
        collectorGoals: users.collectorGoals,
        alertsEnabled: users.alertsEnabled,
        onboardingCompleted: users.onboardingCompleted
      });

    const user = updated[0];
    if (!user) return reply.code(404).send({ error: "User not found" });

    return { ...user, plan: "premium-trial" };
  });
};
