import type { AppEntry, RouteSnapshot, WorkspaceState } from "../../state/store.js";
import { makeId, nowIso } from "../../state/store.js";

const KEYWORDS: Record<string, string[]> = {
  slack: ["slack", "chat", "thread", "message", "engineering"],
  github: ["pr", "pull", "repo", "issue", "ship", "release", "commit"],
  calendar: ["calendar", "meeting", "schedule", "today", "monday", "standup"]
};

export function routeMessage(
  state: WorkspaceState,
  message: string,
  overrideApps?: string[]
): RouteSnapshot {
  const selectedApps = chooseApps(state, message, overrideApps);
  const panels = selectedApps.map((app, idx) => ({
    id: makeId("panel"),
    title: `${app.name} Results`,
    appId: app.id,
    lines: buildPanelLines(app, message, idx)
  }));

  const latencyMs = 1400 + selectedApps.length * 460;
  const qualityScore = Number((7 + selectedApps.length * 0.4).toFixed(1));

  return {
    id: makeId("route"),
    message,
    appPath: selectedApps.map((app) => app.id),
    metrics: {
      latencyMs,
      toolCalls: Math.max(1, selectedApps.length),
      qualityScore
    },
    panels,
    createdAt: nowIso()
  };
}

function chooseApps(state: WorkspaceState, message: string, overrideApps?: string[]): AppEntry[] {
  if (overrideApps && overrideApps.length > 0) {
    return overrideApps
      .map((id) => state.apps.get(id))
      .filter((entry): entry is AppEntry => Boolean(entry));
  }

  const lc = message.toLowerCase();
  const hits = new Set<string>();

  for (const [appId, words] of Object.entries(KEYWORDS)) {
    if (words.some((word) => lc.includes(word))) {
      hits.add(appId);
    }
  }

  const dynamicApps = Array.from(state.apps.values()).filter((app) => app.kind !== "native");
  if (dynamicApps.length > 0) {
    hits.add(dynamicApps[0].id);
  }

  if (hits.size === 0) {
    hits.add("slack");
    hits.add("github");
    hits.add("calendar");
  }

  return Array.from(hits)
    .map((id) => state.apps.get(id))
    .filter((entry): entry is AppEntry => Boolean(entry));
}

function buildPanelLines(app: AppEntry, message: string, idx: number): string[] {
  const base = [
    `Context: ${message.slice(0, 60)}`,
    `${app.name} executed ${idx + 1} tool${idx > 0 ? "s" : ""}`
  ];

  if (app.id === "github") {
    return [...base, "2 PRs merged", "1 release candidate ready"];
  }
  if (app.id === "calendar") {
    return [...base, "Standup at 10:00", "Roadmap sync at 14:00"];
  }
  if (app.kind === "endpointified") {
    return [...base, "Critical tickets: 3", "Pending approvals: 2"];
  }
  if (app.kind === "composite") {
    return [...base, "Unified summary generated", "Latency reduced by 4x"];
  }

  return [...base, "Engineering thread summarized", "Blockers: 2"];
}
