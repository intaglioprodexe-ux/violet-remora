# Component Guide

| Component | File | Responsibility | Must not do |
| --- | --- | --- | --- |
| `JobSearchBar` | `src/components/jobs/JobSearchBar.js` | Capture the search value and emit search or clear events. | Fetch data, interpret job fields, or decide production status. |
| `JobsSummary` | `src/components/jobs/JobsSummary.js` | Display the number of rows and the active search text. | Load data or calculate production metrics. |
| `JobsTable` | `src/components/jobs/JobsTable.js` | Render job rows and the loading/empty table states. | Fetch data, mutate rows, or apply workflow rules. |
| `FeedbackPanel` | `src/components/common/FeedbackPanel.js` | Render a reusable informational or error message. | Decide whether an API error is recoverable. |

## Supporting layers

| Layer | File | Responsibility |
| --- | --- | --- |
| Page | `src/pages/JobsPage.js` | Compose components and connect them to the store. |
| State | `src/state/jobsStore.js` | Own jobs, search text, loading state, errors, and stale-request protection. |
| Service | `src/services/historyService.js` | Call the history jobs endpoint and validate the response envelope. |
| HTTP utility | `src/services/apiClient.js` | Send GET requests and normalize API/network errors. |
| Formatting utility | `src/utils/jobFormatters.js` | Convert known API values into display text and presentation classes. |
| Routing | `src/router.js` | Resolve the currently approved root page without adding a router package. |
| Configuration | `src/config.js` | Keep the API base URL in one place. |

## Data flow

```text
JobsPage
  → jobsStore
    → historyService
      → apiClient
        → Express API
          → SQLite history database
```

The browser never opens the SQLite file directly.
