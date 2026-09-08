# Tenorworth

Marketing site and client application for [tenorworth.com](https://tenorworth.com) — an AI
implementation consultancy for regulated business. Practice brand of TravAlarm, Inc.

| Path | What | Where it runs |
|---|---|---|
| `marketing/` | Astro 5 + Tailwind 4 static site | https://tenorworth.com |
| `frontend/` | React 18 + Vite + TanStack Query + Supabase SPA | https://app.tenorworth.com |
| `backend/` | API (not yet scaffolded, see its README) | `127.0.0.1:8002` on the VPS |
| `deploy/` | `update.sh` + nginx server blocks | VPS |
| `brand/` | Logo sources, contact sheet | — |

Brand brief: [BRAND.md](BRAND.md). Working notes for Claude Code: [CLAUDE.md](CLAUDE.md).

## Local development

```bash
cd marketing && npm install && npm run dev     # http://localhost:4322
cd frontend  && npm install && npm run dev     # http://localhost:3001
```

`frontend/` reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `frontend/.env`
(copy `.env.example`). It renders a notice instead of crashing when unset.

## Booking flow

"Book a call" is our own two-step flow at `/book`: capture the lead, then pick a
30-minute slot from live Google Calendar availability. It runs on Supabase Edge
Functions plus two tables; the static site calls them directly. Setup (Google
OAuth client, secrets, `supabase db push`, `functions deploy`) is in
[supabase/README.md](supabase/README.md).

## Deploying

The site shares the Ubuntu VPS with supremoagent.com (nginx, certbot) under its own
service user `tenorworth`, so the two sites never share files, keys, or sudo rights.
Push to `main` and GitHub Actions builds, SSHes in, and runs `deploy/update.sh`.

### One-time setup

**1. DNS (Hostinger → DNS zone for tenorworth.com).** Replace the parking records with:

| Type | Name | Value |
|---|---|---|
| A | `@` | VPS IPv4 (same as supremoagent.com) |
| A | `www` | VPS IPv4 |
| A | `app` | VPS IPv4 |

Remove any AAAA / parking CNAME records Hostinger added. Check with `dig +short tenorworth.com`.

**2. VPS: create the `tenorworth` user.** One command, run once as a sudoer on the VPS
(the `supremoagent` user works). It creates the user, installs the deploy and operator
public keys, creates `/var/www/tenorworth`, and grants scoped passwordless sudo:

```bash
curl -fsSL https://raw.githubusercontent.com/tenorworth/tenorworthweb/main/deploy/bootstrap-user.sh | sudo bash
```

Read [deploy/bootstrap-user.sh](deploy/bootstrap-user.sh) first; the public keys it
installs are listed at the top.

**3. GitHub → repo → Settings → Secrets and variables → Actions.**

| Kind | Name | Value |
|---|---|---|
| Variable | `DEPLOY_HOST` | VPS IPv4 |
| Variable | `DEPLOY_USER` | `tenorworth` |
| Variable | `DEPLOY_REPO_DIR` | `/home/tenorworth/repo` |
| Secret | `DEPLOY_SSH_KEY` | private half of the `tenorworth-actions` key |
| Secret | `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan -t ed25519 <vps-ip>` output |

Also create an environment named `production` (Settings → Environments); the workflow targets it.

**4. First deploy.** Actions → Deploy → Run workflow. `update.sh` builds both sites and
installs the **HTTP-only** nginx config (no cert yet). Confirm `http://tenorworth.com` loads.

**5. TLS.** On the VPS as `tenorworth` (certbot is in its sudo allowlist):

```bash
sudo certbot certonly --nginx -d tenorworth.com -d www.tenorworth.com -d app.tenorworth.com
```

Then re-run the workflow (or `bash deploy/update.sh` on the VPS). It detects the cert and
switches to the HTTPS config with the `www` → apex redirect.

**6. App env.** `frontend/.env` is not tracked. Create it on the VPS at
`/home/tenorworth/repo/frontend/.env` from `frontend/.env.example` once the
Supabase project exists.

### Manual deploy

```bash
ssh tenorworth@<vps> 'cd ~/repo && git pull && bash deploy/update.sh'
```
