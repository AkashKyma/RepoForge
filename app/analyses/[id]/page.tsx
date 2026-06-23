import { notFound } from 'next/navigation';
import { AnalysisDetailClient } from '@/components/AnalysisDetailClient';
import { enqueueAnalysis, shouldResumeAnalysis } from '@/src/lib/analyzer';
import { getAnalysis } from '@/src/lib/store';

export const dynamic = 'force-dynamic';

export default async function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = await getAnalysis(id);

  if (!analysis) {
    notFound();
  }

  if (shouldResumeAnalysis(analysis)) {
    enqueueAnalysis(analysis.id);
  }

  return <AnalysisDetailClient initialAnalysis={analysis} />;
}
