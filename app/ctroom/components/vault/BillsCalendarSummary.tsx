'use client';

import { CalendarClock } from 'lucide-react';
import type { Subscription } from '../../types/index';
import { fmtUsd } from '@/lib/vault/bills';
import { getUpcomingBills } from '@/lib/vault/upcoming';

export function BillsCalendarSummary({ subscriptions }: { subscriptions: Subscription[] }) {
  const upcoming = getUpcomingBills(subscriptions, 30);
  const next7 = upcoming.filter(p => p.daysUntil <= 7);
  const next7Total = next7.reduce((s, p) => s + p.amount, 0);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl px-4 py-3 bg-stone-900/40 text-xs text-stone-500">
        Set expected bills on the <span className="text-stone-400">See</span> tab to preview what&apos;s due.
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 bg-stone-900/40 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-400 flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          Coming up
        </p>
        {next7.length > 0 && (
          <p className="text-xs font-mono text-amber-400/90">
            {fmtUsd(next7Total)} due in 7 days
          </p>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {upcoming.slice(0, 8).map((p, i) => (
          <div
            key={`${p.name}-${i}`}
            className="flex-shrink-0 px-3 py-2 rounded-xl bg-stone-950/50 min-w-[120px]"
          >
            <p className="text-[10px] text-stone-500">
              {p.daysUntil === 0 ? 'Today' : p.daysUntil === 1 ? 'Tomorrow' : `in ${p.daysUntil}d`}
            </p>
            <p className="text-sm text-stone-200 truncate">
              {p.emoji} {p.name}
            </p>
            <p className="font-mono text-xs text-stone-400">{fmtUsd(p.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
