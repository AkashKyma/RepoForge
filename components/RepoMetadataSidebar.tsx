import type { AnalysisRecord } from '@/src/types/analysis';

export function RepoMetadataSidebar({ analysis }: { analysis: AnalysisRecord }) {
  const repo = analysis.repo;
  const snapshot = analysis.snapshot;

  return (
    <aside className="card sidebar-card">
      <div className="card-header">
        <h3>Repository metadata</h3>
        <p>Snapshot evidence collected during analysis.</p>
      </div>
      <dl className="meta-list">
        <div>
          <dt>Repository</dt>
          <dd>{repo ? `${repo.owner}/${repo.name}` : analysis.repoUrl}</dd>
        </div>
        <div>
          <dt>Branch</dt>
          <dd>{repo?.defaultBranch ?? 'unknown'}</dd>
        </div>
        <div>
          <dt>Primary language</dt>
          <dd>{repo?.primaryLanguage ?? 'unknown'}</dd>
        </div>
        <div>
          <dt>Stars / forks</dt>
          <dd>{repo ? `${repo.stars ?? 0} / ${repo.forks ?? 0}` : 'unknown'}</dd>
        </div>
        <div>
          <dt>Topics</dt>
          <dd>{repo?.topics?.join(', ') || 'none listed'}</dd>
        </div>
        <div>
          <dt>Sampled tree entries</dt>
          <dd>{snapshot?.treeSample.length ?? 0}</dd>
        </div>
        <div>
          <dt>Important files</dt>
          <dd>{snapshot?.importantFiles.slice(0, 6).join(', ') || 'none'}</dd>
        </div>
      </dl>
      {snapshot?.languages.length ? (
        <div>
          <h4>Language distribution</h4>
          <ul>
            {snapshot.languages.slice(0, 5).map((language) => (
              <li key={language.name}>
                {language.name}: {language.share}%
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
