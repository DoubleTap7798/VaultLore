# Railway API Deployment (Production)

## Service Creation

1. Install and login:
```bash
npm install -g @railway/cli
railway login
```
2. Create/select project:
```bash
railway init
railway link
```
3. Add service from repo root:
```bash
railway service create vaultlore-api
railway service vaultlore-api
```

## Service Settings

- Root Directory: `server`
- Builder: Nixpacks
- Build Command:
```bash
pnpm install --frozen-lockfile; pnpm --filter @vaultlore/server build
```
- Start Command:
```bash
pnpm --filter @vaultlore/server db:migrate; node server/dist/index.js
```
- Healthcheck Path: `/v1/health`
- Restart Policy: on-failure

## Required Environment Variables (API)

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=<railway-postgres-connection-string>
REDIS_URL=<railway-redis-connection-string>
JWT_SECRET=<64+ char random>
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30
EXPO_PUBLIC_API_URL=https://api.vaultlore.app/v1
NEXT_PUBLIC_API_URL=https://api.vaultlore.app/v1
RAILWAY_ENVIRONMENT=production
CORS_ORIGINS=https://app.vaultlore.app,https://www.vaultlore.app,https://vaultlore-mobile-web.vercel.app
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
STORAGE_SECRET_KEY=<r2-secret>
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

## Attach Datastores

```bash
railway add --database postgres
railway add --database redis
```

Then map connection vars in the API service:
```bash
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway variables set REDIS_URL='${{Redis.REDIS_URL}}'
```

## Deploy

```bash
railway up --service vaultlore-api
```

## Verification Commands

```bash
curl https://api.vaultlore.app/v1/health
curl -X POST https://api.vaultlore.app/v1/auth/register -H "content-type: application/json" -d '{"email":"smoke+1@vaultlore.app","password":"Password123!"}'
curl -X POST https://api.vaultlore.app/v1/auth/login -H "content-type: application/json" -d '{"email":"smoke+1@vaultlore.app","password":"Password123!"}'
```

## Upload Smoke Test

```bash
# ACCESS_TOKEN from /auth/login response
curl -X POST https://api.vaultlore.app/v1/uploads/card-scan \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "front=@./fixtures/front.jpg" \
  -F "back=@./fixtures/back.jpg" \
  -F "categoryHint=sports-cards"
```

Expected: `202` with `jobId`, `uploadId`, `status=queued`.
