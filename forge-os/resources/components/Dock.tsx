import type { AppEntry } from "./types";

const ringClass: Record<AppEntry["ring"], string> = {
  green: "ring-green",
  amber: "ring-amber",
  blue: "ring-blue",
  red: "ring-red"
};

interface DockProps {
  apps: AppEntry[];
  onSelect: (appId: string) => void;
  selectedAppId?: string;
}

export function Dock({ apps, onSelect, selectedAppId }: DockProps) {
  return (
    <div className="dock">
      {apps.map((app) => (
        <button
          type="button"
          key={app.id}
          className={`dock-item ${ringClass[app.ring]} ${selectedAppId === app.id ? "active" : ""}`}
          onClick={() => onSelect(app.id)}
        >
          <span className="dock-icon">{app.icon}</span>
          <span className="dock-label">{app.name}</span>
          {app.badges.length > 0 ? <span className="dock-badge">{app.badges[0]}</span> : null}
        </button>
      ))}
    </div>
  );
}
