import { randomUUID } from 'crypto';
import type {
  AnalysisRecord,
  AnalysisReport,
  CommercialReport,
  RepoIdentity,
  RepoSnapshot,
  TechnicalReport,
} from '@/src/types/analysis';
import { appendTimeline, getAnalysis, updateAnalysis } from '@/src/lib/store';
import { fetchRepoMetadata, parseGitHubRepoUrl, prepareRepoSnapshot } from '@/src/lib/github';

const activeAnalyses = new Set<string>();

function pickFeatureBreakdown(snapshot: RepoSnapshot): string[] {
  const features = new Set<string>();

  if (snapshot.treeSample.some((item) => item.startsWith('app/') || item.startsWith('pages/'))) {
    features.add('Web application interface');
  }
  if (snapshot.treeSample.some((item) => item.includes('/api/') || item.startsWith('api/'))) {
    features.add('API or service endpoints');
  }
  if (snapshot.treeSample.some((item) => item.toLowerCase().includes('auth'))) {
    features.add('Authentication or account boundary');
  }
  if (snapshot.treeSample.some((item) => item.toLowerCase().includes('dashboard'))) {
    features.add('Dashboard or operations surface');
  }
  if (snapshot.treeSample.some((item) => item.toLowerCase().includes('admin'))) {
    features.add('Administrative tooling');
  }
  if (snapshot.treeSample.some((item) => item.toLowerCase().includes('billing') || item.toLowerCase().includes('payment'))) {
    features.add('Billing or payment workflows');
  }
  if (features.size === 0) {
    features.add('Core product surface inferred from repository structure');
  }

  return [...features];
}

function scoreComplexity(snapshot: RepoSnapshot): number {
  let score = 25;
  score += Math.min(snapshot.stats.fileCount / 12, 25);
  score += Math.min(snapshot.stats.directoryCount / 10, 15);
  score += Math.min(snapshot.stats.packageCount * 5, 15);
  score += Math.min(snapshot.stats.ciCount * 4, 10);
  if (snapshot.architectureStyle.includes('Monorepo')) {
    score += 10;
  }
  if (snapshot.frameworkSignals.length >= 4) {
    score += 8;
  }

  return Math.min(100, Math.round(score));
}

function estimateMaintenanceRisk(snapshot: RepoSnapshot, complexityScore: number): string {
  if (complexityScore >= 75) {
    return 'High: the repository shows enough surface area and moving parts that maintenance cost will climb without ownership boundaries.';
  }
  if (complexityScore >= 50) {
    return 'Moderate: the codebase looks workable, but dependency and architecture discipline will matter.';
  }

  return 'Low to moderate: the current footprint appears understandable for a small product team.';
}

function estimateRefactorRisk(snapshot: RepoSnapshot): string {
  if (snapshot.architectureStyle.includes('Monorepo')) {
    return 'Medium: refactors will likely require coordination across multiple packages and shared contracts.';
  }
  if (snapshot.treeSample.some((item) => item.toLowerCase().includes('legacy'))) {
    return 'High: legacy-marked areas suggest partial modernization work and elevated rewrite risk.';
  }

  return 'Moderate: refactors should be manageable if the current modules stay isolated during iteration.';
}

function deriveTargetUsers(repo: RepoIdentity, snapshot: RepoSnapshot): string[] {
  const description = `${repo.description ?? ''} ${snapshot.readmeExcerpt}`.toLowerCase();
  const users = new Set<string>();

  if (description.includes('developer') || description.includes('sdk') || description.includes('api')) {
    users.add('Developers and technical teams');
  }
  if (description.includes('business') || description.includes('sales') || description.includes('crm')) {
    users.add('Operations and business teams');
  }
  if (description.includes('design') || description.includes('creative')) {
    users.add('Design and creative teams');
  }
  if (users.size === 0) {
    users.add('Teams evaluating a focused software workflow');
  }

  return [...users];
}

function deriveUseCases(repo: RepoIdentity, snapshot: RepoSnapshot): string[] {
  const features = pickFeatureBreakdown(snapshot);
  return [
    `Primary use case built around ${features[0].toLowerCase()}.`,
    repo.description ? `Secondary opportunity implied by the repo description: ${repo.description}.` : 'Secondary opportunity depends on packaging the existing functionality into a repeatable workflow.',
    'Can support product discovery, diligence, or internal tooling depending on the end-user wrapper.',
  ];
}

async function runArchitectAnalysis(snapshot: RepoSnapshot): Promise<Pick<TechnicalReport, 'architectureStyle' | 'moduleBoundaries' | 'evidence'>> {
  const moduleBoundaries = [
    snapshot.treeSample.some((item) => item.startsWith('app/') || item.startsWith('src/'))
      ? 'Presentation or application entrypoints are visible in the repo tree.'
      : 'Top-level application entrypoints are not obvious from the sampled tree.',
    snapshot.stats.ciCount > 0
      ? 'Automation or CI boundary exists and should stay separate from runtime code.'
      : 'Delivery automation is lightweight or absent in the current sample.',
    snapshot.dependencyFiles.length > 1
      ? 'Dependency manifests suggest multiple concerns that should stay behind explicit interfaces.'
      : 'The current manifest surface suggests a tighter single-service boundary.',
  ];

  return {
    architectureStyle: snapshot.architectureStyle,
    moduleBoundaries,
    evidence: snapshot.evidence,
  };
}

async function runTechnicalAnalysis(snapshot: RepoSnapshot): Promise<TechnicalReport> {
  const complexityScore = scoreComplexity(snapshot);
  const stackSignals = snapshot.frameworkSignals;

  return {
    stack: {
      frontend: stackSignals.filter((item) => ['Next.js', 'React', 'Tailwind CSS'].includes(item)),
      backend: stackSignals.filter((item) => ['Express', 'NestJS', 'Fastify', 'Django', 'Flask', 'Rails', 'Spring'].includes(item)),
      data: stackSignals.filter((item) => ['Prisma', 'PostgreSQL', 'MongoDB'].includes(item)),
      infrastructure: stackSignals.filter((item) => ['Docker', 'GitHub Actions'].includes(item)),
    },
    architectureStyle: snapshot.architectureStyle,
    moduleBoundaries: [],
    featureBreakdown: pickFeatureBreakdown(snapshot),
    dependencyHealth: snapshot.dependencyFiles.length
      ? `Healthy enough for MVP analysis: inspected ${snapshot.dependencyFiles.length} manifest/config files for tooling signals.`
      : 'Thin evidence: dependency manifests were sparse, so stack confidence is limited.',
    complexityScore,
    maintenanceRisk: estimateMaintenanceRisk(snapshot, complexityScore),
    refactorRisk: estimateRefactorRisk(snapshot),
    evidence: [
      ...snapshot.evidence,
      ...snapshot.dependencyFiles.map((item) => `${item.path}: ${item.summary}`),
    ].slice(0, 8),
  };
}

async function runProductAnalysis(repo: RepoIdentity, snapshot: RepoSnapshot): Promise<{ features: string[]; useCases: string[] }> {
  return {
    features: pickFeatureBreakdown(snapshot),
    useCases: deriveUseCases(repo, snapshot),
  };
}

async function runCommercialAnalysis(repo: RepoIdentity, snapshot: RepoSnapshot): Promise<CommercialReport> {
  const users = deriveTargetUsers(repo, snapshot);
  const repoScale = repo.stars && repo.stars > 500 ? 'validated open-source traction' : 'early or niche traction';

  return {
    targetUsers: users,
    useCases: deriveUseCases(repo, snapshot),
    marketPotential: `The repository points to ${repoScale}; commercial upside depends on turning the current codebase into a dependable product experience with clear onboarding and support.`,
    monetizationOptions: [
      'Hosted SaaS with premium automation, collaboration, or reporting layers',
      'Open-core distribution with paid support or managed deployment',
      'Service-led implementation or white-label packaging for vertical buyers',
    ],
    competitorLandscape: [
      { name: 'Direct open-source alternatives', positioning: 'Likely closest on raw capability, but often weaker on packaging and support.' },
      { name: 'Vertical SaaS incumbents', positioning: 'Stronger on polish and distribution, weaker on openness or customization.' },
      { name: 'Internal build approach', positioning: 'Competes when buyers already have technical teams and narrow requirements.' },
    ],
    buildEffortEstimate: '2-6 engineer-months for a focused MVP, depending on how much of the current repository can be reused without major cleanup.',
    maintenanceEffortEstimate: snapshot.stats.ciCount > 0
      ? '1-2 engineers can likely maintain an MVP if CI and release discipline stay intact.'
      : 'Expect higher maintenance overhead until release automation and test coverage improve.',
    commercializationOpportunities: [
      'Package the strongest workflow into a self-serve SaaS offer',
      'Offer managed hosting for buyers who value support over self-hosting',
      'Expand into compliance, analytics, or team workflows once the core experience stabilizes',
    ],
    confidenceLevel: snapshot.readmeExcerpt ? 'Medium: grounded in repository structure, metadata, and README evidence.' : 'Low to medium: limited documentation reduced confidence.',
    evidence: [
      repo.description ? `Repo description: ${repo.description}` : 'Repo description unavailable.',
      snapshot.readmeExcerpt ? `README excerpt: ${snapshot.readmeExcerpt}` : 'README excerpt unavailable.',
      `Languages: ${snapshot.languages.map((item) => `${item.name} ${item.share}%`).join(', ') || 'unknown'}`,
    ],
  };
}

function mergeReports(
  repo: RepoIdentity,
  snapshot: RepoSnapshot,
  technical: TechnicalReport,
  commercial: CommercialReport,
  product: { features: string[]; useCases: string[] },
  architect: { architectureStyle: string; moduleBoundaries: string[]; evidence: string[] },
): AnalysisReport {
  const technicalWithArchitecture: TechnicalReport = {
    ...technical,
    architectureStyle: architect.architectureStyle,
    moduleBoundaries: architect.moduleBoundaries,
    featureBreakdown: product.features,
    evidence: [...technical.evidence, ...architect.evidence].slice(0, 10),
  };

  return {
    executiveSummary: {
      summary: `${repo.owner}/${repo.name} appears to be a ${technicalWithArchitecture.architectureStyle.toLowerCase()} built primarily with ${snapshot.frameworkSignals.join(', ') || repo.primaryLanguage || 'a small custom stack'}. The repository shows ${product.features.length} notable product surface areas and a complexity score of ${technicalWithArchitecture.complexityScore}/100.`,
      recommendation: technicalWithArchitecture.complexityScore >= 70
        ? 'Rebuild selectively: ship an MVP around the strongest use case first, then migrate harder edges after validation.'
        : 'Good candidate for MVP recreation: preserve the strongest workflows, simplify the edge cases, and ship quickly.',
      topTechnicalRisks: [
        technicalWithArchitecture.maintenanceRisk,
        technicalWithArchitecture.refactorRisk,
        technicalWithArchitecture.dependencyHealth,
      ],
      topCommercialOpportunities: commercial.commercializationOpportunities.slice(0, 3),
    },
    technical: technicalWithArchitecture,
    commercial: {
      ...commercial,
      useCases: product.useCases,
    },
  };
}

async function executeAnalysis(id: string): Promise<void> {
  const record = await getAnalysis(id);
  if (!record) {
    return;
  }

  const params = parseGitHubRepoUrl(record.repoUrl);
  await appendTimeline(id, 'cloning', 'Repository intake started', 'Validating the GitHub URL and loading repository metadata.');

  const repo = await fetchRepoMetadata(params);
  await updateAnalysis(id, (analysis) => ({ ...analysis, repo }));
  const snapshot = await prepareRepoSnapshot(repo);

  await updateAnalysis(id, (analysis) => ({
    ...analysis,
    status: 'analyzing',
    repo,
    snapshot,
    timeline: [
      ...analysis.timeline,
      {
        id: randomUUID(),
        status: 'analyzing',
        title: 'Snapshot prepared',
        detail: `Collected ${snapshot.treeSample.length} tree samples and ${snapshot.dependencyFiles.length} manifest summaries.`,
        timestamp: new Date().toISOString(),
      },
    ],
  }));

  const [architect, technical, product, commercial] = await Promise.all([
    runArchitectAnalysis(snapshot),
    runTechnicalAnalysis(snapshot),
    runProductAnalysis(repo, snapshot),
    runCommercialAnalysis(repo, snapshot),
  ]);

  await appendTimeline(id, 'synthesizing', 'Reports synthesizing', 'Merging technical and commercial analyses into a final report.');
  const report = mergeReports(repo, snapshot, technical, commercial, product, architect);

  await updateAnalysis(id, (analysis) => ({
    ...analysis,
    status: 'done',
    repo,
    snapshot,
    report,
    errorMessage: undefined,
    timeline: [
      ...analysis.timeline,
      {
        id: randomUUID(),
        status: 'done',
        title: 'Analysis complete',
        detail: 'Technical and commercial reports are ready to review.',
        timestamp: new Date().toISOString(),
      },
    ],
  }));
}

export function enqueueAnalysis(id: string): void {
  if (activeAnalyses.has(id)) {
    return;
  }

  activeAnalyses.add(id);

  setTimeout(async () => {
    try {
      await executeAnalysis(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected analysis failure.';
      await updateAnalysis(id, (analysis) => ({
        ...analysis,
        status: 'failed',
        errorMessage: message,
        timeline: [
          ...analysis.timeline,
          {
            id: randomUUID(),
            status: 'failed',
            title: 'Analysis failed',
            detail: message,
            timestamp: new Date().toISOString(),
          },
        ],
      }));
    } finally {
      activeAnalyses.delete(id);
    }
  }, 0);
}

export function shouldResumeAnalysis(record: AnalysisRecord): boolean {
  return ['queued', 'cloning', 'analyzing', 'synthesizing'].includes(record.status);
}
