#!/usr/bin/env bash
# ============================================================
# One-time: create the `tenorworth` service user on the VPS
# ============================================================
# Run ONCE on the VPS as a sudoer (e.g. the supremoagent user):
#   curl -fsSL https://raw.githubusercontent.com/tenorworth/tenorworthweb/main/deploy/bootstrap-user.sh | sudo bash
# or copy the file over and `sudo bash bootstrap-user.sh`.
#
# What it does (idempotent):
#   1. Creates system user `tenorworth` (no password, SSH keys only).
#   2. Installs the two public keys below into its authorized_keys:
#        - tenorworth-actions      GitHub Actions deploy key (DEPLOY_SSH_KEY secret)
#        - arkabala-mac-tenorworth operator key for manual SSH from the Mac
#   3. Creates /var/www/tenorworth owned by tenorworth (so deploys need no sudo
#      for the static files).
#   4. Grants passwordless sudo for exactly the commands deploy/update.sh and
#      certbot need — nothing else. See /etc/sudoers.d/tenorworth.
#
# Everything the deploy touches lives under:
#   /home/tenorworth/repo        git checkout (DEPLOY_REPO_DIR)
#   /var/www/tenorworth/         served files
#   /etc/nginx/sites-*/tenorworth
# ============================================================
set -euo pipefail

USER_NAME="tenorworth"
HOME_DIR="/home/$USER_NAME"
REPO_DIR="$HOME_DIR/repo"
WEB_ROOT="/var/www/tenorworth"

PUBKEYS=(
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFZamugh8koEhQ7KaQUqNqtixlKK61FPs64uoKQDh1yI tenorworth-actions"
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGb+mE6gebViqRrsO9KCupxiSb8DmPrGbPUQK2IeyZ1M arkabala-mac-tenorworth"
)

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }

echo ">>> User"
if id "$USER_NAME" &>/dev/null; then
  echo "    $USER_NAME exists."
else
  adduser --disabled-password --gecos "Tenorworth site" "$USER_NAME"
  echo "    created $USER_NAME."
fi

echo ">>> SSH keys"
install -d -m 700 -o "$USER_NAME" -g "$USER_NAME" "$HOME_DIR/.ssh"
touch "$HOME_DIR/.ssh/authorized_keys"
for K in "${PUBKEYS[@]}"; do
  grep -qF "$K" "$HOME_DIR/.ssh/authorized_keys" || echo "$K" >> "$HOME_DIR/.ssh/authorized_keys"
done
chown "$USER_NAME:$USER_NAME" "$HOME_DIR/.ssh/authorized_keys"
chmod 600 "$HOME_DIR/.ssh/authorized_keys"
echo "    $(wc -l < "$HOME_DIR/.ssh/authorized_keys") key(s) authorized."

echo ">>> Web root"
install -d -m 755 -o "$USER_NAME" -g "$USER_NAME" "$WEB_ROOT"
echo "    $WEB_ROOT owned by $USER_NAME."

echo ">>> Prerequisites"
command -v node >/dev/null && echo "    node $(node -v)" || echo "    [!] node not found — install Node 20 (NodeSource) before deploying."
command -v nginx >/dev/null && echo "    nginx present" || echo "    [!] nginx not found."
command -v certbot >/dev/null && echo "    certbot present" || echo "    [!] certbot not found."

echo ">>> Scoped sudo"
SUDOERS="/etc/sudoers.d/tenorworth"
cat > "$SUDOERS.tmp" <<SUDO
# Tenorworth deploy user — only what deploy/update.sh and certbot need.
Cmnd_Alias TW_NGINX   = /usr/bin/cp $REPO_DIR/deploy/nginx/* /etc/nginx/sites-available/tenorworth, \\
                        /usr/bin/ln -s /etc/nginx/sites-available/tenorworth /etc/nginx/sites-enabled/tenorworth, \\
                        /usr/sbin/nginx -t, \\
                        /usr/bin/systemctl reload nginx
Cmnd_Alias TW_BACKEND = /usr/bin/cp $REPO_DIR/deploy/systemd/tenorworth-backend.service /etc/systemd/system/, \\
                        /usr/bin/systemctl daemon-reload, \\
                        /usr/bin/systemctl enable --now tenorworth-backend, \\
                        /usr/bin/systemctl restart tenorworth-backend, \\
                        /usr/bin/systemctl status tenorworth-backend *
Cmnd_Alias TW_CERT    = /usr/bin/certbot certonly *, /usr/bin/certbot renew *
$USER_NAME ALL=(root) NOPASSWD: TW_NGINX, TW_BACKEND, TW_CERT
SUDO
chmod 440 "$SUDOERS.tmp"
visudo -cf "$SUDOERS.tmp" >/dev/null && mv "$SUDOERS.tmp" "$SUDOERS" && echo "    $SUDOERS installed." \
  || { rm -f "$SUDOERS.tmp"; echo "    [!] sudoers syntax check failed; not installed."; exit 1; }

echo ""
echo "Done. Next: Actions → Deploy → Run workflow on tenorworth/tenorworthweb."
