# backend/

Reserved for the Tenorworth API. Not scaffolded yet — the runtime needs a decision:

- **FastAPI (Python)** — what SupremoAgent uses. Lets us lift auth, Supabase, and
  scheduler code straight across.
- **Node (Fastify/Express + TypeScript)** — what the brief for this repo mentioned.
  One language across the whole repo, no shared code with SupremoAgent.

Either way the service should listen on **127.0.0.1:8002** (8001 is SupremoAgent's
backend on the same VPS) and expose `/api/*` and `/health`. nginx already proxies
those paths for app.tenorworth.com — see `deploy/nginx/tenorworth.conf`.
