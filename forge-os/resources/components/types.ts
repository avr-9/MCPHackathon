export type RingHealth = "green" | "amber" | "blue" | "red";

export interface AppEntry {
  id: string;
  name: string;
  icon: string;
  kind: "native" | "endpointified" | "composite";
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

export interface EndpointifyResult {
  url: string;
  normalizedUrl: string;
  components: EndpointComponent[];
  confidence: number;
  source: "demo_cache" | "live" | "heuristic";
  diagnostics: {
    source: "demo_cache" | "live" | "heuristic";
    retry_count: number;
    timing_ms: number;
    notes: string[];
  };
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
  kind: string;
  title: string;
  detail: string;
  timestamp: string;
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

export interface WorkspacePayload {
  apps: AppEntry[];
  endpointifyJobs: EndpointifyJob[];
  activity: ActivityEvent[];
  trialProposals: TrialProposal[];
  composites: CompositeTool[];
  routes: RouteSnapshot[];
  stats: {
    optimizations: number;
    speedGainPct: number;
    newApps: number;
    endpointified: number;
  };
}
