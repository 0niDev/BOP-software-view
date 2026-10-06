# BOP Software View

Executive dashboard for the BOP Nutraceuticals ERP — a React (Vite + TypeScript) single-page app that queries a [SQLite Cloud](https://sqlitecloud.io) database over its **Weblite HTTP/JSON REST API** and deploys to **GitHub Pages**.

## Stack

- **React 19 + Vite + TypeScript** — app framework and build tool
- **Tailwind CSS v4** — styling, dark theme with glassmorphism surfaces
- **TanStack Query** — data fetching, caching, retries, background refresh
- **Recharts** — sales vs purchases chart
- **Framer Motion** — page and card micro-interactions
- **Lucide React** — icons
- **gh-pages** — `npm run deploy` publishes `dist/` to the `gh-pages` branch

## Data layer

The app talks directly to SQLite Cloud over HTTPS (no backend, no sockets):

- Endpoint: `POST {VITE_SQLITECLOUD_URL}` with body `{ "sql": "...", "database": "..." }`
- Auth: `Authorization: Bearer <api key>`
- Response: `{ "data": [ ...rows ] }`

All SQL is read-only and lives in `src/lib/queries/`. Query parameters are
interpolated only from constants or fully-quoted numbers — there is no
user-input string concatenation.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the three values
npm run dev                  # http://localhost:5173
```

Required environment variables (in `.env.local`):

| Variable | Meaning |
|---|---|
| `VITE_SQLITECLOUD_URL` | Weblite SQL endpoint, e.g. `https://<project>.<zone>.sqlite.cloud/v2/weblite/sql` |
| `VITE_SQLITECLOUD_API_KEY` | SQLite Cloud API key |
| `VITE_SQLITECLOUD_DATABASE` | Database file name, e.g. `MainDatabase.sqlite` |

> ⚠️ **Security:** the API key ships to the browser in the bundle — anyone can
> read it. Use a **read-only, least-privilege** key, and rotate it if it has
> ever been committed. Never commit `.env.local`.

## Deploy to GitHub Pages

The Vite `base` is set to `/BOP-software-view/` to match the project Pages URL.

```bash
npm run deploy        # builds dist/ and pushes the gh-pages branch
```

For CI deploys, use [an action like `peaceiris/actions-gh-pages`](https://github.com/peaceiris/actions-gh-pages)
with `publish_dir: ./dist`. The scheduled `keepalive` workflow pings SQLite
Cloud every 6 hours to prevent auto-suspend; it reads the endpoint, key, and
database name from repository secrets (`SQLITECLOUD_URL`,
`SQLITECLOUD_API_KEY`, `SQLITECLOUD_DATABASE`).

## Project layout

```
src/
├── main.tsx              # entry, TanStack Query + HashRouter providers
├── App.tsx               # routes
├── index.css             # Tailwind theme tokens (desktop-app palette)
├── lib/
│   ├── sqlitecloud.ts    # typed Weblite REST client
│   ├── format.ts         # Intl formatters (₦, dates)
│   ├── types.ts          # view models
│   └── queries/          # all SQL, grouped by domain
├── components/           # layout, stat cards, badges, UI primitives
└── pages/                # dashboard, parties, inventory, invoices, reports
```

## Reports & accounting conventions

Reports mirror the desktop ERP's conventions:

- **Trial balance** — closing balances journal-derived; opening side = OPENING vouchers
- **Profit & Loss** — period side excludes `voucher_type = 'OPENING'`
- **Balance sheet** — journal-derived (the legacy `accounts.opening_balance` column is ignored)
- **Party ledger** — joins on `journal_entry_lines.party_id`, running balance signed by party type

See the workspace `AGENTS.md` for the full ERP data model.
