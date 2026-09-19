# Violet Remora frontend proof of concept

This is a zero-build Vue 3 frontend for the first job-history screen.

It does not require Vite, npm, or any new local package. Vue is loaded from the
CDN in `index.html`. The frontend calls the Express API; it never connects to
SQLite directly.

## Current backend dependency

The frontend expects this read-only endpoint:

```text
GET /api/v1/history/jobs
GET /api/v1/history/jobs?search=1234
```

The current repository commit has the backend foundation but does not yet
implement this job-row endpoint. Until that endpoint is added, the page will
show the API error returned for the missing route.

The expected successful response is:

```json
{
  "data": [
    {
      "id": 1,
      "jobcard_raw": "example-job-card",
      "jobcard_normalized": "EXAMPLE-JOB-CARD",
      "jobcard_last4": "1234",
      "product_code": "example-product-code",
      "customer_name": "example-customer",
      "product_name": "example-product",
      "order_qty": "1000",
      "meter_run": "500",
      "status": "Pending",
      "printing_machine": "Gravure 1",
      "printing_date": "2026-09-17",
      "source_file": "job_history_2023_2025.sqlite",
      "source_sheet": "history",
      "source_row": 1,
      "imported_at_utc": "2026-09-17T00:00:00.000Z"
    }
  ],
  "meta": {
    "request_id": "request-id-from-api"
  }
}
```

The example values above are only a response-shape example. The frontend does
not create or substitute fake job data.

## Manual run

1. Copy the contents of this folder into the repository at `frontend\`.
2. Start the backend from `backend\` with the frontend origin configured:

   ```powershell
   $env:FRONTEND_ORIGIN="http://127.0.0.1:5500"
   npm start
   ```

3. Open a second Command Prompt or PowerShell window at the repository root:

   ```powershell
   py -m http.server 5500 --directory frontend
   ```

   If `py` is unavailable, use `python` instead.

4. Open `http://127.0.0.1:5500/` in Firefox.

5. Leave the search box empty to request the available rows, or enter a full
   job card or final four digits and press Enter.
