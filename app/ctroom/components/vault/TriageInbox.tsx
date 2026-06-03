'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import type { Subscription, VaultTransaction } from '../../types/index';
import { RecurringReviewQueue } from './RecurringReviewQueue';
import { fmtUsd } from '@/lib/vault/bills';
import { cn } from '@/lib/utils';

const QUICK_CATEGORIES = [
  'Groceries',
  'Food & Drink',
  'Bills & Utilities',
  'Loan Payments',
  'Shopping',
  'Transportation',
  'Other',
];

function prettyMerchant(name: string | null | undefined, fallback?: string | null): string {
  const src = (name || fallback || '').trim();
  if (!src) return 'Unknown';
  return src.length > 32 ? `${src.slice(0, 30)}…` : src;
}

export function TriageInbox({
  transactions,
  subscriptions,
  onUpdateCategory,
  onReviewed,
}: {
  transactions: VaultTransaction[];
  subscriptions: Subscription[];
  onUpdateCategory: (id: string, category: string) => void;
  onReviewed: () => void;
}) {
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const uncategorized = transactions
    .filter(t => t.type === 'expense' && (!t.category || t.category === 'Other'))
    .slice(0, 5);

  const pendingRecurring = subscriptions.filter(
    s => s.status === 'pending_review' && s.merchantPattern,
  ).length;

  const totalItems = uncategorized.length + pendingRecurring;

  if (totalItems === 0) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: 'rgba(110,231,160,0.06)', border: '1px solid rgba(110,231,160,0.15)' }}
      >
        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-300/90">All caught up</p>
          <p className="text-[11px] text-stone-500">No transactions or bills need review right now.</p>
        </div>
      </div>
    );
  }

  const handleAssign = async (txId: string, category: string) => {
    setAssigningId(txId);
    await onUpdateCategory(txId, category);
    setAssigningId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-amber-400/80" />
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
          Needs review · {totalItems}
        </p>
      </div>

      <RecurringReviewQueue subscriptions={subscriptions} onReviewed={onReviewed} />

      {uncategorized.length > 0 && (
        <div
          className="rounded-2xl p-4 space-y-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-[11px] text-stone-500 mb-2">Uncategorized spending</p>
          {uncategorized.map(tx => (
            <div
              key={tx.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-200 truncate">{prettyMerchant(tx.merchant, tx.description)}</p>
                <p className="text-xs text-stone-500">
                  {fmtUsd(tx.amount)} · {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {QUICK_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    disabled={assigningId === tx.id}
                    onClick={() => handleAssign(tx.id, cat)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-[10px] font-medium transition-colors',
                      'bg-stone-800/80 text-stone-400 hover:text-emerald-300 hover:bg-stone-800',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
