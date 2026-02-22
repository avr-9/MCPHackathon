# forge-os Demo Workspace

Two-server MCP demo stack built for fast live reliability.

## Services

- `forge-os` (TypeScript): main MCP App with widget + endpointify + routing + optimization/composite UX.
- `forge-optimizer` (Python): Optuna MCP server with in-memory studies.
- `forge-optimizer-node` (Node): Node-only fallback optimizer server for environments that cannot run Python.

## Local Run

```bash
cd /Users/raghavsubramaniam/Downloads/buildfolder/agentos
./scripts/dev.sh
```

This starts:

- `forge-optimizer` at `http://127.0.0.1:8100/mcp`
- `forge-os` at `http://127.0.0.1:3000/mcp`

Inspector/UI routes are managed by `mcp-use` dev mode.

## Deploy

```bash
./scripts/deploy-forge-os.sh
./scripts/deploy-forge-optimizer.sh
```

## Demo-critical behavior

- `endpointify` includes a hardcoded cache for demo URL output.
- Cached URL returns immediately with `source: "demo_cache"`.
- Live extraction still uses Playwright + vision + heuristic fallback.
- If live extraction fails and cache exists, cached output is returned.
- If no cache exists, heuristic-only output is returned.

## Manual acceptance checklist

1. Cached URL endpointify returns instantly.
2. Non-cached URL endpointify returns components with fallback path.
3. Optimize + accept/reject updates rings/feed.
4. Composite proposal appears and test adds composite app.
5. `load_evolved_state()` switches workspace to the hardcoded one-week snapshot.
