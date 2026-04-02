# Production Environment Variable Matrix

## API (Railway service: vaultlore-api)

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=<postgres-url>
REDIS_URL=<redis-url>
JWT_SECRET=<64+ random>
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30
EXPO_PUBLIC_API_URL=https://api.vaultlore.app/v1
NEXT_PUBLIC_API_URL=https://api.vaultlore.app/v1
RAILWAY_ENVIRONMENT=production
CORS_ORIGINS=https://app.vaultlore.app,https://www.vaultlore.app
RATE_LIMIT_MAX=120
RATE_LIMIT_WINDOW=1 minute
RATE_LIMIT_AUTH_MAX=12
RATE_LIMIT_PASSWORD_RESET_MAX=6
RATE_LIMIT_UPLOAD_MAX=20
STORAGE_PROVIDER=r2
STORAGE_BUCKET=vaultlore-uploads
STORAGE_REGION=auto
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=<r2-access-key>
STORAGE_SECRET_KEY=<r2-secret-key>
STORAGE_PUBLIC_BASE_URL=https://cdn.vaultlore.app
EMAIL_PROVIDER=resend
EMAIL_API_KEY=<resend-api-key>
EMAIL_FROM=VaultLore <noreply@vaultlore.app>
APP_BASE_URL=https://app.vaultlore.app
REVENUECAT_WEBHOOK_SECRET=<revenuecat-webhook-secret>
SENTRY_DSN_API=<sentry-api-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Worker (Railway service: vaultlore-worker)

```env
NODE_ENV=production
DATABASE_URL=<postgres-url>
REDIS_URL=<redis-url>
GOOGLE_CLOUD_VISION_KEY=<optional>
SENTRY_DSN_WORKER=<sentry-worker-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Mobile (EAS)

```env
EXPO_PUBLIC_API_URL=https://api.vaultlore.app/v1
EXPO_PUBLIC_REVENUECAT_KEY=<revenuecat-mobile-sdk-key>
EXPO_PUBLIC_SENTRY_DSN=<sentry-mobile-dsn>
EXPO_PUBLIC_SENTRY_ENVIRONMENT=production
EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Web (Vercel)

```env
NEXT_PUBLIC_API_URL=https://api.vaultlore.app/v1
NEXT_PUBLIC_SENTRY_DSN=<sentry-web-dsn>
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```
