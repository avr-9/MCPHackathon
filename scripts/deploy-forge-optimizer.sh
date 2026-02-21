#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FORGE_OPT_DIR="$ROOT_DIR/forge-optimizer"

if [[ ! -d "$FORGE_OPT_DIR/.venv" ]]; then
  python3 -m venv "$FORGE_OPT_DIR/.venv"
fi

source "$FORGE_OPT_DIR/.venv/bin/activate"
pip install -q -r "$FORGE_OPT_DIR/requirements.txt"

cd "$FORGE_OPT_DIR"
npx -y @mcp-use/cli login
npx -y @mcp-use/cli deploy --name forge-optimizer --runtime python --port 8100
