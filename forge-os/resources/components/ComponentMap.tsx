import { useMemo } from "react";
import type { EndpointifyJob } from "./types";

interface ComponentMapProps {
  job?: EndpointifyJob;
  selected: string[];
  onToggle: (componentId: string) => void;
  onGenerate: () => void;
}

export function ComponentMap({ job, selected, onToggle, onGenerate }: ComponentMapProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  if (!job) {
    return (
      <section className="component-map empty">
        <h3>Component Map</h3>
        <p>Run endpointify(url) to detect interactive components.</p>
      </section>
    );
  }

  return (
    <section className="component-map">
      <div className="component-map-head">
        <h3>Component Map</h3>
        <small>{new URL(job.url).host}</small>
      </div>
      <div className="component-grid">
        {job.result.components.map((component) => (
          <label key={component.id} className="component-item">
            <input
              type="checkbox"
              checked={selectedSet.has(component.id)}
              onChange={() => onToggle(component.id)}
            />
            <span>
              <strong>{component.label}</strong>
              <small>{component.type} • {(component.confidence * 100).toFixed(0)}%</small>
            </span>
          </label>
        ))}
      </div>
      <button type="button" className="primary-btn" onClick={onGenerate} disabled={selected.length === 0}>
        Endpointify Selected
      </button>
    </section>
  );
}
