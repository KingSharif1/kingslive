'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import type { Subscription, VaultTransaction } from '../../types/index';
import { RecurringReviewQueue } from './RecurringReviewQueue';
import { RecurringCalendar, type CalendarPayment } from './RecurringCalendar';
import { BillsTimeline } from './BillsTimeline';
import { fmtUsd, getBillPaymentHistory } from '@/lib/vault/bills';
import { getAllLiveBills, getUpcomingBills, type UpcomingBill } from '@/lib/vault/upcoming';
import { cn } from '@/lib/utils';

type BillsView = 'list' | 'calendar';

function dueLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return 'Overdue';
  if (days <= 7) return `In ${days} days`;
  return new Date(Date.now() + days * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function BillRow({
  bill,
  urgent,
  onClick,
}: {
  bill: ReturnType<typeof getAllLiveBills>[0];
  urgent?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors hover:bg-stone-800/40',
        urgent ? 'bg-rose-500/5 ring-1 ring-rose-500/15' : 'bg-stone-900/30',
      )}
    >
      <span className="text-xl">{bill.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-200 truncate">{bill.name}</p>
        <p className="text-[11px] text-stone-500 capitalize">
          {bill.billType === 'loan' ? 'Loan' : bill.billType === 'bill' ? 'Bill' : 'Subscription'} ·{' '}
          {bill.frequency}
        </p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'font-mono text-sm font-semibold',
            bill.billType === 'income' ? 'text-emerald-400' : 'text-stone-200',
          )}
        >
          {bill.billType === 'income' ? '+' : ''}
          {fmtUsd(bill.amount)}
        </p>
        <p className={cn('text-[11px]', urgent && bill.daysUntil <= 3 ? 'text-rose-400' : 'text-stone-500')}>
          {bill.billType === 'income' ? 'Expected' : dueLabel(bill.daysUntil)}
        </p>
      </div>
    </button>
  );
}

function BillSection({
  title,
  subtitle,
  bills,
  expandedId,
  setExpandedId,
  urgent,
}: {
  title: string;
  subtitle: string;
  bills: UpcomingBill[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  urgent?: boolean;
}) {
  if (bills.length === 0) return null;
  const total = bills.reduce(
    (s, b) => s + (b.billType === 'income' ? -b.amount : b.amount),
    0,
  );
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 px-1">
        <p
          className={cn(
            'text-xs font-semibold uppercase tracking-wide',
            urgent ? 'text-amber-400/90' : 'text-stone-500',
          )}
        >
          {title}
        </p>
        <p className="text-[11px] text-stone-600">
          {bills.length} item{bills.length !== 1 ? 's' : ''} · {fmtUsd(Math.abs(total))}
          {total < 0 ? ' in' : ''}
        </p>
      </div>
      <p className="text-[10px] text-stone-600 px-1 -mt-1">{subtitle}</p>
      {bills.map(b => (
        <BillRow
          key={b.id}
          bill={b}
          urgent={urgent}
          onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
        />
      ))}
    </section>
  );
}

export function BillsTab({
  subscriptions,
  transactions,
  onSave: _onSave,
  onUpdate,
  onDelete,
  onDetectRecurring,
  onReviewed,
  onEditSub,
}: {
  subscriptions: Subscription[];
  transactions: VaultTransaction[];
  onSave: (s: Omit<Subscription, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Subscription>) => void;
  onDelete: (id: string) => void;
  onDetectRecurring?: () => Promise<void> | void;
  onReviewed?: () => void;
  onEditSub?: (sub: Subscription) => void;
}) {
  const [view, setView] = useState<BillsView>('list');
  const [search, setSearch] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const upcoming = useMemo(() => getUpcomingBills(subscriptions, 45), [subscriptions]);
  const allBills = useMemo(() => getAllLiveBills(subscriptions), [subscriptions]);
  const monthlyTotal = allBills.reduce((s, b) => s + b.monthly, 0);

  const next7 = upcoming.filter(b => b.daysUntil <= 7);
  const comingLater = upcoming.filter(b => b.daysUntil > 7);
  const listedIds = new Set([...next7, ...comingLater].map(b => b.id));
  const filteredAll = allBills.filter(b => {
    if (search) return b.name.toLowerCase().includes(search.toLowerCase());
    return !listedIds.has(b.id);
  });

  const calendarPayments: CalendarPayment[] = upcoming.map(b => ({
    key: b.id,
    name: b.name,
    emoji: b.emoji,
    amount: b.amount,
    nextDate: b.nextDate,
  }));

  const handleDetect = async () => {
    if (!onDetectRecurring || isDetecting) return;
    setIsDetecting(true);
    try {
      await onDetectRecurring();
    } finally {
      setIsDetecting(false);
    }
  };

  const expanded = upcoming.find(b => b.id === expandedId) ?? allBills.find(b => b.id === expandedId);
  const expandedSub = subscriptions.find(s => s.id === expandedId);
  const paymentHistory =
    expandedSub && transactions.length > 0
      ? getBillPaymentHistory(expandedSub, transactions, 8)
      : [];

  return (
    <div className="space-y-4 max-w-2xl">
      {onReviewed && <RecurringReviewQueue subscriptions={subscriptions} onReviewed={onReviewed} />}

      <div className="rounded-2xl p-4 bg-stone-900/40 backdrop-blur-sm">
        <p className="text-xs text-stone-500">Committed each month</p>
        <p className="font-mono text-2xl font-bold text-stone-100 mt-0.5">{fmtUsd(monthlyTotal)}</p>
        <p className="text-[11px] text-stone-600 mt-1">
          {allBills.length} recurring item{allBills.length !== 1 ? 's' : ''}
          {next7.length > 0 && ` · ${next7.length} in the next 7 days`}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl bg-stone-900/60">
          {(
            [
              ['list', 'Bills'],
              ['calendar', 'Calendar'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                view === id ? 'bg-violet-500/20 text-violet-300' : 'text-stone-500 hover:text-stone-300',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {onDetectRecurring && (
            <button
              type="button"
              onClick={handleDetect}
              disabled={isDetecting}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-stone-400 bg-stone-800/60 hover:text-stone-200 disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isDetecting && 'animate-spin')} />
              Rescan
            </button>
          )}
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="rounded-2xl p-4 bg-stone-900/40">
          <RecurringCalendar upcoming={calendarPayments} />
        </div>
      ) : (
        <>
          {!search && (
            <div className="rounded-2xl p-3 bg-stone-900/40">
              <p className="text-[10px] uppercase text-stone-600 tracking-wide mb-2 px-1">Next 14 days</p>
              <BillsTimeline
                bills={upcoming}
                days={14}
                onSelect={b => setExpandedId(b.id)}
              />
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search bills..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-stone-950/50 border border-stone-800 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-stone-600"
            />
          </div>

          {!search && (
            <>
              <BillSection
                title="Next 7 days"
                subtitle="What's about to hit your account"
                bills={next7}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                urgent
              />
              <BillSection
                title="Coming later"
                subtitle="Further out this month"
                bills={comingLater}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
              />
            </>
          )}

          <section className="space-y-2">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide px-1">All recurring</p>
            {filteredAll.length === 0 && search ? (
              <p className="text-sm text-stone-500 py-6 text-center">No matches.</p>
            ) : filteredAll.length === 0 && next7.length === 0 && comingLater.length === 0 ? (
              <p className="text-sm text-stone-500 py-8 text-center">
                No bills yet. Set targets in Plan → Assign, then Rescan after syncing your bank.
              </p>
            ) : (
              (search ? allBills.filter(b => b.name.toLowerCase().includes(search.toLowerCase())) : filteredAll).map(
                b => (
                  <BillRow
                    key={b.id}
                    bill={b}
                    onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                  />
                ),
              )
            )}
          </section>

          {expanded && expandedSub && (
            <div className="rounded-2xl p-4 bg-stone-950/80 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-200">
                  {expanded.emoji} {expanded.name}
                </p>
                <button type="button" onClick={() => setExpandedId(null)} className="text-stone-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-stone-600">Per charge</p>
                  <p className="font-mono text-stone-300">{fmtUsd(expanded.amount)}</p>
                </div>
                <div>
                  <p className="text-stone-600">Monthly equivalent</p>
                  <p className="font-mono text-stone-300">{fmtUsd(expanded.monthly)}</p>
                </div>
                <div>
                  <p className="text-stone-600">Next due</p>
                  <p className="text-stone-300">{dueLabel(expanded.daysUntil)}</p>
                </div>
                {expandedSub.confidence != null && (
                  <div>
                    <p className="text-stone-600">Detection confidence</p>
                    <p className="text-stone-300">{expandedSub.confidence}%</p>
                  </div>
                )}
                {expandedSub.chargeCount != null && expandedSub.chargeCount > 0 && (
                  <div>
                    <p className="text-stone-600">Charges seen</p>
                    <p className="text-stone-300">{expandedSub.chargeCount}</p>
                  </div>
                )}
              </div>
              {paymentHistory.length > 0 && (
                <div className="border-t border-stone-800 pt-2">
                  <p className="text-[10px] uppercase text-stone-600 mb-2">Payment history</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {paymentHistory.map(tx => (
                      <div key={tx.id} className="flex justify-between text-[11px]">
                        <span className="text-stone-500">
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span
                          className={cn(
                            'font-mono',
                            tx.type === 'income' ? 'text-emerald-400' : 'text-stone-300',
                          )}
                        >
                          {tx.type === 'income' ? '+' : ''}
                          {fmtUsd(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                {onEditSub && (
                  <button
                    type="button"
                    onClick={() => onEditSub(expandedSub)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-stone-800 text-stone-300"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onUpdate(expandedSub.id, { status: 'cancelled', isActive: false });
                    setExpandedId(null);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-stone-800 text-stone-400"
                >
                  Mark cancelled
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(expandedSub.id);
                    setExpandedId(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs text-rose-400 bg-rose-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
