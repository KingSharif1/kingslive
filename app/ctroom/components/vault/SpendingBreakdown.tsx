'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { VaultTransaction } from '../../types/index';
import { fmtUsd } from '@/lib/vault/bills';
import {
  buildCategorySpend,
  buildMonthSummary,
  CATEGORY_COLORS,
  isRealExpense,
} from '@/lib/vault/spendingInsights';
import { cn } from '@/lib/utils';

function prettyMerchant(name: string | null | undefined, fallback?: string | null): string {
  const src = (name || fallback || '').trim();
  return src || 'Unknown';
}

export function SpendingBreakdown({
  transactions,
  allTransactions,
  onTxClick,
  onCategorySelect,
  selectedCategory,
}: {
  transactions: VaultTransaction[];
  allTransactions: VaultTransaction[];
  onTxClick: (tx: VaultTransaction) => void;
  onCategorySelect: (cat: string | null) => void;
  selectedCategory: string | null;
}) {
  const [includeBills, setIncludeBills] = useState(true);
  const ref = new Date();

  const summary = useMemo(() => buildMonthSummary(allTransactions, ref), [allTransactions]);
  const categories = useMemo(
    () => buildCategorySpend(transactions, ref, includeBills),
    [transactions, includeBills],
  );
  const totalSpend = categories.reduce((s, c) => s + c.amount, 0);

  const donutStyle = useMemo(() => {
    if (totalSpend <= 0) return { background: '#292524' };
    let acc = 0;
    const stops: string[] = [];
    categories.slice(0, 8).forEach((c, i) => {
      const pct = (c.amount / totalSpend) * 100;
      const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
      stops.push(`${color} ${acc}% ${acc + pct}%`);
      acc += pct;
    });
    if (acc < 100) stops.push(`#44403c ${acc}% 100%`);
    return { background: `conic-gradient(${stops.join(', ')})` };
  }, [categories, totalSpend]);

  const categoryTxs = useMemo(() => {
    if (!selectedCategory) return [];
    return transactions
      .filter(t => isRealExpense(t) && (t.category || 'Uncategorized') === selectedCategory)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedCategory]);

  const insight =
    categories.length >= 2 && categories[0].changePct != null && categories[0].changePct > 20
      ? `${categories[0].name} is up ${categories[0].changePct}% vs last month — your biggest mover.`
      : summary.leftForSavings < 0
        ? `You spent ${fmtUsd(Math.abs(summary.leftForSavings))} more than you brought in this period.`
        : summary.income > 0
          ? `About ${summary.billPctOfIncome}% of income went to bills; the rest is spending and savings room.`
          : null;

  return (
    <div className="space-y-5">
      {insight && (
        <p className="text-sm text-stone-400 leading-relaxed rounded-2xl px-4 py-3 bg-stone-900/50 border border-stone-800/60">
          {insight}
        </p>
      )}

      <div className="grid md:grid-cols-[1fr_200px] gap-4">
        <div className="rounded-2xl p-4 bg-stone-900/40 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-36 h-36 rounded-full flex-shrink-0" style={donutStyle}>
            <div className="absolute inset-4 rounded-full bg-[#0c0a09] flex flex-col items-center justify-center text-center">
              <p className="text-[9px] uppercase text-stone-600 tracking-wide">Total spend</p>
              <p className="font-mono text-lg font-bold text-stone-100">{fmtUsd(totalSpend)}</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer">
            <input
              type="checkbox"
              checked={includeBills}
              onChange={e => setIncludeBills(e.target.checked)}
              className="rounded border-stone-600"
            />
            Include bills in chart
          </label>
        </div>

        <div className="rounded-2xl p-4 bg-stone-900/40 space-y-3 text-sm">
          <p className="text-[10px] uppercase text-stone-600 tracking-wide">Summary</p>
          <div>
            <p className="text-[11px] text-stone-500">Income</p>
            <p className="font-mono font-semibold text-emerald-400">
              {summary.income > 0 ? `+${fmtUsd(summary.income)}` : '—'}
            </p>
            {summary.incomeEvents > 0 && (
              <p className="text-[10px] text-stone-600">{summary.incomeEvents} deposits</p>
            )}
          </div>
          <div>
            <p className="text-[11px] text-stone-500">Bills</p>
            <p className="font-mono font-semibold text-stone-300">−{fmtUsd(summary.bills)}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-500">Other spending</p>
            <p className="font-mono font-semibold text-stone-300">−{fmtUsd(summary.spending)}</p>
          </div>
          <div className="pt-2 border-t border-stone-800">
            <p className="text-[11px] text-stone-500">Left after all</p>
            <p
              className={cn(
                'font-mono font-semibold',
                summary.leftForSavings >= 0 ? 'text-stone-100' : 'text-rose-400',
              )}
            >
              {summary.income > 0 ? fmtUsd(summary.leftForSavings) : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide px-1">By category</p>
        {categories.length === 0 ? (
          <p className="text-sm text-stone-500 py-6 text-center">No spending in this period.</p>
        ) : (
          categories.map((cat, i) => {
            const selected = selectedCategory === cat.name;
            return (
              <div key={cat.name}>
                <button
                  type="button"
                  onClick={() => onCategorySelect(selected ? null : cat.name)}
                  className={cn(
                    'w-full rounded-xl px-4 py-3 text-left transition-colors',
                    selected ? 'bg-stone-800/90 ring-1 ring-stone-600' : 'bg-stone-900/30 hover:bg-stone-900/50',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                    />
                    <span className="flex-1 text-sm text-stone-200">{cat.name}</span>
                    <span className="text-[11px] text-stone-500 w-12 text-right">{cat.pct}%</span>
                    {cat.changePct != null && (
                      <span
                        className={cn(
                          'flex items-center gap-0.5 text-[11px] w-14 justify-end',
                          cat.changePct > 0 ? 'text-stone-400' : 'text-emerald-500/80',
                        )}
                      >
                        {cat.changePct > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(cat.changePct)}%
                      </span>
                    )}
                    <span className="font-mono text-sm text-stone-300 w-20 text-right">{fmtUsd(cat.amount)}</span>
                  </div>
                </button>
                {selected && (
                  <div className="mt-1 ml-6 pl-3 border-l border-stone-700 max-h-56 overflow-y-auto">
                    {categoryTxs.map(tx => (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => onTxClick(tx)}
                        className="w-full flex justify-between gap-2 py-2 text-left hover:bg-stone-900/40 rounded-lg px-2"
                      >
                        <span className="text-xs text-stone-400 truncate">
                          {prettyMerchant(tx.merchant, tx.description)} ·{' '}
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs font-mono text-stone-300">{fmtUsd(tx.amount)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
