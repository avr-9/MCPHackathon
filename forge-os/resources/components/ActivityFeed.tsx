import type { ActivityEvent } from "./types";

interface ActivityFeedProps {
  events: ActivityEvent[];
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <aside className="activity-feed">
      <h3>Activity</h3>
      <div className="feed-items">
        {events.slice(0, 10).map((event) => (
          <article key={event.id} className={`feed-item kind-${event.kind}`}>
            <strong>{event.title}</strong>
            <p>{event.detail}</p>
            <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
          </article>
        ))}
      </div>
    </aside>
  );
}
