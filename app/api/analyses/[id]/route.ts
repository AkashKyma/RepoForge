import { NextResponse } from 'next/server';
import { enqueueAnalysis, shouldResumeAnalysis } from '@/src/lib/analyzer';
import { getAnalysis } from '@/src/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = await getAnalysis(id);

  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 });
  }

  if (shouldResumeAnalysis(analysis)) {
    enqueueAnalysis(analysis.id);
  }

  return NextResponse.json(analysis, { status: 200 });
}
