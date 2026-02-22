🔥 FORGE OS
Turning the entire internet into self-learning MCP servers.
Every webpage becomes a tool. Every tool evolves itself. Every workflow writes itself.

What is FORGE OS?
FORGE OS is an MCP App that renders a desktop-like operating system inside ChatGPT and Claude. Your MCP servers appear as apps in a dock. But this isn't a launcher — it's alive.

FORGE OS does three things that have never been built before:

🌐 Endpointify — Turn any webpage into an MCP server
Paste any URL. FORGE OS analyzes the page with LLM vision + DOM heuristics, identifies every interactive component — search bars, buttons, forms, tables, filters — and turns each one into an MCP tool. No API needed. No developer needed.

There are 5,800 MCP servers today. There are 2 billion websites. FORGE OS bridges that gap.

Example: Your team's internal admin panel has no API and no MCP server. Paste the URL into FORGE OS. 30 seconds later, ChatGPT can search tickets, filter by status, and create new issues — on a page that has zero API endpoints.

🧬 Self-Optimize — Every server gets measurably better
Every tool call flows through a structured telemetry layer. FORGE OS calls its companion optimization server — which runs real Optuna (TPE/CMA-ES) — to suggest better configurations: rewritten tool descriptions, tuned parameter defaults, improved retry strategies.

You see a split-test comparison card in the widget. Accept or reject. Your feedback is a reward signal that drives the next optimization trial. The tools you used yesterday are measurably faster and more accurate today.

This is not a mock. This is real Bayesian optimization running real trials.

⚡ Auto-Generate — Tools nobody designed, born from how you work
FORGE OS watches your tool-call patterns. When it detects you always call Slack → GitHub → Calendar in sequence, it generates a composite tool (team-pulse) that collapses three calls into one — 4x faster, one click.

These composite tools appear as proposals in the widget. Test them. Accept them. A new app icon appears in your dock. Nobody designed it. It emerged from your workflow.


Architecture
Two MCP servers. One Manufact Cloud pool. Even the optimizer is an MCP server — it's MCP servers all the way down.

┌─────────────────────────────────────────────────┐
│ Manufact MCP Cloud │
│ │
│ forge-os (TypeScript) forge-optimizer (Python)│
│ ├── endpointify() ├── suggest_trial() │
│ ├── endpointify_generate()├── record_feedback() │
│ ├── route_query() ├── get_best_config() │
│ ├── optimize() └── get_trial_history()│
│ ├── accept_optimization() │
│ ├── reject_optimization() Optuna (TPE/CMA-ES) │
│ ├── generate_composite() InMemoryStorage │
│ ├── test_composite() Real Bayesian opt. │
│ ├── get_status() │
│ └── load_evolved_state() │
│ │
│ User's MCP servers: │
│ ├── slack, github, calendar (existing) │
│ ├── admin-panel (endpointified from URL) │
│ └── team-pulse (auto-generated composite) │
└─────────────────────────────────────────────────┘
│
▼
ChatGPT / Claude
Widget renders inline

forge-os (TypeScript MCP App)
The main application. Exposes all user-facing tools. Renders the interactive widget UI per the MCP Apps standard. Built with mcp-use TypeScript SDK.

forge-optimizer (Python MCP Server)
Wraps Optuna as an MCP server with four tools. Real TPE and CMA-ES sampling. One study per server, created on demand, InMemoryStorage. Built with mcp-use Python SDK.

forge-os calls forge-optimizer via mcp-use — standard MCP tool calls within the same server pool. No HTTP sidecar. No custom protocols. Pure MCP.


The Widget
FORGE OS renders a full desktop workspace as an MCP App widget inside the chat client:

┌──────────────────────────────────────────────────────┐
│ FORGE Bar │
│ 🧬 12 optimizations ⚡ +340% speed 🆕 2 new 🌐 3 │
├────────────────────────────────────┬─────────────────┤
│ │ Activity Feed │
│ Floating Panels │ │
│ (results, comparisons, │ 🌐 Endpointified│
│ component maps) │ admin-panel │
│ │ │
│ │ 🔧 Optimized │
│ │ slack.search │
│ │ +45% accuracy │
│ │ │
│ │ 🆕 Composite │
│ │ team-pulse │
│ │ [Test][Reject] │
├────────────────────────────────────┴─────────────────┤
│ Dock │
│ [Slack🟢] [GitHub🟢] [Cal🟡] [Admin🌐🔵] [Pulse🔵] │
└──────────────────────────────────────────────────────┘

Health rings: 🟢 optimized | 🟡 analyzing | 🔵 newly created | 🔴 degraded


Widget ↔ Model Interactions
FORGE OS uses four constant, bidirectional interaction loops between the widget and the model — the widget is never static:

Loop 1: Endpointify
User pastes URL → model calls endpointify() → widget renders Component Map with checkboxes for each detected element → user selects components → clicks "Endpointify" → useCallTool() fires endpointify_generate() → new app icon fades into dock with 🌐 badge → sendFollowUpMessage() confirms the new app is ready.

Loop 2: Chat → OS Routing
User types a question → model calls route_query() → widget shows animated paths between dock icons → results populate in floating panels → user clicks a different dock icon to override → useCallTool() re-routes → FORGE logs preference for future optimization.

Loop 3: Split-Test Optimization
FORGE calls optimizer for a suggested variant → runs both original and candidate → widget pops a comparison card (before/after metrics) → user clicks Accept or Reject → sendFollowUpMessage() sends reward to optimizer → health ring updates → Optuna samples smarter next time.

Loop 4: Composite Proposals
Telemetry detects repeated tool-call chain → FORGE generates composite tool → widget slides in proposal card → user clicks "Test" → useCallTool() executes composite → results appear in panel → user accepts → new icon appears in dock.


Demo Walkthrough
Minute 1 — Endpointify: "Turn a webpage into an MCP server"
Launch FORGE OS → desktop workspace appears with three app icons (Slack, GitHub, Calendar). Paste an internal admin panel URL → Component Map shows detected elements (search bar, filter, create button, data table) → select all → click Endpointify → new 🌐🔵 icon appears in dock. Ask: "Show me all critical open tickets" → it works. ChatGPT just queried a webpage with zero API.

Minute 2 — Self-Optimization: "Same tools, dramatically better"
Ask: "Catch me up on engineering" → slow response, 3 tool calls, 12 seconds. FORGE has been analyzing. Same question again → split-test card appears, optimized version is 3x faster with higher relevance. Accept. Health rings turn green. Activity feed shows a new composite tool was generated: team-pulse. Test it → instant, perfect result. Accept → new blue icon in dock.

Minute 3 — Evolution: "A week of learning in one click"
Load pre-evolved state. Dock now has 8 icons: 3 original + 2 endpointified + 3 auto-generated composites. All green health rings. FORGE Bar: 47 optimizations | +340% speed | 3 new apps | 2 endpointified. Complex query spanning all apps → 2 seconds, comprehensive answer. The same query took 12 seconds three days ago.


The Technology Behind the Optimization
The optimization engine inside FORGE OS is built on the same technology as Aviran, our agent optimization platform (8 active customers).

How it works:

Every MCP server configuration is decomposed into parameter paths: tool descriptions, parameter defaults, retry strategies, routing preferences, timeout thresholds
Every user interaction (accept/reject/override) generates a reward signal
Optuna samples the next configuration to try using TPE (Tree-structured Parzen Estimator) for discrete choices and CMA-ES for continuous parameters
Each trial is stored with its parameter path and reward score
The optimizer converges on the best configuration for each server, for each user's specific usage patterns
This is not prompt engineering. This is real Bayesian hyperparameter optimization applied to MCP server configurations.


Endpointify: How It Works
The endpointify pipeline uses a layered extraction strategy for maximum reliability:

Playwright fetches the page with a deterministic viewport and wait strategy
LLM Vision (primary pass) analyzes a screenshot + DOM summary to semantically identify interactive components — understanding what each element does, not just what it looks like
Heuristic fallback parses DOM/ARIA for standard patterns (input[type=search], <form>, <table>, <button>) when the vision model is slow or low-confidence
Merge + deduplicate results by selector signature with confidence ranking
Generate MCP tools from selected components — each component maps to a tool with a name, description, and input schema
The result: any webpage becomes a set of MCP tools without writing a single line of code.


Built With
Technology
Role
mcp-use TypeScript SDK
forge-os server + React widget
mcp-use Python SDK
forge-optimizer server
Manufact MCP Cloud
Deployment (both servers in one pool)
Manufact Inspector
Testing and debugging
Optuna
Real TPE/CMA-ES Bayesian optimization
Playwright
Page fetching for endpointify
MCP Apps standard
Widget rendering in ChatGPT/Claude
React
Widget UI components

Sponsor Integration
Sponsor
How FORGE OS Uses It
Manufact
SDK, Inspector, Cloud — the entire build-test-deploy pipeline. FORGE OS creates and deploys MCP servers on their cloud.
Anthropic
Claude as LLM backbone for routing, endpointify vision analysis, and optimization evaluation.
OpenAI
ChatGPT as primary demo client. Widget renders inline via MCP Apps / Apps SDK.
Cloudflare
Workers available for sandboxed page interaction in endpointify pipeline.
WorkOS
AuthKit integration path for production multi-tenant access (post-hackathon).
Puzzle
Cost analytics dimension — optimization tracks token spend per tool alongside quality and speed.

What's Next
FORGE OS is a preview of what we're building at Aviran — self-learning infrastructure for AI agents. Our optimization engine uses Optuna with TPE and CMA-ES to evolve agent configurations based on real usage data. We have 8 active customers today.

The endpointify engine opens up the entire internet as MCP tool surface area. The optimization engine makes every tool better over time. Combined, they point toward a future where AI tools aren't configured by humans — they evolve.


Team
Built at the MCP Apps Hackathon by Manufact, Feb 21, 2026, at Y Combinator SF.


FORGE OS — Turning the entire internet into self-learning MCP servers.
