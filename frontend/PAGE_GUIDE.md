# Page Guide

| Route | Page | Responsibility | Data source |
| --- | --- | --- | --- |
| `/` | `src/pages/JobsPage.js` | Compose the job search form, result summary, feedback, and table. It does not contain fetch or database logic. | `src/state/jobsStore.js` |

## Page rules

- The first proof-of-concept screen is intentionally one page.
- The page route is `/` because the repository had no existing frontend route
  to preserve.
- Add another route only when a separate user workflow is approved.
- API calls belong in services, request state belongs in the store, and value
  formatting belongs in utilities.
- The page must remain usable when the API is loading, unavailable, returns no
  rows, or returns an error response.

## API dependency

`JobsPage` currently expects the backend to provide:

```text
GET /api/v1/history/jobs
GET /api/v1/history/jobs?search=<full-job-card-or-final-four-digits>
```

This endpoint is required for the page to show job rows. It is not present in
the inspected backend commit yet.
