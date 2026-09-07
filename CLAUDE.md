# Tenorworth — tenorworth.com

AI implementation consultancy for regulated, operations-heavy businesses in Southern
California. Practice brand of **TravAlarm, Inc.** (dba). Positioning, voice, palette,
and type live in [BRAND.md](BRAND.md) — read it before touching copy or styling.

**This repo is PUBLIC.** Never commit `.env` files, keys, hostnames-with-credentials,
or anything from the SupremoAgent repo's secrets.

## Layout (mirrors supremoagent_web)

```
marketing/   Astro 5 + Tailwind 4, static → tenorworth.com          (port 4322)
frontend/    React 18 + Vite + TS + TanStack Query + Supabase → app.tenorworth.com (port 3001)
backend/     NOT scaffolded. Runtime undecided (FastAPI like SupremoAgent, or Node). Listens on :8002.
deploy/      update.sh (runs on VPS), nginx/ server blocks
brand/       source logo assets + contact sheet (do not edit; export from here)
.github/     deploy.yml — build-check, then SSH to VPS and run deploy/update.sh
```

## Commands

```bash
cd marketing && npm install && npm run dev    # http://localhost:4322
cd marketing && npm run build                 # astro check + build → marketing/dist
cd frontend  && npm install && npm run dev    # http://localhost:3001
cd frontend  && npm run build                 # tsc + vite build → frontend/dist
```

## Conventions

- **Brand tokens** are defined once in `marketing/src/styles/global.css` (`@theme`) and
  duplicated in `frontend/src/styles.css`. Colours: ink `#141B2D`, cream `#F4F1EA`,
  brass `#B8985A`. Accent is brass only — no teal, no neon, no gradients.
- **Type**: Fraunces for headings/wordmark, Inter for everything else. Both from Google Fonts.
- **Voice**: composed, precise, senior, quietly confident. Short sentences. No hype words
  ("revolutionary", "cutting-edge", "unlock"). Never robots/brains/circuits imagery.
- **Site config** (name, email, booking URL, nav, sitemap routes) is in
  `marketing/src/config/site.ts`. Add a page → add its route to `ROUTES` there.
- **Astro output**: `build.format = 'file'` so `/services` → `services.html`; nginx's
  `try_files $uri $uri.html` depends on this. Don't change one without the other.
- **CTAs** carry `data-event="cta_click" data-source="..."`; the GA component forwards
  them automatically when `PUBLIC_GA_MEASUREMENT_ID` is set.
- The logo mark is an inline SVG component (`Mark.astro`) using `currentColor` for ink
  and a fixed brass point. Source of truth is `brand/mark-transparent.svg`.

## Deployment

Shared Ubuntu VPS with supremoagent.com, user `supremoagent`, nginx + certbot.
Push to `main` → GitHub Actions → SSH → `git reset --hard origin/main` → `deploy/update.sh`.
The workflow needs repo **variables** `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_REPO_DIR`
(`/home/supremoagent/tenorworth-repo`) and **secrets** `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`.
Full runbook in [README.md](README.md#deploying).

`update.sh` installs the HTTP-only nginx config until the Let's Encrypt cert exists,
then switches to the HTTPS config on the next run. Never edit nginx on the VPS by hand;
the repo owns `/etc/nginx/sites-available/tenorworth`.

## Open items

- `hello@tenorworth.com` is assumed in `site.ts`; confirm the mailbox exists (Hostinger email).
- `SITE.bookingUrl` is empty; set a Calendly/Cal.com link and every "Book a call" CTA switches over.
- Supabase: create a **new** project for Tenorworth (do not reuse SupremoAgent's
  `lslzrqsiyqrzqwjtycpe`), then add `.mcp.json` pointing at it and fill `frontend/.env`.
- Backend runtime decision (see `backend/README.md`).
