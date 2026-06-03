'use client';

import { useState } from 'react';
import { fmtUsd } from '@/lib/vault/bills';

export interface CalendarPayment {
  key: string;
  name: string;
  emoji: string;
  amount: number;
  nextDate: Date;
  color?: string;
}

export function RecurringCalendar({
  upcoming,
  onDayClick,
}: {
  upcoming: CalendarPayment[];
  onDayClick?: (date: Date, payments: CalendarPayment[]) => void;
}) {
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const paymentsOn = (day: number) =>
    upcoming.filter(p => {
      const d = new Date(p.nextDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  const monthTotal = upcoming
    .filter(p => p.nextDate.getFullYear() === year && p.nextDate.getMonth() === month)
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCalMonth(new Date(year, month - 1, 1))}
          className="px-3 py-1.5 rounded-lg text-xs text-stone-500 bg-stone-800/50 hover:bg-stone-800"
        >
          ← Prev
        </button>
        <div className="text-center">
          <p className="font-semibold text-sm text-stone-200">
            {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <p className="text-[11px] text-stone-500">{fmtUsd(monthTotal)} due this month</p>
        </div>
        <button
          type="button"
          onClick={() => setCalMonth(new Date(year, month + 1, 1))}
          className="px-3 py-1.5 rounded-lg text-xs text-stone-500 bg-stone-800/50 hover:bg-stone-800"
        >
          Next →
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-stone-600 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="aspect-square" />;
          const pms = paymentsOn(day);
          const isToday = isCurrentMonth && day === today.getDate();
          const total = pms.reduce((s, p) => s + p.amount, 0);
          const clickable = pms.length > 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => clickable && onDayClick?.(new Date(year, month, day), pms)}
              disabled={!clickable}
              className="flex flex-col items-center py-1.5 rounded-xl gap-0.5 min-h-[52px] transition-colors"
              style={{
                background: isToday
                  ? 'rgba(239,68,68,0.1)'
                  : pms.length
                    ? 'rgba(139,92,246,0.08)'
                    : 'rgba(255,255,255,0.02)',
                border: isToday
                  ? '1px solid rgba(239,68,68,0.35)'
                  : pms.length
                    ? '1px solid rgba(139,92,246,0.2)'
                    : '1px solid transparent',
                cursor: clickable ? 'pointer' : 'default',
                opacity: !isToday && isCurrentMonth && day < today.getDate() ? 0.45 : 1,
              }}
            >
              <span className={`text-xs font-semibold ${isToday ? 'text-rose-400' : 'text-stone-400'}`}>
                {day}
              </span>
              {pms.length > 0 && (
                <span className="text-[9px] font-mono text-amber-400/90">${Math.round(total)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
