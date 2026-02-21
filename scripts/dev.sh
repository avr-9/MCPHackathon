#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FORGE_OS_DIR="$ROOT_DIR/forge-os"
FORGE_OPT_DIR="$ROOT_DIR/forge-optimizer"

if [[ ! -d "$FORGE_OS_DIR/node_modules" ]]; then
  echo "Installing forge-os dependencies..."
  (cd "$FORGE_OS_DIR" && npm install)
fi

if [[ ! -d "$FORGE_OPT_DIR/.venv" ]]; then
  echo "Creating forge-optimizer virtualenv..."
  python3 -m venv "$FORGE_OPT_DIR/.venv"
fi

source "$FORGE_OPT_DIR/.venv/bin/activate"
pip install -q -r "$FORGE_OPT_DIR/requirements.txt"

echo "Starting forge-optimizer on :8100"
(
  cd "$FORGE_OPT_DIR"
  python -m optimizer_server.main
) &
OPT_PID=$!

cleanup() {
  echo "Stopping services..."
  kill "$OPT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

export OPTIMIZER_MCP_URL="${OPTIMIZER_MCP_URL:-http://127.0.0.1:8100/mcp}"

echo "Starting forge-os on :3000"
cd "$FORGE_OS_DIR"
npm run dev
