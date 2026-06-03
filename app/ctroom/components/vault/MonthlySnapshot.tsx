'use client';

import { cn } from '@/lib/utils';
import { fmtUsd } from '@/lib/vault/bills';

export function MonthlySnapshot({
  income,
  committed,
  incomeNote,
  paycheckCount,
}: {
  income: number;
  committed: number;
  incomeNote: string;
  paycheckCount: number;
}) {
  const left = income - committed;
  const hasIncome = income > 0;

  return (
    <div
      className="rounded-3xl p-5 md:p-7"
      style={{
        background:
          'linear-gradient(160deg, rgba(110,231,160,0.08) 0%, rgba(28,25,23,0.6) 55%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p className="text-xs font-medium text-stone-400 mb-4">This month at a glance</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-stone-500 mb-1">Money in</p>
          <p className={cn('font-mono text-2xl md:text-3xl font-bold', hasIncome ? 'text-emerald-300' : 'text-stone-500')}>
            {hasIncome ? fmtUsd(income) : '—'}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">{incomeNote}</p>
        </div>
        <div className="hidden sm:flex items-center justify-center text-stone-600 text-2xl font-light">−</div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-stone-500 mb-1">Committed bills</p>
          <p className="font-mono text-2xl md:text-3xl font-bold text-rose-300/90">
            {committed > 0 ? fmtUsd(committed) : '—'}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Rent, loans, subs &amp; bills you set</p>
        </div>
      </div>
      <div
        className="mt-6 pt-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div>
          <p className="text-[11px] uppercase tracking-wide text-stone-500 mb-1">Left to work with</p>
          <p
            className={cn(
              'font-mono text-3xl md:text-4xl font-bold',
              !hasIncome ? 'text-stone-500' : left >= 0 ? 'text-white' : 'text-rose-400',
            )}
          >
            {hasIncome ? fmtUsd(left) : '—'}
          </p>
        </div>
        {hasIncome && committed > 0 && (
          <p className="text-xs text-stone-500 max-w-xs">
            {left >= 0
              ? 'After your expected bills — for food, gas, furniture, and savings.'
              : 'Your declared bills exceed detected income. Review amounts in Expected bills.'}
          </p>
        )}
        {!hasIncome && paycheckCount === 0 && (
          <p className="text-xs text-stone-500 max-w-xs">
            Link your bank and sync — we&apos;ll detect your IRC paychecks automatically.
          </p>
        )}
      </div>
    </div>
  );
}
