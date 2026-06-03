'use client';

import { fmtUsd } from '@/lib/vault/bills';
import type { UpcomingBill } from '@/lib/vault/upcoming';
import { cn } from '@/lib/utils';

export function BillsTimeline({
  bills,
  days = 14,
  onSelect,
}: {
  bills: UpcomingBill[];
  days?: number;
  onSelect?: (bill: UpcomingBill) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cols: { date: Date; label: string; isToday: boolean; items: UpcomingBill[]; total: number }[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const items = bills.filter(b => {
      const nd = new Date(b.nextDate);
      nd.setHours(0, 0, 0, 0);
      return nd.getTime() === d.getTime();
    });
    const total = items.reduce((s, b) => s + (b.billType === 'income' ? -b.amount : b.amount), 0);
    cols.push({
      date: d,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: i === 0,
      items,
      total,
    });
  }

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex gap-2 min-w-max">
        {cols.map(col => (
          <div
            key={col.date.toISOString()}
            className={cn(
              'w-[72px] flex-shrink-0 rounded-xl p-2 flex flex-col items-center gap-1',
              col.isToday ? 'bg-rose-500/10 ring-1 ring-rose-500/25' : 'bg-stone-900/40',
            )}
          >
            <p className={cn('text-[10px] font-medium', col.isToday ? 'text-rose-300' : 'text-stone-500')}>
              {col.isToday ? 'Today' : col.label}
            </p>
            <p className="text-xs font-mono text-stone-400">{col.date.getDate()}</p>
            <div className="flex flex-wrap gap-0.5 justify-center min-h-[28px]">
              {col.items.slice(0, 3).map(b => (
                <button
                  key={b.id}
                  type="button"
                  title={b.name}
                  onClick={() => onSelect?.(b)}
                  className="text-base leading-none hover:scale-110 transition-transform"
                >
                  {b.emoji}
                </button>
              ))}
            </div>
            {col.items.length > 0 && (
              <p
                className={cn(
                  'text-[10px] font-mono font-semibold',
                  col.total < 0 ? 'text-emerald-400' : 'text-stone-300',
                )}
              >
                {col.total < 0 ? '+' : ''}
                {fmtUsd(Math.abs(col.total))}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
