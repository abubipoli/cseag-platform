# CSEAG Website & Member Management System

This is the working implementation of the system defined in the CSEAG
System Requirements Specification (v1.0). It replaces cyberexpertgh.org and
teams.cyberexpertgh.org with a single, unified platform (see SRS Section 5).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Drizzle ORM**, SQLite for local development, swappable to PostgreSQL for
  production in one file (`src/db/client.ts`) — chosen over Prisma because
  Prisma's engine-binary CDN was unreachable in the sandboxed build
  environment this project started in; Drizzle has no such dependency.
- Custom JWT-based session auth (`src/lib/auth.ts`) — no third-party auth
  service, easy to audit.
- A pluggable notification layer (`src/lib/notifications/`) so the real
  email/SMS providers can be dropped in via environment variables with no
  code changes elsewhere.

## What's implemented

- Public marketing pages (home).
- Online membership application form (`/apply`) with immediate email + SMS
  acknowledgment (SRS 6.2, 6.3).
- Tiered approval workflow (SRS 6.4): applicants get a limited account on
  submission; an admin/reviewer approves, rejects, or requests more info from
  `/admin`; approval upgrades them to full member status and fires the
  approval notification automatically.
- Member self-service dashboard (`/dashboard`) to edit profile info.
- **Per-field public/private visibility toggles** on the dashboard — members
  choose exactly what appears on their public Experts profile. Sensitive
  fields (DOB, national ID, address) are never exposed to this control; they
  simply cannot be made public (SRS 6.6).
- Public expert directory (`/experts`) with search by name/expertise, backed
  by an API that only returns fields the member marked public.
- An audit log recording every application decision and profile change.

## What's intentionally stubbed, pending your input (see SRS Section 12)

- **Email/SMS providers**: wired to a console fallback (logs instead of
  sending) until real credentials are set. Adapters already exist for SMTP
  (any provider), Arkesel, and mNotify — tell me which you use and I'll wire
  the real one in `src/lib/notifications/index.ts` and remove the fallback.
- **Payments/dues** (SRS 6.11): not built, per the SRS scope.
- **Production database**: SQLite locally; needs a real Postgres instance
  and `DATABASE_URL` for production (two-line change, see `src/db/client.ts`).
- **File uploads** (CVs, certification proof, profile photos): not yet
  implemented — needs a storage target (e.g. S3-compatible bucket) to be
  chosen.

## Getting started locally

```bash
npm install
cp .env.example .env.local   # then fill in SESSION_SECRET at minimum
npx tsx src/db/migrate.ts    # creates the local SQLite database

# create the first admin account:
SEED_ADMIN_EMAIL=you@cyberexpertgh.org SEED_ADMIN_PASSWORD=ChangeMe123! npx tsx src/db/seed.ts

npm run dev
```

Visit http://localhost:3000 — apply as a test applicant, then log in as the
seeded admin at `/login` and approve the application from `/admin`.

## Project structure

```
src/
  app/                 Pages and API routes (Next.js App Router)
  components/          Shared UI (header, footer)
  db/                  Drizzle schema, client, migration + seed scripts
  lib/
    auth.ts            Password hashing, JWT sessions, role checks
    audit.ts           Audit log helper
    validation.ts      Zod schemas for every form/API input
    constants.ts       Shared lists (areas of expertise, categories)
    notifications/     Pluggable email/SMS layer + templates
```

## Deployment

Any Node.js host works (Render, Railway, a VPS, etc.). Before going live:

1. Set `DATABASE_URL` to a managed Postgres instance and switch
   `src/db/client.ts` to the Postgres driver (commented block already there).
2. Set `SESSION_SECRET` to a fresh random value in the production
   environment (never reuse the one in `.env.local`).
3. Set the real `SMTP_*` and `SMS_*` environment variables once providers
   are confirmed.
4. Point the domain(s) at the new deployment and retire the old WordPress
   site and portal per the SRS Section 10 migration plan — including the
   urgent malware clean-up on the current cyberexpertgh.org described in the
   SRS before decommissioning it.
