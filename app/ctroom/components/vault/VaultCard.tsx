'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function VaultCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('p-4 md:p-5 rounded-3xl bg-stone-900/40 backdrop-blur-md', className)}
    >
      {children}
    </div>
  );
}

export function VaultStat({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <VaultCard>
      <p className="text-[10px] uppercase tracking-widest mb-1 text-vault-muted">{label}</p>
      <p className={cn('font-mono text-lg font-bold leading-none', valueClassName || 'text-white')}>{value}</p>
      {sub && <p className="text-[11px] mt-1 text-vault-muted">{sub}</p>}
    </VaultCard>
  );
}

export function VaultHero({
  netWorth,
  delta,
  deltaPct,
  format,
  stats,
}: {
  netWorth: number;
  delta: number;
  deltaPct: number;
  format: (n: number) => string;
  stats: { label: string; value: string; tone?: 'pos' | 'neg' | 'neutral' }[];
}) {
  const positive = delta >= 0;
  return (
    <div
      className="rounded-3xl p-5 md:p-7"
      style={{
        background:
          'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(255,255,255,0.02) 60%)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-vault-muted mb-1.5">
            Net worth
          </p>
          <p
            className={cn(
              'font-mono font-bold leading-none text-4xl md:text-5xl',
              netWorth >= 0 ? 'text-white' : 'text-red-400',
            )}
          >
            {format(netWorth)}
          </p>
          {Number.isFinite(deltaPct) && (
            <p
              className={cn(
                'mt-2 text-xs font-mono font-semibold',
                positive ? 'text-emerald-400' : 'text-red-400',
              )}
            >
              {positive ? '↑' : '↓'} {format(Math.abs(delta))} this month ({positive ? '+' : ''}
              {deltaPct.toFixed(1)}%)
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 md:min-w-[420px]">
          {stats.map(s => (
            <div
              key={s.label}
              className="px-3 py-2.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p className="text-[9px] uppercase tracking-widest text-vault-muted">{s.label}</p>
              <p
                className={cn(
                  'font-mono text-sm font-bold mt-0.5 truncate',
                  s.tone === 'pos'
                    ? 'text-emerald-400'
                    : s.tone === 'neg'
                    ? 'text-red-400'
                    : 'text-white',
                )}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VaultSubNav<T extends string>({
  items,
  value,
  onChange,
  rightSlot,
}: {
  items: { id: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4 md:mb-5">
      <div
        className="flex gap-1 p-1 rounded-xl overflow-x-auto [&::-webkit-scrollbar]:hidden min-w-0"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        role="tablist"
      >
        {items.map(item => {
          const active = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all',
                active ? 'text-black' : 'text-white/45 hover:text-white/70',
              )}
              style={active ? { background: 'rgb(110 231 160 / 0.9)' } : undefined}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
    </div>
  );
}

export function VaultEmptyState({
  icon,
  label,
  sub,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 opacity-40">{icon}</div>
      <p className="text-sm font-semibold text-white/70">{label}</p>
      {sub && <p className="text-xs mt-1 max-w-xs text-vault-muted">{sub}</p>}
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-vault-accent border border-vault-accent/30 bg-vault-accent/10"
        >
          {action}
        </button>
      )}
    </div>
  );
}
