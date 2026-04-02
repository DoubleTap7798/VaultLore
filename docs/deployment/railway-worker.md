# Railway Worker Deployment (Production)

## Service Creation

```bash
railway service create vaultlore-worker
railway service vaultlore-worker
```

## Service Settings

- Root Directory: `worker`
- Builder: Nixpacks
- Build Command:
```bash
pnpm install --frozen-lockfile; pnpm --filter @vaultlore/worker build
```
- Start Command:
```bash
node worker/dist/index.js
```
- Healthcheck: disabled (long-running worker)
- Restart Policy: always

## Required Environment Variables (Worker)

```env
NODE_ENV=production
DATABASE_URL=<railway-postgres-connection-string>
REDIS_URL=<railway-redis-connection-string>
GOOGLE_CLOUD_VISION_KEY=<optional-vision-key>
SENTRY_DSN_WORKER=<sentry-worker-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

Use same Postgres + Redis backing resources as API service.

## Deploy

```bash
railway up --service vaultlore-worker
```

## Worker Verification Checklist

1. Worker logs show startup banner:
   - `VaultLore worker online`
2. Worker logs include queue names:
   - `card-scan`, `comp-refresh`, `alert-notification`
3. Submit scan upload via API.
4. Verify worker log shows completed scan job.
5. Verify `jobs_log` row transitions `queued -> processing -> completed`.
6. Trigger alert queue item and verify Expo push API request succeeds.
7. Trigger forgot-password and verify email provider logs/sends successfully.

## SQL Proof Commands

```sql
select queue_name, status, job_type, processed_at, created_at
from jobs_log
order by created_at desc
limit 20;
```
