# Local Development

## Prerequisites

- Docker Desktop
- pnpm
- Node.js 20+

The scripts support both Docker Compose command styles: `docker compose` and `docker-compose`.

## Bootstrap

1. Copy `.env.example` to `.env`.
2. Run `pnpm install`.
3. Run `pnpm local:up`.

`pnpm local:up` will:
- Start Postgres and Redis via `docker-compose.local.yml`
- Run Drizzle migrations
- Seed demo categories/cards/user data

## Run Services

- API: `pnpm dev:server`
- Worker: `pnpm dev:worker`
- Mobile: `pnpm dev:mobile`
- Web: `pnpm dev:web`

## Smoke Test

After API and worker are running, run:

- `pnpm smoke:api`

Or run a one-command orchestration that starts API and worker, runs smoke tests, and shuts both down:

- `pnpm smoke:local`

This validates:
- health endpoint
- demo login
- authenticated `users/me` and `collection`
- scan enqueue + poll until completed
- logout

## Default Demo Credentials

- Email: collector@vaultlore.app
- Password: Password123!

## Teardown

- Run `pnpm local:down`
