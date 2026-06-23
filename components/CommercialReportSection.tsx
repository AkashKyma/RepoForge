import type { CommercialReport } from '@/src/types/analysis';

export function CommercialReportSection({ report }: { report: CommercialReport }) {
  return (
    <section className="card report-section">
      <div className="card-header">
        <h2>Commercial report</h2>
        <p>Who it serves, how it monetizes, and what it might take to ship as a product.</p>
      </div>
      <div className="report-grid">
        <div>
          <h3>Target users</h3>
          <ul>
            {report.targetUsers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Use cases</h3>
          <ul>
            {report.useCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Monetization options</h3>
          <ul>
            {report.monetizationOptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Effort</h3>
          <ul>
            <li>{report.buildEffortEstimate}</li>
            <li>{report.maintenanceEffortEstimate}</li>
            <li>Confidence: {report.confidenceLevel}</li>
          </ul>
        </div>
      </div>
      <div>
        <h3>Market potential</h3>
        <p>{report.marketPotential}</p>
      </div>
      <div>
        <h3>Commercialization opportunities</h3>
        <ul>
          {report.commercializationOpportunities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Competitor landscape</h3>
        <div className="competitor-list">
          {report.competitorLandscape.map((competitor) => (
            <article className="competitor-card" key={competitor.name}>
              <strong>{competitor.name}</strong>
              <p>{competitor.positioning}</p>
            </article>
          ))}
        </div>
      </div>
      <div>
        <h3>Evidence</h3>
        <ul>
          {report.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
