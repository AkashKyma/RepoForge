import type { TechnicalReport } from '@/src/types/analysis';

function renderItems(items: string[]) {
  if (!items.length) {
    return <li>Not detected from the sampled evidence.</li>;
  }

  return items.map((item) => <li key={item}>{item}</li>);
}

export function TechnicalReportSection({ report }: { report: TechnicalReport }) {
  return (
    <section className="card report-section">
      <div className="card-header">
        <h2>Technical report</h2>
        <p>Stack, architecture, complexity, and maintenance shape.</p>
      </div>
      <div className="report-grid">
        <div>
          <h3>Stack</h3>
          <ul>
            {renderItems([
              `Frontend: ${report.stack.frontend.join(', ') || 'Not detected'}`,
              `Backend: ${report.stack.backend.join(', ') || 'Not detected'}`,
              `Data: ${report.stack.data.join(', ') || 'Not detected'}`,
              `Infrastructure: ${report.stack.infrastructure.join(', ') || 'Not detected'}`,
            ])}
          </ul>
        </div>
        <div>
          <h3>Architecture</h3>
          <p>{report.architectureStyle}</p>
          <ul>{renderItems(report.moduleBoundaries)}</ul>
        </div>
        <div>
          <h3>Feature breakdown</h3>
          <ul>{renderItems(report.featureBreakdown)}</ul>
        </div>
        <div>
          <h3>Complexity and risk</h3>
          <ul>
            <li>Complexity score: {report.complexityScore}/100</li>
            <li>{report.dependencyHealth}</li>
            <li>{report.maintenanceRisk}</li>
            <li>{report.refactorRisk}</li>
          </ul>
        </div>
      </div>
      <div>
        <h3>Evidence</h3>
        <ul>{renderItems(report.evidence)}</ul>
      </div>
    </section>
  );
}
