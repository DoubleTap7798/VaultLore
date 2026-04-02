import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CORS_ORIGINS: z.string().default("http://localhost:8081,http://localhost:3000"),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.string().default("1 minute"),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(10),
  RATE_LIMIT_PASSWORD_RESET_MAX: z.coerce.number().default(5),
  RATE_LIMIT_UPLOAD_MAX: z.coerce.number().default(20),
  JWT_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  EXPO_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  RAILWAY_ENVIRONMENT: z.string().default("local"),

  // --- Storage ---
  // STORAGE_PROVIDER: "local" | "s3" | "r2"  (default: local)
  STORAGE_PROVIDER: z.enum(["local", "s3", "r2"]).default("local"),
  UPLOAD_DIR: z.string().optional(),               // local: relative path for uploads folder
  UPLOAD_BASE_URL: z.string().optional(),           // local: public server base URL e.g. http://localhost:4000
  STORAGE_BUCKET: z.string().optional(),            // s3/r2: bucket name
  STORAGE_REGION: z.string().optional(),            // s3: AWS region, r2: use "auto"
  STORAGE_ENDPOINT: z.string().optional(),          // r2: https://<account>.r2.cloudflarestorage.com
  STORAGE_ACCESS_KEY: z.string().optional(),        // s3/r2: access key
  STORAGE_SECRET_KEY: z.string().optional(),        // s3/r2: secret key
  STORAGE_PUBLIC_BASE_URL: z.string().optional(),   // s3/r2: public CDN/bucket base URL

  // --- Email ---
  // EMAIL_PROVIDER: "resend" | "sendgrid" | "console"  (default: console)
  EMAIL_PROVIDER: z.enum(["resend", "sendgrid", "console"]).default("console"),
  EMAIL_API_KEY: z.string().optional(),             // Resend/SendGrid API key
  EMAIL_FROM: z.string().default("noreply@vaultlore.app"),

  // --- RevenueCat (server-side webhook validation) ---
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),

  // --- Monitoring ---
  SENTRY_DSN_API: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default("development"),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().default(0.1),

  // --- App base URL (used in password-reset emails) ---
  APP_BASE_URL: z.string().url().default("https://app.vaultlore.app")
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
  RATE_LIMIT_AUTH_MAX: process.env.RATE_LIMIT_AUTH_MAX,
  RATE_LIMIT_PASSWORD_RESET_MAX: process.env.RATE_LIMIT_PASSWORD_RESET_MAX,
  RATE_LIMIT_UPLOAD_MAX: process.env.RATE_LIMIT_UPLOAD_MAX,
  JWT_SECRET: process.env.JWT_SECRET,
  ACCESS_TOKEN_TTL_MINUTES: process.env.ACCESS_TOKEN_TTL_MINUTES,
  REFRESH_TOKEN_TTL_DAYS: process.env.REFRESH_TOKEN_TTL_DAYS,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER as "local" | "s3" | "r2" | undefined,
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  UPLOAD_BASE_URL: process.env.UPLOAD_BASE_URL,
  STORAGE_BUCKET: process.env.STORAGE_BUCKET,
  STORAGE_REGION: process.env.STORAGE_REGION,
  STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT,
  STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY,
  STORAGE_SECRET_KEY: process.env.STORAGE_SECRET_KEY,
  STORAGE_PUBLIC_BASE_URL: process.env.STORAGE_PUBLIC_BASE_URL,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER as "resend" | "sendgrid" | "console" | undefined,
  EMAIL_API_KEY: process.env.EMAIL_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  REVENUECAT_WEBHOOK_SECRET: process.env.REVENUECAT_WEBHOOK_SECRET,
  SENTRY_DSN_API: process.env.SENTRY_DSN_API,
  SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
  SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE,
  APP_BASE_URL: process.env.APP_BASE_URL
});

