import { NextRequest, NextResponse } from 'next/server';
import { enqueueAnalysis } from '@/src/lib/analyzer';
import { parseGitHubRepoUrl } from '@/src/lib/github';
import { createAnalysis, listAnalyses } from '@/src/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const analyses = await listAnalyses(20);
  return NextResponse.json(analyses);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { repoUrl?: string };
    const repoUrl = body.repoUrl?.trim();

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required.' }, { status: 400 });
    }

    parseGitHubRepoUrl(repoUrl);

    const analysis = await createAnalysis(repoUrl);
    enqueueAnalysis(analysis.id);

    return NextResponse.json({ id: analysis.id, status: analysis.status }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create analysis.';
    const status = message.includes('public GitHub repository URL') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
