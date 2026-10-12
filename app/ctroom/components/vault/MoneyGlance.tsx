'use client';

import { useMemo } from 'react';
import { Wallet, CalendarClock, BadgeCheck } from 'lucide-react';
import type { SnapshotData } from '@/lib/vault/financeSnapshot';
import type { BillsStatus } from '@/lib/vault/bills';
import { fmtUsd } from '@/lib/vault/bills';
import type { Subscription, VaultTransaction } from '../../types/index';
import { cn } from '@/lib/utils';

/**
 * MoneyGlance — the 3 numbers that matter, readable in 2 seconds on a phone.
 * Safe to spend, bills due soon, bills handled. No scrolling required.
 */
export function MoneyGlance({
  snapshot,
  billsStatus,
  subscriptions,
  transactions,
}: {
  snapshot: SnapshotData;
  billsStatus: BillsStatus;
  subscriptions: Subscription[];
  transactions: VaultTransaction[];
}) {
  const glance = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);
    const in14 = new Date(now);
    in14.setDate(in14.getDate() + 14);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const isPaid = (bill: Subscription): boolean => {
      const pat = (bill.merchantPattern || bill.name).toLowerCase();
      return transactions.some(t => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.date);
        d.setHours(0, 0, 0, 0);
        if (d < monthStart) return false;
        const hay = `${t.merchant || ''} ${t.description || ''}`.toLowerCase();
        const amountOk = t.amount >= bill.amount * 0.85;
        return (hay.includes(pat) || hay.includes(bill.name.toLowerCase())) && amountOk;
      });
    };

    const upcoming = subscriptions.filter(s => {
      if (!s.isActive || !s.nextBillingDate) return false;
      const d = new Date(s.nextBillingDate);
      d.setHours(0, 0, 0, 0);
      return d >= now && !isPaid(s);
    });

    const due7 = upcoming.filter(s => {
      const d = new Date(s.nextBillingDate!);
      d.setHours(0, 0, 0, 0);
      return d <= in7;
    });
    const due14 = upcoming.filter(s => {
      const d = new Date(s.nextBillingDate!);
      d.setHours(0, 0, 0, 0);
      return d <= in14;
    });

    const due7Total = due7.reduce((sum, s) => sum + s.amount, 0);
    const due14Total = due14.reduce((sum, s) => sum + s.amount, 0);
    const safeToSpend = snapshot.netRemaining - due14Total;

    return { due7, due7Total, due14Total, safeToSpend };
  }, [snapshot, subscriptions, transactions]);

  const safe = glance.safeToSpend;

  return (
    <div className="rounded-3xl p-5 space-y-4"
      style={{
        background: 'linear-gradient(155deg, rgba(0,255,136,0.10) 0%, rgba(28,25,23,0.65) 60%)',
        border: '1px solid rgba(0,255,136,0.14)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500 mb-1.5 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Safe to spend
          </p>
          <p className={cn('font-mono text-4xl font-bold tracking-tight', safe >= 0 ? 'text-white' : 'text-rose-400')}>
            {fmtUsd(safe)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1.5">
            After bills due in the next 14 days ({fmtUsd(glance.due14Total)})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-black/30 border border-white/8 px-4 py-3">
          <p className="text-[11px] text-stone-500 flex items-center gap-1.5 mb-1">
            <CalendarClock className="w-3.5 h-3.5" /> Due in 7 days
          </p>
          <p className="font-mono text-xl font-bold text-amber-300">{fmtUsd(glance.due7Total)}</p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {glance.due7.length === 0 ? 'Nothing due' : `${glance.due7.length} bill${glance.due7.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="rounded-2xl bg-black/30 border border-white/8 px-4 py-3">
          <p className="text-[11px] text-stone-500 flex items-center gap-1.5 mb-1">
            <BadgeCheck className="w-3.5 h-3.5" /> Bills handled
          </p>
          <p className="font-mono text-xl font-bold text-emerald-300">
            {billsStatus.paidThisMonth}<span className="text-stone-500 text-sm">/{billsStatus.liveCount}</span>
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">paid this month</p>
        </div>
      </div>
    </div>
  );
}
