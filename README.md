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

## Deploying

The site shares the Ubuntu VPS with supremoagent.com (nginx, certbot, user `supremoagent`).
Push to `main` and GitHub Actions builds, SSHes in, and runs `deploy/update.sh`.

### One-time setup

**1. DNS (Hostinger → DNS zone for tenorworth.com).** Replace the parking records with:

| Type | Name | Value |
|---|---|---|
| A | `@` | VPS IPv4 (same as supremoagent.com) |
| A | `www` | VPS IPv4 |
| A | `app` | VPS IPv4 |

Remove any AAAA / parking CNAME records Hostinger added. Check with `dig +short tenorworth.com`.

**2. VPS: deploy key for Actions → VPS.** On the VPS as `supremoagent`:

```bash
ssh-keygen -t ed25519 -C "tenorworth-actions" -f ~/.ssh/tenorworth_deploy -N ""
cat ~/.ssh/tenorworth_deploy.pub >> ~/.ssh/authorized_keys
ssh-keyscan -H "$(curl -s ifconfig.me)"      # → DEPLOY_KNOWN_HOSTS value
cat ~/.ssh/tenorworth_deploy                  # → DEPLOY_SSH_KEY value (then delete this private key from the VPS)
```

**3. GitHub → repo → Settings → Secrets and variables → Actions.**

| Kind | Name | Value |
|---|---|---|
| Variable | `DEPLOY_HOST` | VPS IPv4 |
| Variable | `DEPLOY_USER` | `supremoagent` |
| Variable | `DEPLOY_REPO_DIR` | `/home/supremoagent/tenorworth-repo` |
| Secret | `DEPLOY_SSH_KEY` | private key from step 2 |
| Secret | `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan` output from step 2 |

Also create an environment named `production` (Settings → Environments); the workflow targets it.

**4. First deploy.** Actions → Deploy → Run workflow. `update.sh` builds both sites and
installs the **HTTP-only** nginx config (no cert yet). Confirm `http://tenorworth.com` loads.

**5. TLS.** On the VPS:

```bash
sudo certbot certonly --nginx -d tenorworth.com -d www.tenorworth.com -d app.tenorworth.com
```

Then re-run the workflow (or `bash deploy/update.sh` on the VPS). It detects the cert and
switches to the HTTPS config with the `www` → apex redirect.

**6. App env.** `frontend/.env` is not tracked. Create it on the VPS at
`/home/supremoagent/tenorworth-repo/frontend/.env` from `frontend/.env.example` once the
Supabase project exists.

### Manual deploy

```bash
ssh supremoagent@<vps> 'cd ~/tenorworth-repo && git pull && bash deploy/update.sh'
```
