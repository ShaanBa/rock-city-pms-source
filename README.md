# Rock City Motel Property Management System

A source-visible monorepo for a small-property staff dashboard, booking API, and public website.

This repository contains production-oriented business software, but the checked-in configuration and seed data are development examples. Do not expose the backend without configuring authentication, allowed origins, rate limits, and production secrets.

## Repository layout

- `backend/` — Fastify, Drizzle ORM, PostgreSQL, Stripe webhooks, and reservation APIs
- `frontend/` — React/Vite staff dashboard for a trusted on-site network
- `frontend-public/` — Next.js public website and direct-booking flow
- `scripts/motel/` — optional Windows/pm2 operations helpers
- `docker-compose.yml` — localhost-only development PostgreSQL

## Requirements

- Node.js 20.9 or newer
- npm
- Docker Compose or PostgreSQL 18
- Stripe test credentials for the booking payment flow

## Local setup

1. Copy `.env.example` to `.env` and replace every placeholder. Generate independent staff/import tokens with a cryptographically secure generator such as `openssl rand -hex 32`.
2. Copy `frontend/.env.example` to `frontend/.env` and use the same staff/import tokens.
3. Copy `frontend-public/.env.example` to `frontend-public/.env.local`.
4. Start PostgreSQL with `docker compose up -d`.
5. Install and initialize the backend:

   ```bash
   npm --prefix backend ci
   npm --prefix backend exec drizzle-kit migrate
   npm --prefix backend exec tsx src/db/run-seed.ts
   npm --prefix backend run dev
   ```

6. In separate terminals, start the two frontends:

   ```bash
   npm --prefix frontend ci
   npm --prefix frontend run dev -- --host

   npm --prefix frontend-public ci
   npm --prefix frontend-public run dev
   ```

Default development URLs are:

- Backend health: `http://localhost:3000/health`
- Staff dashboard: `http://localhost:5173`
- Public website: `http://localhost:3001`

## Security model

The backend deliberately separates three access tiers:

- Public: health, availability, quote, reservation creation, payment-intent creation, and the signed Stripe webhook
- Staff: reservation, room, room-stay, pricing, folio, manifest, and assignment operations using `STAFF_API_KEY`
- Service import: reservation import using a separate `IMPORT_API_KEY`

The Vite staff application sends these bearer tokens. Because Vite variables are visible in its browser bundle, the staff application must still remain on a trusted network; tokens do not replace network isolation or a future user-login system.

Set `CORS_ALLOWED_ORIGINS` to the exact public and staff origins. Requests with an unlisted browser origin are rejected. Public endpoints are schema-validated, size-limited, and rate-limited. Payment totals are loaded from the reservation database rather than accepted from the browser.

See [SECURITY.md](SECURITY.md) for reporting and deployment guidance.

## Environment variables

The authoritative templates are:

- `.env.example` — backend, database, email, CORS, authentication, and rate limits
- `frontend/.env.example` — staff API URLs and browser-side staff/import tokens
- `frontend-public/.env.example` — public API URL, Stripe publishable key, and booking pause flag

Never commit `.env` files, database dumps, private keys, or production runbooks.

## Verification

```bash
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend-public run lint
npm --prefix frontend-public run build
```

Backend integration tests require a migrated PostgreSQL database through `DATABASE_URL`.

## Rights

Copyright © 2026 Rock City Motel. All rights reserved.

The repository is publicly viewable for portfolio and review purposes. It is not open-source software and no permission is granted to use, copy, modify, distribute, sublicense, or deploy the code except where required by GitHub's Terms of Service. See [LICENSE](LICENSE).
