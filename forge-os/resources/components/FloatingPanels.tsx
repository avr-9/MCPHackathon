import type { RouteSnapshot } from "./types";

interface FloatingPanelsProps {
  route?: RouteSnapshot;
}

export function FloatingPanels({ route }: FloatingPanelsProps) {
  if (!route || route.panels.length === 0) {
    return (
      <section className="panel-zone empty">
        <div className="empty-card">
          <h3>Workspace Ready</h3>
          <p>Run route_query to populate floating result panels.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-zone">
      {route.panels.map((panel, idx) => (
        <article key={panel.id} className="float-panel" style={{ animationDelay: `${idx * 80}ms` }}>
          <header>
            <h4>{panel.title}</h4>
            <small>{panel.appId}</small>
          </header>
          <ul>
            {panel.lines.map((line, lineIdx) => (
              <li key={`${panel.id}_${lineIdx}`}>{line}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
