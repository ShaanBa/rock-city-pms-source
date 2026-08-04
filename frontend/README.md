# Staff dashboard

React/Vite interface for staff reservation, room, housekeeping, folio, and web-assignment workflows.

Copy `.env.example` to `.env`, configure the LAN/cloud API URLs, and set browser-side `VITE_STAFF_API_KEY` and `VITE_IMPORT_API_KEY` values matching the backend. These values are embedded in the browser bundle, so deploy this application only on a trusted staff network.

```bash
npm ci
npm run dev -- --host
```

Quality checks:

```bash
npm run lint
npm run build
```
