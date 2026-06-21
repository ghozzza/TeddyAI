#!/usr/bin/env bash
# TeddyAI — one-shot VPS setup (Ubuntu/Debian). Run ON the VPS after SSH.
#   bash deploy/setup.sh
# Assumes the repo is already cloned and you're in its root.
set -euo pipefail

echo "── TeddyAI VPS setup ──"

# 1. Node 22+ via nvm (twak requires >= 22.14)
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v//;s/\..*//')" -lt 22 ]; then
  echo "· installing Node 22 (nvm)…"
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
  nvm install 22 && nvm use 22
else
  export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" || true
fi

# 2. pnpm
command -v pnpm >/dev/null 2>&1 || npm i -g pnpm@10.15.1

# 3. Trust Wallet Agent Kit (CLI) — skip interactive onboarding (we copy ~/.twak)
command -v twak >/dev/null 2>&1 || curl -fsSL https://agent-kit.trustwallet.com/install.sh | bash -s -- --no-onboard

# 4. PM2 process manager
command -v pm2 >/dev/null 2>&1 || npm i -g pm2

# 5. Build the app
pnpm install --frozen-lockfile
pnpm build

echo
echo "✅ Setup done. Still TODO (from your Mac):"
echo "   1. scp the .env and ~/.twak wallet dir over (see DEPLOY.md)"
echo "   2. add TWAK_BIN=\$(which twak) and AGENT_AUTO_EXECUTE=true to .env"
echo "   3. pm2 start deploy/ecosystem.config.cjs && pm2 save"
echo "   twak: $(command -v twak 2>/dev/null || echo 'NOT FOUND — re-open shell')"
