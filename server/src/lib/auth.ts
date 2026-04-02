import type { FastifyReply, FastifyRequest } from "fastify";
import { jwtVerify, SignJWT } from "jose";
import { createHash, randomBytes } from "node:crypto";

import { env } from "../config/env";

const textEncoder = new TextEncoder();
const secret = textEncoder.encode(env.JWT_SECRET);

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export type AuthUser = {
  userId: string;
  email: string | null;
};

export async function signAccessToken(payload: AccessTokenPayload) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_MINUTES}m`)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AuthUser> {
  const verified = await jwtVerify(token, secret, {
    algorithms: ["HS256"]
  });

  if (typeof verified.payload.sub !== "string" || verified.payload.sub.length === 0) {
    throw new Error("Invalid access token subject");
  }

  return {
    userId: verified.payload.sub,
    email: typeof verified.payload.email === "string" ? verified.payload.email : null
  };
}

export function createRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function getBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function requireAuthUser(request: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null> {
  const token = getBearerToken(request);
  if (!token) {
    await reply.code(401).send({ error: "Missing bearer token" });
    return null;
  }

  try {
    const payload = await verifyAccessToken(token);
    return payload;
  } catch {
    await reply.code(401).send({ error: "Invalid or expired access token" });
    return null;
  }
}
