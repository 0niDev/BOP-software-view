# BOP Software View

Read-only executive view of the BOP Nutraceuticals ERP. A React (Vite + TypeScript) single-page app that queries a [SQLite Cloud](https://sqlitecloud.io) database over its **Weblite HTTP/JSON REST API** and deploys to **GitHub Pages**.

The viewer is intentionally read-only: it never inserts, updates or deletes records, and it never selects password hashes or salts.

## Pages

| Route | Page |
|---|---|
| `#/` | Executive dashboard — today, month-to-date, cash/bank, trend, recent activity, alerts |
| `#/sales` | Sales invoices with line-item detail |
| `#/purchases` | Purchase invoices with line-item and batch detail |
| `#/parties` | Customers & suppliers, balances and running ledger |
| `#/items` | Catalogue, stock on hand, low stock and inventory value |
| `#/reports` | Trial balance, profit & loss, balance sheet, cash book, party ledger |
| `#/users` | Read-only user accounts (no password columns) |
| `#/roles` | Read-only role definitions and permission grants |
| `#/settings` | Read-only settings and keyboard shortcuts (sensitive values masked) |
| `#/audit` | Read-only audit log with entry detail |

Amounts are **PKR** (`en-PK` grouping, `Rs` prefix) and dates are **dd/MM/yyyy**.

## Stack

- **React 19 + Vite + TypeScript**
- **Tailwind CSS v4** — flat matte maroon design tokens, light/dark/system themes
- **TanStack Query** — fetching, caching, retry and background refresh
- **Recharts** — revenue vs expenses trend
- **Framer Motion** — page and drawer transitions (honours reduced motion)
- **Lucide React** — icons
- **gh-pages** — `npm run deploy` publishes `dist/` to the `gh-pages` branch

## Data layer

The browser talks directly to SQLite Cloud over HTTPS. There is no backend or socket.

- Endpoint: `POST {VITE_SQLITECLOUD_URL}` with `{ "sql": "...", "database": "..." }`
- Auth: `Authorization: Bearer <api key>`
- Response: `{ "data": [ ...rows ] }`
- Database: `main`

All SQL lives in `src/lib/queries/`. Values interpolated into SQL come from constants
or are passed through `safeId()`; no free-form user input is concatenated.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the three values
npm run dev                  # Vite prints the local URL
```

Required environment variables (in `.env.local`):

| Variable | Meaning |
|---|---|
| `VITE_SQLITECLOUD_URL` | Weblite SQL endpoint, e.g. `https://<project>.<zone>.sqlite.cloud/v2/weblite/sql` |
| `VITE_SQLITECLOUD_API_KEY` | SQLite Cloud API key |
| `VITE_SQLITECLOUD_DATABASE` | Database file name — `main` for this project |

> ⚠️ **Security:** the API key ships to the browser bundle and is readable by
> anyone who opens the site. Use a **read-only, least-privilege** key, rotate it
> if it has ever been committed, and never commit `.env.local`.

### Demo mode

Set `VITE_DEMO_MODE=1` to run the UI on the representative sample data in
`src/lib/demo.ts` — no network or credentials required. Unknown query shapes
fall back to an empty result rather than crashing.

## Theme

The app supports **light**, **dark** and **system** appearance. The chosen mode
is stored in `localStorage` under `bop-view.theme`. On a first visit the app
adopts the ERP’s `APPEARANCE.theme_name` setting; the first manual toggle
persists an explicit choice. An inline script in `index.html` applies the saved
theme before first paint to avoid a flash.

## Reports & accounting conventions

Reports follow the desktop ERP and `web/server`:

- **Trial balance** — opening side from `OPENING` vouchers; closing includes all posted lines
- **Profit & loss** — period side excludes `OPENING` vouchers
- **Balance sheet** — journal-derived up to an as-of date (the legacy `accounts.opening_balance` column is ignored)
- **Cash book** — cash (`1000`/`1020`) and bank (`1010`), excluding `OPENING`
- **Party ledger** — joins on `journal_entry_lines.party_id`; running balance signed by party type (customer: debit − credit, supplier: credit − debit)

## Build & deploy

```bash
npm run typecheck
npm run build
npm run deploy        # builds dist/ and pushes the gh-pages branch
```

Vite `base` is `/BOP-software-view/` to match the project Pages URL.

For CI deploys, use an action such as [`peaceiris/actions-gh-pages`](https://github.com/peaceiris/actions-gh-pages) with `publish_dir: ./dist`. The scheduled `keepalive` workflow pings SQLite Cloud every 6 hours to prevent auto-suspend; it reads `SQLITECLOUD_URL`, `SQLITECLOUD_API_KEY` and `SQLITECLOUD_DATABASE` from repository secrets.

## Project layout

```
src/
├── main.tsx              # entry, TanStack Query + HashRouter providers
├── App.tsx               # routes
├── index.css             # design tokens, light/dark, table and print styles
├── lib/
│   ├── sqlitecloud.ts    # typed Weblite REST client
│   ├── format.ts         # PKR and dd/MM/yyyy formatters
│   ├── theme.ts          # light/dark/system resolution
│   ├── types.ts          # view models
│   ├── demo.ts           # demo-mode query matchers and sample rows
│   └── queries/          # all SQL, grouped by domain
├── components/
│   ├── layout/           # sidebar and top bar
│   ├── dashboard/        # dashboard widgets
│   ├── ui/               # cards, tables, drawers, states, pills
│   ├── InvoiceListPage.tsx
│   └── ReadOnlyNotice.tsx
└── pages/                # one component per route above
```
