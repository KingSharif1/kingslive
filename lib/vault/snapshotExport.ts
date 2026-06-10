import type { SnapshotData } from '@/lib/vault/financeSnapshot';

export function snapshotToCsv(data: SnapshotData): string {
  const lines: string[] = [
    'Personal Finance Snapshot',
    `Month,${data.monthLabel}`,
    `Generated,${new Date(data.generatedAt).toLocaleString()}`,
    '',
    'Category,Amount,% of Income',
    ...data.buckets.map(b => `${b.label},${b.amount.toFixed(2)},${b.pctOfIncome.toFixed(1)}%`),
    `Net Remaining,${data.netRemaining.toFixed(2)},${data.netRemainingPct.toFixed(1)}%`,
    '',
    'Health Metric,Current,Target,Status',
    ...data.health.map(h => `${h.label},${h.currentLabel},${h.targetLabel},${h.status}`),
    '',
    `Health Score,${data.healthScore}/100`,
    `Total Debt,${data.debtTotal.toFixed(2)}`,
    `Goal Progress Avg,${data.goalProgressPct}%`,
    '',
    '50/30/20 Split',
    `Needs,${data.needsWantsSavings.needsPct}%`,
    `Wants,${data.needsWantsSavings.wantsPct}%`,
    `Savings,${data.needsWantsSavings.savingsPct}%`,
  ];
  return lines.join('\n');
}

export function downloadCsv(data: SnapshotData, filename?: string) {
  const csv = snapshotToCsv(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `vault-snapshot-${data.monthKey}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function snapshotToPdf(data: SnapshotData): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 48;
  let y = margin;

  const line = (text: string, size = 10, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(text, margin, y);
    y += size + 6;
  };

  line('PERSONAL FINANCE DASHBOARD', 16, true);
  line(data.monthLabel, 11);
  line(`Generated ${new Date(data.generatedAt).toLocaleString()}`, 9);
  y += 8;

  line('Monthly Snapshot', 12, true);
  for (const b of data.buckets) {
    line(
      `${b.label.padEnd(28)} ${b.pctOfIncome.toFixed(1).padStart(6)}%   $${b.amount.toFixed(2)}`,
      10,
    );
  }
  line(`NET REMAINING`.padEnd(28) + ` ${data.netRemainingPct.toFixed(1).padStart(6)}%   $${data.netRemaining.toFixed(2)}`, 10, true);
  y += 10;

  line('Financial Health Check', 12, true);
  for (const h of data.health) {
    line(`${h.label}: ${h.currentLabel}  (target ${h.targetLabel})`, 10);
  }
  line(`Overall health score: ${data.healthScore}/100`, 10);
  y += 8;

  line(`50/30/20 — Needs ${data.needsWantsSavings.needsPct}% / Wants ${data.needsWantsSavings.wantsPct}% / Savings ${data.needsWantsSavings.savingsPct}%`, 10);
  line(`Total debt: $${data.debtTotal.toFixed(2)}`, 10);

  return doc.output('blob');
}

export async function downloadPdf(data: SnapshotData, filename?: string) {
  const blob = await snapshotToPdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `vault-snapshot-${data.monthKey}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
