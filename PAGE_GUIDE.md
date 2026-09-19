# Page Guide

| Route | Page | Responsibility | Data source |
| --- | --- | --- | --- |
| `/` | `src/pages/JobsPage.js` | Compose the job search form, result summary, feedback, and table. It does not contain fetch or database logic. | `src/state/jobsStore.js` |
| `/masterlist` | `src/pages/MasterlistPage.js` | Compose the product-code search form, result summary, feedback, and masterlist table. It does not contain fetch or database logic. | `src/state/masterlistStore.js` |

## Page rules

- The application shell provides the approved navigation items: `Job History`
  and `Masterlist`.
- `/` remains the existing Job History page and must retain its search behavior.
- `/masterlist` is the first additional read-only reference page.
- Add another route only when a separate user workflow is approved.
- API calls belong in services, request state belongs in the store, and value
  formatting belongs in utilities.
- The page must remain usable when the API is loading, unavailable, returns no
  rows, or returns an error response.

## API dependency

`JobsPage` expects the backend to provide:

```text
GET /api/v1/history/jobs
GET /api/v1/history/jobs?search=<full-job-card-or-final-four-digits>
```

`MasterlistPage` expects the backend to provide:

```text
GET /api/v1/masterlist/items?product_code=<full-or-partial-product-code>
```
