/**
 * POST /v1/uploads/card-scan
 *
 * Accepts a multipart/form-data upload containing:
 *   front  — image file (required)
 *   back   — image file (optional)
 *   categoryHint — text field (optional, one of the card category slugs)
 *
 * Stores files via the storage abstraction, records upload rows, creates a
 * scan job, and returns { jobId, uploadId, status }.
 *
 * The scan worker will find the stored file URL via the upload record.
 */

import type { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
// Import triggers @fastify/multipart TypeScript augmentation of FastifyRequest
// (adds isMultipart(), parts(), file() etc.)
import "@fastify/multipart";

import { env } from "../config/env";
import { db } from "../db/client";
import { uploads, jobsLog } from "../db/schema";
import { requireAuthUser } from "../lib/auth";
import { storage } from "../lib/storage";
import { queues } from "../lib/queues";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp"
]);

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export const uploadRoutes: FastifyPluginAsync = async (app) => {
  app.post("/uploads/card-scan", {
    config: { rateLimit: { max: env.RATE_LIMIT_UPLOAD_MAX, timeWindow: env.RATE_LIMIT_WINDOW } }
  }, async (request, reply) => {
    const auth = await requireAuthUser(request, reply);
    if (!auth) return;

    // @fastify/multipart must be registered on the app before this route runs.
    if (!request.isMultipart()) {
      return reply.code(400).send({ error: "Request must be multipart/form-data" });
    }

    let frontStoredFile: { uploadId: string; url: string; storageKey: string } | null = null;
    let backStoredFile: { uploadId: string; url: string; storageKey: string } | null = null;
    let categoryHint: string | null = null;

    const parts = request.parts({ limits: { fileSize: MAX_FILE_BYTES } });

    for await (const part of parts) {
      if (part.type === "field") {
        if (part.fieldname === "categoryHint" && typeof part.value === "string") {
          categoryHint = part.value.trim() || null;
        }
        continue;
      }

      // File part
      const mimeType = part.mimetype;
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        // Drain the stream then reject
        await part.toBuffer().catch(() => null);
        return reply
          .code(415)
          .send({ error: `Unsupported file type: ${mimeType}. Accepted: jpeg, png, heic, webp` });
      }

      const stream = part.file as Readable;
      const originalName = part.filename || `image.jpg`;

      const stored = await storage.save(stream, originalName, mimeType);

      const [insertedRow] = await db
        .insert(uploads)
        .values({
          id: stored.uploadId,
          userId: auth.userId,
          purpose: "card-scan",
          storageKey: stored.storageKey,
          mimeType
        })
        .returning({ id: uploads.id });

      if (part.fieldname === "front") {
        frontStoredFile = { uploadId: insertedRow?.id ?? stored.uploadId, url: stored.url, storageKey: stored.storageKey };
      } else if (part.fieldname === "back") {
        backStoredFile = { uploadId: insertedRow?.id ?? stored.uploadId, url: stored.url, storageKey: stored.storageKey };
      }
    }

    if (!frontStoredFile) {
      return reply.code(400).send({ error: "Front image (field 'front') is required" });
    }

    // Create scan job with the real uploaded asset URLs.
    const job = await queues.cardScan.add("scan-card", {
      userId: auth.userId,
      frontImageUrl: frontStoredFile.url,
      backImageUrl: backStoredFile?.url ?? null,
      uploadId: frontStoredFile.uploadId,
      categoryHint,
      requestedAt: new Date().toISOString()
    });

    await db.insert(jobsLog).values({
      externalJobId: String(job.id),
      queueName: "card-scan",
      jobType: "scan-card",
      status: "queued",
      payload: {
        userId: auth.userId,
        uploadId: frontStoredFile.uploadId,
        categoryHint
      }
    });

    return reply.code(202).send({
      jobId: String(job.id),
      uploadId: frontStoredFile.uploadId,
      status: "queued",
      categoryHint
    });
  });
};
