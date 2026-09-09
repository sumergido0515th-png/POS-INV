# JP Laagan MotoPOS

A modern, web-based **Point of Sale and Inventory Management System** built for
motorcycle parts retailers. Role-based access separates day-to-day selling
(Cashier) from full business control (Owner/Admin).

## Features

**Point of Sale (Cashier + Admin)**
- Fast product search/filter by name, SKU, brand, or category
- Tap-to-add cart with live stock limits
- Discount, tax (configurable %), multiple payment methods (Cash, GCash, Card, Bank Transfer)
- Cash quick-amount buttons and automatic change calculation
- Printable receipt on completion

**Inventory Management (Admin only)**
- Full product CRUD: SKU, barcode, category, brand/compatibility, supplier, cost & selling price, unit, reorder level
- Categories, Brands, and Suppliers management
- Stock adjustments (receiving, manual +/- corrections) with a full audit trail per product
- Low-stock detection and alerts
- Soft-delete/deactivate for products with sales history (keeps historical reports accurate)

**Sales & Reporting (Admin sees all; Cashiers see their own)**
- Full sales history with date range and invoice search
- Sale detail view with reprintable receipt
- Void sale (Admin only) — automatically restores stock
- Dashboard: today's sales, revenue trend, top products, low-stock alerts, inventory value
- Reports page: configurable date range, best sellers, low-stock table

**Users & Settings (Admin only)**
- Create/edit/deactivate Owner/Admin and Cashier accounts
- Safeguards: can't delete/deactivate your own account, can't remove the last active Admin
- Business settings: name, address, contact info, tax rate, currency, receipt footer, low-stock threshold

## Tech Stack

| Layer          | Choice                                             |
|----------------|-----------------------------------------------------|
| Framework      | Next.js 14 (App Router, TypeScript, Server + API routes) |
| Styling        | Tailwind CSS                                       |
| Database       | Postgres via Prisma ORM (Neon, Supabase, Railway, or self-hosted) |
| Auth           | NextAuth (Credentials provider, JWT sessions)      |
| Validation     | Zod                                                |
| Charts         | Recharts                                           |

### Why this stack

Next.js gives one codebase for both the UI and the API (no separate backend
service to deploy/scale) and deploys natively to Vercel's free tier. Postgres
is the database because Vercel's serverless functions have an ephemeral
filesystem — a file-based database wouldn't survive between requests — and
free managed Postgres (Neon, Supabase) is a two-minute signup with no server
to manage. For quick local hacking without any external service, the schema
also works unmodified against SQLite (see [Local development](#local-development)).

## Architecture

```
app/
  (app)/                 Authenticated shell (sidebar + topbar layout)
    dashboard/            Admin dashboard — KPIs, revenue trend, low stock
    pos/                  Point of Sale screen (Cashier + Admin)
    inventory/            Product list, add/edit, stock adjustments
      catalog/             Categories / Brands / Suppliers management
    sales/                Sales history + sale detail/void
    reports/              Configurable-range sales & stock reports
    users/                User management
    settings/             Business & sales configuration
  api/                    REST-style route handlers (Next.js Route Handlers)
    auth/[...nextauth]/   NextAuth credentials login
    products/  brands/  categories/  suppliers/
    stock/adjust/         Stock movement endpoint (audit-logged)
    sales/                Sale creation (transactional stock decrement) + void
    users/  settings/  reports/summary/
  login/                 Public login page

components/              UI building blocks (POS cart, receipt, forms, nav)
lib/
  auth.ts                 NextAuth config (bcrypt password check, JWT/session)
  rbac.ts                  requireSession()/requireRole() guards for API routes
  prisma.ts                Prisma client singleton
  validations.ts           Zod schemas (shared by API routes)
  types.ts                 Role/PaymentMethod/MovementType/SaleStatus unions
prisma/
  schema.prisma            Data model
  seed.ts                  Demo data (2 users, 10 categories, 8 brands, 32 products)
middleware.ts             Route protection + Admin-only route gating
```

### Data model highlights

- **Product** stock quantity is never edited directly outside of `StockMovement`
  records — every change (initial receive, manual adjustment, sale, void/return)
  is logged with who did it and why, so stock counts are always auditable.
- **Sale** creation is a single Prisma transaction: it validates stock
  availability, computes subtotal/discount/tax/total from live settings,
  creates the `Sale` + `SaleItem` rows, decrements `Product.quantity`, and
  writes `StockMovement` rows — all or nothing.
- `Role`, `PaymentMethod`, `MovementType`, and `SaleStatus` are plain string
  columns rather than native Postgres enums — this keeps the schema portable
  to SQLite for local dev — constrained by Zod at the API boundary and by
  shared TypeScript unions in `lib/types.ts`. They could be promoted to real
  Postgres enums later if desired.

### Roles

| Role | Access |
|---|---|
| **Owner/Admin** | Everything: Dashboard, POS, Inventory, Sales History (all cashiers), Reports, Users, Settings |
| **Cashier** | Point of Sale, and Sales History scoped to their own transactions |

Enforcement happens at three layers: `middleware.ts` redirects Cashiers away
from Admin-only routes, every API route re-checks the role server-side via
`lib/rbac.ts` (never trust the client), and the sidebar/nav simply hides
links a role can't use.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Postgres connection string — the free tier from [Neon](https://neon.tech)
  or [Supabase](https://supabase.com) takes about two minutes to set up and
  needs no server of your own. (Or use SQLite for local-only hacking — see
  [Local development](#local-development).)

### Setup

```bash
npm install
cp .env.example .env        # paste your Postgres URL; set NEXTAUTH_SECRET (openssl rand -base64 32)
npx prisma db push          # creates the schema in your database
npm run db:seed             # demo users, categories, brands, products
npm run dev
```

Visit `http://localhost:3000` and sign in with:

- **Owner/Admin** — `admin` / `admin123`
- **Cashier** — `cashier` / `cashier123`

> Change these passwords (or the accounts entirely) before using this in a
> real shop — see [Security Notes](#security-notes).

### Useful scripts

```bash
npm run dev          # start dev server
npm run build         # typecheck + production build
npm run start         # run the production build
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
npm run db:push        # sync prisma/schema.prisma to the database
npm run db:seed        # (re)seed demo data
npm run db:studio      # Prisma Studio — browse/edit data visually
```

## Deployment

### Option A — Vercel + free Postgres (recommended, free)

This is the fastest path to a live URL and costs nothing at small-shop scale.

1. **Get a free Postgres database.** Sign up at [neon.tech](https://neon.tech)
   or [supabase.com](https://supabase.com), create a project, and copy the
   connection string it gives you (Neon: the "Connection string" on the
   project dashboard; Supabase: Project Settings → Database → Connection
   string → "URI", using the *pooled* connection on port 6543 if offered).
2. **Push this repo to your own GitHub account** (fork it or push this code
   to a new repo you own — Vercel deploys from a repo you control).
3. **Import it into Vercel.** Go to [vercel.com/new](https://vercel.com/new),
   sign in with GitHub, and import the repo. Vercel auto-detects Next.js —
   you don't need to change any build settings.
4. **Set environment variables** in the Vercel project (Settings →
   Environment Variables) before the first deploy:
   - `DATABASE_URL` — the Postgres connection string from step 1
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Vercel URL once assigned, e.g.
     `https://your-project.vercel.app` (you can add this after the first
     deploy and redeploy once you know the URL)
5. **Initialize the database.** From your machine, with `DATABASE_URL` in
   your local `.env` set to the *same* connection string:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
6. **Deploy** (Vercel does this automatically on every push to your default
   branch, or click "Deploy" in the dashboard).

Every subsequent `git push` redeploys automatically. To scale beyond the
free Postgres tier's connection limit under heavier concurrent load, switch
`DATABASE_URL` to a pooled connection string (both Neon and Supabase provide
one) — no code changes needed.

### Option B — Docker (for a shop's own server/VPS)

```bash
echo "DATABASE_URL=postgresql://..." >> .env   # any reachable Postgres — hosted or self-run
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
docker compose up -d --build
```

This builds the app and runs the schema migration and demo seed
automatically on first boot (via `docker-entrypoint.sh`). Set `NEXTAUTH_URL`
in your `.env` to your real domain (e.g. `https://pos.yourshop.com`) once
you put it behind a reverse proxy/HTTPS (Caddy, Nginx, or Cloudflare Tunnel
all work well). This path needs its own Postgres — either point it at the
same free Neon/Supabase instance from Option A, or run a `postgres:16`
container alongside it.

### Local development

For quick local hacking with zero external services, you can point the
schema back at SQLite instead of Postgres:

1. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "sqlite"        // was "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL="file:./dev.db"` in `.env`.
3. `npx prisma db push && npm run db:seed`.

No other code changes are needed either direction — remember to switch the
provider back to `"postgresql"` before deploying.

## Security Notes

- Passwords are hashed with bcrypt; sessions are signed JWTs (`NEXTAUTH_SECRET`
  must be a strong random value in production — never reuse the `.env.example`
  placeholder).
- All mutating API routes re-validate the caller's role server-side; the UI
  hiding a button is a convenience, not the security boundary.
- Change or remove the seeded `admin`/`cashier` demo accounts before going
  live, and put the deployment behind HTTPS.

## Validation & Testing Performed

- `npm run typecheck` and `npm run lint` — clean, no errors/warnings.
- `npm run build` — production build succeeds (validated against both the
  SQLite and Postgres datasource providers; `prisma validate`/`generate`
  clean on Postgres).
- End-to-end smoke test (headless browser) covering: Admin login → Dashboard →
  Inventory list → POS product search/add-to-cart → Checkout (tax/discount/
  change calculation) → completed sale → stock decrement reflected → Sales
  History → Reports → Users → Settings → Cashier login → Cashier correctly
  redirected away from Admin-only routes.

## Roadmap Ideas

- Barcode scanner integration (USB HID scanners already work today since
  the POS search box accepts raw barcode input + Enter)
- Purchase orders / supplier restocking workflow
- Per-terminal cash drawer / shift reconciliation
- CSV/Excel export for reports
- Multi-branch inventory
