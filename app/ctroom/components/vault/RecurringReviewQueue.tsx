'use client';

import { useState } from 'react';
import { Check, X, Edit3, AlertCircle, Sparkles } from 'lucide-react';
import { VaultDataService } from '../../services/vaultDataService';
import type { Subscription } from '../../types/index';

interface Props {
  subscriptions: Subscription[];
  onReviewed: () => void; // parent invalidates cache after a decision
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

/**
 * Human-in-the-loop review queue for auto-detected recurring charges
 * that the engine isn't fully confident about.
 *
 * The server marks rows as `status='pending_review'` when:
 *   - confidence < 80 and we have no dictionary backing, OR
 *   - the engine sees an unfamiliar merchant with stable intervals, OR
 *   - one expected charge is overdue (1.4 < missed_ratio < 2.5)
 *
 * The user can:
 *   - Confirm  → lock to active, treat as recurring forever
 *   - Dismiss  → delete the sub and never auto-create it again
 *   - Recategorize → keep as recurring but pin a custom category
 */
export function RecurringReviewQueue({ subscriptions, onReviewed }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [recategorizing, setRecategorizing] = useState<Subscription | null>(null);

  const pending = subscriptions.filter(
    s => s.status === 'pending_review' && s.merchantPattern,
  );

  if (pending.length === 0) return null;

  const decide = async (
    sub: Subscription,
    decision: 'confirmed' | 'dismissed' | 'category',
    category?: string,
  ) => {
    if (!sub.merchantPattern) return;
    setPendingId(sub.id);
    await VaultDataService.reviewRecurring({
      pattern: sub.merchantPattern,
      decision,
      category,
    });
    setPendingId(null);
    setRecategorizing(null);
    onReviewed();
  };

  return (
    <div
      className="p-4 rounded-2xl mb-4"
      style={{
        background: 'rgba(251,191,36,0.05)',
        border: '1px solid rgba(251,191,36,0.2)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4" style={{ color: '#fbbf24' }} />
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#fbbf24' }}>
          Review queue · {pending.length}
        </p>
        <p className="text-[10px] text-white/40 ml-auto">
          Confirm what looks right, dismiss what doesn&apos;t.
        </p>
      </div>

      <div className="space-y-2">
        {pending.map(sub => {
          const isPending = pendingId === sub.id;
          const isRecategorizing = recategorizing?.id === sub.id;
          const conf = sub.confidence ?? 0;
          const confColor =
            conf >= 70 ? '#10b981' : conf >= 55 ? '#fbbf24' : '#f87171';

          return (
            <div
              key={sub.id}
              className="rounded-xl p-3 transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                opacity: isPending ? 0.5 : 1,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  {sub.emoji || '💳'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{sub.name}</p>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold"
                      style={{
                        background: `${confColor}15`,
                        color: confColor,
                        border: `1px solid ${confColor}40`,
                      }}
                    >
                      {conf}%
                    </span>
                    {sub.billType && sub.billType !== 'subscription' && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md uppercase tracking-wide font-bold"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {sub.billType}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    {fmt(sub.amount)} · {sub.frequency}
                    {sub.chargeCount ? ` · ${sub.chargeCount} charges` : ''}
                    {sub.lastChargeDate
                      ? ` · last ${new Date(sub.lastChargeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : ''}
                  </p>
                  {sub.notes && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <AlertCircle className="w-3 h-3" style={{ color: '#fbbf24' }} />
                      <p className="text-[10px] italic" style={{ color: 'rgba(251,191,36,0.85)' }}>
                        {sub.notes}
                      </p>
                    </div>
                  )}

                  {isRecategorizing ? (
                    <div className="flex gap-1.5 mt-2">
                      {['Subscriptions', 'Bills & Utilities', 'Entertainment', 'Software', 'Insurance', 'Debt'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => decide(sub, 'category', cat)}
                          disabled={isPending}
                          className="text-[10px] px-2 py-1 rounded-md font-semibold transition-colors"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.7)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                      <button
                        onClick={() => setRecategorizing(null)}
                        className="text-[10px] px-2 py-1 rounded-md text-white/40"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => decide(sub, 'confirmed')}
                        disabled={isPending}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                        style={{
                          background: 'rgba(16,185,129,0.12)',
                          color: '#10b981',
                          border: '1px solid rgba(16,185,129,0.3)',
                        }}
                      >
                        <Check className="w-3 h-3" /> Confirm
                      </button>
                      <button
                        onClick={() => decide(sub, 'dismissed')}
                        disabled={isPending}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                        style={{
                          background: 'rgba(248,113,113,0.10)',
                          color: '#f87171',
                          border: '1px solid rgba(248,113,113,0.25)',
                        }}
                      >
                        <X className="w-3 h-3" /> Dismiss
                      </button>
                      <button
                        onClick={() => setRecategorizing(sub)}
                        disabled={isPending}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.65)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <Edit3 className="w-3 h-3" /> Recategorize
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
