'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, LineChart, Line
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6', '#a855f7', '#64748b'];

const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const fmtK = (v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`;

type ChartMode = 'spending' | 'monthly' | 'trend' | 'merchants';

interface VaultChartsProps {
  categoryData: { name: string; value: number }[];
  monthlyData: { month: string; income: number; expenses: number }[];
  trendData?: { day: number; amount: number; cumulative: number }[];
  merchantData?: { name: string; value: number }[];
  activeCategoryFilter?: string | null;
  onCategoryClick?: (cat: string) => void;
}

export default function VaultCharts({
  categoryData, monthlyData, trendData = [], merchantData = [],
  activeCategoryFilter, onCategoryClick
}: VaultChartsProps) {
  const hasCategory = categoryData.length > 0;
  const hasMonthly = monthlyData.some(m => m.income > 0 || m.expenses > 0);
  const hasTrend = trendData.length > 0;
  const hasMerchants = merchantData.length > 0;
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [chartMode, setChartMode] = useState<ChartMode>('spending');

  const INITIAL_SHOW = 5;
  const visibleCategories = showAllCategories ? categoryData : categoryData.slice(0, INITIAL_SHOW);
  const hiddenCount = categoryData.length - INITIAL_SHOW;

  const chartModes: { id: ChartMode; label: string; available: boolean }[] = [
    { id: 'spending',   label: 'Spending',  available: hasCategory },
    { id: 'monthly',    label: 'Monthly',   available: hasMonthly },
    { id: 'trend',      label: 'Trend',     available: hasTrend },
    { id: 'merchants',  label: 'Merchants', available: hasMerchants },
  ].filter(m => m.available) as { id: ChartMode; label: string; available: boolean }[];

  if (chartModes.length === 0) return null;

  // Ensure chartMode is valid
  const activeMode = chartModes.find(m => m.id === chartMode) ? chartMode : chartModes[0]?.id;

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const total = categoryData.reduce((s, c) => s + c.value, 0);
    const pct = total > 0 ? Math.round((payload[0].value / total) * 100) : 0;
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-muted-foreground">{fmtFull(payload[0].value)} · {pct}%</p>
      </div>
    );
  };

  const DefaultTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-lg space-y-0.5">
        <p className="font-medium text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name}><span style={{ color: p.color }}>●</span> {p.name}: {fmtFull(p.value)}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-4">
      {/* Chart type selector */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          {activeMode === 'spending'  && 'Spending by Category'}
          {activeMode === 'monthly'   && 'Income vs Expenses'}
          {activeMode === 'trend'     && 'Monthly Spending Trend'}
          {activeMode === 'merchants' && 'Top Merchants'}
        </h3>
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl">
          {chartModes.map(m => (
            <button
              key={m.id}
              onClick={() => setChartMode(m.id)}
              className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                activeMode === m.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SPENDING DONUT ── */}
      {activeMode === 'spending' && (
        <div className="flex items-center gap-4">
          <div className="w-36 h-36 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<PieTooltip />} />
                <Pie
                  data={categoryData}
                  cx="50%" cy="50%"                  innerRadius={35} outerRadius={60}
                  paddingAngle={3} dataKey="value" stroke="none"
                  onClick={(entry) => onCategoryClick?.(entry.name)}
                  style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}
                      opacity={activeCategoryFilter && activeCategoryFilter !== categoryData[i].name ? 0.35 : 1} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1 overflow-hidden">
            {onCategoryClick && <p className="text-[10px] text-muted-foreground mb-2">Click to filter transactions</p>}
            {visibleCategories.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => onCategoryClick?.(cat.name)}
                className={cn(
                  "flex items-center justify-between gap-2 text-xs w-full rounded-lg px-1 py-0.5 transition-all",
                  activeCategoryFilter === cat.name ? "bg-secondary" : "hover:bg-secondary/50",
                  activeCategoryFilter && activeCategoryFilter !== cat.name ? "opacity-40" : ""
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="truncate text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-medium flex-shrink-0">{fmtFull(cat.value)}</span>
              </button>
            ))}
            {hiddenCount > 0 && (
              <button onClick={() => setShowAllCategories(p => !p)} className="text-[10px] text-primary hover:underline px-1 mt-0.5">
                {showAllCategories ? '↑ Show less' : `+${hiddenCount} more`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── INCOME VS EXPENSES BAR ── */}
      {activeMode === 'monthly' && (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={45} tickFormatter={fmtK} />
                <Tooltip content={<DefaultTooltip />} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Income</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Expenses</div>
          </div>
        </>
      )}

      {/* ── SPENDING TREND AREA ── */}
      {activeMode === 'trend' && trendData.length > 0 && (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}`} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={48} tickFormatter={fmtK} />
                <Tooltip content={<DefaultTooltip />} />
                <Area type="monotone" dataKey="cumulative" stroke="#ef4444" strokeWidth={2}
                  fill="url(#spendGrad)" name="Cumulative Spend" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center">Cumulative spending this month by day</p>
        </>
      )}

      {/* ── TOP MERCHANTS HORIZONTAL BAR ── */}
      {activeMode === 'merchants' && merchantData.length > 0 && (
        <div style={{ height: Math.max(180, Math.min(merchantData.length, 8) * 44) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={merchantData.slice(0, 8)}
              layout="vertical"
              margin={{ left: 4, right: 20, top: 4, bottom: 4 }}
              barSize={22}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <YAxis
                type="category" dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false} tickLine={false} width={105}
                tickFormatter={(v: string) => v.length > 15 ? v.slice(0, 14) + '…' : v}
              />
              <Tooltip content={<DefaultTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Spent">
                {merchantData.slice(0, 8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
