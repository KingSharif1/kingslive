'use client';

import type { Subscription, VaultAccount, VaultTransaction } from '../../types/index';
import { fmtUsd, toMonthly } from '@/lib/vault/bills';

export function CashFlowSummary({
  accounts,
  transactions,
  subscriptions,
}: {
  accounts: VaultAccount[];
  transactions: VaultTransaction[];
  subscriptions: Subscription[];
}) {
  const liquidBalance = accounts
    .filter(a => a.type === 'checking' || a.type === 'savings' || a.type === 'cash')
    .reduce((s, a) => s + a.balance, 0);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = Math.max(0, daysInMonth - dayOfMonth);

  const expenses = transactions.filter(t => t.type === 'expense' && t.category !== 'Transfer');
  const avgDailyExpense =
    dayOfMonth > 0 && expenses.length > 0
      ? expenses.reduce((s, t) => s + t.amount, 0) / dayOfMonth
      : 0;

  const projectedRemaining = avgDailyExpense * daysLeft;
  const activeSubMonthly = subscriptions
    .filter(s => (s.status || (s.isActive ? 'active' : 'cancelled')) === 'active')
    .reduce((s, sub) => s + toMonthly(sub.amount, sub.frequency), 0);
  const eomForecast = liquidBalance - projectedRemaining;

  return (
    <div
      className="rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span className="text-stone-500">
        Cash now <span className="font-mono font-semibold text-stone-300">{fmtUsd(liquidBalance)}</span>
      </span>
      <span className="text-stone-600">·</span>
      <span className="text-stone-500">
        ~{fmtUsd(avgDailyExpense)}/day spend
      </span>
      <span className="text-stone-600">·</span>
      <span className="text-stone-500">
        Month-end est.{' '}
        <span className={cnFont(eomForecast >= 0)}>{fmtUsd(eomForecast)}</span>
      </span>
    </div>
  );
}

function cnFont(positive: boolean) {
  return `font-mono font-semibold ${positive ? 'text-emerald-400/90' : 'text-rose-400'}`;
}
