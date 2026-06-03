'use client';

import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { VaultAccount, VaultTransaction } from '../../types/index';
import { fmtUsd } from '@/lib/vault/bills';
import { cn } from '@/lib/utils';

function prettyMerchant(name: string | null | undefined, fallback?: string | null): string {
  const src = (name || fallback || '').trim();
  if (!src) return 'Unknown';
  return src.length > 36 ? `${src.slice(0, 34)}…` : src;
}

function ActivityRow({
  tx,
  onClick,
}: {
  tx: VaultTransaction;
  onClick: () => void;
}) {
  const isIncome = tx.type === 'income';
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 py-3 px-1 border-b border-stone-800/80 last:border-0 text-left hover:bg-stone-900/30 rounded-lg transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-stone-200 truncate">{prettyMerchant(tx.merchant, tx.description)}</p>
        <p className="text-[11px] text-stone-500 mt-0.5">
          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {tx.category ? ` · ${tx.category}` : ''}
        </p>
      </div>
      <p
        className={cn(
          'font-mono text-sm font-semibold flex-shrink-0',
          isIncome ? 'text-emerald-400' : 'text-stone-300',
        )}
      >
        {isIncome ? '+' : '−'}
        {fmtUsd(tx.amount)}
      </p>
    </button>
  );
}

export function ActivityTab({
  transactions,
  accounts,
  onTxClick,
}: {
  transactions: VaultTransaction[];
  accounts: VaultAccount[];
  onTxClick: (tx: VaultTransaction) => void;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [hideTransfers, setHideTransfers] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (hideTransfers && (t.type === 'transfer' || t.category === 'Transfer')) return false;
        if (typeFilter === 'expense') return t.type === 'expense';
        if (typeFilter === 'income') return t.type === 'income';
        return true;
      })
      .filter(
        t =>
          !search ||
          `${t.merchant} ${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase()),
      );
  }, [transactions, search, typeFilter, hideTransfers]);

  const expenseTotal = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const incomeTotal = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-stone-950/50 border border-stone-800 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-stone-600"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(f => !f)}
          className={cn(
            'px-3 rounded-xl border border-stone-800 text-stone-500 hover:text-stone-300',
            showFilters && 'bg-stone-800 text-stone-300',
          )}
          aria-label="Filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 items-center text-xs">
          {(['all', 'expense', 'income'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setTypeFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg capitalize',
                typeFilter === f ? 'bg-emerald-500/15 text-emerald-400' : 'text-stone-500 bg-stone-900/50',
              )}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHideTransfers(h => !h)}
            className={cn(
              'px-3 py-1.5 rounded-lg',
              hideTransfers ? 'text-stone-500 bg-stone-900/50' : 'bg-amber-500/15 text-amber-400',
            )}
          >
            {hideTransfers ? 'Hiding transfers' : 'Showing transfers'}
          </button>
          {accounts.length > 1 && (
            <span className="text-stone-600 ml-auto">{accounts.length} accounts</span>
          )}
        </div>
      )}

      <p className="text-xs text-stone-500 px-1">
        {filtered.length} transactions · spent {fmtUsd(expenseTotal)}
        {incomeTotal > 0 && ` · income ${fmtUsd(incomeTotal)}`}
      </p>

      <div className="rounded-2xl px-3 py-1 bg-stone-900/30 max-h-[min(60vh,520px)] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-stone-500 py-10 text-center">No transactions match.</p>
        ) : (
          filtered.map(tx => <ActivityRow key={tx.id} tx={tx} onClick={() => onTxClick(tx)} />)
        )}
      </div>
    </div>
  );
}
