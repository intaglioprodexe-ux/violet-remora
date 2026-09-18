# violet-remora deployment runbook

This document describes the current proof-of-concept deployment for `intaglioprodexe-ux/violet-remora`.

## Deployment model

GitHub stores the source code. It is not the runtime host for this application.

The application requires:

- Node.js 22.5 or newer for the built-in `node:sqlite` API;
- a Windows machine that can read the historical SQLite database and the internal schedule workbook;
- a local writable directory for the generated live SQLite database and reports;
- an Express process to serve both the Vue frontend and the API;
- an optional authenticated ngrok tunnel for remote browser access.

The supported proof-of-concept path is:

```text
Windows backend host
  ├── Express + Vue on 127.0.0.1:3000
  ├── read-only historical database on the internal share
  ├── read-only local live_schedule.sqlite
  └── scheduled workbook refresh
          │
          └── optional OAuth-protected ngrok HTTPS tunnel
```

Do not use GitHub Pages for this application. GitHub Pages can serve static files, but it cannot run the Express API, open SQLite, or reach the internal SMB data source.

## Deployment prerequisites

Before deployment, confirm:

- The checkout is on the intended `main` revision.
- Node.js reports version `22.5.0` or newer.
- `npm`, `py`, and the Python `openpyxl` package are available.
- The historical database is readable at the approved internal path.
- The live workbook exists at the configured path and contains worksheet `LISTING 2025 & 2026` with headers on row `2`.
- The existing workbook conversion step, if required by production operations, has completed successfully before the importer runs. The converter is not included in this repository.
- No SQLite database, report, credential, or `.env` file is staged for GitHub.

## Initial installation

Use PowerShell from the machine that will run the backend.

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

`npm ci` installs only the backend dependencies declared in `backend/package-lock.json`. The frontend has no npm build step; Express serves `index.html` and `src/` directly.

## Refresh the live schedule database

Run this after the source workbook has been refreshed and validated by the normal production process.

```powershell
Set-Location 'X:\violet-remora'

py .\live_migration\scripts\import_live_schedule.py `
  --config .\live_migration\config.example.json

if ($LASTEXITCODE -ne 0) {
    throw 'Live schedule import failed. The previous successful live rows should remain in place.'
}

py .\live_migration\scripts\verify_live_database.py `
  .\live_migration\data\output\live_schedule.sqlite

if ($LASTEXITCODE -ne 0) {
    throw 'Live schedule verification failed. Do not restart the production API until investigated.'
}
```

The repository already provides the equivalent wrapper:

```powershell
Set-Location 'X:\violet-remora'
& .\live_migration\run_live_import.bat
if ($LASTEXITCODE -ne 0) { throw 'Live schedule refresh failed.' }
```

The importer writes the live database under `live_migration/data/output/` and reports under `live_migration/reports/`. Both are excluded from Git commits.

## Run automated importer tests

```powershell
Set-Location 'X:\violet-remora'

py -m unittest discover `
  -s .\live_migration\tests `
  -p 'test_*.py'
```

The current tests cover delivery-header disambiguation, final-four job-card normalization, and the large row-count-drop safeguard.

## Start the backend

Open a PowerShell window and set runtime configuration for that session:

```powershell
Set-Location 'X:\violet-remora'

$env:NODE_ENV = 'production'
$env:HOST = '127.0.0.1'
$env:PORT = '3000'
$env:HISTORY_DB_PATH = '\\192.168.0.254\Public\violet-remora\job_history_2023_2025.sqlite'
$env:LIVE_SCHEDULE_DB_PATH = 'X:\violet-remora\live_migration\data\output\live_schedule.sqlite'

# Leave empty unless controlled schema diagnostics are required.
$env:SCHEMA_INSPECTION_TOKEN = ''

Set-Location .\backend
npm start
```

Keep this window open. A successful startup prints the local listening address and confirms that the history database was opened in read-only mode.

The backend must be able to open both databases at startup. If either path is wrong or unavailable, the process exits instead of serving incomplete data.

## Local smoke test

Open a second PowerShell window:

```powershell
Invoke-RestMethod 'http://127.0.0.1:3000/api/v1/health'
Invoke-RestMethod 'http://127.0.0.1:3000/api/v1/history/ping'
Invoke-RestMethod 'http://127.0.0.1:3000/api/v1/history/jobs?search=1234'
```

Expected checks:

- `/api/v1/health` reports both databases as connected and read-only.
- `/api/v1/history/ping` reports the historical connection as connected.
- `/api/v1/history/jobs?search=1234` returns a JSON envelope with `data` as an array.
- `x-request-id` is present in the response headers and the response metadata.
- `http://127.0.0.1:3000/` displays the Jobs page.

## Remote access through ngrok

Only start the tunnel after the local smoke test passes.

```powershell
ngrok http 127.0.0.1:3000
```

Before sharing the generated HTTPS address:

1. Confirm the ngrok endpoint uses the approved OAuth/access-control policy.
2. Confirm that the tunnel is pointing to `127.0.0.1:3000`, not a development frontend port.
3. Confirm that SQLite files, the SMB path, and schema-inspection headers are not exposed as downloadable files.
4. Share the HTTPS address only with approved users.

The current application does not provide its own user login or role enforcement. Ngrok access control is an outer perimeter for the proof of concept; it is not a replacement for application authentication when write operations are introduced.

## Windows Task Scheduler

### Live schedule refresh task

Create a task that runs after the normal schedule workbook/converter process has completed.

```text
Program/script: C:\Windows\System32\cmd.exe
Arguments: /c "X:\violet-remora\live_migration\run_live_import.bat"
Start in: X:\violet-remora
```

The task account must have:

- read access to `\\192.168.0.254\Public\PRINTING SCHEDULE 2026B.xlsx`;
- write access to the local repository `live_migration\data\output` and `live_migration\reports` directories;
- permission to run the configured Python launcher and `openpyxl`.

Do not run the importer before the source workbook conversion has completed successfully.

### Backend startup task

For a proof-of-concept machine, starting `npm start` manually is acceptable. For a persistent local service, create a separate task using the actual npm path reported by PowerShell:

```powershell
(Get-Command npm).Source
```

Configure Task Scheduler with:

```text
Program/script: <the npm.cmd path returned above>
Arguments: start
Start in: X:\violet-remora\backend
```

Configure `HOST`, `PORT`, `NODE_ENV`, `HISTORY_DB_PATH`, `LIVE_SCHEDULE_DB_PATH`, and any schema token as machine-level environment variables or through an approved wrapper outside the repository. Do not place secrets in a committed file.

The ngrok tunnel is a separate process and should be managed separately from the backend until a supervised service design is approved.

## Updating from GitHub

Perform updates from the deployment machine only after checking the working tree.

```powershell
Set-Location 'X:\violet-remora'

git status --short --branch
git fetch origin
git pull --ff-only origin main

Set-Location .\backend
npm ci
Set-Location ..

py -m pip install --user -r .\live_migration\requirements.txt
```

Do not use `git reset --hard` as part of deployment. Stop and investigate if local changes, untracked data, or an unexpected branch are present.

After updating:

1. Run the live schedule refresh and verification.
2. Run the importer tests.
3. Stop and restart the backend process.
4. Repeat the local smoke test.
5. Restart or reconnect the approved ngrok tunnel.
6. Check the browser job lookup with a full job card and a final-four search.

## Backup and rollback

The historical database is an external read-only source and must not be overwritten by this deployment.

Before replacing a live SQLite file manually, stop the backend and make a timestamped copy outside the Git checkout:

```powershell
Set-Location 'X:\violet-remora'

$database = '.\live_migration\data\output\live_schedule.sqlite'
$backupDirectory = 'X:\violet-remora-backups'
New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
$backup = Join-Path $backupDirectory "live_schedule.sqlite.$(Get-Date -Format 'yyyyMMdd-HHmmss').bak"
Copy-Item -LiteralPath $database -Destination $backup
```

Normal importer failures should not require manual rollback because replacement occurs inside a transaction and previous successful live rows are retained. If a known-good backup must be restored:

1. Stop the backend.
2. Copy the selected backup over `live_schedule.sqlite`.
3. Run `verify_live_database.py`.
4. Restart the backend.
5. Repeat the health and job-lookup smoke tests.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Backend exits while starting | Verify both database paths, network-share access, Node version, and that `live_schedule.sqlite` exists. |
| `/api/v1/health` reports degraded | Inspect which database reports `connected: false`; do not treat degraded data as a successful deployment. |
| Browser loads but jobs fail | Check the browser/API URL, backend console, `/api/v1/health`, and the `x-request-id` for correlation. |
| Final-four lookup returns no rows | Verify the live import completed, inspect `jobcard_last4`, and test the same value through `/api/v1/history/jobs?search=1234`. |
| Live import fails | Read the printed validation error and `live_migration/reports/`; do not delete the previous live database. |
| ngrok shows a bad gateway | Confirm Express is still listening on `127.0.0.1:3000` and that ngrok targets the same port. |
| External access is refused | Confirm the approved ngrok OAuth/access policy and that the tunnel process is online. |
| Schema endpoint is unavailable | In production, this is expected unless `SCHEMA_INSPECTION_TOKEN` is configured and sent in `X-Schema-Inspection-Token`. |

## Deployment acceptance checklist

- [ ] Correct repository and `main` branch confirmed.
- [ ] Working tree reviewed before update.
- [ ] Node.js `22.5.0` or newer confirmed.
- [ ] Backend `npm ci` completed.
- [ ] Python dependency installation completed.
- [ ] Live schedule refresh completed.
- [ ] Live database verification passed.
- [ ] Importer tests passed.
- [ ] Historical and live databases both report connected and read-only.
- [ ] Local frontend and full/final-four job searches work.
- [ ] No database, report, workbook, `.env`, token, or credential was staged.
- [ ] Remote tunnel is OAuth/access-control protected before sharing.
- [ ] Rollback backup location is known.

## Known deployment limitations

- There is no application authentication or role model yet.
- There is no operational `erp.sqlite` database yet.
- The API currently exposes read-only history and live schedule data only.
- The live schedule source depends on the internal Windows share and workbook format.
- The frontend currently depends on the Vue CDN.
- There is no GitHub Actions deployment workflow; the supported deployment is a controlled on-prem Windows runbook.
