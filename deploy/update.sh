#!/usr/bin/env bash
# ============================================================
# tenorworth.com — build + deploy (run on the VPS)
# ============================================================
# Idempotent. Called by GitHub Actions after `git reset --hard
# origin/main`, or by hand:
#   ssh supremoagent@<vps> 'cd ~/tenorworth-repo && git pull && bash deploy/update.sh'
#
# Runs as the `supremoagent` user (shared VPS with supremoagent.com).
# Needs passwordless sudo for: mkdir/rsync into /var/www, cp into
# /etc/nginx, nginx -t, systemctl reload nginx — the same set
# supremoagent's update.sh already relies on.
#
# Layout on the VPS:
#   /var/www/tenorworth/marketing/dist   tenorworth.com      (Astro)
#   /var/www/tenorworth/frontend/dist    app.tenorworth.com  (React SPA)
#   127.0.0.1:8002                       backend (when it exists)
# ============================================================
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MARKETING_SERVE_DIR="/var/www/tenorworth/marketing/dist"
FRONTEND_SERVE_DIR="/var/www/tenorworth/frontend/dist"
NGINX_AVAILABLE="/etc/nginx/sites-available/tenorworth"
NGINX_ENABLED="/etc/nginx/sites-enabled/tenorworth"
CERT="/etc/letsencrypt/live/tenorworth.com/fullchain.pem"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
step() { echo -e "\n${GREEN}>>> $1${NC}"; }
warn() { echo -e "${YELLOW}    [!] $1${NC}"; }

# ---------- Marketing site (Astro) ----------
step "Building marketing site (Astro)"
cd "$REPO_DIR/marketing"
npm ci --silent --no-audit --no-fund
npm run build
echo "    Built $(find dist -name '*.html' | wc -l | tr -d ' ') pages."

step "Deploying marketing to $MARKETING_SERVE_DIR"
sudo mkdir -p "$MARKETING_SERVE_DIR"
sudo rsync -a --delete "$REPO_DIR/marketing/dist/" "$MARKETING_SERVE_DIR/"
echo "    Synced."

# ---------- App SPA (React/Vite) ----------
if [ -f "$REPO_DIR/frontend/package.json" ]; then
    step "Building app frontend (Vite)"
    cd "$REPO_DIR/frontend"
    # Vite reads VITE_* from frontend/.env at build time. It is NOT tracked;
    # create it on the VPS once from frontend/.env.example.
    [ -f .env ] || warn "frontend/.env missing — Supabase will be unconfigured in the build."
    npm ci --silent --no-audit --no-fund
    npm run build
    step "Deploying app to $FRONTEND_SERVE_DIR"
    sudo mkdir -p "$FRONTEND_SERVE_DIR"
    sudo rsync -a --delete "$REPO_DIR/frontend/dist/" "$FRONTEND_SERVE_DIR/"
    echo "    Synced."
else
    warn "No frontend/package.json — skipping app build."
fi

# ---------- Backend (placeholder until it exists) ----------
if [ -f "$REPO_DIR/deploy/systemd/tenorworth-backend.service" ]; then
    step "Restarting backend service"
    sudo cp "$REPO_DIR/deploy/systemd/tenorworth-backend.service" /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable --now tenorworth-backend
    sudo systemctl restart tenorworth-backend
fi

# ---------- nginx ----------
step "Installing nginx config"
if [ -f "$CERT" ]; then
    SRC="$REPO_DIR/deploy/nginx/tenorworth.conf"
    echo "    TLS cert found — installing full HTTPS config."
else
    SRC="$REPO_DIR/deploy/nginx/tenorworth-http.conf"
    warn "No cert at $CERT — installing HTTP-only bootstrap config."
    warn "After DNS resolves here run:"
    warn "  sudo certbot certonly --nginx -d tenorworth.com -d www.tenorworth.com -d app.tenorworth.com"
    warn "then re-run this script to switch to HTTPS."
fi
sudo cp "$SRC" "$NGINX_AVAILABLE"
[ -L "$NGINX_ENABLED" ] || sudo ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "    nginx reloaded."
else
    warn "nginx -t FAILED — previous config left in place. Fix and retry."
    exit 1
fi

step "Done"
echo "    Marketing: https://tenorworth.com"
echo "    App:       https://app.tenorworth.com"
