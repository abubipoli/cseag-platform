# CSEAG Website & Member Management System

This is the working implementation of the system defined in the CSEAG
System Requirements Specification (v1.0). It replaces cyberexpertgh.org and
teams.cyberexpertgh.org with a single, unified platform (see SRS Section 5).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4 (custom design
  tokens in `src/app/globals.css` — navy/teal brand palette, Inter font).
- **Drizzle ORM**, SQLite for local development, swappable to PostgreSQL for
  production in one file (`src/db/client.ts`).
- Custom JWT-based session auth (`src/lib/auth.ts`) — no third-party auth
  service, easy to audit.
- A pluggable notification layer (`src/lib/notifications/`) so the real
  email/SMS providers can be dropped in via environment variables with no
  code changes elsewhere.
- A small dependency-free UI kit (`src/components/ui/`) — buttons, cards,
  badges, form fields, tabs, drawers, stat cards, an icon set — used
  consistently across the public site, member portal, and admin back office.

## What's implemented

**Public website** — Home, About, What We Do, Contact, News, Events (with
RSVP capture), Resources (with member-only gating), Expert Directory, and
the membership application, all built on the shared design system with a
responsive mobile-first layout (SRS 6.1, 6.9).

**Membership application** (`/apply`) — a 4-step wizard (Account →
Professional Background → Bio & Documents → Review & Submit) with a CV/
certification upload, a honeypot field for basic bot resistance, and
immediate email + SMS acknowledgment (SRS 6.2, 6.3).

**Tiered approval workflow** (SRS 6.4) — applicants get a limited account on
submission; a reviewer/admin approves, rejects, or requests more info from
`/admin/applications`; approval upgrades them to full member status and
fires the approval notification automatically.

**Member self-service portal** (`/dashboard`) — a tabbed, mobile-first
profile (Overview, My Profile, Public Visibility, Resources) with a live
preview of exactly what the public Experts profile will look like before
saving (SRS 6.5, 6.6). Self-service password reset via emailed link
(`/forgot-password`, `/reset-password`).

**Public profile visibility controls** (SRS 6.6) — per-field public/private
toggles; sensitive fields (DOB, national ID, address) are never exposed to
the control and can never be made public.

**Public expert directory** (`/experts`) with search by name/expertise, a
profile page, and a "contact this expert" relay form that emails the member
without ever exposing their address to the visitor (SRS 6.8).

**Admin back office** (`/admin`) — a full member-management system with a
sidebar shell:

- **Dashboard** — member/application counts, recent activity feed.
- **Applications** — tabbed review queue (Pending/Approved/Rejected/All)
  with a detail drawer, decision notes, and the supporting document link.
- **Members** — searchable/filterable table; a detail drawer to change
  role, membership category, deactivate/reinstate, or reset a member's
  password on their behalf (emails a temporary password).
- **Content** — CRUD for News, Events, Resources, and static Pages, with
  slugs, draft/published status, event date/location, and file attachments
  for resources (member-only or public) — no developer required (SRS 6.9).
- **Communications** — a targeted/bulk broadcast composer (email/SMS/both,
  by audience) and a centralized notification log with a manual resend for
  failed deliveries (SRS 6.3, 6.10).
- **Reports** — CSV export of members and applications (SRS 6.7).
- **Audit Log** — every admin action, who did it, and when (SRS 6.7, 7.1).

**Content-backed public pages** — News, Events (with RSVP), and Resources
are all driven by the same content items the admin CMS manages, so nothing
is hard-coded.

An audit log records every application decision, profile change, and admin
action.

## What's intentionally stubbed, pending your input (see SRS Section 12)

- **Email/SMS providers**: wired to a console fallback (logs instead of
  sending) until real credentials are set. Adapters already exist for SMTP
  (any provider), Arkesel, and mNotify — tell us which you use and we'll
  wire the real one in `src/lib/notifications/index.ts` and remove the
  fallback.
- **Payments/dues** (SRS 6.11): not built, per the SRS scope.
- **Production database**: SQLite locally; needs a real Postgres instance
  and `DATABASE_URL` for production (two-line change, see `src/db/client.ts`).
- **File storage**: uploads currently save to `public/uploads` on local
  disk, which is fine for a single-instance deployment but won't survive a
  redeploy or scale across instances — swap `src/app/api/uploads/route.ts`
  for an S3-compatible bucket before going to production.
- **CAPTCHA**: the public forms (apply, contact, expert-contact, RSVP) use a
  hidden honeypot field for basic bot resistance rather than a third-party
  CAPTCHA service (which needs a site key) — swap in hCaptcha/Turnstile if
  bot traffic becomes a problem.
- **MFA**: the SRS recommends multi-factor authentication for admin
  accounts; not yet implemented — flag if you want this prioritized next.

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
seeded admin at `/login` and manage the application from `/admin`.

## Project structure

```
src/
  app/
    (site)/            Public site + member portal (shares one header/footer)
      page.tsx, about/, what-we-do/, contact/, news/, events/, resources/,
      experts/, apply/, login/, forgot-password/, reset-password/,
      dashboard/
    admin/              Back office (its own sidebar shell, no public chrome)
      page.tsx (dashboard), applications/, members/, content/,
      communications/, reports/, audit-log/
    api/                Route handlers for everything above
  components/
    ui/                 Design-system primitives (Button, Card, Badge, …)
    admin/              AdminShell (sidebar + topbar)
    marketing/          PageHero and other public-site building blocks
    SiteHeader/Footer, HeaderMobileMenu, NewsletterForm, LogoutButton
  db/                   Drizzle schema, client, migration + seed scripts
  lib/
    auth.ts             Password hashing, JWT sessions, role checks, password reset
    audit.ts            Audit log helper
    validation.ts       Zod schemas for every form/API input
    constants.ts        Shared lists + SITE_CONFIG (single source of truth
                         for contact details, per SRS 6.1)
    csv.ts              CSV export helper
    base-url.ts         Absolute-URL helper for server-side same-app fetches
    notifications/      Pluggable email/SMS layer + templates
```

## Deployment

Any Node.js host works (Render, Railway, a VPS, etc.). Before going live:

1. Set `DATABASE_URL` to a managed Postgres instance and switch
   `src/db/client.ts` to the Postgres driver (commented block already there).
2. Set `SESSION_SECRET` to a fresh random value in the production
   environment (never reuse the one in `.env.local`).
3. Set the real `SMTP_*` and `SMS_*` environment variables once providers
   are confirmed.
4. Swap the local-disk file uploads (`src/app/api/uploads/route.ts`) for an
   S3-compatible bucket.
5. Point the domain(s) at the new deployment and retire the old WordPress
   site and portal per the SRS Section 10 migration plan — including the
   urgent malware clean-up on the current cyberexpertgh.org described in the
   SRS before decommissioning it.
