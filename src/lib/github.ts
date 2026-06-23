import type { RepoIdentity, RepoSnapshot } from '@/src/types/analysis';

const GITHUB_REPO_URL = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/#?]+)(?:\/tree\/([^/?#]+))?\/?$/i;
const TEXT_DECODER = new TextDecoder();
const MAX_TREE_ITEMS = 250;
const IMPORTANT_FILE_PATTERNS = [
  /^package\.json$/i,
  /^pnpm-workspace\.yaml$/i,
  /^turbo\.json$/i,
  /^dockerfile/i,
  /^docker-compose/i,
  /^requirements\.txt$/i,
  /^pyproject\.toml$/i,
  /^go\.mod$/i,
  /^Cargo\.toml$/i,
  /^pom\.xml$/i,
  /^Gemfile$/i,
  /^README/i,
  /^vercel\.json$/i,
  /^next\.config\./i,
  /^tsconfig\.json$/i,
  /^vite\.config\./i,
];

interface GitHubRepoParams {
  owner: string;
  repo: string;
  branch?: string;
}

interface GitHubRepoApiResponse {
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count: number;
  pushed_at: string;
  language: string | null;
  default_branch: string;
  topics?: string[];
  license?: { spdx_id?: string | null; name?: string | null } | null;
}

interface GitHubTreeResponse {
  truncated: boolean;
  tree: Array<{ path: string; type: 'blob' | 'tree'; size?: number }>;
}

interface GitHubContentResponse {
  path: string;
  content?: string;
  encoding?: string;
}

function percent(total: number, value: number): number {
  if (!total) {
    return 0;
  }

  return Number(((value / total) * 100).toFixed(1));
}

async function fetchGitHubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'RepoForge/0.1',
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}) for ${url}`);
  }

  return (await response.json()) as T;
}

async function fetchGitHubContent(owner: string, repo: string, filePath: string, branch: string): Promise<string | undefined> {
  const encodedPath = filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;

  try {
    const response = await fetchGitHubJson<GitHubContentResponse>(url);

    if (!response.content || response.encoding !== 'base64') {
      return undefined;
    }

    const content = Buffer.from(response.content.replace(/\n/g, ''), 'base64');
    return TEXT_DECODER.decode(content);
  } catch {
    return undefined;
  }
}

function inferFrameworkSignals(paths: string[], manifests: Array<{ path: string; content: string }>): string[] {
  const manifestText = manifests.map((item) => item.content.toLowerCase()).join('\n');
  const signals = new Set<string>();

  if (paths.some((item) => item.startsWith('app/') || item === 'next.config.js' || item === 'next.config.ts') || manifestText.includes('"next"')) {
    signals.add('Next.js');
  }
  if (manifestText.includes('"react"')) {
    signals.add('React');
  }
  if (manifestText.includes('"express"')) {
    signals.add('Express');
  }
  if (manifestText.includes('"nestjs"')) {
    signals.add('NestJS');
  }
  if (manifestText.includes('"fastify"')) {
    signals.add('Fastify');
  }
  if (manifestText.includes('django')) {
    signals.add('Django');
  }
  if (manifestText.includes('flask')) {
    signals.add('Flask');
  }
  if (manifestText.includes('rails')) {
    signals.add('Rails');
  }
  if (manifestText.includes('spring-boot') || paths.includes('pom.xml')) {
    signals.add('Spring');
  }
  if (manifestText.includes('prisma')) {
    signals.add('Prisma');
  }
  if (paths.some((item) => item.includes('.github/workflows/'))) {
    signals.add('GitHub Actions');
  }
  if (paths.some((item) => item.toLowerCase().includes('dockerfile') || item.includes('docker-compose'))) {
    signals.add('Docker');
  }
  if (manifestText.includes('tailwindcss')) {
    signals.add('Tailwind CSS');
  }
  if (manifestText.includes('postgres') || manifestText.includes('pg') || manifestText.includes('typeorm') || manifestText.includes('sequelize')) {
    signals.add('PostgreSQL');
  }
  if (manifestText.includes('mongodb') || manifestText.includes('mongoose')) {
    signals.add('MongoDB');
  }

  return [...signals];
}

function inferArchitectureStyle(paths: string[]): string {
  const hasApps = paths.some((item) => item.startsWith('apps/'));
  const hasPackages = paths.some((item) => item.startsWith('packages/'));
  const hasApi = paths.some((item) => item.startsWith('api/') || item.startsWith('server/') || item.startsWith('backend/'));
  const hasInfra = paths.some((item) => item.startsWith('infra/') || item.startsWith('terraform/') || item.startsWith('k8s/'));

  if (hasApps && hasPackages) {
    return 'Monorepo with shared packages';
  }
  if (hasApi && hasInfra) {
    return 'Layered application with separate runtime and infrastructure concerns';
  }
  if (hasApi) {
    return 'Full-stack or service-oriented application';
  }

  return 'Single repository application with mostly co-located concerns';
}

function inferDependencyFiles(paths: string[]): string[] {
  return paths.filter((item) => IMPORTANT_FILE_PATTERNS.some((pattern) => pattern.test(item.split('/').pop() ?? ''))).slice(0, 12);
}

function summarizeManifest(path: string, content: string): string {
  const trimmed = content.slice(0, 1600);
  if (path.endsWith('package.json')) {
    try {
      const pkg = JSON.parse(trimmed) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; scripts?: Record<string, string> };
      const deps = Object.keys(pkg.dependencies ?? {}).slice(0, 8);
      const devDeps = Object.keys(pkg.devDependencies ?? {}).slice(0, 6);
      const scripts = Object.keys(pkg.scripts ?? {}).slice(0, 6);
      return `deps=${deps.join(', ') || 'none'}; devDeps=${devDeps.join(', ') || 'none'}; scripts=${scripts.join(', ') || 'none'}`;
    } catch {
      return trimmed.replace(/\s+/g, ' ').slice(0, 220);
    }
  }

  return trimmed.replace(/\s+/g, ' ').slice(0, 220);
}

export function parseGitHubRepoUrl(input: string): GitHubRepoParams {
  const trimmed = input.trim();
  const match = trimmed.match(GITHUB_REPO_URL);

  if (!match) {
    throw new Error('Enter a public GitHub repository URL in the format https://github.com/owner/repo.');
  }

  const [, owner, repoName, branch] = match;

  return {
    owner,
    repo: repoName.replace(/\.git$/i, ''),
    branch,
  };
}

export async function fetchRepoMetadata(params: GitHubRepoParams): Promise<RepoIdentity> {
  const repoJson = await fetchGitHubJson<GitHubRepoApiResponse>(`https://api.github.com/repos/${params.owner}/${params.repo}`);

  return {
    owner: params.owner,
    name: params.repo,
    url: `https://github.com/${params.owner}/${params.repo}`,
    defaultBranch: params.branch ?? repoJson.default_branch,
    description: repoJson.description ?? undefined,
    homepage: repoJson.homepage ?? undefined,
    stars: repoJson.stargazers_count,
    forks: repoJson.forks_count,
    openIssues: repoJson.open_issues_count,
    watchers: repoJson.subscribers_count,
    lastPushedAt: repoJson.pushed_at,
    primaryLanguage: repoJson.language ?? undefined,
    topics: repoJson.topics ?? [],
    license: repoJson.license?.spdx_id ?? repoJson.license?.name ?? undefined,
  };
}

export async function prepareRepoSnapshot(repo: RepoIdentity): Promise<RepoSnapshot> {
  const branch = repo.defaultBranch ?? 'main';
  const languagesJson = await fetchGitHubJson<Record<string, number>>(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/languages`,
  );
  const treeJson = await fetchGitHubJson<GitHubTreeResponse>(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );

  const tree = treeJson.tree.slice(0, MAX_TREE_ITEMS);
  const paths = tree.map((item) => item.path);
  const importantFiles = inferDependencyFiles(paths);
  const manifests = await Promise.all(
    importantFiles.slice(0, 8).map(async (filePath) => {
      const content = await fetchGitHubContent(repo.owner, repo.name, filePath, branch);
      return content ? { path: filePath, content } : undefined;
    }),
  );

  const readme = manifests.find((item) => item?.path.toLowerCase().startsWith('readme'))?.content ?? '';
  const filteredManifests = manifests.filter((item): item is { path: string; content: string } => Boolean(item));
  const frameworkSignals = inferFrameworkSignals(paths, filteredManifests);
  const languageTotal = Object.values(languagesJson).reduce((sum, value) => sum + value, 0);
  const evidence = [
    `Sampled ${tree.length}${treeJson.truncated ? '+' : ''} tree entries from ${branch}.`,
    `Detected important files: ${importantFiles.join(', ') || 'none found'}.`,
    frameworkSignals.length ? `Framework signals: ${frameworkSignals.join(', ')}.` : 'No strong framework signals found.',
  ];

  return {
    languages: Object.entries(languagesJson)
      .map(([name, bytes]) => ({ name, bytes, share: percent(languageTotal, bytes) }))
      .sort((a, b) => b.bytes - a.bytes),
    frameworkSignals,
    architectureStyle: inferArchitectureStyle(paths),
    dependencyFiles: filteredManifests.map((item) => ({
      path: item.path,
      summary: summarizeManifest(item.path, item.content),
    })),
    manifests: filteredManifests,
    importantFiles,
    treeSample: paths.slice(0, 40),
    stats: {
      fileCount: tree.filter((item) => item.type === 'blob').length,
      directoryCount: tree.filter((item) => item.type === 'tree').length,
      configCount: paths.filter((item) => /(config|\.json$|\.ya?ml$|\.toml$|\.ini$)/i.test(item)).length,
      ciCount: paths.filter((item) => item.startsWith('.github/workflows/') || item.includes('circleci') || item.includes('gitlab-ci')).length,
      packageCount: paths.filter((item) => /(package\.json|requirements\.txt|pyproject\.toml|go\.mod|Cargo\.toml|pom\.xml|Gemfile)$/i.test(item)).length,
      docsCount: paths.filter((item) => item.toLowerCase().includes('docs') || item.toLowerCase().startsWith('readme')).length,
    },
    readmeExcerpt: readme.replace(/\s+/g, ' ').trim().slice(0, 700),
    evidence,
  };
}
