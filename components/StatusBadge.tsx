import type { AnalysisStatus } from '@/src/types/analysis';

const statusLabel: Record<AnalysisStatus, string> = {
  queued: 'Queued',
  cloning: 'Intake',
  analyzing: 'Analyzing',
  synthesizing: 'Synthesizing',
  done: 'Complete',
  failed: 'Failed',
};

export function StatusBadge({ status }: { status: AnalysisStatus }) {
  return <span className={`status-badge status-${status}`}>{statusLabel[status]}</span>;
}
