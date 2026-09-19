# Component Guide

| Component | File | Responsibility | Must not do |
| --- | --- | --- | --- |
| `AppShell` | `src/components/layout/AppShell.js` | Render the left navigation, read-only status, and the page slot. | Fetch data, decide permissions, or contain page-specific business rules. |
| `JobSearchBar` | `src/components/jobs/JobSearchBar.js` | Capture the search value and emit search or clear events. | Fetch data, interpret job fields, or decide production status. |
| `JobsSummary` | `src/components/jobs/JobsSummary.js` | Display the number of rows and the active search text. | Load data or calculate production metrics. |
| `JobsTable` | `src/components/jobs/JobsTable.js` | Render job rows and the loading/empty table states. | Fetch data, mutate rows, or apply workflow rules. |
| `MasterlistTable` | `src/components/masterlist/MasterlistTable.js` | Render masterlist items and loading/empty states. | Fetch data, mutate items, or calculate manufacturing rules. |
| `FeedbackPanel` | `src/components/common/FeedbackPanel.js` | Render a reusable informational or error message. | Decide whether an API error is recoverable. |

## Supporting layers

| Layer | File | Responsibility |
| --- | --- | --- |
| Page | `src/pages/JobsPage.js` | Compose components and connect them to the store. |
| Page | `src/pages/MasterlistPage.js` | Compose reusable search/feedback components with the masterlist table and store. |
| State | `src/state/jobsStore.js` | Own jobs, search text, loading state, errors, and stale-request protection. |
| State | `src/state/masterlistStore.js` | Own masterlist items, product-code search, loading state, errors, and stale-request protection. |
| Service | `src/services/historyService.js` | Call the history jobs endpoint and validate the response envelope. |
| Service | `src/services/masterlistService.js` | Call the masterlist item endpoint and validate the response envelope. |
| HTTP utility | `src/services/apiClient.js` | Send GET requests and normalize API/network errors. |
| Formatting utility | `src/utils/jobFormatters.js` | Convert known API values into display text and presentation classes. |
| Formatting utility | `src/utils/masterlistFormatters.js` | Convert known masterlist values into display text. |
| Routing | `src/router.js` | Resolve `/` and `/masterlist` without adding a router package. |
| Configuration | `src/config.js` | Keep the API base URL in one place. |

## Data flow

```text
AppShell
  → JobsPage → jobsStore → historyService → apiClient → history/live SQLite
  → MasterlistPage → masterlistStore → masterlistService → apiClient → masterlist SQLite
```

The browser never opens the SQLite file directly.
