'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { VaultAccount, VaultTransaction } from '../../types/index';
import { fmtUsd } from '@/lib/vault/bills';
import { ActivityTab } from './ActivityTab';
import { SpendingBreakdown } from './SpendingBreakdown';
import { cn } from '@/lib/utils';

function toLocalMidnight(d: Date | string): Date {
  if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const parsed = new Date(d);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function isRealExpense(tx: VaultTransaction): boolean {
  return tx.type === 'expense' && tx.category !== 'Transfer';
}

export function UnderstandTab({
  transactions,
  allTransactions,
  accounts,
  onTxClick,
}: {
  transactions: VaultTransaction[];
  allTransactions: VaultTransaction[];
  accounts: VaultAccount[];
  onTxClick: (tx: VaultTransaction) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showActivity, setShowActivity] = useState(false);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthTxs = allTransactions.filter(t => toLocalMidnight(t.date) >= monthStart);
  const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxs.filter(isRealExpense).reduce((s, t) => s + t.amount, 0);
  const left = income - expenses;

  const monthlyBars = useMemo(() => {
    const bars: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const txs = allTransactions.filter(t => {
        const td = toLocalMidnight(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      bars.push({
        month: label,
        income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expenses: txs.filter(isRealExpense).reduce((s, t) => s + t.amount, 0),
      });
    }
    return bars;
  }, [allTransactions, now]);

  const maxBar = Math.max(...monthlyBars.flatMap(b => [b.income, b.expenses]), 1);

  const narrative =
    income <= 0
      ? 'Sync your bank to see income and spending for this month.'
      : left >= 0
        ? `After spending, you have about ${fmtUsd(left)} left from what came in this month.`
        : `You spent ${fmtUsd(Math.abs(left))} more than you brought in this month.`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-3xl p-5 bg-stone-900/40 backdrop-blur-sm space-y-2">
        <p className="text-xs text-stone-500 uppercase tracking-wide">This month at a glance</p>
        <p className="text-sm text-stone-400 leading-relaxed">{narrative}</p>
      </div>

      <SpendingBreakdown
        transactions={transactions}
        allTransactions={allTransactions}
        onTxClick={onTxClick}
        onCategorySelect={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      {monthlyBars.some(b => b.income > 0 || b.expenses > 0) && (
        <div className="rounded-2xl p-4 bg-stone-900/40 space-y-3">
          <p className="text-xs font-semibold text-stone-400">Last 6 months</p>
          <div className="flex items-end gap-2 h-32">
            {monthlyBars.map(b => (
              <div key={b.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex gap-0.5 items-end justify-center h-24">
                  <div
                    className="w-[42%] rounded-t bg-emerald-500/50"
                    style={{ height: `${Math.max(4, (b.income / maxBar) * 100)}%` }}
                    title={`Income ${fmtUsd(b.income)}`}
                  />
                  <div
                    className="w-[42%] rounded-t bg-rose-500/40"
                    style={{ height: `${Math.max(4, (b.expenses / maxBar) * 100)}%` }}
                    title={`Spent ${fmtUsd(b.expenses)}`}
                  />
                </div>
                <span className="text-[10px] text-stone-600">{b.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-[10px] text-stone-500 justify-center">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-emerald-500/50" /> Income
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-rose-500/40" /> Spent
            </span>
          </div>
        </div>
      )}

      <div className="border-t border-stone-800/80 pt-4">
        <button
          type="button"
          onClick={() => setShowActivity(s => !s)}
          className="w-full flex items-center justify-between text-sm font-medium text-stone-400 hover:text-stone-200"
        >
          All transactions
          {showActivity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showActivity && (
          <div className="mt-4">
            <ActivityTab transactions={transactions} accounts={accounts} onTxClick={onTxClick} />
          </div>
        )}
      </div>
    </div>
  );
}
