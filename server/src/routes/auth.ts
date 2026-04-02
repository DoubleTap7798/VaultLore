import { authCredentialsSchema } from "@vaultlore/shared";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

import { env } from "../config/env";
import { db } from "../db/client";
import { passwordResets, sessions, users } from "../db/schema";
import {
  createRefreshToken,
  hashToken,
  requireAuthUser,
  signAccessToken
} from "../lib/auth";
import { emailService, passwordResetEmail } from "../lib/email";

const forgotPasswordSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({ token: z.string().min(6), password: z.string().min(8) });
const refreshSchema = z.object({ refreshToken: z.string().min(20) });

function getRefreshExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/register", {
    config: { rateLimit: { max: env.RATE_LIMIT_AUTH_MAX, timeWindow: env.RATE_LIMIT_WINDOW } }
  }, async (request, reply) => {
    const parsed = authCredentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsed.data.email.toLowerCase()))
      .limit(1);
    if (existing.length > 0) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const created = await db
      .insert(users)
      .values({
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        collectorLevel: "beginner"
      })
      .returning({ id: users.id, email: users.email });

    const user = created[0];
    const refreshToken = createRefreshToken();
    await db.insert(sessions).values({
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: getRefreshExpiry()
    });

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email
    });

    return reply.code(201).send({
      user,
      accessToken,
      refreshToken
    });
  });

  app.post("/auth/login", {
    config: { rateLimit: { max: env.RATE_LIMIT_AUTH_MAX, timeWindow: env.RATE_LIMIT_WINDOW } }
  }, async (request, reply) => {
    const parsedCredentials = authCredentialsSchema.safeParse(request.body);
    if (!parsedCredentials.success) {
      return reply.code(400).send({ error: parsedCredentials.error.flatten() });
    }

    const found = await db
      .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, parsedCredentials.data.email.toLowerCase()))
      .limit(1);

    const user = found[0];
    if (!user) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const passwordValid = await bcrypt.compare(parsedCredentials.data.password, user.passwordHash);
    if (!passwordValid) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const refreshToken = createRefreshToken();
    await db.insert(sessions).values({
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: getRefreshExpiry()
    });

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email
    });

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken
    };
  });

  app.post("/auth/logout", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    await db
      .delete(sessions)
      .where(eq(sessions.refreshTokenHash, hashToken(parsed.data.refreshToken)));

    return { success: true };
  });

  app.post("/auth/refresh", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const now = new Date();
    const found = await db
      .select({ id: sessions.id, userId: sessions.userId })
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshTokenHash, hashToken(parsed.data.refreshToken)),
          gt(sessions.expiresAt, now)
        )
      )
      .limit(1);

    const stored = found[0];
    if (!stored) {
      return reply.code(401).send({ error: "Invalid refresh token" });
    }

    const userRows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, stored.userId))
      .limit(1);
    if (userRows.length === 0) {
      return reply.code(401).send({ error: "Invalid refresh token" });
    }

    const accessToken = await signAccessToken({
      sub: userRows[0].id,
      email: userRows[0].email
    });

    return { accessToken };
  });

  app.post("/auth/forgot-password", {
    config: { rateLimit: { max: env.RATE_LIMIT_PASSWORD_RESET_MAX, timeWindow: env.RATE_LIMIT_WINDOW } }
  }, async (request, reply) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { email } = parsed.data;
    const userRows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return the same response to avoid leaking email existence
    if (userRows.length === 0) {
      return { queued: true };
    }

    const user = userRows[0];
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResets).values({
      userId: user.id,
      tokenHash,
      expiresAt
    });

    const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${rawToken}`;
    await emailService.send({
      to: user.email,
      ...passwordResetEmail(resetUrl)
    });

    return { queued: true };
  });

  app.post("/auth/reset-password", {
    config: { rateLimit: { max: env.RATE_LIMIT_PASSWORD_RESET_MAX, timeWindow: env.RATE_LIMIT_WINDOW } }
  }, async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { token, password } = parsed.data;
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const resetRows = await db
      .select({ id: passwordResets.id, userId: passwordResets.userId })
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.tokenHash, tokenHash),
          isNull(passwordResets.usedAt),
          gt(passwordResets.expiresAt, new Date())
        )
      )
      .limit(1);

    if (resetRows.length === 0) {
      return reply.code(400).send({ error: "Invalid or expired reset token" });
    }

    const reset = resetRows[0];
    const passwordHash = await bcrypt.hash(password, 12);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, reset.userId));

    await db
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(eq(passwordResets.id, reset.id));

    // Invalidate all existing sessions for this user
    await db.delete(sessions).where(eq(sessions.userId, reset.userId));

    return { success: true };
  });

  app.delete("/auth/delete-account", async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) {
      return;
    }

    await db.delete(sessions).where(eq(sessions.userId, auth.userId));
    await db.delete(users).where(eq(users.id, auth.userId));

    return { success: true, deletedAt: new Date().toISOString() };
  });
};
