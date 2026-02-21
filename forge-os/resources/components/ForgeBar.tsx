import type { WorkspacePayload } from "./types";

interface ForgeBarProps {
  stats: WorkspacePayload["stats"];
}

export function ForgeBar({ stats }: ForgeBarProps) {
  return (
    <header className="forge-bar">
      <div className="brand">
        <span className="brand-dot" />
        <strong>forge-os</strong>
      </div>
      <div className="bar-metrics">
        <span>🧬 {stats.optimizations} optimizations</span>
        <span>⚡ +{stats.speedGainPct}% speed</span>
        <span>🆕 {stats.newApps} new</span>
        <span>🌐 {stats.endpointified} endpointified</span>
      </div>
    </header>
  );
}
