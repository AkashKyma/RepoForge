import { RecentAnalysesList } from '@/components/RecentAnalysesList';
import { RepoUrlForm } from '@/components/RepoUrlForm';
import { listAnalyses } from '@/src/lib/store';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const analyses = await listAnalyses();

  return (
    <main className="page-shell home-shell">
      <section className="hero-card card">
        <div className="hero-copy">
          <p className="eyebrow">Phase 1 MVP</p>
          <h2>Understand any public GitHub repository before you build on top of it.</h2>
          <p>
            RepoForge ingests a repository URL, inspects its structure and manifests, and returns two outputs: a technical diligence report and a commercial productization report.
          </p>
          <div className="hero-points">
            <span>Tech stack + architecture</span>
            <span>Feature and risk breakdown</span>
            <span>Commercial opportunity estimate</span>
          </div>
        </div>
        <RepoUrlForm />
      </section>

      <section className="value-grid">
        <article className="card value-card">
          <h3>Technical diligence</h3>
          <p>Infer stack, boundaries, dependencies, and complexity from repository evidence instead of README marketing copy.</p>
        </article>
        <article className="card value-card">
          <h3>Commercial assessment</h3>
          <p>Translate the codebase into likely users, monetization paths, competitor pressure, and expected build effort.</p>
        </article>
        <article className="card value-card">
          <h3>Reusable reports</h3>
          <p>Saved analyses persist in local storage so reports can be reopened, shared internally, and iterated on later.</p>
        </article>
      </section>

      <RecentAnalysesList analyses={analyses} />
    </main>
  );
}
