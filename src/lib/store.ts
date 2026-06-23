import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { AnalysisListItem, AnalysisRecord, AnalysisStatus, TimelineEntry } from '@/src/types/analysis';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'analyses.json');

interface AnalysisStore {
  analyses: AnalysisRecord[];
}

const EMPTY_STORE: AnalysisStore = { analyses: [] };

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2), 'utf8');
  }
}

async function readStore(): Promise<AnalysisStore> {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, 'utf8');

  try {
    const parsed = JSON.parse(raw) as AnalysisStore;
    return parsed.analyses ? parsed : EMPTY_STORE;
  } catch {
    return EMPTY_STORE;
  }
}

async function writeStore(store: AnalysisStore): Promise<void> {
  await ensureStore();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function createTimelineEntry(status: AnalysisStatus, title: string, detail: string): TimelineEntry {
  return {
    id: randomUUID(),
    status,
    title,
    detail,
    timestamp: new Date().toISOString(),
  };
}

export async function listAnalyses(limit = 8): Promise<AnalysisListItem[]> {
  const store = await readStore();

  return [...store.analyses]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(({ id, repoUrl, status, createdAt, updatedAt, repo }) => ({
      id,
      repoUrl,
      status,
      createdAt,
      updatedAt,
      repo,
    }));
}

export async function getAnalysis(id: string): Promise<AnalysisRecord | undefined> {
  const store = await readStore();
  return store.analyses.find((analysis) => analysis.id === id);
}

export async function createAnalysis(repoUrl: string): Promise<AnalysisRecord> {
  const store = await readStore();
  const now = new Date().toISOString();

  const analysis: AnalysisRecord = {
    id: randomUUID(),
    repoUrl,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    timeline: [
      createTimelineEntry('queued', 'Analysis queued', 'Repository URL accepted and queued for intake.'),
    ],
  };

  store.analyses.push(analysis);
  await writeStore(store);

  return analysis;
}

export async function updateAnalysis(
  id: string,
  updater: (analysis: AnalysisRecord) => AnalysisRecord,
): Promise<AnalysisRecord | undefined> {
  const store = await readStore();
  const index = store.analyses.findIndex((analysis) => analysis.id === id);

  if (index === -1) {
    return undefined;
  }

  const updated = updater(store.analyses[index]);
  updated.updatedAt = new Date().toISOString();
  store.analyses[index] = updated;
  await writeStore(store);

  return updated;
}

export async function appendTimeline(
  id: string,
  status: AnalysisStatus,
  title: string,
  detail: string,
): Promise<AnalysisRecord | undefined> {
  return updateAnalysis(id, (analysis) => ({
    ...analysis,
    status,
    timeline: [...analysis.timeline, createTimelineEntry(status, title, detail)],
  }));
}
