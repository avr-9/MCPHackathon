#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FORGE_OS_DIR="$ROOT_DIR/forge-os"

cd "$FORGE_OS_DIR"

npm install
npm run build
npx -y @mcp-use/cli login
npx -y @mcp-use/cli deploy --name forge-os --runtime node --port 3000
