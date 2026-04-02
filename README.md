# VaultLore

VaultLore is a premium collector intelligence platform for scanning, valuing, organizing, and understanding collectible cards across sports, TCG, entertainment, and future categories.

## Workspace

- `apps/mobile`: Expo React Native app with Expo Router
- `apps/web`: Next.js companion web app and marketing surface
- `packages/shared`: domain models, schemas, and constants
- `packages/api-client`: typed fetch client for all frontend consumers
- `packages/ui`: cross-platform design tokens and UI primitives
- `server`: Fastify API, Drizzle ORM schema, and route modules
- `worker`: BullMQ-based background job processor
- `docs`: product, architecture, and launch planning

## Quick Start

1. Install `pnpm`.
2. Copy `.env.example` to `.env` and fill in secrets.
3. Run `pnpm install`.
4. Run `pnpm local:up` to start Postgres/Redis, apply migrations, and seed demo data.
5. Run `pnpm dev:server` and `pnpm dev:worker`.
6. Run `pnpm dev:web` or `pnpm dev:mobile`.
7. Run `pnpm smoke:api` to verify auth, collection, and worker-backed scan flow.
8. Run `pnpm smoke:local` for one-command server+worker startup, smoke verification, and teardown.

## Database Workflow

- Generate migration files: `pnpm db:generate`
- Apply migrations: `pnpm db:migrate`
- Seed demo data: `pnpm db:seed`

## Product Direction

VaultLore is designed as a mobile-first collector operating system with scan intelligence, collection management, market dashboards, lore-driven content, grading guidance, and premium subscriptions.
