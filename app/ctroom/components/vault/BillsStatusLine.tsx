'use client';

import { CalendarClock, CheckCircle2 } from 'lucide-react';
import type { BillsStatus } from '@/lib/vault/bills';
import { fmtUsd } from '@/lib/vault/bills';

export function BillsStatusLine({ status }: { status: BillsStatus }) {
  if (status.liveCount === 0) {
    return (
      <p className="text-xs text-stone-500 px-1">
        Add your expected bills below so Vault knows what&apos;s committed each month.
      </p>
    );
  }

  const allPaid = status.paidThisMonth >= status.liveCount && status.liveCount > 0;
  const nextLabel =
    status.nextName && status.nextDays !== undefined
      ? `Next: ${status.nextName}${status.nextAmount ? ` (${fmtUsd(status.nextAmount)})` : ''} · ${
          status.nextDays === 0 ? 'today' : status.nextDays === 1 ? 'tomorrow' : `in ${status.nextDays} days`
        }`
      : null;

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-2xl text-xs"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {allPaid ? (
        <span className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          All {status.liveCount} bills look paid this month
        </span>
      ) : (
        <span className="text-stone-400">
          <span className="text-stone-200 font-medium">{status.paidThisMonth}</span> of{' '}
          <span className="text-stone-200 font-medium">{status.liveCount}</span> bills paid this month
        </span>
      )}
      {nextLabel && (
        <span className="flex items-center gap-1.5 text-stone-500">
          <CalendarClock className="w-3.5 h-3.5 text-stone-600" />
          {nextLabel}
        </span>
      )}
      <span className="text-stone-600 ml-auto font-mono">{fmtUsd(status.monthlyTotal)}/mo committed</span>
    </div>
  );
}
