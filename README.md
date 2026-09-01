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
| Database       | SQLite via Prisma ORM (zero-setup; Postgres-ready) |
| Auth           | NextAuth (Credentials provider, JWT sessions)      |
| Validation     | Zod                                                |
| Charts         | Recharts                                           |

### Why this stack

Next.js gives one codebase for both the UI and the API (no separate backend
service to deploy/scale). SQLite + Prisma means the system runs anywhere with
zero external services for a single-shop deployment, while the schema is
written so switching to Postgres for multi-terminal/concurrent use is a
one-line change (see [Scaling to Postgres](#scaling-to-postgres)).

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
- SQLite has no native enum type, so `Role`, `PaymentMethod`, `MovementType`,
  and `SaleStatus` are plain strings constrained by Zod at the API boundary
  and by shared TypeScript unions in `lib/types.ts`. Switching to Postgres
  lets you promote these back to real enums if desired (optional).

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

### Setup

```bash
npm install
cp .env.example .env        # then set NEXTAUTH_SECRET (openssl rand -base64 32)
npx prisma db push          # creates prisma/dev.db from the schema
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

### Option A — Docker (recommended for a shop's own server/VPS)

```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" > .env
docker compose up -d --build
```

This builds the app, runs the schema migration and demo seed automatically on
first boot (via `docker-entrypoint.sh`), and persists the SQLite database in
a named Docker volume (`motopos-data`) so it survives container restarts and
image rebuilds. Set `NEXTAUTH_URL` in `docker-compose.yml` to your real
domain (e.g. `https://pos.yourshop.com`) once you put it behind a reverse
proxy/HTTPS (Caddy, Nginx, or Cloudflare Tunnel all work well).

### Option B — Vercel + hosted Postgres

Next.js deploys natively to Vercel, but Vercel's filesystem is ephemeral so
SQLite won't persist there — switch to Postgres first (see below), then:

1. Push this repo to GitHub and import it in Vercel.
2. Set env vars in the Vercel project: `DATABASE_URL` (your Postgres
   connection string, e.g. from [Neon](https://neon.tech) or
   [Supabase](https://supabase.com)), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
   (your production URL).
3. Run `npx prisma db push && npm run db:seed` once locally against the
   production `DATABASE_URL` to initialize the schema and demo data (or
   write your own seed for real shop data).
4. Deploy.

### Scaling to Postgres

The schema was written to make this a small change when a shop grows to
multiple concurrent terminals (SQLite serializes writes, which is fine for
1–2 registers but not many):

1. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. Point `DATABASE_URL` at your Postgres instance.
3. `npx prisma db push` (or set up `prisma migrate` for versioned migrations).

No application code changes are required — the `role`/`paymentMethod`/etc.
string columns work identically on Postgres (and can optionally be promoted
to real Postgres enums later).

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
- `npm run build` — production build succeeds.
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
