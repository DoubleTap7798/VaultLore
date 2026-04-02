# Vercel Web Deployment (Production Companion)

## Project Setup

1. Install and login:
```bash
npm install -g vercel
vercel login
```
2. Link project:
```bash
cd apps/web
vercel link
```

## Build Settings

- Framework: Next.js
- Root Directory: `apps/web`
- Install Command:
```bash
pnpm install --frozen-lockfile
```
- Build Command:
```bash
pnpm --filter @vaultlore/web build
```
- Output Directory: `.next`

## Environment Variables (Vercel)

```env
NEXT_PUBLIC_API_URL=https://api.vaultlore.app/v1
NEXT_PUBLIC_SENTRY_DSN=<sentry-web-dsn>
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Deploy Commands

```bash
cd apps/web
vercel --prod
```

## Domain Plan

- Web app: `app.vaultlore.app` (Vercel)
- API: `api.vaultlore.app` (Railway)
- Marketing site (future): `www.vaultlore.app` (can be same Vercel project or separate)

## Verification

```bash
curl https://app.vaultlore.app
curl https://app.vaultlore.app/privacy
curl https://app.vaultlore.app/terms
curl https://app.vaultlore.app/support
```

Confirm web app loads and links to API environment correctly.
