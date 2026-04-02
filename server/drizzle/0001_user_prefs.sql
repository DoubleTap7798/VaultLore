-- Add collector preference fields to users table.
-- Run: pnpm --filter @vaultlore/server db:migrate
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "collector_goals" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean DEFAULT false NOT NULL;
