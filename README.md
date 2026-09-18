# violet-remora

Violet Remora is a Vue-based production monitoring ERP proof of concept for Intaglio Production.

The current application provides a read-only job-history lookup screen. It combines the static historical job database with the separately refreshed live 2026 schedule database and exposes the result through a small Express API.

> Current status: proof of concept. Job/process/machine-run/output recording, authentication, roles, and the operational ERP database have not been implemented yet.

## Current capabilities

- Vue 3 browser interface loaded from the CDN; no Vite installation is required.
- Search by full job card, batch number, or final four digits.
- Read-only Express API on port `3000`.
- Read-only access to:
  - historical job data from `job_history_2023_2025.sqlite`;
  - the refreshed live schedule database at `live_migration/data/output/live_schedule.sqlite`.
- Live schedule rows take precedence when the same normalized job card exists in both sources.
- Health, database ping, job lookup, and development schema-inspection endpoints.
- Safe live schedule refresh with source validation, row-count safeguards, SQLite transactions, SHA-256 source tracking, and verification scripts.

## Current architecture

```text
Browser
  │
  └── Express :3000
        ├── Serves index.html and src/
        ├── /api/v1/health
        ├── /api/v1/history/jobs
        ├── /api/v1/history/ping
        └── Read-only SQLite connections
              ├── Historical job history database
              └── Live schedule database
```

The preferred runtime path is same-origin: Express serves both the frontend and the API. The browser does not open SQLite files directly.

For remote access during the proof of concept:

```text
Browser → OAuth-protected ngrok HTTPS tunnel → 127.0.0.1:3000 → Express
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete runbook.

## Repository structure

| Path | Purpose |
| --- | --- |
| `index.html` | Browser entry point; loads Vue 3, the application stylesheet, and `src/main.js`. |
| `src/main.js` | Creates the Vue application. |
| `src/router.js` | Resolves the approved root page without adding a router package. |
| `src/pages/JobsPage.js` | Composes the job search screen. |
| `src/components/jobs/` | Search bar, result summary, and job table components. |
| `src/components/common/` | Reusable feedback component. |
| `src/state/jobsStore.js` | Owns job rows, search state, loading state, errors, and stale-request protection. |
| `src/services/` | API client and history service. |
| `src/utils/jobFormatters.js` | Job table columns and display formatting. |
| `src/styles/app.css` | Application styling and responsive layout. |
| `backend/package.json` | Node.js backend dependencies and scripts. |
| `backend/src/server.js` | Opens both databases and starts Express. |
| `backend/src/app.js` | Express middleware, static frontend serving, health route, API mounting, and error handling. |
| `backend/src/config.js` | Environment-variable configuration and database defaults. |
| `backend/src/db/history-db.js` | Read-only SQLite connections, schema inspection, and combined job lookup. |
| `backend/src/routes/history.routes.js` | History API routes and schema-inspection guard. |
| `live_migration/` | Workbook-to-live-SQLite importer, schema, reports, verification, and Python tests. |
| `PAGE_GUIDE.md` | Approved page and route responsibilities. |
| `COMPONENT_GUIDE.md` | Approved component and layer responsibilities. |
| `DEPLOYMENT.md` | Windows/on-prem deployment and operations runbook. |

## Requirements

The current proof of concept is intended for a Windows machine that can reach the internal production files.

- Node.js `22.5.0` or newer. The backend uses the built-in `node:sqlite` module.
- npm, included with Node.js.
- Python with the Windows `py` launcher, or `python`.
- Python package `openpyxl` for live schedule refreshes.
- Read access to the historical database and the live schedule workbook.
- A browser with internet access if Vue 3 has not been cached, because Vue is loaded from `https://unpkg.com/vue@3/dist/vue.global.prod.js`.

## Quick start on Windows

Run these commands from the repository root. Replace the repository path with the actual local checkout path.

```powershell
Set-Location 'X:\violet-remora'

node --version
npm --version
py --version

Set-Location .\backend
npm ci
Set-Location ..

py -m pip install --user -r .\live_migration\requirements.txt
```

Refresh and verify the live schedule database before starting the API:

```powershell
Set-Location 'X:\violet-remora'

py .\live_migration\scripts\import_live_schedule.py `
  --config .\live_migration\config.example.json

py .\live_migration\scripts\verify_live_database.py `
  .\live_migration\data\output\live_schedule.sqlite

py -m unittest discover `
  -s .\live_migration\tests `
  -p 'test_*.py'
```

Start the backend:

```powershell
Set-Location 'X:\violet-remora\backend'

$env:NODE_ENV = 'development'
$env:HOST = '127.0.0.1'
$env:PORT = '3000'
$env:HISTORY_DB_PATH = '\\192.168.0.254\Public\violet-remora\job_history_2023_2025.sqlite'
$env:LIVE_SCHEDULE_DB_PATH = 'X:\violet-remora\live_migration\data\output\live_schedule.sqlite'

npm start
```

Open the application at [http://127.0.0.1:3000](http://127.0.0.1:3000).

## API reference

All API responses use a top-level `data` property. Successful responses include request metadata. Errors use an `error` object with a code, message, and request ID.

### Health

```text
GET /api/v1/health
```

Reports whether the historical and live schedule databases are connected, read-only, and exposing database objects.

### History ping

```text
GET /api/v1/history/ping
```

Checks the historical database connection.

### Job lookup

```text
GET /api/v1/history/jobs
GET /api/v1/history/jobs?search=1234
GET /api/v1/history/jobs?search=ITG-0326-0523&limit=25&offset=0
```

The lookup searches normalized job cards, final four digits, raw job cards, product codes, customer names, and product names. Exact final-four matches are ordered ahead of broader matches. `limit` must be an integer from `1` to `100`; `offset` must be a non-negative integer.

The returned job rows currently include fields such as:

```json
{
  "id": 1,
  "jobcard_raw": "ITG-0326-0523",
  "jobcard_normalized": "ITG-0326-0523",
  "jobcard_last4": "0523",
  "product_code": "P-1001",
  "customer_name": "Example Customer",
  "product_name": "Example Product",
  "order_qty": "100000",
  "meter_run": "2500",
  "status": "Scheduled",
  "printing_machine": "Gravure 1",
  "printing_date": "2026-09-18",
  "source": "live_schedule"
}
```

### Schema inspection

```text
GET /api/v1/history/tables
GET /api/v1/history/schema
```

These endpoints are available without a token in development. In production they require the `SCHEMA_INSPECTION_TOKEN` environment variable and the `X-Schema-Inspection-Token` request header. They are for controlled diagnostics, not normal frontend use.

## Configuration

Configuration is read from environment variables. Defaults are defined in `backend/src/config.js`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Network interface for Express. Keep local-only when using ngrok as the external entry point. |
| `PORT` | `3000` | Express listening port. |
| `NODE_ENV` | `development` | Controls production schema-inspection protection. |
| `HISTORY_DB_PATH` | `\\192.168.0.254\Public\violet-remora\job_history_2023_2025.sqlite` | Read-only historical job database. |
| `LIVE_SCHEDULE_DB_PATH` | `live_migration/data/output/live_schedule.sqlite` relative to the repository | Read-only live schedule database generated by the importer. |
| `FRONTEND_ORIGIN` | empty | Optional CORS origin for a separately served frontend. Same-origin Express serving is preferred. |
| `SCHEMA_INSPECTION_TOKEN` | empty | Optional token required for `/tables` and `/schema` in production. Never commit it. |

The backend opens both SQLite databases with `readOnly: true` and enables `PRAGMA query_only = ON`. The historical database must remain unchanged. The operational ERP database for future job/process/machine/output writes is not part of this proof of concept.

## Live schedule refresh

The importer reads the configured worksheet from:

```text
\\192.168.0.254\Public\PRINTING SCHEDULE 2026B.xlsx
Worksheet: LISTING 2025 & 2026
Header row: 2
```

The importer:

1. Reads and validates the workbook before replacing active live rows.
2. Rejects missing files, missing required headers, too few valid rows, and excessive row-count drops.
3. Preserves source-row payloads and SHA-256 source hashes.
4. Replaces live rows inside one SQLite transaction.
5. Writes a summary and rejected-row report under `live_migration/reports/`.
6. Leaves the previous successful live rows available when validation or insertion fails.

Use [live_migration/README.md](live_migration/README.md) for importer-specific details and [DEPLOYMENT.md](DEPLOYMENT.md) for Task Scheduler operation.

## Security and production limitations

This repository is not yet a complete production ERP.

- The current API is read-only and has no application authentication, user roles, or audit identity.
- If the service is made available outside the local machine, protect the ngrok tunnel with the approved OAuth/access policy. Do not expose an unauthenticated port.
- Do not expose the historical database, live SQLite file, SMB share, schema endpoints, or source workbook directly to the internet.
- Keep SQLite files, reports, workbooks, `.env` files, and credentials outside commits. The repository `.gitignore` already excludes the current database/report paths.
- The browser depends on the Vue CDN. A future offline deployment should vendor Vue only as an approved dependency change.
- Job/process transitions, machine runs, output quantities, waste, timestamps, permissions, and operational writes still require an approved ERP design before implementation.

## Development conventions

- Keep pages, components, services, state, routing, and utilities separated.
- Keep business rules out of Vue templates.
- Reuse existing components before adding new ones.
- Update [PAGE_GUIDE.md](PAGE_GUIDE.md) and [COMPONENT_GUIDE.md](COMPONENT_GUIDE.md) when an approved page or component changes.
- Do not add Vite, npm frontend packages, or a new router without approval; the current frontend intentionally has no root `package.json`.
- Do not use `git add .` for deployment commits. Review explicit paths and exclude databases, reports, credentials, and generated files.

## Related documents

- [Deployment runbook](DEPLOYMENT.md)
- [Live migration guide](live_migration/README.md)
- [Page guide](PAGE_GUIDE.md)
- [Component guide](COMPONENT_GUIDE.md)
