# JP Laagan MotoPOS — PHP / MySQL edition (InfinityFree)

This is a from-scratch PHP + MySQL reimplementation of JP Laagan MotoPOS,
built specifically to run on **InfinityFree** (or any PHP/MySQL shared
host) — no Node.js, no build step, no Composer, no SSH required. Everything
is plain PHP 7.4+/8.x, PDO, and vanilla JavaScript, uploaded as-is via FTP.

> The original Next.js/Prisma version lives at the repo root. This folder
> is a **separate, independent app** with the same features, rebuilt for a
> PHP-only host. Pick whichever matches where you're deploying.

## Features

Same feature set as the Next.js version: role-based Point of Sale (Owner/
Admin + Cashier), inventory with audited stock movements, sales history
with void/restock, dashboard, configurable-range reports, user management,
and business settings — see the root `README.md` for the full feature list.

## Tech stack

| Layer | Choice |
|---|---|
| Language | PHP 7.4+ / 8.x, procedural + small functions, no framework |
| Database | MySQL / MariaDB via PDO (prepared statements throughout) |
| Auth | Native PHP sessions, `password_hash()`/`password_verify()`, CSRF tokens |
| Frontend | Server-rendered PHP for every admin page; the POS screen is a React app (`assets/js/pos-app.js`) |
| Styling | Self-hosted utility CSS (`assets/css/utilities.css`) — **zero external CDN dependencies**, works even if the visitor's network blocks third-party scripts |
| Charts | Dependency-free CSS bar chart (`includes/bar_chart.php`) — no JS charting library |

Nothing in this app calls out to an external service at runtime. That's a
deliberate choice for a free host: InfinityFree visitors get a fully
self-contained page every time, with no dependency on a CDN staying up.
That includes React itself — see [The POS screen: React, self-hosted](#the-pos-screen-react-self-hosted).

## Directory structure

```
php-app/
  config/
    config.sample.php   Template — copy to config.php and fill in your DB creds
    config.php           Gitignored — your real credentials (never commit this)
    db.php                PDO connection singleton
  includes/
    bootstrap.php         Single include for every page (config+db+helpers+auth)
    auth.php              Session login/logout, require_login()/require_role(), CSRF
    functions.php         format_currency(), redirect(), flash messages, JSON helpers
    header.php / footer.php   Shared sidebar/topbar layout
    bar_chart.php          Dependency-free CSS bar chart renderer
  assets/
    css/utilities.css       Self-hosted utility classes (layout, color, spacing)
    css/style.css            Buttons, inputs, cards, tables, print styles
    js/pos-app.js             The POS screen — a React app (fetch calls to api/*.php)
    js/vendor/                 Self-hosted React, ReactDOM, and htm (see LICENSES.md)
  api/                    JSON endpoints called by pos-app.js (products, categories,
                          brands, suppliers, settings, create_sale)
  auth/                   login.php, logout.php
  inventory/              Product CRUD, stock adjustments, categories/brands/suppliers
  pos/                    The POS screen
  sales/                  Sales history, detail, void
  reports/                Configurable-range reports
  users/                  User management (admin only)
  settings/               Business settings (admin only)
  dashboard.php           Admin dashboard
  index.php               Role-based landing redirect
  db/
    schema.sql             MySQL schema — import first
    seed.sql                Demo accounts + motorcycle parts catalog — import second
```

## Deploying to InfinityFree

### 1. Create your free account and database

1. Sign up at [infinityfree.com](https://infinityfree.com) and create a
   new hosting account (pick a free subdomain like
   `yourshop.infinityfreeapp.com`, or attach your own domain later).
2. In the control panel, open **MySQL Databases** and create a new
   database. InfinityFree will show you:
   - a **database name** (prefixed like `if0_12345678_motopos`)
   - a **username** (usually the same prefix, e.g. `if0_12345678`)
   - a **hostname** (something like `sql200.infinityfree.com` — **not**
     `localhost`; use exactly what the panel shows)
   - the **password** you set
   Write these four values down — you'll need them in step 4.

### 2. Import the database schema

1. From the control panel, open **phpMyAdmin** for your new database.
2. Use the **Import** tab to import `db/schema.sql` first.
3. Then import `db/seed.sql` (adds the demo accounts and a 32-product
   motorcycle parts catalog so you have something to click through
   immediately).

### 3. Upload the files

1. Get your FTP credentials from the control panel (**FTP Accounts**), or
   use the browser-based **Online File Manager**.
2. Upload the **contents** of this `php-app/` folder (not the folder
   itself) into your account's `htdocs/` directory — `index.php`,
   `config/`, `includes/`, `assets/`, `api/`, `auth/`, `inventory/`, `pos/`,
   `sales/`, `reports/`, `users/`, `settings/`, `dashboard.php`, `db/` all
   go directly inside `htdocs/`.
   - FileZilla (FTP) is the fastest way to upload this many files. The
     Online File Manager works too but is slower for a full-folder upload.

### 4. Configure your database credentials

1. In `htdocs/config/`, duplicate `config.sample.php` as `config.php`
   (upload it under that new name — `config.php` is not included in this
   repo on purpose, since it holds real credentials).
2. Edit `config.php` and fill in the four values from step 1:
   ```php
   define('DB_HOST', 'sql200.infinityfree.com');   // your real host
   define('DB_NAME', 'if0_12345678_motopos');
   define('DB_USER', 'if0_12345678');
   define('DB_PASS', 'your-real-password');
   ```
3. Set `BASE_URL` to match exactly where you uploaded the app:
   - Uploaded straight into `htdocs/` (root): `define('BASE_URL', '');`
   - Uploaded into a subfolder, e.g. `htdocs/motopos/`:
     `define('BASE_URL', '/motopos');`

### 5. Go live

Visit your site. You should land on the login page. Sign in with:

- **Owner/Admin** — `admin` / `admin123`
- **Cashier** — `cashier` / `cashier123`

**Change these before real use** — see [Security Notes](#security-notes).

### Enable HTTPS

In the control panel, open **SSL Certificates** and enable the free
AutoSSL certificate for your domain/subdomain. It's free and takes a few
minutes to provision. Do this before entering real passwords or taking
real sales.

## Local development / testing

You don't need InfinityFree to work on this locally — any PHP 7.4+ with
the `pdo_mysql` extension and a MySQL/MariaDB server works:

```bash
# from php-app/
cp config/config.sample.php config/config.php   # edit with your local DB creds
mysql -u root -e "CREATE DATABASE motopos CHARACTER SET utf8mb4;"
mysql -u root motopos < db/schema.sql
mysql -u root motopos < db/seed.sql
php -S 127.0.0.1:8000
```

Then visit `http://127.0.0.1:8000/auth/login.php`.

## Architecture notes

- **No ORM.** Every query is a hand-written PDO prepared statement. This
  keeps the app runnable on hosts with no Composer/SSH access — there's
  nothing to `composer install`.
- **Real MySQL enums.** Unlike the SQLite-compatible Prisma schema at the
  repo root (which uses plain strings for portability), this schema uses
  native MySQL `ENUM` columns for `role`, `payment_method`, `status`, etc.,
  since MySQL supports them natively and there's no cross-database
  portability constraint here.
- **Sale creation is transactional.** `api/create_sale.php` locks each
  product row (`SELECT ... FOR UPDATE`) inside a transaction before
  decrementing stock, so two cashiers can't oversell the last unit of a
  product at the same time.
- **CSRF protection** on every state-changing form and API call, via a
  per-session token checked with `hash_equals()`.
- **Stock is never edited directly.** Every quantity change — initial
  receive, manual adjustment, sale, void/return — is written to
  `stock_movements` with who did it and why, mirroring the audit trail in
  the Next.js version.

### The POS screen: React, self-hosted

The POS screen (`pos/index.php` + `assets/js/pos-app.js`) is a React app —
it's the one page in this admin-panel-style app where the UI genuinely
needs live, reactive state (cart contents, quantities, running totals,
modal flow) rather than a page reload per action. The rest of the app
stays plain server-rendered PHP, since that's a better fit for CRUD forms
and tables.

To keep the "zero external runtime dependency" rule intact, React,
ReactDOM, and [htm](https://github.com/developit/htm) (a ~600-byte tagged-
template library that gives JSX-like syntax without needing Babel or any
build step) are **vendored as static files** in `assets/js/vendor/` rather
than loaded from a CDN — see `vendor/LICENSES.md` for exact versions and
how to update them. The PHP backend doesn't know or care that the POS
screen is React; it's still just JSON endpoints under `api/`, the same
ones a plain `fetch()` call would use.

No Node.js runs on the server anywhere in this app — React only runs in
the visitor's browser, same as any other JavaScript. Nothing here requires
(or benefits from) a Node.js backend, which InfinityFree can't run anyway.

### Responsive, closable navigation

The dark sidebar (`includes/header.php`) is desktop/laptop-only (shown at
768px viewport width and up). Below that — phones and portrait tablets —
it's replaced by a hamburger button that opens a closable slide-in drawer
with the same role-filtered links, a backdrop that closes it on tap, an
Escape-key handler, and 44px-minimum touch targets throughout for
Android/iOS. It auto-closes if the viewport is resized back to desktop
width (e.g. rotating a tablet) so it can never get stuck open behind the
desktop sidebar. No JS framework — a ~50-line inline script using
`classList` toggles, consistent with the rest of the app's plain-PHP pages.

This surfaced a real cross-browser CSS bug worth noting: `utilities.css`
loads before `style.css`, so at equal specificity a component class like
`.btn-ghost` (which sets its own `display`) was silently beating the
`.md\:hidden` / `.flex` responsive utilities on any element carrying both
— the hamburger button stayed visible at desktop widths until this was
fixed. All display-setting utilities (`.hidden`, `.flex`, `.grid`,
`.block`, `.inline-flex`, and their `sm:`/`md:` variants) now carry
`!important` so they're always authoritative over component styles,
regardless of stylesheet load order.

### Closable POS cart panel (mobile/tablet)

The same "unusable below desktop width" problem existed on the POS screen
itself: the cart (`CartPanel`) was a permanently-visible sidebar column in
a `grid-cols-1 lg:grid-cols-[1fr_360px]` layout, which meant on anything
narrower than the `lg` breakpoint (1024px — phones, Android tablets, and
portrait iPads) it either got squeezed unusably narrow or pushed below the
fold entirely, with no way to reach "Charge" without scrolling past the
whole product catalog.

`assets/js/pos-app.js` now tracks viewport width with a small
`useIsDesktop(1024)` hook (plain `window.innerWidth` + a resize listener,
not a CSS media query — see below for why) and renders two different cart
experiences from the same `CartPanel` component:

- **≥1024px (laptop/desktop):** unchanged — the cart stays inline as a
  sticky sidebar column, exactly as before.
- **&lt;1024px (phone/Android/portrait &amp; landscape tablet up to
  1024px):** the cart is hidden until there's something in it, at which
  point a floating "View Cart · *n* · ₱*total*" button appears
  (bottom-right, reserving space below the product grid so it never
  overlaps the last row of cards). Tapping it opens the cart as a
  full-screen slide-in drawer with a backdrop (tap to close), an explicit
  × close button, and the same increment/decrement/remove/checkout flow as
  the desktop sidebar. The drawer auto-closes if the viewport is resized
  back to desktop width, same as the nav drawer.

**A second, more serious layout bug was caught while testing this at a
real 390px mobile viewport** (all earlier POS testing had only used
desktop-sized Playwright viewports, so this was the first time the page
had actually been rendered narrow): the product grid
(`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4`) computed
`grid-template-columns: 0px 0px` and rendered every card as a ~26px sliver
of overlapping text. Root cause was in `utilities.css`: a stray,
non-media-gated copy of `.lg\:grid-cols-\[1fr_360px\]` sat right after the
base `.grid-cols-1` rule, outside any `@media` block, so the cascade
applied it unconditionally on *every* viewport width, not just `≥1024px`
— the correctly media-gated copy further down the file never got a chance
to matter. That silently forced the outer POS layout grid into a two-track
`1fr 360px` template even on a 390px-wide screen with only one grid item
present, which starved the nested product grid down to zero available
width. Deleting the orphaned unconditional rule (keeping only the
`@media (min-width: 1024px)`-gated one) fixed it — confirmed via computed-style
inspection (`grid-template-columns` now correctly resolves to two even
tracks at mobile widths) and a full 6-viewport Playwright pass (phone,
Android, portrait tablet, landscape tablet, laptop, desktop) with zero
console/page errors.

Desktop-vs-mobile cart rendering is driven by JS state
(`useIsDesktop`/`cartOpen`) rather than competing CSS display classes,
deliberately — the nav-drawer bug above was exactly this class of problem
(two rules of equal specificity fighting over `display`), and controlling
it in React state sidesteps that entire failure mode for the cart.

## Security notes

- Passwords are hashed with `password_hash()` (bcrypt). Sessions are
  server-side PHP sessions; no tokens are exposed to JavaScript beyond the
  CSRF token.
- **Change or remove the seeded `admin`/`cashier` demo accounts** before
  taking real sales — see Users → Edit, or create new accounts and delete
  the demo ones.
- Enable HTTPS (see above) before entering real credentials or processing
  real transactions — InfinityFree serves plain HTTP by default until you
  turn SSL on.
- `config.php` contains your live database password — it's gitignored
  here on purpose; never commit it if you fork this.

## Validation performed

- `php -l` (lint) clean on every file in this folder.
- Full local run against a real MariaDB instance: schema + seed import,
  then an end-to-end headless-browser pass covering admin login →
  dashboard → inventory (add/edit/delete product, categories/brands/
  suppliers) → POS (search, cart, checkout with tax/discount/change
  calculation, printable receipt) → stock correctly decremented → sales
  history → sale detail → reports (all date ranges) → user management →
  settings → cashier login correctly restricted to POS + own Sales
  History only.
- The React POS screen specifically: category filtering, add-to-cart with
  quantity clamping at available stock, increment/decrement/remove in the
  cart, a full checkout (payment method selection, discount, quick-cash
  buttons, change calculation) against the live API, and a printable
  receipt reflecting the actual payment method and totals returned by the
  server — verified with zero browser console errors.
- Not yet verified on InfinityFree's actual infrastructure (its specific
  PHP version, `open_basedir` restrictions, and MySQL host quirks can
  only be confirmed once deployed there) — the steps above are accurate
  for InfinityFree's documented setup, but if a specific file/API path
  behaves unexpectedly, check InfinityFree's PHP version in the control
  panel (**PHP Version selector**) and note any error your browser's
  console or InfinityFree's error log shows.

## Known InfinityFree constraints

- **No cron jobs on the free plan.** There's nothing here that needs one,
  but if you later add scheduled emails/reports, you'd need a paid plan or
  an external cron-ping service.
- **No SSH / Composer.** By design, nothing in this app needs either.
- **Execution time / resource limits** apply on shared free hosting.
  Normal shop-scale usage (a handful of registers, hundreds of sales/day)
  is well within free-tier limits; a busy multi-location operation would
  outgrow it.
