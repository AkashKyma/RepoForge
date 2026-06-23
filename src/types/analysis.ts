export type AnalysisStatus = 'queued' | 'cloning' | 'analyzing' | 'synthesizing' | 'done' | 'failed';

export interface TimelineEntry {
  id: string;
  status: AnalysisStatus;
  title: string;
  detail: string;
  timestamp: string;
}

export interface RepoIdentity {
  owner: string;
  name: string;
  url: string;
  defaultBranch?: string;
  description?: string;
  homepage?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  watchers?: number;
  lastPushedAt?: string;
  primaryLanguage?: string;
  topics?: string[];
  license?: string;
}

export interface RepoSnapshot {
  languages: Array<{ name: string; bytes: number; share: number }>;
  frameworkSignals: string[];
  architectureStyle: string;
  dependencyFiles: Array<{ path: string; summary: string }>;
  manifests: Array<{ path: string; content: string }>;
  importantFiles: string[];
  treeSample: string[];
  stats: {
    fileCount: number;
    directoryCount: number;
    configCount: number;
    ciCount: number;
    packageCount: number;
    docsCount: number;
  };
  readmeExcerpt: string;
  evidence: string[];
}

export interface TechnicalReport {
  stack: {
    frontend: string[];
    backend: string[];
    data: string[];
    infrastructure: string[];
  };
  architectureStyle: string;
  moduleBoundaries: string[];
  featureBreakdown: string[];
  dependencyHealth: string;
  complexityScore: number;
  maintenanceRisk: string;
  refactorRisk: string;
  evidence: string[];
}

export interface CommercialReport {
  targetUsers: string[];
  useCases: string[];
  marketPotential: string;
  monetizationOptions: string[];
  competitorLandscape: Array<{ name: string; positioning: string }>;
  buildEffortEstimate: string;
  maintenanceEffortEstimate: string;
  commercializationOpportunities: string[];
  confidenceLevel: string;
  evidence: string[];
}

export interface ExecutiveSummary {
  summary: string;
  recommendation: string;
  topTechnicalRisks: string[];
  topCommercialOpportunities: string[];
}

export interface AnalysisReport {
  executiveSummary: ExecutiveSummary;
  technical: TechnicalReport;
  commercial: CommercialReport;
}

export interface AnalysisRecord {
  id: string;
  repoUrl: string;
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
  repo?: RepoIdentity;
  snapshot?: RepoSnapshot;
  report?: AnalysisReport;
  timeline: TimelineEntry[];
  errorMessage?: string;
}

export interface AnalysisListItem {
  id: string;
  repoUrl: string;
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
  repo?: RepoIdentity;
}
