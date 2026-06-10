'use client';

import type { SnapshotData } from '@/lib/vault/financeSnapshot';
import { fmtUsd } from '@/lib/vault/bills';
import { cn } from '@/lib/utils';

export function FinanceSnapshotCard({ snapshot }: { snapshot: SnapshotData }) {
  const hasIncome = snapshot.income > 0;
  const expenseBuckets = snapshot.buckets.filter(b => b.key !== 'income');

  return (
    <div
      className="rounded-3xl p-5 md:p-6 space-y-4"
      style={{
        background:
          'linear-gradient(160deg, rgba(110,231,160,0.08) 0%, rgba(28,25,23,0.6) 55%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Monthly snapshot</p>
      <p className="text-[11px] text-stone-600">{snapshot.monthLabel}</p>

      {!hasIncome ? (
        <p className="text-sm text-stone-500 py-4">
          Sync your bank to see income and spending buckets for this month.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {snapshot.buckets.map(b => (
              <div key={b.key} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span
                    className={cn(
                      b.key === 'income' ? 'text-emerald-300/90 font-medium' : 'text-stone-400',
                    )}
                  >
                    {b.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-stone-600 w-12 text-right">
                      {b.pctOfIncome.toFixed(1)}%
                    </span>
                    <span
                      className={cn(
                        'font-mono text-sm font-semibold w-24 text-right',
                        b.key === 'income' ? 'text-emerald-300' : 'text-stone-200',
                      )}
                    >
                      {fmtUsd(b.amount)}
                    </span>
                  </div>
                </div>
                {b.key !== 'income' && (
                  <div className="h-1 rounded-full bg-stone-800/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-stone-500/60"
                      style={{ width: `${Math.min(100, b.pctOfIncome)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            className="pt-4 mt-2 flex items-end justify-between gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div>
              <p className="text-[11px] uppercase tracking-wide text-stone-500 mb-1">Net remaining</p>
              <p
                className={cn(
                  'font-mono text-3xl font-bold',
                  snapshot.netRemaining >= 0 ? 'text-white' : 'text-rose-400',
                )}
              >
                {fmtUsd(snapshot.netRemaining)}
              </p>
            </div>
            <p className="text-sm text-stone-500">
              {snapshot.netRemainingPct.toFixed(1)}% of income
            </p>
          </div>

          {expenseBuckets.every(b => b.amount === 0) && (
            <p className="text-xs text-stone-600">
              Income detected — categorize transactions or set bill targets in Plan → Assign.
            </p>
          )}
        </>
      )}
    </div>
  );
}
