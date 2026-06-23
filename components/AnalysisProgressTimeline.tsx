import type { TimelineEntry } from '@/src/types/analysis';

export function AnalysisProgressTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Analysis timeline</h3>
        <p>Each step is persisted, so the report page can recover after refresh or restart.</p>
      </div>
      <ol className="timeline-list">
        {timeline.map((entry) => (
          <li className="timeline-item" key={entry.id}>
            <div className={`timeline-dot timeline-${entry.status}`} />
            <div>
              <div className="timeline-title-row">
                <strong>{entry.title}</strong>
                <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC</time>
              </div>
              <p>{entry.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
