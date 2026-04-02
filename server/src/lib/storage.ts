/**
 * Storage abstraction for uploaded card images.
 *
 * Provider is selected by the STORAGE_PROVIDER env var:
 *   local  — write to local disk (default for development)
 *   s3     — AWS S3 (or any S3-compatible service)
 *   r2     — Cloudflare R2 (S3-compatible, no egress fees)
 *
 * Required env vars per provider:
 *
 *   local:
 *     UPLOAD_DIR          (optional, default: ./uploads)
 *     UPLOAD_BASE_URL     (optional, default: http://localhost:4000)
 *
 *   s3 / r2:
 *     STORAGE_BUCKET           e.g. vaultlore-uploads
 *     STORAGE_REGION           e.g. us-east-1  (s3) or auto  (r2)
 *     STORAGE_ENDPOINT         required for r2, e.g. https://<account>.r2.cloudflarestorage.com
 *     STORAGE_ACCESS_KEY       IAM / R2 API token access key
 *     STORAGE_SECRET_KEY       IAM / R2 API token secret key
 *     STORAGE_PUBLIC_BASE_URL  e.g. https://uploads.vaultlore.app (public bucket URL or CDN)
 */

import { createWriteStream, mkdirSync } from "node:fs";
import { join, extname } from "node:path";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type StoredFile = {
  /** UUID used as primary key in the uploads table. */
  uploadId: string;
  /** Provider-specific key (filename for local, object key for S3/R2). */
  storageKey: string;
  /** Publicly reachable URL for the file (safe for worker + external CV use). */
  url: string;
  mimeType: string;
};

export interface StorageProvider {
  save(stream: Readable, originalName: string, mimeType: string): Promise<StoredFile>;
  delete(storageKey: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Local disk provider
// ---------------------------------------------------------------------------

class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR
      ? join(process.cwd(), process.env.UPLOAD_DIR)
      : join(process.cwd(), "uploads");

    this.baseUrl = (process.env.UPLOAD_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
    mkdirSync(this.uploadDir, { recursive: true });
  }

  async save(stream: Readable, originalName: string, mimeType: string): Promise<StoredFile> {
    const ext = extname(originalName) || mimeTypeToExt(mimeType);
    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    const absolutePath = join(this.uploadDir, filename);

    await pipeline(stream, createWriteStream(absolutePath));

    return {
      uploadId: randomUUID(),
      storageKey: filename,
      url: `${this.baseUrl}/uploads/${filename}`,
      mimeType
    };
  }

  async delete(storageKey: string): Promise<void> {
    const { unlink } = await import("node:fs/promises");
    const absolutePath = join(this.uploadDir, storageKey);
    await unlink(absolutePath).catch(() => {
      // Ignore missing file on delete
    });
  }
}

// ---------------------------------------------------------------------------
// S3 / R2 provider (uses AWS SDK v3 — S3-compatible)
// ---------------------------------------------------------------------------

class S3StorageProvider implements StorageProvider {
  private client!: import("@aws-sdk/client-s3").S3Client;
  private bucket!: string;
  private publicBaseUrl!: string;

  constructor() {
    this.init();
  }

  private init() {
    // Dynamic import deferred so the AWS SDK is only loaded when this provider is active.
    // We assign synchronously to satisfy TypeScript; actual import happens in save().
    this.bucket = process.env.STORAGE_BUCKET ?? "";
    this.publicBaseUrl = (process.env.STORAGE_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

    if (!this.bucket) {
      throw new Error("STORAGE_BUCKET env var is required for s3/r2 provider");
    }
    if (!this.publicBaseUrl) {
      throw new Error("STORAGE_PUBLIC_BASE_URL env var is required for s3/r2 provider");
    }
  }

  private async getClient(): Promise<import("@aws-sdk/client-s3").S3Client> {
    if (this.client) return this.client;

    const { S3Client } = await import("@aws-sdk/client-s3");

    const endpoint = process.env.STORAGE_ENDPOINT || undefined;
    const region = process.env.STORAGE_REGION ?? "us-east-1";
    const accessKeyId = process.env.STORAGE_ACCESS_KEY ?? "";
    const secretAccessKey = process.env.STORAGE_SECRET_KEY ?? "";

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY are required for s3/r2 provider");
    }

    this.client = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: false } : {}),
      credentials: { accessKeyId, secretAccessKey }
    });

    return this.client;
  }

  async save(stream: Readable, originalName: string, mimeType: string): Promise<StoredFile> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();

    const ext = extname(originalName) || mimeTypeToExt(mimeType);
    const storageKey = `card-scans/${Date.now()}-${randomUUID()}${ext}`;

    // S3 SDK needs a buffer or sized stream; collect to buffer for simplicity at ≤10MB.
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
    }
    const body = Buffer.concat(chunks);

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: body,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000, immutable"
      })
    );

    return {
      uploadId: randomUUID(),
      storageKey,
      url: `${this.publicBaseUrl}/${storageKey}`,
      mimeType
    };
  }

  async delete(storageKey: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
  }
}

// ---------------------------------------------------------------------------
// Provider factory — driven entirely by env, no code edits needed
// ---------------------------------------------------------------------------

function createStorageProvider(): StorageProvider {
  const provider = (process.env.STORAGE_PROVIDER ?? "local").toLowerCase();
  switch (provider) {
    case "s3":
    case "r2":
      return new S3StorageProvider();
    case "local":
    default:
      return new LocalStorageProvider();
  }
}

export const storage: StorageProvider = createStorageProvider();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mimeTypeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/webp": ".webp"
  };
  return map[mime] ?? ".bin";
}
