import Link from 'next/link';
import type { AnalysisListItem } from '@/src/types/analysis';
import { StatusBadge } from '@/components/StatusBadge';

export function RecentAnalysesList({ analyses }: { analyses: AnalysisListItem[] }) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>Recent analyses</h2>
        <p>Saved analyses can be reopened without rerunning the intake flow.</p>
      </div>
      {analyses.length ? (
        <ul className="analysis-list">
          {analyses.map((analysis) => (
            <li className="analysis-row" key={analysis.id}>
              <div>
                <Link href={`/analyses/${analysis.id}`}>
                  {analysis.repo ? `${analysis.repo.owner}/${analysis.repo.name}` : analysis.repoUrl}
                </Link>
                <p>{analysis.repo?.description ?? analysis.repoUrl}</p>
              </div>
              <div className="analysis-row-meta">
                <StatusBadge status={analysis.status} />
                <time dateTime={analysis.updatedAt}>{new Date(analysis.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC</time>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">No analyses yet. Submit a public GitHub repository URL to generate the first report.</p>
      )}
    </section>
  );
}
