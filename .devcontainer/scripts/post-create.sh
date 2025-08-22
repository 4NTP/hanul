#!/usr/bin/env bash
set -euo pipefail

DEV_USER="${DEV_USER:-vscode}"
run_as_dev() {
  local cmd="$*"
  if [ "$(id -u)" -eq 0 ]; then
    runuser -u "$DEV_USER" -- bash -lc "$cmd"
  else
    if [ "$(id -un)" = "$DEV_USER" ] || [ "${USER:-}" = "$DEV_USER" ]; then
      bash -lc "$cmd"
    else
      echo "[devcontainer] Not root and not $DEV_USER; cannot switch user."
      exit 1
    fi
  fi
}

echo "[devcontainer] Enabling Corepack and installing latest pnpm..."
corepack enable
corepack prepare pnpm@latest --activate

# Resolve the intended non-root dev user and home
DEV_USER="${DEV_USER:-vscode}"
DEV_HOME="$(getent passwd "$DEV_USER" 2>/dev/null | cut -d: -f6 || echo "/home/$DEV_USER")"

# Configure PNPM_HOME for the dev user and current shell
export PNPM_HOME="${PNPM_HOME:-${DEV_HOME}/.local/share/pnpm}"
export PATH="$PNPM_HOME:$PATH"

# Ensure directories exist with correct ownership/permissions
sudo install -d -m 0775 -o "$DEV_USER" -g "$DEV_USER" "$PNPM_HOME"
sudo install -d -m 0775 -o "$DEV_USER" -g "$DEV_USER" "${DEV_HOME}/.local/share" "${DEV_HOME}/.cache"
sudo chown -R "$DEV_USER":"$DEV_USER" "${DEV_HOME}/.local" "${DEV_HOME}/.cache" || true
sudo chmod -R u+rwX,go+rX "$PNPM_HOME" || true
umask 002

# Persist PNPM_HOME and PATH into the dev user's zsh profile
ZSHRC="${DEV_HOME}/.zshrc"
touch "$ZSHRC"
if ! grep -q "PNPM_HOME" "$ZSHRC"; then
  {
    echo ''
    echo '# pnpm via Corepack'
    echo "export PNPM_HOME=\"$PNPM_HOME\""
    echo 'export PATH="${PNPM_HOME}:${PATH}"'
  } >> "$ZSHRC"
  chown "$DEV_USER":"$DEV_USER" "$ZSHRC" || true
fi

# Install useful OS packages (psql client)
echo "[devcontainer] Installing OS packages (postgresql-client)..."
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends postgresql-client
sudo rm -rf /var/lib/apt/lists/*

echo "[devcontainer] Installing global CLIs (vercel, turbo, ni) for ${DEV_USER}..."
run_as_dev "export PNPM_HOME=\"$PNPM_HOME\"; export PATH=\"$PNPM_HOME:\$PATH\"; pnpm config set global-bin-dir \"$PNPM_HOME\" --global; pnpm add -g vercel@latest turbo@latest @antfu/ni@latest"

run_as_dev 'command -v vercel >/dev/null 2>&1 && vercel --version | head -n1 | sed -e "s/^/[devcontainer] /" || true'

# If a VERCEL_TOKEN env is provided, store it for CLI usage
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  echo "[devcontainer] Writing Vercel token for ${DEV_USER}"
  mkdir -p "${DEV_HOME}/.vercel"
  printf "%s" "$VERCEL_TOKEN" > "${DEV_HOME}/.vercel/token"
  chown -R "$DEV_USER":"$DEV_USER" "${DEV_HOME}/.vercel" || true
  chmod 600 "${DEV_HOME}/.vercel/token" || true
  # Confirm auth (non-fatal if it fails)
  run_as_dev 'vercel whoami || true'
fi

# If org/project IDs are provided, link the repo automatically and pull envs
if [[ -n "${VERCEL_TOKEN:-}" && -n "${VERCEL_ORG_ID:-}" && -n "${VERCEL_PROJECT_ID:-}" ]]; then
  echo "[devcontainer] Linking to Vercel project ${VERCEL_PROJECT_ID} (org: ${VERCEL_ORG_ID})"
  sudo -E -u "$DEV_USER" bash -lc "vercel link --project \"$VERCEL_PROJECT_ID\" --org \"$VERCEL_ORG_ID\" --yes || true"
  # Pull development environment variables to .env.local if available
  sudo -E -u "$DEV_USER" bash -lc 'vercel env pull --yes .env.local || true'
fi

# Install workspace dependencies if package.json exists
if [[ -f package.json ]]; then
  echo "[devcontainer] Installing workspace dependencies via pnpm (as ${DEV_USER})..."

  sudo chown -R "$DEV_USER":"$DEV_USER" "$(pwd)" || true

  if [[ -f pnpm-lock.yaml ]]; then
    run_as_dev 'pnpm install --frozen-lockfile'
  else
    run_as_dev 'pnpm install'
  fi
fi

# Install global dependencies
run_as_dev 'pnpm i -g @nestjs/cli'

# Show tool versions
node -v || true
run_as_dev 'pnpm -v || true'
run_as_dev 'vercel --version || true'
psql --version || true