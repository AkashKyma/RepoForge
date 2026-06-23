'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnalysisProgressTimeline } from '@/components/AnalysisProgressTimeline';
import { CommercialReportSection } from '@/components/CommercialReportSection';
import { RepoMetadataSidebar } from '@/components/RepoMetadataSidebar';
import { StatusBadge } from '@/components/StatusBadge';
import { TechnicalReportSection } from '@/components/TechnicalReportSection';
import type { AnalysisRecord } from '@/src/types/analysis';

const ACTIVE_STATUSES = new Set(['queued', 'cloning', 'analyzing', 'synthesizing']);

export function AnalysisDetailClient({ initialAnalysis }: { initialAnalysis: AnalysisRecord }) {
  const [analysis, setAnalysis] = useState(initialAnalysis);

  useEffect(() => {
    if (!ACTIVE_STATUSES.has(analysis.status)) {
      return;
    }

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/analyses/${analysis.id}`, { cache: 'no-store' });
      if (!response.ok) {
        return;
      }

      const nextAnalysis = (await response.json()) as AnalysisRecord;
      setAnalysis(nextAnalysis);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [analysis.id, analysis.status]);

  const summaryCards = useMemo(() => {
    if (!analysis.report) {
      return [];
    }

    return [
      {
        label: 'Recommendation',
        value: analysis.report.executiveSummary.recommendation,
      },
      {
        label: 'Technical risks',
        value: analysis.report.executiveSummary.topTechnicalRisks.join(' • '),
      },
      {
        label: 'Commercial upside',
        value: analysis.report.executiveSummary.topCommercialOpportunities.join(' • '),
      },
    ];
  }, [analysis.report]);

  return (
    <div className="page-shell analysis-shell">
      <section className="card hero-card compact-hero">
        <div className="hero-copy">
          <p className="eyebrow">RepoForge analysis</p>
          <h1>{analysis.repo ? `${analysis.repo.owner}/${analysis.repo.name}` : analysis.repoUrl}</h1>
          <p>{analysis.repo?.description ?? 'Repository analysis in progress.'}</p>
        </div>
        <div className="hero-actions analysis-header-meta">
          <StatusBadge status={analysis.status} />
          <a className="secondary-link" href={analysis.repo?.url ?? analysis.repoUrl} rel="noreferrer" target="_blank">
            Open repository ↗
          </a>
        </div>
      </section>

      <div className="analysis-layout">
        <main className="analysis-main">
          <AnalysisProgressTimeline timeline={analysis.timeline} />

          {analysis.errorMessage ? (
            <section className="card error-panel">
              <h2>Analysis failed</h2>
              <p>{analysis.errorMessage}</p>
            </section>
          ) : null}

          {analysis.report ? (
            <>
              <section className="card report-section">
                <div className="card-header">
                  <h2>Executive summary</h2>
                  <p>{analysis.report.executiveSummary.summary}</p>
                </div>
                <div className="summary-grid">
                  {summaryCards.map((card) => (
                    <article className="summary-card" key={card.label}>
                      <h3>{card.label}</h3>
                      <p>{card.value}</p>
                    </article>
                  ))}
                </div>
              </section>
              <TechnicalReportSection report={analysis.report.technical} />
              <CommercialReportSection report={analysis.report.commercial} />
            </>
          ) : (
            <section className="card loading-panel">
              <h2>Working on the report</h2>
              <p>The page polls for updates automatically while repo intake and report synthesis run in the background.</p>
            </section>
          )}
        </main>
        <RepoMetadataSidebar analysis={analysis} />
      </div>
    </div>
  );
}
