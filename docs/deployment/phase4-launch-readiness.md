# Phase 4 Deployment + Hardening Report

## Completed in Repository

- Railway API and worker deployment runbooks with exact root/build/start commands
- Vercel web deployment runbook with exact build/env settings
- API hardening:
  - env-driven CORS allowlist
  - global rate limiting
  - stricter auth and password reset limits
  - upload endpoint rate limit
- Monitoring:
  - API Sentry initialization + global Fastify error capture
  - Worker Sentry initialization + failed job capture
  - Mobile Sentry initialization (DSN-gated)
  - Web Sentry initialization (DSN-gated)
- Public legal/support surfaces:
  - `/privacy`, `/terms`, `/support` on web
  - mobile support/legal screen now opens live URLs
- Release readiness scaffolding:
  - store metadata template
  - release asset checklist
  - app review compliance checklist
- Production smoke test script:
  - `scripts/smoke-production.ps1`

## Hardening Validation

- Password reset tokens are one-time use (`usedAt` enforced)
- Auth/password reset/upload endpoints now rate-limited
- Upload file type and size validation remains enforced
- Delete-account flow untouched and still active in auth routes
- No fake-success behavior added in auth/password-reset paths

## Blockers (External Authentication Required)

The following could not be executed from this machine because platform login is required:

- `railway whoami` -> unauthorized (`railway login` required)
- `vercel whoami` -> no credentials (`vercel login` required)

Because of this, live deployment URLs cannot be generated automatically in this run.

## Immediate Command Sequence to Finish Live Deploy

```bash
railway login
railway init
railway service create vaultlore-api
railway service create vaultlore-worker
railway up --service vaultlore-api
railway up --service vaultlore-worker

cd apps/web
vercel login
vercel link
vercel --prod
```

Then run production smoke test:

```powershell
pwsh ./scripts/smoke-production.ps1 -ApiBaseUrl "https://api.vaultlore.app/v1" -Email "smoke+1@vaultlore.app" -Password "Password123!" -FrontImagePath "./fixtures/front.jpg"
```
