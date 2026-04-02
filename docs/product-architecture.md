# VaultLore Product Architecture

## Core Principles

- Mobile-first product decisions
- API-first boundary between clients and services
- Flexible card model that supports sports, TCG, entertainment, and custom future categories
- Worker-backed asynchronous processing for scans, valuations, alerts, and subscription events
- Shared contracts between backend, web, and mobile
- Early app-store readiness including account deletion and restore purchases

## System Overview

- Mobile app: primary collector experience, scan flow, vault, watchlists, alerts
- Web app: premium marketing surface plus authenticated dashboard expansion
- API server: auth, card intelligence, collection, market, watchlist, notifications
- Worker: scan processing, comp refresh, alert dispatch, valuation jobs
- Postgres: transactional system of record
- Redis: queue and transient cache layer

## Domain Model Highlights

- `cards` stores normalized card identity across all categories
- `card_variants` stores parallels, print variants, language differences, and graded distinctions
- `subject_profiles` covers athletes, characters, franchises, and personalities with category-aware metadata
- `iconic_moments` powers the lore layer used on subject and card pages
- `user_cards` models ownership, grading, purchase data, and showcase state
- `comps` and `grading_estimates` support pricing intelligence and grade-smart features

## Delivery Priorities

1. Auth and onboarding
2. Collection vault and card detail experience
3. Scan pipeline and worker orchestration
4. Market dashboards and alerts
5. Premium monetization and store readiness
6. Expanded lore content and discovery systems
