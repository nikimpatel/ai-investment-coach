#!/usr/bin/env bash
# Cursor Cloud Agent install script.
# Runs when Cursor creates an environment Build (not on every agent boot).
# Must be idempotent: it may run on a disk that was already prepared.
set -euo pipefail

export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_NOLOGO=1

# --- Node 20.x (matches package.json engines and Vercel) ---------------------
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20.* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# --- .NET SDK 8 (backend) ----------------------------------------------------
DOTNET_DIR="$HOME/.dotnet"
if ! "$DOTNET_DIR/dotnet" --list-sdks 2>/dev/null | grep -q '^8\.'; then
  curl -fsSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 8.0 --install-dir "$DOTNET_DIR"
fi
# Builds keep disk state only, not exported shell variables, so expose dotnet
# through a system path symlink and persist DOTNET_ROOT in shell profiles.
sudo ln -sf "$DOTNET_DIR/dotnet" /usr/local/bin/dotnet
for profile in "$HOME/.bashrc" "$HOME/.profile"; do
  if ! grep -q 'DOTNET_ROOT' "$profile" 2>/dev/null; then
    printf '\nexport DOTNET_ROOT="$HOME/.dotnet"\nexport PATH="$PATH:$HOME/.dotnet:$HOME/.dotnet/tools"\n' >> "$profile"
  fi
done

# --- Project dependencies ----------------------------------------------------
npm ci
(cd backend && dotnet restore TenYearExplorer.sln)

echo "install complete: node $(node -v), dotnet $(dotnet --version)"
