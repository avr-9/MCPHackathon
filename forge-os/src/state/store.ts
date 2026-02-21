import evolvedState from "../demo/evolved-state.js";

export type RingHealth = "green" | "amber" | "blue" | "red";
export type AppKind = "native" | "endpointified" | "composite";

export interface AppEntry {
  id: string;
  name: string;
  icon: string;
  kind: AppKind;
  ring: RingHealth;
  badges: string[];
  toolNames: string[];
  createdAt: string;
}

export interface EndpointComponent {
  id: string;
  type: "search" | "form" | "table" | "button" | "filter" | "pagination";
  label: string;
  selector: string;
  description: string;
  confidence: number;
  actionHints: string[];
}

export interface EndpointifyDiagnostics {
  source: "demo_cache" | "live" | "heuristic";
  retry_count: number;
  timing_ms: number;
  notes: string[];
}

export interface EndpointifyResult {
  url: string;
  normalizedUrl: string;
  components: EndpointComponent[];
  confidence: number;
  source: "demo_cache" | "live" | "heuristic";
  diagnostics: EndpointifyDiagnostics;
}

export interface EndpointifyJob {
  id: string;
  url: string;
  result: EndpointifyResult;
  selectedComponentIds: string[];
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  kind:
    | "endpointified"
    | "optimized"
    | "optimization_proposed"
    | "optimization_rejected"
    | "composite_proposed"
    | "composite_accepted"
    | "route_executed"
    | "demo_loaded";
  title: string;
  detail: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export interface TrialProposal {
  trialId: string;
  serverId: string;
  candidateParams: Record<string, unknown>;
  baselineSummary: string;
  candidateSummary: string;
  createdAt: string;
  state: "proposed" | "accepted" | "rejected";
}

export interface CompositeTool {
  id: string;
  name: string;
  chain: string[];
  estimate: string;
  status: "proposed" | "accepted" | "dismissed";
  createdAt: string;
}

export interface ToolCallLog {
  id: string;
  toolName: string;
  appId?: string;
  timestamp: string;
}

export interface RoutePanel {
  id: string;
  title: string;
  appId: string;
  lines: string[];
}

export interface RouteSnapshot {
  id: string;
  message: string;
  appPath: string[];
  metrics: {
    latencyMs: number;
    toolCalls: number;
    qualityScore: number;
  };
  panels: RoutePanel[];
  createdAt: string;
}

export interface WorkspaceState {
  apps: Map<string, AppEntry>;
  endpointifyJobs: Map<string, EndpointifyJob>;
  activity: ActivityEvent[];
  trialProposals: Map<string, TrialProposal>;
  composites: Map<string, CompositeTool>;
  toolCalls: ToolCallLog[];
  routes: RouteSnapshot[];
  stats: {
    optimizations: number;
    speedGainPct: number;
    newApps: number;
    endpointified: number;
  };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

export function createState(): WorkspaceState {
  const seedApps: AppEntry[] = [
    {
      id: "slack",
      name: "Slack",
      icon: "S",
      kind: "native",
      ring: "amber",
      badges: [],
      toolNames: ["search_messages", "list_channels"],
      createdAt: nowIso(),
    },
    {
      id: "github",
      name: "GitHub",
      icon: "G",
      kind: "native",
      ring: "amber",
      badges: [],
      toolNames: ["list_prs", "list_issues"],
      createdAt: nowIso(),
    },
    {
      id: "calendar",
      name: "Calendar",
      icon: "C",
      kind: "native",
      ring: "amber",
      badges: [],
      toolNames: ["today_events", "next_meetings"],
      createdAt: nowIso(),
    },
  ];

  return {
    apps: new Map(seedApps.map((app) => [app.id, app])),
    endpointifyJobs: new Map(),
    activity: [],
    trialProposals: new Map(),
    composites: new Map(),
    toolCalls: [],
    routes: [],
    stats: {
      optimizations: 0,
      speedGainPct: 0,
      newApps: 0,
      endpointified: 0,
    },
  };
}

export function logActivity(
  state: WorkspaceState,
  event: Omit<ActivityEvent, "id" | "timestamp">
): ActivityEvent {
  const created: ActivityEvent = {
    id: makeId("act"),
    timestamp: nowIso(),
    ...event,
  };
  state.activity.unshift(created);
  state.activity = state.activity.slice(0, 120);
  return created;
}

export function logToolCall(state: WorkspaceState, toolName: string, appId?: string): void {
  state.toolCalls.push({
    id: makeId("call"),
    toolName,
    appId,
    timestamp: nowIso(),
  });
  if (state.toolCalls.length > 500) {
    state.toolCalls = state.toolCalls.slice(-500);
  }
}

export function workspaceSnapshot(state: WorkspaceState) {
  return {
    apps: Array.from(state.apps.values()),
    endpointifyJobs: Array.from(state.endpointifyJobs.values()),
    activity: state.activity,
    trialProposals: Array.from(state.trialProposals.values()),
    composites: Array.from(state.composites.values()),
    routes: state.routes,
    stats: state.stats,
  };
}

function toMapWithKey<T>(items: T[], keyFn: (item: T) => string): Map<string, T> {
  return new Map(items.map((item) => [keyFn(item), item]));
}

export function loadEvolvedStateInto(state: WorkspaceState) {
  const data = evolvedState as {
    apps: AppEntry[];
    activity: ActivityEvent[];
    composites: CompositeTool[];
    trialProposals: TrialProposal[];
    routes: RouteSnapshot[];
    stats: WorkspaceState["stats"];
  };

  state.apps = toMapWithKey(data.apps, (item) => item.id);
  state.activity = data.activity;
  state.composites = toMapWithKey(data.composites, (item) => item.id);
  state.trialProposals = toMapWithKey(data.trialProposals, (item) => item.trialId);
  state.routes = data.routes;
  state.stats = data.stats;

  logActivity(state, {
    kind: "demo_loaded",
    title: "Loaded Evolved State",
    detail: "Workspace jumped to one-week evolution snapshot",
  });
}
