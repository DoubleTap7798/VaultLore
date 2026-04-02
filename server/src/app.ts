import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import staticFiles from "@fastify/static";
import Fastify from "fastify";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

import { env } from "./config/env";
import { captureApiError } from "./lib/monitoring";
import { apiRoutes } from "./routes/index";

export function createApp() {
  const app = Fastify({ logger: true });

  const allowedOrigins = env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.register(cors, {
    origin: allowedOrigins,
    credentials: true
  });

  app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    keyGenerator: (request) => request.headers["x-forwarded-for"]?.toString() ?? request.ip
  });

  // Multipart must be registered before routes that consume uploads.
  app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
      files: 2
    }
  });

  // Serve uploaded files at /uploads/*
  const uploadDir = process.env.UPLOAD_DIR
    ? join(process.cwd(), process.env.UPLOAD_DIR)
    : join(process.cwd(), "uploads");
  mkdirSync(uploadDir, { recursive: true });

  app.register(staticFiles, {
    root: uploadDir,
    prefix: "/uploads/"
  });

  app.register(apiRoutes, { prefix: "/v1" });

  app.setErrorHandler((error, request, reply) => {
    captureApiError(error, {
      method: request.method,
      url: request.url,
      requestId: request.id
    });
    request.log.error({ err: error }, "unhandled_request_error");
    reply.send(error);
  });

  return app;
}
