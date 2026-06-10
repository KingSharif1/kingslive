'use client';

import type { HealthMetric } from '@/lib/vault/financeSnapshot';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  good: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
  warn: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
  bad: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
};

export function HealthCheckCard({
  metrics,
  healthScore,
}: {
  metrics: HealthMetric[];
  healthScore: number;
}) {
  return (
    <div className="rounded-2xl p-4 md:p-5 bg-stone-900/40 border border-stone-800/60 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
          Financial health check
        </p>
        <span className="text-xs font-mono text-stone-500">Score {healthScore}/100</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.map(m => (
          <div
            key={m.key}
            className={cn(
              'rounded-xl p-3 border',
              STATUS_STYLES[m.status] || STATUS_STYLES.warn,
            )}
          >
            <p className="text-[11px] uppercase tracking-wide opacity-80">{m.label}</p>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <p className="font-mono text-lg font-bold">{m.currentLabel}</p>
              <p className="text-[10px] opacity-70">Target: {m.targetLabel}</p>
            </div>
            {m.detail && <p className="text-[10px] mt-1 opacity-60">{m.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
