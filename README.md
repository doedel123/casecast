# Call the Case

A mobile-first platform for public opinion forecasts on high-profile court
cases. Readers cast one free, irrevocable prediction per case, see the live
forecast only **after** voting, and can become members ($7.99/month) to track
their prediction history — with a transparently reported charitable donation
attached to membership revenue.

Built with Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui
(Base UI) · Drizzle ORM · Neon Postgres · Auth.js v5 · Stripe Billing ·
Cloudflare Turnstile · Vercel.

---

## Quick start

```bash
npm install
vercel env pull .env.local --yes   # DATABASE_URL (Neon) + AUTH_SECRET
npm run setup                      # drizzle-kit push + seed
npm run dev
```

The seed creates:

- an **admin user** — `admin@callthecase.local` (password printed to the
  terminal; override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars),
- the launch case *Commonwealth v. Lindsay Clancy* (open, featured,
  "Jury deliberating") with five verdict outcomes and sources,
- a partner charity and the default donation setting
  (**$1 per membership per month**).

## How the core mechanic works

1. `/` renders the featured case: neutral summary, sources, content note.
2. An anonymous visitor picks an outcome and hits **Cast my prediction**.
   A signed, httpOnly session cookie (`cc_sid`) is created server-side; the
   vote is stored against it with a salted IP hash (no plaintext IPs).
3. Results are **technically unreachable before voting**: the server only
   queries/serializes aggregates after finding the viewer's own vote
   (`components/case/case-experience.tsx`), and the JSON endpoint
   `GET /api/cases/[id]/results` returns **403** until then.
4. After the vote: animated result bars, percentages (largest-remainder
   rounding to 100), participant count, "updated just now", own vote
   highlighted — followed by the membership CTA.
5. Sign-up (`/signup`) links all anonymous votes from that device to the new
   account, then Stripe Checkout handles the $7.99/month subscription.
6. Votes are unique per case per account **and** per anonymous session,
   enforced by partial unique indexes — there is no update path (votes are
   final).

## Environment variables

See [.env.example](.env.example). Highlights:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres (auto-injected by the Vercel integration) |
| `AUTH_SECRET` | Auth.js JWT + anon-cookie signing + IP-hash salt |
| `STRIPE_SECRET_KEY` / `STRIPE_API_KEY` | Stripe secret key (either name works) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `STRIPE_PRICE_ID` | Optional — otherwise the app finds/creates the $7.99 price by lookup key |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (skipped when unset, e.g. local dev) |

## Stripe

The **Stripe Vercel Marketplace integration** is the intended path
(`vercel integration add stripe --no-claim` — requires accepting the
marketplace terms in the browser once). Any standard Stripe secret key works
too. Then:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook   # local
# set STRIPE_WEBHOOK_SECRET from the printed whsec_…
```

No dashboard product setup needed: the first checkout finds-or-creates the
`casecast_membership_monthly_799` price automatically. The customer portal
(`/api/stripe/portal`) powers "cancel anytime".

## Admin

`/admin` (role `admin`):

- create/edit cases, define outcomes & sources, set the phase label
  ("Jury deliberating"), pick the homepage feature,
- open/close voting instantly; record the official verdict to resolve a case
  (most serious verdict controls on mixed counts),
- manage charity, donation model (fixed $/membership, % of revenue, or 100%
  of net proceeds) and publish donation reports for `/impact`,
- review vote clusters by salted IP hash, and read the full audit log.

Every admin mutation is written to `admin_audit_log`.

## Data model

`users`, `anonymous_sessions`, `cases`, `case_outcomes`, `case_sources`,
`votes`, `subscriptions`, `charities`, `donation_reports`,
`case_resolutions`, `admin_audit_log` — plus `site_settings` (donation
config) and `case_follows` (member feature). Schema:
[lib/db/schema.ts](lib/db/schema.ts).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run setup` | `db:push` + `db:seed` |
| `npm run db:push` | Apply schema to the database (uses unpooled URL) |
| `npm run db:seed` | Idempotent seed (safe to re-run) |
| `npm run db:studio` | Drizzle Studio |

## Deploying

Production runs at **callthecase.com**. The project is linked to Vercel
(`casecast` on the `waterloosvercel` team) with Neon env vars already set for
production/preview/development; pushes to `main` deploy production
automatically. Manual deploys:

```bash
vercel deploy          # preview
vercel deploy --prod   # production
```

After the first deploy, add `STRIPE_WEBHOOK_SECRET` (webhook endpoint
`https://<domain>/api/stripe/webhook`) and the Turnstile keys.

## Editorial guardrails (built in)

- Presumption of innocence language on every surface; questions ask what a
  court *will decide*, never what a person *did*.
- 80-word summary limit enforced in the admin form; sources + "updated" date
  on every case; content notes for violence/children/mental illness.
- Membership never weights votes and there are no prizes — stated on
  `/membership` and in the terms.
- No open commenting: discussion on case pages is a curated, moderated
  teaser (`case_comments`) with no public write path. Donation claims are
  concrete, configurable, and reported on `/impact`; no tax-deductibility
  claims.
- The legal pages are solid MVP drafts — have counsel review before a real
  public launch.
