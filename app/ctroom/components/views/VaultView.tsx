'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Wallet, TrendingUp, TrendingDown, Plus, RefreshCw, Link,
  CreditCard, PiggyBank, Target, X, Check,
  DollarSign, AlertCircle, Trash2, Upload, FileText,
  ArrowUpRight, ArrowDownRight, Building2, Landmark, Pencil,
  Repeat, CalendarClock, LayoutDashboard, ListOrdered,
  PieChart, Flag, Sparkles, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTellerConnect, TellerConnectEnrollment } from 'teller-connect-react';
import { supabase } from '@/lib/supabase';
import { VaultDataService } from '../../services/vaultDataService';
import {
  VaultAccount, VaultTransaction, BudgetCategory,
  DebtEntry, SavingsGoal, AccountType, TransactionType,
  TransactionRule, Subscription, SubscriptionFrequency, VaultAiNudge,
  NetWorthSnapshot,
} from '../../types/index';
import { cn } from '@/lib/utils';
import VaultCharts from './VaultCharts';
import { RecurringReviewQueue } from '../vault/RecurringReviewQueue';
import { SeeTab } from '../vault/SeeTab';
import { UnderstandTab } from '../vault/UnderstandTab';
import { EnvelopeBudget } from '../vault/EnvelopeBudget';
import { BillsTab } from '../vault/BillsTab';
import { StudentLoanMatcher } from '../vault/StudentLoanMatcher';
import {
  useVaultData,
  useVaultCache,
  useUpdateTransactionCategory,
} from '../../hooks/useVaultQueries';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const pct = (current: number, target: number) =>
  target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

const ACCOUNT_COLORS: Record<AccountType, string> = {
  checking: '#3b82f6', savings: '#10b981', credit: '#ef4444',
  loan: '#f59e0b', investment: '#8b5cf6', cash: '#6b7280',
};

const ACCOUNT_ICONS: Record<AccountType, React.ReactNode> = {
  checking:   <Landmark className="w-4 h-4" />,
  savings:    <PiggyBank className="w-4 h-4" />,
  credit:     <CreditCard className="w-4 h-4" />,
  loan:       <Building2 className="w-4 h-4" />,
  investment: <TrendingUp className="w-4 h-4" />,
  cash:       <DollarSign className="w-4 h-4" />,
};

// See → Understand → Plan → Ask (journey: see whole picture, then manage)
type VaultTopTab = 'see' | 'understand' | 'plan' | 'ask';
type VaultSection =
  | 'see' | 'understand'
  | 'recurring' | 'budget' | 'debt' | 'goals'
  | 'ask';
type TimeRange = 'today' | 'week' | 'month' | 'last_month' | '3months' | '6months' | 'all';

interface VaultSubNavItem {
  id: VaultSection;
  label: string;
  icon: React.ReactNode;
}

const TOP_TABS: { id: VaultTopTab; label: string; icon: React.ReactNode; sections: VaultSubNavItem[]; defaultSection: VaultSection }[] = [
  {
    id: 'see',
    label: 'See',
    icon: <LayoutDashboard className="w-4 h-4" />,
    defaultSection: 'see',
    sections: [
      { id: 'see', label: 'Today', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: 'understand',
    label: 'Understand',
    icon: <PieChart className="w-4 h-4" />,
    defaultSection: 'understand',
    sections: [
      { id: 'understand', label: 'Spending', icon: <PieChart className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: 'plan',
    label: 'Plan',
    icon: <Target className="w-4 h-4" />,
    defaultSection: 'recurring',
    sections: [
      { id: 'recurring', label: 'Bills',   icon: <Repeat className="w-3.5 h-3.5" /> },
      { id: 'budget',    label: 'Assign',  icon: <PieChart className="w-3.5 h-3.5" /> },
      { id: 'debt',      label: 'Debt',    icon: <TrendingDown className="w-3.5 h-3.5" /> },
      { id: 'goals',     label: 'Goals',   icon: <Flag className="w-3.5 h-3.5" /> },
    ],
  },
  {
    id: 'ask',
    label: 'Ask',
    icon: <Sparkles className="w-4 h-4" />,
    defaultSection: 'ask',
    sections: [
      { id: 'ask', label: 'Advisor', icon: <Sparkles className="w-3.5 h-3.5" /> },
    ],
  },
];

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  today: 'Today', week: '7d', month: 'Month', last_month: 'Last Mo.', '3months': '3M', '6months': '6M', all: 'All',
};

// Normalize a tx date to local-midnight so the range filter is timezone-safe.
// VaultDataService already returns Dates parsed at local midnight for YYYY-MM-DD
// inputs; this is a belt-and-braces guard for callers that pass raw strings.
function toLocalMidnight(d: Date | string): Date {
  if (d instanceof Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const parsed = new Date(d);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function filterByRange(txs: VaultTransaction[], range: TimeRange): VaultTransaction[] {
  if (range === 'all') return txs;
  const now = new Date();
  let from: Date;
  let to: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (range === 'today')           { from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
  else if (range === 'week')       from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  else if (range === 'month')      from = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (range === 'last_month') { from = new Date(now.getFullYear(), now.getMonth() - 1, 1); to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); }
  else if (range === '3months')    from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  else                             from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return txs.filter(t => {
    const d = toLocalMidnight(t.date);
    return d >= from && d <= to;
  });
}

const CATEGORIES = [
  'Food & Drink', 'Groceries', 'Shopping', 'Transportation', 'Housing', 'Entertainment',
  'Medical', 'Loan Payments', 'Education', 'Travel', 'Bills & Utilities', 'Investment', 'Income',
  'Personal Care', 'Services', 'Software', 'Business', 'Charity', 'Transfer', 'Other',
];

// Keywords that mark a transaction as recurring
const RECURRING_TX_KEYWORDS = [
  'recurring', 'autopay', 'auto pay', 'automatic payment',
  'scheduled payment', 'bill pay', 'recurring charge', 'recurring debit',
];

function isRecurringTx(tx: VaultTransaction): boolean {
  const text = `${tx.description} ${tx.merchant || ''}`.toLowerCase();
  return RECURRING_TX_KEYWORDS.some(kw => text.includes(kw));
}

// True spending = expenses that aren't transfers/internal moves
function isRealExpense(tx: VaultTransaction): boolean {
  return tx.type === 'expense' && tx.category !== 'Transfer';
}

// Clean up the raw merchant string Teller hands us so it stops looking like
// "POS DEBIT #1842 KROGER ATX". Strips POS prefixes, branch numbers, trailing
// city/state codes, and re-cases everything to Title Case.
function prettyMerchant(name: string | null | undefined, fallback?: string | null): string {
  const src = (name || fallback || '').trim();
  if (!src) return 'Unknown';
  let s = src
    .replace(/\b(POS\s*DEBIT|POS\s*PURCHASE|DEBIT\s*CARD|VISA\s*CHECK\s*CARD|CHECKCARD|ACH\s*DEBIT|EXTERNAL\s*DEPOSIT|EXTERNAL\s*WITHDRAWAL|ELECTRONIC\s*WITHDRAWAL|ONLINE\s*PAYMENT|RECURRING\s*PAYMENT|PURCHASE\s*AUTHORIZED|AUTHORIZED\s*ON)\b/gi, '')
    .replace(/#\s*\d+/g, '')
    .replace(/\s\d{2}\/\d{2}(\/\d{2,4})?\b/g, '')
    .replace(/\s\d{4,}\b/g, '')
    .replace(/\s[A-Z]{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) s = src;
  // Title-case but preserve all-caps acronyms <= 3 chars (HBO, IRS).
  return s
    .toLowerCase()
    .split(' ')
    .map(w => (w.length <= 3 && /^[a-z]+$/.test(w) && /^(hbo|irs|nyc|usa|llc|inc|att|nfl|nba|mlb)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

// Category → chip colors (used everywhere we render a category pill).
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Food & Drink':       { bg: 'rgba(251,146,60,0.12)',  text: '#fb923c' },
  'Groceries':          { bg: 'rgba(132,204,22,0.12)',  text: '#84cc16' },
  'Transportation':     { bg: 'rgba(56,189,248,0.12)',  text: '#38bdf8' },
  'Shopping':           { bg: 'rgba(244,114,182,0.12)', text: '#f472b6' },
  'Entertainment':      { bg: 'rgba(168,85,247,0.12)',  text: '#a855f7' },
  'Bills & Utilities':  { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
  'Health & Fitness':   { bg: 'rgba(34,197,94,0.12)',   text: '#22c55e' },
  'Travel':             { bg: 'rgba(14,165,233,0.12)',  text: '#0ea5e9' },
  'Education':          { bg: 'rgba(99,102,241,0.12)',  text: '#6366f1' },
  'Personal Care':      { bg: 'rgba(236,72,153,0.12)',  text: '#ec4899' },
  'Subscriptions':      { bg: 'rgba(124,58,237,0.12)',  text: '#7c3aed' },
  'Services':           { bg: 'rgba(20,184,166,0.12)',  text: '#14b8a6' },
  'Income':             { bg: 'rgba(16,185,129,0.12)',  text: '#10b981' },
  'Transfer':           { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
  'Software':           { bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa' },
};
const categoryChipBg = (c?: string) => (c && CATEGORY_COLORS[c]?.bg) || 'rgba(255,255,255,0.05)';
const categoryChipText = (c?: string) => (c && CATEGORY_COLORS[c]?.text) || 'rgba(255,255,255,0.5)';

// ── Teller Connect button ─────────────────────────────────────────────────────
function TellerConnectButton({ onSuccess, disabled }: {
  onSuccess: () => void;
  disabled?: boolean;
}) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleSuccess = useCallback(async (enrollment: TellerConnectEnrollment) => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;

      const res = await fetch('/api/ctroom/vault/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({
          accessToken:  enrollment.accessToken,
          enrollmentId: enrollment.enrollment.id,
          institution:  enrollment.enrollment.institution,
        }),
      });

      const result = await res.json();
      if (!result.success) console.error('Teller enroll failed:', result.error);
      else onSuccess();
    } catch (err) {
      console.error('Teller onSuccess error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [onSuccess]);

  const { open, ready } = useTellerConnect({
    applicationId: process.env.NEXT_PUBLIC_TELLER_APP_ID || '',
    environment:   (process.env.NEXT_PUBLIC_TELLER_ENV as 'sandbox' | 'development' | 'production') || 'sandbox',
    onSuccess:     handleSuccess,
    onExit:        () => setIsConnecting(false),
  });

  return (
    <button
      onClick={() => { setIsConnecting(true); open(); }}
      disabled={disabled || isConnecting || !ready}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-60"
    >
      <Link className="w-4 h-4" />
      <span className="hidden sm:inline">
        {isConnecting ? 'Connecting…' : 'Link Bank'}
      </span>
    </button>
  );
}

// ── Known subscription keyword database ───────────────────────────────────────
const KNOWN_SUBS: { keywords: string[]; name: string; emoji: string; category: string; color: string }[] = [
  { keywords: ['netflix'],              name: 'Netflix',           emoji: '🎬', category: 'Entertainment', color: '#e50914' },
  { keywords: ['spotify'],              name: 'Spotify',           emoji: '🎵', category: 'Entertainment', color: '#1db954' },
  { keywords: ['apple.com/bill', 'apple cash', 'itunes', 'apple one'], name: 'Apple Services', emoji: '🍎', category: 'Software', color: '#555' },
  { keywords: ['amazon prime', 'prime video'], name: 'Amazon Prime', emoji: '📦', category: 'Shopping', color: '#ff9900' },
  { keywords: ['hulu'],                 name: 'Hulu',              emoji: '📺', category: 'Entertainment', color: '#1ce783' },
  { keywords: ['disney', 'disneyplus'], name: 'Disney+',           emoji: '🏰', category: 'Entertainment', color: '#113ccf' },
  { keywords: ['youtube premium', 'youtubepremium'], name: 'YouTube Premium', emoji: '▶️', category: 'Entertainment', color: '#ff0000' },
  { keywords: ['hbo', 'max.com'],       name: 'HBO Max',           emoji: '📺', category: 'Entertainment', color: '#4b0082' },
  { keywords: ['paramount'],            name: 'Paramount+',        emoji: '⭐', category: 'Entertainment', color: '#0064ff' },
  { keywords: ['peacock'],              name: 'Peacock',           emoji: '🦚', category: 'Entertainment', color: '#000' },
  { keywords: ['adobe'],                name: 'Adobe',             emoji: '🎨', category: 'Software', color: '#ff0000' },
  { keywords: ['microsoft 365', 'office 365', 'microsoft office'], name: 'Microsoft 365', emoji: '💻', category: 'Software', color: '#0078d4' },
  { keywords: ['google one', 'google storage'], name: 'Google One', emoji: '☁️', category: 'Software', color: '#4285f4' },
  { keywords: ['dropbox'],              name: 'Dropbox',           emoji: '📁', category: 'Software', color: '#0061ff' },
  { keywords: ['github'],               name: 'GitHub',            emoji: '🐙', category: 'Software', color: '#333' },
  { keywords: ['notion'],               name: 'Notion',            emoji: '📓', category: 'Software', color: '#000' },
  { keywords: ['figma'],                name: 'Figma',             emoji: '🎨', category: 'Software', color: '#f24e1e' },
  { keywords: ['chatgpt', 'openai'],    name: 'ChatGPT Plus',      emoji: '🤖', category: 'Software', color: '#10a37f' },
  { keywords: ['claude', 'anthropic'],  name: 'Claude Pro',        emoji: '🤖', category: 'Software', color: '#d97706' },
  { keywords: ['cursor'],               name: 'Cursor',            emoji: '💻', category: 'Software', color: '#000' },
  { keywords: ['vercel'],               name: 'Vercel',            emoji: '▲',  category: 'Software', color: '#000' },
  { keywords: ['supabase'],             name: 'Supabase',          emoji: '⚡', category: 'Software', color: '#3ecf8e' },
  { keywords: ['gym', 'planet fitness', 'anytime fitness', 'la fitness', 'crunch fitness'], name: 'Gym', emoji: '💪', category: 'Personal Care', color: '#f59e0b' },
  { keywords: ['audible'],              name: 'Audible',           emoji: '🎧', category: 'Entertainment', color: '#f76a1e' },
  { keywords: ['kindle unlimited'],     name: 'Kindle Unlimited',  emoji: '📚', category: 'Entertainment', color: '#ff9900' },
  { keywords: ['twitch'],               name: 'Twitch',            emoji: '🎮', category: 'Entertainment', color: '#9146ff' },
  { keywords: ['discord nitro'],        name: 'Discord Nitro',     emoji: '💬', category: 'Entertainment', color: '#5865f2' },
  { keywords: ['duolingo'],             name: 'Duolingo',          emoji: '🦉', category: 'Education', color: '#58cc02' },
  { keywords: ['masterclass'],          name: 'MasterClass',       emoji: '🎓', category: 'Education', color: '#000' },
  { keywords: ['icloud'],               name: 'iCloud',            emoji: '☁️', category: 'Software', color: '#555' },
  { keywords: ['experian', 'equifax', 'transunion', 'credit karma'], name: 'Credit Monitor', emoji: '📊', category: 'Services', color: '#3b82f6' },
  { keywords: ['tidal'],                name: 'Tidal',             emoji: '🎵', category: 'Entertainment', color: '#000' },
  { keywords: ['sirius', 'siriusxm'],   name: 'SiriusXM',          emoji: '📻', category: 'Entertainment', color: '#0000cc' },
  { keywords: ['dazn'],                 name: 'DAZN',              emoji: '🥊', category: 'Entertainment', color: '#f5a623' },
  { keywords: ['espn'],                 name: 'ESPN+',             emoji: '🏈', category: 'Entertainment', color: '#cc0000' },
  { keywords: ['nba league pass'],      name: 'NBA League Pass',   emoji: '🏀', category: 'Entertainment', color: '#c9082a' },
  { keywords: ['calm', 'headspace'],    name: 'Meditation App',    emoji: '🧘', category: 'Personal Care', color: '#f97316' },
  { keywords: ['noom', 'weight watchers', 'weightwatchers'], name: 'Health App', emoji: '🥗', category: 'Personal Care', color: '#84cc16' },
];

function matchKnownSub(merchantOrDesc: string) {
  const s = merchantOrDesc.toLowerCase();
  return KNOWN_SUBS.find(k => k.keywords.some(kw => s.includes(kw)));
}

// ── Recurring payment detector ────────────────────────────────────────────────
interface RecurringItem {
  merchant: string;
  amount: number;
  frequency: string;
  estimatedMonthly: number;
  lastDate: Date;
  category?: string;
  count: number;
}

/**
 * DEPRECATED — this client detector used to flood the UI with false positives
 * (Home Depot, QuikTrip, gas stations) because it had no denylist and a low
 * minOccurrences gate. All recurring data should come from the `subscriptions`
 * table, which is populated by the much stricter server engine in
 * `lib/vault/recurringDetection.ts`.
 *
 * Kept as a no-op so other parts of the file still typecheck; the calendar
 * and All-Recurring views now read straight from `subscriptions`.
 */
function detectRecurring(_transactions: VaultTransaction[]): RecurringItem[] {
  return [];
}

function getNextPaymentDate(lastDate: Date, frequency: string): Date {
  const now = new Date();
  const next = new Date(lastDate);
  const step = () => {
    if (frequency === 'weekly')    next.setDate(next.getDate() + 7);
    else if (frequency === 'bi-weekly') next.setDate(next.getDate() + 14);
    else if (frequency === 'monthly')   next.setMonth(next.getMonth() + 1);
    else if (frequency === 'quarterly') next.setMonth(next.getMonth() + 3);
    else if (frequency === 'annual')    next.setFullYear(next.getFullYear() + 1);
  };
  step();
  while (next < now) step();
  return next;
}

interface UpcomingPayment {
  key: string;
  name: string;
  emoji: string;
  amount: number;
  nextDate: Date;
  frequency: string;
  color?: string;
  category?: string;
}

function buildUpcoming(allTransactions: VaultTransaction[], subscriptions: Subscription[]): UpcomingPayment[] {
  const items: UpcomingPayment[] = [];
  const seen = new Set<string>();

  // From auto-detected recurring transactions
  detectRecurring(allTransactions).forEach(r => {
    const key = r.merchant.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const known = matchKnownSub(r.merchant);
    const nextDate = getNextPaymentDate(r.lastDate, r.frequency);
    items.push({
      key,
      name: known?.name || r.merchant,
      emoji: known?.emoji || '💳',
      amount: r.amount,
      nextDate,
      frequency: r.frequency,
      color: known?.color,
      category: known?.category,
    });
  });

  // From manually saved subscriptions (override auto-detected if same merchant)
  subscriptions.filter(s => s.isActive).forEach(s => {
    const key = s.name.toLowerCase();
    seen.add(key);
    const nextDate = s.nextBillingDate
      ? new Date(s.nextBillingDate)
      : getNextPaymentDate(new Date(), s.frequency || 'monthly');
    // Remove auto-detected duplicate
    const existing = items.findIndex(i => i.key === key || i.name.toLowerCase() === key);
    if (existing !== -1) items.splice(existing, 1);
    items.push({
      key,
      name: s.name,
      emoji: s.emoji || '💳',
      amount: s.amount,
      nextDate,
      frequency: s.frequency || 'monthly',
      color: s.color,
      category: s.category,
    });
  });

  return items
    .filter(i => {
      const days = Math.ceil((i.nextDate.getTime() - Date.now()) / 86400000);
      return days >= 0 && days <= 45;
    })
    .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
}

function UpcomingPayments({ allTransactions, subscriptions }: {
  allTransactions: VaultTransaction[];
  subscriptions: Subscription[];
}) {
  const upcoming = buildUpcoming(allTransactions, subscriptions);
  if (upcoming.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build 30-day calendar grid
  const calDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const payments = upcoming.filter(u => {
      const nd = new Date(u.nextDate);
      nd.setHours(0, 0, 0, 0);
      return nd.getTime() === d.getTime();
    });
    return { date: d, payments };
  });

  const daysLabel = (d: Date) => {
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-white/40 flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" /> Upcoming Payments
        </p>
        <p className="font-mono text-[10px] text-white/25">next 45 days</p>
      </div>

      {/* 30-day strip */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {calDays.map(({ date, payments }, i) => {
          const isToday = i === 0;
          const hasPayment = payments.length > 0;
          const totalAmt = payments.reduce((s, p) => s + p.amount, 0);
          return (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1"
              style={{ minWidth: 32 }}>
              <span className="font-mono text-[9px] text-white/20">
                {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[10px] relative transition-all ${
                isToday ? 'text-black font-bold' : hasPayment ? 'text-white' : 'text-white/25'
              }`} style={{
                background: isToday ? '#00ff88' : hasPayment ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.03)',
                border: hasPayment && !isToday ? '1px solid rgba(248,113,113,0.3)' : isToday ? 'none' : '1px solid rgba(255,255,255,0.05)',
              }}>
                {date.getDate()}
                {hasPayment && !isToday && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400" />
                )}
              </div>
              {hasPayment && (
                <span className="font-mono text-[8px] text-red-400/70">
                  ${Math.round(totalAmt)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-2">
        {upcoming.slice(0, 8).map(p => {
          const diff = Math.round((p.nextDate.getTime() - today.getTime()) / 86400000);
          const isUrgent = diff <= 3;
          return (
            <div key={p.key} className="flex items-center gap-3 py-2 px-3 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-lg flex-shrink-0">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-white/80 truncate">{p.name}</p>
                <p className="font-mono text-[10px] text-white/30 capitalize">{p.frequency}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-sm font-bold text-white">{fmtFull(p.amount)}</p>
                <p className="font-mono text-[10px]" style={{ color: isUrgent ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                  {daysLabel(p.nextDate)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── VaultView ─────────────────────────────────────────────────────────────────
export function VaultView() {
  const [topTab, setTopTab] = useState<VaultTopTab>('see');
  const [section, setSection] = useState<VaultSection>('see');
  const [selectedTx, setSelectedTx] = useState<VaultTransaction | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [nudges, setNudges] = useState<VaultAiNudge[]>([]);
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());

  // modals
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [useClassicBudget, setUseClassicBudget] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  // ── React Query: cached vault reads. Tab switches stay instant. ──
  const {
    accounts,
    transactions,
    budgets,
    debts,
    goals,
    rules,
    subscriptions,
    netWorthHistory,
    isLoading,
  } = useVaultData(500);
  const cache = useVaultCache();
  const updateCategoryMutation = useUpdateTransactionCategory();

  // Keep loadAll callable so existing handlers don't all need rewrites.
  const loadAll = useCallback(async () => {
    await cache.invalidateAll();
  }, [cache]);

  // computed
  const netWorth = VaultDataService.computeNetWorth(accounts);
  const rangedTxs = filterByRange(transactions, timeRange);
  const totalIncome   = rangedTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = rangedTxs.filter(isRealExpense).reduce((s, t) => s + t.amount, 0);

  const handleUpdateCategory = useCallback(async (id: string, category: string) => {
    // Optimistic mutation — patches cache immediately, refetches on settle.
    await updateCategoryMutation.mutateAsync({ id, category });
  }, [updateCategoryMutation]);

  // ── AI nudges: keyed off a fingerprint so we don't re-hit /ai-nudges
  //    every time React Query touches the cache. ──
  const fetchNudges = useCallback(async (
    txs: VaultTransaction[],
    debtList: DebtEntry[],
    goalList: SavingsGoal[],
  ) => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const recent = txs.filter(t => new Date(t.date) >= cutoff);
      if (recent.length === 0 && debtList.length === 0 && goalList.length === 0) return;

      const res = await fetch('/api/ctroom/vault/ai-nudges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: recent.map(t => ({
            description: t.description,
            merchant: t.merchant,
            amount: t.amount,
            type: t.type,
            category: t.category,
            date: new Date(t.date).toISOString().split('T')[0],
            accountName: t.accountName,
          })),
          debts: debtList.map(d => ({ id: d.id, name: d.name, type: d.type, balance: d.balance, minimumPayment: d.minimumPayment })),
          goals: goalList.map(g => ({ id: g.id, name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount, emoji: g.emoji })),
        }),
      });
      const data = await res.json();
      if (data.nudges?.length) setNudges(data.nudges);
    } catch {
      // silently fail — nudges are advisory
    }
  }, []);

  const nudgeFingerprint = `${transactions.length}:${debts.length}:${goals.length}`;
  useEffect(() => {
    if (isLoading) return;
    fetchNudges(transactions, debts, goals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nudgeFingerprint, isLoading]);

  // ── nudge helpers (declared after loadAll to avoid hoisting error) ──────
  const dismissNudge = useCallback((id: string) => {
    setDismissedNudges(prev => new Set(Array.from(prev).concat(id)));
  }, []);

  const applyDebtNudge = useCallback(async (nudge: VaultAiNudge) => {
    if (!nudge.debtId || nudge.suggestedBalance === undefined) return;
    await VaultDataService.updateDebt(nudge.debtId, { balance: nudge.suggestedBalance });
    dismissNudge(nudge.id);
    loadAll();
  }, [dismissNudge, loadAll]);

  const applyGoalNudge = useCallback(async (nudge: VaultAiNudge) => {
    if (!nudge.goalId || nudge.suggestedAmount === undefined) return;
    await VaultDataService.updateSavingsGoal(nudge.goalId, { currentAmount: nudge.suggestedAmount });
    dismissNudge(nudge.id);
    loadAll();
  }, [dismissNudge, loadAll]);

  const activeNudges = nudges.filter(n => !dismissedNudges.has(n.id));

  // ── sync ─────────────────────────────────────────────────────────────────
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) {
        setSyncMessage('Not signed in — refresh and try again');
        return;
      }

      const res = await fetch('/api/ctroom/vault/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        console.error('[Vault sync] failed:', res.status, text);
        setSyncMessage(`Sync failed (${res.status})`);
        return;
      }

      const result = await res.json();
      if (result.error) {
        console.error('[Vault sync] api error:', result.error);
        setSyncMessage(`Sync failed: ${result.error}`);
        return;
      }

      // Server-side recurring scan runs inline as part of sync.
      const parts: string[] = [];
      if (typeof result.synced === 'number') parts.push(`Synced ${result.synced} transactions`);
      if (result.accountsUpdated) parts.push(`${result.accountsUpdated} accounts`);
      if (result.recurring?.pendingReview) parts.push(`${result.recurring.pendingReview} to review`);
      if (result.recurring?.cancelled) parts.push(`${result.recurring.cancelled} cancelled`);
      setSyncMessage(parts.length ? parts.join(' · ') : 'Sync complete');
      await loadAll();
    } catch (err) {
      console.error('[Vault sync] threw:', err);
      setSyncMessage('Sync failed — see console');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  const authFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    return fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...options.headers,
      },
    });
  }, []);

  const handleDetectRecurring = useCallback(async () => {
    const res = await authFetch('/api/ctroom/vault/recurring-refresh', { method: 'POST' });
    const data = await res.json();
    const parts: string[] = [];
    if (data.detected !== undefined) parts.push(`${data.detected} detected`);
    if (data.pendingReview) parts.push(`${data.pendingReview} to review`);
    if (data.cancelled) parts.push(`${data.cancelled} cancelled`);
    setSyncMessage(parts.length ? parts.join(' · ') : 'Recurring scan complete');
    await loadAll();
    setTimeout(() => setSyncMessage(''), 4000);
  }, [authFetch, loadAll]);

  // Pick the active top-tab descriptor and the active section's icon/label.
  const activeTopTab = TOP_TABS.find(t => t.id === topTab) ?? TOP_TABS[0];
  // Auto-correct stale section when switching top tabs (e.g. 'budget' → 'plan' but
  // budget actually lives under money; we just snap to the new tab's default).
  useEffect(() => {
    if (!activeTopTab.sections.some(s => s.id === section)) {
      setSection(activeTopTab.defaultSection);
    }
  }, [activeTopTab, section]);

  // Time-range bar only makes sense on data-heavy sections.
  const showTimeRange = section === 'understand';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(0,255,136,0.3)', borderTopColor: '#00ff88' }} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#080808' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 md:px-6 pt-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Row 1: brand strip + net-worth hero stats + actions */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                <Wallet className="w-4 h-4" style={{ color: '#00ff88' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Vault</p>
                <p className="text-[10px] mt-0.5 leading-none" style={{ color: 'rgba(255,255,255,0.35)' }}>See · Understand · Plan</p>
              </div>
            </div>

            {/* VaultHero — net worth + range income/spend */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Net Worth</p>
                <p className={cn("font-mono font-bold text-sm leading-none", netWorth >= 0 ? "text-white" : "text-red-400")}>{fmtFull(netWorth)}</p>
              </div>
              <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Income</p>
                <p className="font-mono font-bold text-xs leading-none text-emerald-400">+{fmtFull(totalIncome)}</p>
              </div>
              <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Spent</p>
                <p className="font-mono font-bold text-xs leading-none text-red-400">-{fmtFull(totalExpenses)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {syncMessage && <span className="text-xs font-mono text-emerald-400">{syncMessage}</span>}
            <TellerConnectButton onSuccess={() => { loadAll(); handleSync(); }} />
            <button onClick={handleSync} disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>

        {/* Row 2: top tabs (4) — pill style */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3">
          {TOP_TABS.map(t => {
            const active = topTab === t.id;
            return (
              <button key={t.id}
                onClick={() => { setTopTab(t.id); setSection(t.defaultSection); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                style={active
                  ? { color: '#00ff88', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }
                  : { color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ color: active ? '#00ff88' : 'rgba(255,255,255,0.4)' }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Row 3: sub-nav (shown only when the active top tab has >1 section)
            + time range bar (only on data sections) */}
        {(activeTopTab.sections.length > 1 || showTimeRange) && (
          <div className="flex items-center justify-between gap-4 pb-3 flex-wrap">
            {activeTopTab.sections.length > 1 ? (
              <div className="flex gap-1 p-1 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {activeTopTab.sections.map(s => {
                  const active = section === s.id;
                  return (
                    <button key={s.id} onClick={() => setSection(s.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                      style={active
                        ? { background: 'rgba(255,255,255,0.09)', color: '#e5e5e5' }
                        : { color: 'rgba(255,255,255,0.4)' }}>
                      {s.icon}{s.label}
                    </button>
                  );
                })}
              </div>
            ) : <div />}
            {showTimeRange && (
              <div className="flex gap-0.5 p-1 rounded-xl flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map(r => (
                  <button key={r} onClick={() => setTimeRange(r)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all"
                    style={timeRange === r
                      ? { background: 'rgba(255,255,255,0.09)', color: '#e5e5e5' }
                      : { color: 'rgba(255,255,255,0.3)' }}>
                    {TIME_RANGE_LABELS[r]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${topTab}/${section}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {section === 'see' && (
              <SeeTab
                transactions={rangedTxs}
                allTransactions={transactions}
                subscriptions={subscriptions}
                accounts={accounts}
                goals={goals}
                debts={debts}
                budgets={budgets}
                onUpdateCategory={handleUpdateCategory}
                onReviewed={() => cache.invalidateSubscriptions()}
                onGoalsSaved={loadAll}
              />
            )}
            {section === 'understand' && (
              <UnderstandTab
                transactions={rangedTxs}
                allTransactions={transactions}
                accounts={accounts}
                onTxClick={setSelectedTx}
              />
            )}
            {section === 'budget' && (
              useClassicBudget ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setUseClassicBudget(false)}
                    className="text-xs text-stone-500 hover:text-stone-300"
                  >
                    ← Back to zero-based assign
                  </button>
                  <BudgetTab
                    budgets={budgets}
                    onAdd={() => setShowAddBudget(true)}
                    onDelete={async id => { await VaultDataService.deleteBudgetCategory(id); loadAll(); }}
                    onUpdate={async (id, updates) => { await VaultDataService.updateBudgetCategory(id, updates); loadAll(); }}
                  />
                </div>
              ) : (
                <EnvelopeBudget
                  transactions={transactions}
                  subscriptions={subscriptions}
                  onShowClassicBudget={() => setUseClassicBudget(true)}
                  onBillsChanged={loadAll}
                />
              )
            )}
            {section === 'debt' && (
              <DebtTab
                debts={debts}
                transactions={transactions}
                nudges={activeNudges.filter(n => n.type === 'debt_payment')}
                onAdd={() => setShowAddDebt(true)}
                onDelete={async id => { await VaultDataService.deleteDebt(id); loadAll(); }}
                onUpdate={async (id, updates) => { await VaultDataService.updateDebt(id, updates); loadAll(); }}
                onImport={async rows => { await Promise.all(rows.map(r => VaultDataService.saveDebt(r))); loadAll(); }}
                onApplyNudge={applyDebtNudge}
                onDismissNudge={dismissNudge}
              />
            )}
            {section === 'goals' && (
              <GoalsTab
                goals={goals}
                nudges={activeNudges.filter(n => n.type === 'goal_contribution')}
                onAdd={() => setShowAddGoal(true)}
                onDelete={async id => { await VaultDataService.deleteSavingsGoal(id); loadAll(); }}
                onUpdate={async (id, updates) => { await VaultDataService.updateSavingsGoal(id, updates); loadAll(); }}
                onApplyNudge={applyGoalNudge}
                onDismissNudge={dismissNudge}
              />
            )}
            {section === 'recurring' && (
              <>
                {editingSubscription && (
                  <EditSubscriptionModal
                    subscription={editingSubscription}
                    onClose={() => setEditingSubscription(null)}
                    onSave={sub => {
                      VaultDataService.saveSubscription(sub).then(() => {
                        setEditingSubscription(null);
                        loadAll();
                      });
                    }}
                    onUpdate={(id, u) => {
                      VaultDataService.updateSubscription(id, u).then(() => {
                        setEditingSubscription(null);
                        loadAll();
                      });
                    }}
                    onDelete={id => {
                      VaultDataService.deleteSubscription(id).then(() => {
                        setEditingSubscription(null);
                        loadAll();
                      });
                    }}
                  />
                )}
                <BillsTab
                  transactions={transactions}
                  subscriptions={subscriptions}
                  onSave={async s => { await VaultDataService.saveSubscription(s); loadAll(); }}
                  onUpdate={async (id, u) => { await VaultDataService.updateSubscription(id, u); loadAll(); }}
                  onDelete={async id => { await VaultDataService.deleteSubscription(id); loadAll(); }}
                  onDetectRecurring={handleDetectRecurring}
                  onReviewed={() => cache.invalidateSubscriptions()}
                  onEditSub={setEditingSubscription}
                />
              </>
            )}
            {section === 'ask' && (
              <VaultAIChat
                transactions={transactions}
                budgets={budgets}
                debts={debts}
                goals={goals}
                subscriptions={subscriptions}
                accounts={accounts}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddAccount     && <AddAccountModal    onClose={() => setShowAddAccount(false)}    onSave={async a => { await VaultDataService.saveAccount(a); setShowAddAccount(false); loadAll(); }} />}
        {showAddTransaction && <AddTransactionModal accounts={accounts} onClose={() => setShowAddTransaction(false)} onSave={async t => { await VaultDataService.saveTransaction(t); setShowAddTransaction(false); loadAll(); }} />}
        {showAddDebt        && <AddDebtModal        onClose={() => setShowAddDebt(false)}       onSave={async d => { await VaultDataService.saveDebt(d); setShowAddDebt(false); loadAll(); }} />}
        {showAddGoal        && <AddGoalModal        onClose={() => setShowAddGoal(false)}       onSave={async g => { await VaultDataService.saveSavingsGoal(g); setShowAddGoal(false); loadAll(); }} />}
        {showAddBudget      && <AddBudgetModal      onClose={() => setShowAddBudget(false)}     onSave={async b => { await VaultDataService.saveBudgetCategory(b); setShowAddBudget(false); loadAll(); }} />}
        {selectedTx && (
          <TransactionDetailModal
            tx={selectedTx}
            onClose={() => setSelectedTx(null)}
            onUpdateCategory={async (id, cat) => { await handleUpdateCategory(id, cat); setSelectedTx(prev => prev ? { ...prev, category: cat } : null); }}
            onCreateRule={async (pattern, cat) => { await VaultDataService.saveRule(pattern, cat); loadAll(); setSelectedTx(null); }}
            onDelete={async id => { await VaultDataService.deleteTransaction(id); setSelectedTx(null); loadAll(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── HEALTH SCORE ──────────────────────────────────────────────────────────────
function computeHealthScore(
  transactions: VaultTransaction[],
  budgets: BudgetCategory[],
  debts: DebtEntry[],
  goals: SavingsGoal[],
): { score: number; breakdown: { label: string; pts: number; max: number; note: string }[] } {
  const monthTxs = filterByRange(transactions, 'month');
  const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxs.filter(isRealExpense).reduce((s, t) => s + t.amount, 0);

  // 1. Savings rate (30 pts) — 20%+ savings = full points
  const savingsRate = income > 0 ? (income - expenses) / income : 0;
  const savingsPts = Math.round(Math.min(30, Math.max(0, savingsRate * 150)));

  // 2. Budget health (25 pts) — % of categories under limit
  const budgetPts = budgets.length === 0 ? 12
    : Math.round((budgets.filter(b => (b.spent || 0) <= b.monthlyLimit).length / budgets.length) * 25);

  // 3. Debt load (25 pts) — lower debt-to-annual-income = better
  const totalDebtBal = debts.reduce((s, d) => s + d.balance, 0);
  const annualIncome = income * 12;
  const dti = annualIncome > 0 ? totalDebtBal / annualIncome : (totalDebtBal > 0 ? 1 : 0);
  const debtPts = debts.length === 0 ? 25 : Math.round(Math.max(0, 25 - dti * 25));

  // 4. Goal progress (20 pts) — average % across all goals
  const goalPts = goals.length === 0 ? 10
    : Math.round((goals.reduce((s, g) => s + Math.min(1, g.currentAmount / (g.targetAmount || 1)), 0) / goals.length) * 20);

  const score = Math.min(100, savingsPts + budgetPts + debtPts + goalPts);
  return {
    score,
    breakdown: [
      { label: 'Savings Rate', pts: savingsPts, max: 30, note: income > 0 ? `${Math.round(savingsRate * 100)}% saved this month` : 'No income data' },
      { label: 'Budget Health', pts: budgetPts, max: 25, note: budgets.length > 0 ? `${budgets.filter(b => (b.spent || 0) <= b.monthlyLimit).length}/${budgets.length} on track` : 'No budgets set' },
      { label: 'Debt Load', pts: debtPts, max: 25, note: debts.length > 0 ? `DTI: ${Math.round(dti * 100)}%` : 'No debts tracked' },
      { label: 'Goal Progress', pts: goalPts, max: 20, note: goals.length > 0 ? `${goals.filter(g => g.currentAmount >= g.targetAmount).length}/${goals.length} complete` : 'No goals set' },
    ],
  };
}

const COMPONENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const HEALTH_TIPS: Record<string, string> = {
  'Savings Rate': 'Aim to save 20%+ of income. Cut top spending categories first.',
  'Budget Health': 'Set limits for each category and stick to them monthly.',
  'Debt Load': 'Pay more than minimums on high-interest debt to reduce load.',
  'Goal Progress': 'Automate a fixed transfer to savings goals each payday.',
};

function HealthScorePanel({ score, breakdown }: {
  score: number;
  breakdown: { label: string; pts: number; max: number; note: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';

  return (
    <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between">
        <h3 className="font-mono font-semibold text-sm" style={{ color: '#e5e5e5' }}>Financial Health</h3>
        <button onClick={() => setExpanded(p => !p)}
          className="text-xs transition-colors"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e5e5e5'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}>
          {expanded ? 'Hide tips ↑' : 'Show tips ↓'}
        </button>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" className="-rotate-90">
            <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle cx="48" cy="48" r={r} fill="none" stroke={scoreColor} strokeWidth="8"
              strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-xl font-bold leading-none" style={{ color: scoreColor }}>{grade}</span>
            <span className="font-mono text-[11px] font-medium" style={{ color: scoreColor }}>{score}</span>
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>/100</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-sm" style={{ color: scoreColor }}>{label}</p>
          {breakdown.map((b, i) => {
            const pct = (b.pts / b.max) * 100;
            const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? COMPONENT_COLORS[i] : pct >= 25 ? '#f59e0b' : '#ef4444';
            return (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{b.label}</span>
                  <span className="font-medium text-xs" style={{ color: '#e5e5e5' }}>{b.pts}/{b.max} · {b.note}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: barColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {expanded && (
        <div className="space-y-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {breakdown.filter(b => b.pts < b.max).map((b, i) => (
            <div key={b.label} className="flex items-start gap-2 text-xs">
              <span style={{ color: COMPONENT_COLORS[i] }} className="flex-shrink-0 mt-0.5">↑</span>
              <div>
                <span className="font-medium" style={{ color: '#e5e5e5' }}>{b.label}:</span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{HEALTH_TIPS[b.label]}</span>
              </div>
            </div>
          ))}
          {breakdown.every(b => b.pts === b.max) && (
            <p className="text-xs text-emerald-500">All components maxed — great work!</p>
          )}
        </div>
      )}
    </div>
  );
}

function CashFlowPanel({ accounts, transactions, subscriptions }: {
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
  const daysLeft = daysInMonth - dayOfMonth;

  const expenses = transactions.filter(t => t.type === 'expense');
  const avgDailyExpense = dayOfMonth > 0 && expenses.length > 0
    ? expenses.reduce((s, t) => s + t.amount, 0) / dayOfMonth
    : 0;

  const projectedRemaining = avgDailyExpense * daysLeft;
  const activeSubMonthly = subscriptions.filter(s => s.isActive).reduce((s, sub) => s + toMonthly(sub.amount, sub.frequency), 0);
  const eomForecast = liquidBalance - projectedRemaining;

  return (
    <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <h3 className="font-mono font-semibold text-sm mb-3" style={{ color: '#e5e5e5' }}>Cash Flow Forecast</h3>
      <div className="space-y-2.5">
        <div className="flex justify-between text-sm">
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Liquid Balance</span>
          <span className="font-semibold" style={{ color: '#e5e5e5' }}>{fmtFull(liquidBalance)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Avg Daily Spend</span>
          <span className="font-medium text-red-400">{fmtFull(avgDailyExpense)}/day</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Projected ({daysLeft}d left)</span>
          <span className="font-medium text-amber-400">-{fmtFull(projectedRemaining)}</span>
        </div>
        {activeSubMonthly > 0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Subscriptions/mo</span>
            <span className="font-medium text-red-400">-{fmtFull(activeSubMonthly)}</span>
          </div>
        )}
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="flex justify-between text-sm font-semibold">
          <span style={{ color: '#e5e5e5' }}>End of Month Est.</span>
          <span className={eomForecast >= 0 ? 'text-emerald-500' : 'text-red-400'}>{fmtFull(eomForecast)}</span>
        </div>
      </div>
    </div>
  );
}

const VAULT_AI_MODELS = [
  // Google Gemini
  { id: 'gemini-2.0-flash',             label: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash',             label: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro',               label: 'Gemini 1.5 Pro' },
  // OpenAI
  { id: 'gpt-4o-mini',                  label: 'GPT-4o Mini' },
  { id: 'gpt-4o',                       label: 'GPT-4o' },
  // Anthropic
  { id: 'claude-3-5-haiku-20241022',    label: 'Claude 3.5 Haiku' },
  { id: 'claude-3-5-sonnet-20241022',   label: 'Claude 3.5 Sonnet' },
];

const VAULT_QUICK_PROMPTS = [
  'Give me 4 financial insights this month',
  'Where am I overspending?',
  'How can I pay off my debt faster?',
  'Am I on track with my savings goals?',
  'What subscriptions should I cut?',
];

function buildVaultSystemPrompt(
  transactions: VaultTransaction[],
  budgets: BudgetCategory[],
  debts: DebtEntry[],
  goals: SavingsGoal[],
  subscriptions: Subscription[],
  accounts: VaultAccount[],
): string {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(isRealExpense).reduce((s, t) => s + t.amount, 0);
  const catMap: Record<string, number> = {};
  transactions.filter(isRealExpense).forEach(t => {
    catMap[t.category || 'Other'] = (catMap[t.category || 'Other'] || 0) + t.amount;
  });
  const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([k, v]) => `${k}: $${v.toFixed(0)}`).join(', ');
  const accountSummary = accounts.map(a => `${a.name} (${a.type}): $${a.balance.toFixed(2)}`).join(', ');
  const budgetSummary = budgets.map(b => `${b.name}: $${(b.spent || 0).toFixed(0)}/$${b.monthlyLimit} ${(b.spent || 0) > b.monthlyLimit ? '[OVER]' : '[ok]'}`).join(', ');
  const debtSummary = debts.map(d => `${d.name}: $${d.balance.toFixed(0)} @ ${d.interestRate}% APR, min $${d.minimumPayment}/mo`).join(', ');
  const goalSummary = goals.map(g => `${g.name}: $${g.currentAmount}/$${g.targetAmount} (${Math.round((g.currentAmount / (g.targetAmount || 1)) * 100)}%)`).join(', ');
  const subSummary = subscriptions.filter(s => s.isActive).map(s => `${s.name}: $${s.amount}/${s.frequency}`).join(', ');

  return `You are Kings's personal finance advisor with full access to their financial data. Be specific, direct, and use exact numbers from their data. Keep responses concise.

TODAY: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

ACCOUNTS: ${accountSummary || 'None linked'}
THIS MONTH: Income $${income.toFixed(0)}, Spending $${expenses.toFixed(0)}, Savings rate ${income > 0 ? Math.round(((income - expenses) / income) * 100) : 0}%
TOP SPENDING CATEGORIES: ${topCats || 'No data'}
BUDGETS: ${budgetSummary || 'None set'}
DEBTS: ${debtSummary || 'None tracked'}
SAVINGS GOALS: ${goalSummary || 'None set'}
ACTIVE SUBSCRIPTIONS: ${subSummary || 'None tracked'}`;
}

type VaultChatMsg = { role: 'user' | 'assistant'; content: string; timestamp: string; isError?: boolean };

const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  p:          ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong:     ({ children }) => <strong className="font-semibold" style={{ color: '#e5e5e5' }}>{children}</strong>,
  em:         ({ children }) => <em className="italic">{children}</em>,
  ul:         ({ children }) => <ul className="mt-1 mb-2 space-y-1 pl-1">{children}</ul>,
  ol:         ({ children }) => <ol className="mt-1 mb-2 space-y-1 pl-1">{children}</ol>,
  li:         ({ children }) => (
    <li className="flex items-start gap-1.5">
      <span className="flex-shrink-0 mt-1 text-[8px] select-none" style={{ color: '#00ff88' }}>●</span>
      <span>{children}</span>
    </li>
  ),
  h1:         ({ children }) => <p className="font-bold text-sm mb-1" style={{ color: '#e5e5e5' }}>{children}</p>,
  h2:         ({ children }) => <p className="font-semibold mb-1" style={{ color: '#e5e5e5' }}>{children}</p>,
  h3:         ({ children }) => <p className="font-medium mb-0.5" style={{ color: '#e5e5e5' }}>{children}</p>,
  code:       ({ children }) => <code className="rounded px-1 py-0.5 font-mono text-[10px]" style={{ background: 'rgba(255,255,255,0.08)', color: '#00ff88' }}>{children}</code>,
  blockquote: ({ children }) => <div className="pl-2 italic" style={{ borderLeft: '2px solid rgba(0,255,136,0.4)', color: 'rgba(255,255,255,0.4)' }}>{children}</div>,
};

function VaultAIChat({ transactions, budgets, debts, goals, subscriptions, accounts }: {
  transactions: VaultTransaction[];
  budgets: BudgetCategory[];
  debts: DebtEntry[];
  goals: SavingsGoal[];
  subscriptions: Subscription[];
  accounts: VaultAccount[];
}) {
  const [messages, setMessages] = useState<VaultChatMsg[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('gemini-2.0-flash');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ id: string; title: string; updated_at: string; messages: VaultChatMsg[] }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Load most recent chat on mount
  useEffect(() => {
    VaultDataService.fetchVaultChats().then(chats => {
      if (chats.length > 0) {
        const latest = chats[0];
        setHistory(chats as any);
        setChatId(latest.id);
        setMessages((latest.messages || []) as VaultChatMsg[]);
        setModel(latest.model || 'gemini-2.0-flash');
      }
    });
  }, []);

  const scrollToBottom = () =>
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);

  const persistChat = useCallback(async (
    msgs: VaultChatMsg[], currentId: string | null, currentModel: string
  ) => {
    const firstUser = msgs.find(m => m.role === 'user')?.content || 'Financial Chat';
    const title = firstUser.length > 50 ? firstUser.slice(0, 50) + '…' : firstUser;
    const newId = await VaultDataService.saveVaultChat(currentId, msgs as any, title, currentModel);
    if (!currentId && newId) setChatId(newId);
  }, []);

  const callApi = useCallback(async (msgs: VaultChatMsg[], retryModel?: string) => {
    const activeModel = retryModel || model;
    setIsLoading(true);
    try {
      const systemPrompt = buildVaultSystemPrompt(transactions, budgets, debts, goals, subscriptions, accounts);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'system', content: systemPrompt }, ...msgs.map(m => ({ role: m.role, content: m.content }))],
          model: activeModel,
        }),
      });
      const data = await res.json();
      const content = data.message || 'No response received.';
      const isError = !data.message || content.toLowerCase().startsWith('error') || content.includes('having trouble');
      const reply: VaultChatMsg = { role: 'assistant', content, timestamp: new Date().toISOString(), isError };
      const updated = [...msgs, reply];
      setMessages(updated);
      await persistChat(updated, chatId, activeModel);
      return updated;
    } catch {
      const reply: VaultChatMsg = { role: 'assistant', content: 'Connection failed. Check your API key in Settings or try a different model.', timestamp: new Date().toISOString(), isError: true };
      setMessages(prev => [...prev, reply]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
    return msgs;
  }, [model, chatId, transactions, budgets, debts, goals, subscriptions, accounts, persistChat]);

  const send = useCallback(async (userMsg?: string) => {
    const msg = (userMsg || input).trim();
    if (!msg || isLoading) return;
    setInput('');
    const userEntry: VaultChatMsg = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    const withUser = [...messages, userEntry];
    setMessages(withUser);
    scrollToBottom();
    await callApi(withUser);
  }, [input, messages, isLoading, callApi]);

  const retry = useCallback(async () => {
    // Re-send from the last user message
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIdx === -1) return;
    const idx = messages.length - 1 - lastUserIdx;
    const withoutLast = messages.slice(0, idx + 1);
    setMessages(withoutLast);
    await callApi(withoutLast);
  }, [messages, callApi]);

  const newChat = useCallback(() => {
    setMessages([]);
    setChatId(null);
    setShowHistory(false);
  }, []);

  const loadChat = useCallback((chat: { id: string; messages: VaultChatMsg[]; model: string }) => {
    setChatId(chat.id);
    setMessages(chat.messages || []);
    setModel(chat.model || 'gemini-2.0-flash');
    setShowHistory(false);
    scrollToBottom();
  }, []);

  const openHistory = useCallback(async () => {
    setLoadingHistory(true);
    const chats = await VaultDataService.fetchVaultChats();
    setHistory(chats as any);
    setLoadingHistory(false);
    setShowHistory(true);
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    await VaultDataService.deleteVaultChat(id);
    setHistory(prev => prev.filter(c => c.id !== id));
    if (chatId === id) newChat();
  }, [chatId, newChat]);

  const lastMsg = messages[messages.length - 1];
  const showRetry = lastMsg?.isError && !isLoading;

  return (
    <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono font-semibold text-sm" style={{ color: '#e5e5e5' }}>AI Finance Advisor</h3>
        <div className="flex items-center gap-2">
          <button onClick={openHistory}
            className="text-xs transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e5e5e5'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}>
            History
          </button>
          <button onClick={newChat}
            className="text-xs transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e5e5e5'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}>
            New Chat
          </button>
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e5e5' }}
          >
            {VAULT_AI_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-mono font-medium" style={{ color: '#e5e5e5' }}>Past Conversations</p>
            <button onClick={() => setShowHistory(false)} style={{ color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e5e5e5'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loadingHistory ? (
              <p className="text-xs p-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-xs p-3" style={{ color: 'rgba(255,255,255,0.35)' }}>No saved conversations yet.</p>
            ) : history.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 transition-colors group"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <button className="flex-1 text-left min-w-0" onClick={() => loadChat(c as any)}>
                  <p className="text-xs font-medium truncate" style={{ color: '#e5e5e5' }}>{c.title}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{new Date(c.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </button>
                <button onClick={() => deleteChat(c.id)} className="opacity-0 group-hover:opacity-100 p-1 transition-all ml-2"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick prompts */}
      {messages.length === 0 && !showHistory && (
        <div className="flex flex-wrap gap-1.5">
          {VAULT_QUICK_PROMPTS.map(q => (
            <button key={q} onClick={() => send(q)} disabled={isLoading}
              className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#e5e5e5'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div ref={scrollRef} className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className="text-xs rounded-2xl px-3 py-2.5 leading-relaxed"
              style={m.role === 'user'
                ? { background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.15)', color: '#e5e5e5', marginLeft: '1.5rem' }
                : m.isError
                  ? { background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#e5e5e5', marginRight: '1.5rem' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#e5e5e5', marginRight: '1.5rem' }
              }>
              {m.role === 'user' ? m.content : (
                <ReactMarkdown components={MD_COMPONENTS}>{m.content}</ReactMarkdown>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', marginRight: '1.5rem' }}>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'rgba(0,255,136,0.5)', animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'rgba(0,255,136,0.5)', animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'rgba(0,255,136,0.5)', animationDelay: '300ms' }} />
              </div>
              <span>Analyzing your finances...</span>
            </div>
          )}
          {showRetry && (
            <div className="flex items-center gap-2 px-3">
              <button onClick={retry}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors font-medium flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Response failed — try a different model or retry</span>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask about your finances..."
          disabled={isLoading}
          className="flex-1 text-xs px-3 py-2 rounded-xl focus:outline-none disabled:opacity-60"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e5e5', caretColor: '#00ff88' }}
        />
        <button onClick={() => send()} disabled={!input.trim() || isLoading}
          className="text-xs px-3 py-2 rounded-xl font-mono font-medium disabled:opacity-50 transition-all"
          style={{ background: '#00ff88', color: '#000' }}>
          Send
        </button>
      </div>
    </div>
  );
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────
function OverviewTab({ accounts, transactions, allTransactions, timeRange, budgets, debts, goals, subscriptions, netWorthHistory, onAddAccount, onDeleteAccount, onUpdateCategory, onTxClick }: {
  accounts: VaultAccount[];
  transactions: VaultTransaction[];
  allTransactions: VaultTransaction[];
  timeRange: TimeRange;
  budgets: BudgetCategory[];
  debts: DebtEntry[];
  goals: SavingsGoal[];
  subscriptions: Subscription[];
  netWorthHistory?: NetWorthSnapshot[];
  onAddAccount: () => void;
  onDeleteAccount: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => void;
  onTxClick: (tx: VaultTransaction) => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const recent = (categoryFilter
    ? transactions.filter(t => t.category === categoryFilter)
    : transactions
  ).slice(0, 8);

  // Spending by category from ranged transactions (exclude transfers)
  const categoryMap: Record<string, number> = {};
  transactions.filter(isRealExpense).forEach(t => {
    categoryMap[t.category || 'Other'] = (categoryMap[t.category || 'Other'] || 0) + t.amount;
  });
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  // Monthly income vs expense — last 6 months (timezone-safe via toLocalMidnight)
  const now = new Date();
  const monthlyData: { month: string; income: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const monthTxs = allTransactions.filter(t => {
      const td = toLocalMidnight(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    monthlyData.push({
      month: label,
      income: Math.round(monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)),
      expenses: Math.round(monthTxs.filter(isRealExpense).reduce((s, t) => s + t.amount, 0)),
    });
  }

  // Daily spending trend for current month (exclude transfers, timezone-safe)
  const currentMonthExpenses = allTransactions.filter(t => {
    const td = toLocalMidnight(t.date);
    return td.getMonth() === now.getMonth() && td.getFullYear() === now.getFullYear() && isRealExpense(t);
  });
  const dailyMap: Record<number, number> = {};
  currentMonthExpenses.forEach(t => {
    const day = toLocalMidnight(t.date).getDate();
    dailyMap[day] = (dailyMap[day] || 0) + t.amount;
  });
  let cumulative = 0;
  const trendData = Array.from({ length: now.getDate() }, (_, i) => {
    const day = i + 1;
    const amount = dailyMap[day] || 0;
    cumulative += amount;
    return { day, amount: Math.round(amount * 100) / 100, cumulative: Math.round(cumulative * 100) / 100 };
  });

  // Top merchants from ranged transactions (exclude transfers)
  const merchantMap: Record<string, number> = {};
  transactions.filter(t => isRealExpense(t) && (t.merchant || t.description)).forEach(t => {
    const key = t.merchant || t.description;
    merchantMap[key] = (merchantMap[key] || 0) + t.amount;
  });
  const merchantData = Object.entries(merchantMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Net-worth timeline from daily snapshots (whatever the engine has captured so far).
  // Show last 90 days so the chart stays readable; format the x-axis as "Jun 1".
  const netWorthData = (netWorthHistory ?? [])
    .slice(-90)
    .map(s => ({
      date: toLocalMidnight(s.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      netWorth: Math.round(s.netWorth),
    }));

  const hasChartData =
    categoryData.length > 0
    || monthlyData.some(m => m.income > 0 || m.expenses > 0)
    || netWorthData.length > 1;
  const { score, breakdown } = computeHealthScore(allTransactions, budgets, debts, goals);

  return (
    <div className="space-y-6">
      {/* RM-style SUMMARY row */}
      {(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const bills = transactions.filter(t => isRealExpense(t) && (t.category === 'Bills & Utilities' || t.category === 'Loan Payments')).reduce((s, t) => s + t.amount, 0);
        const spending = transactions.filter(isRealExpense).reduce((s, t) => s + t.amount, 0) - bills;
        return (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Income', value: `+${fmtFull(income)}`, color: '#00ff88', sub: 'this period' },
              { label: 'Bills', value: `-${fmtFull(bills)}`, color: '#f87171', sub: 'utilities & loans' },
              { label: 'Spending', value: `-${fmtFull(spending)}`, color: '#f87171', sub: 'discretionary' },
            ].map(({ label, value, color, sub }) => (
              <div key={label} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
                <p className="font-mono text-lg font-bold truncate" style={{ color }}>{value}</p>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{sub}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Health Score + Cash Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HealthScorePanel score={score} breakdown={breakdown} />
        <CashFlowPanel accounts={accounts} transactions={transactions} subscriptions={subscriptions} />
      </div>

      {/* Upcoming Payments */}
      <UpcomingPayments allTransactions={allTransactions} subscriptions={subscriptions} />

      {/* AI Finance Advisor */}
      <VaultAIChat
        transactions={transactions}
        budgets={budgets}
        debts={debts}
        goals={goals}
        subscriptions={subscriptions}
        accounts={accounts}
      />

      {/* Charts (lazy-loaded, no SSR) */}
      {hasChartData && (
        <VaultCharts
          categoryData={categoryData}
          monthlyData={monthlyData}
          trendData={trendData}
          merchantData={merchantData}
          netWorthData={netWorthData}
          activeCategoryFilter={categoryFilter}
          onCategoryClick={cat => setCategoryFilter(prev => prev === cat ? null : cat)}
        />
      )}

      {/* Accounts + Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-mono font-semibold text-sm" style={{ color: '#e5e5e5' }}>Accounts</h2>
            <button onClick={onAddAccount}
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: '#00ff88' }}>
              <Plus className="w-3 h-3" /> Add manually
            </button>
          </div>
          {accounts.length === 0
            ? <EmptyState icon={<Landmark className="w-8 h-8" />} label="No accounts yet" sub="Link your bank above or add manually" />
            : accounts.map(acc => <AccountCard key={acc.id} account={acc} onDelete={() => onDeleteAccount(acc.id)} />)
          }
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-mono font-semibold text-sm" style={{ color: '#e5e5e5' }}>
              {categoryFilter ? `${categoryFilter} transactions` : 'Recent Activity'}
            </h2>
            {categoryFilter && (
              <button onClick={() => setCategoryFilter(null)}
                className="text-xs flex items-center gap-1 transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e5e5e5'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}>
                <X className="w-3 h-3" /> Clear filter
              </button>
            )}
          </div>
          {recent.length === 0
            ? <EmptyState icon={<ArrowUpRight className="w-8 h-8" />} label="No transactions" sub="Sync your bank or add manually" />
            : recent.map(tx => (
                <div key={tx.id} className="p-3 rounded-xl cursor-pointer transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'}
                  onClick={() => onTxClick(tx)}>
                  <TxRow tx={tx} onUpdateCategory={onUpdateCategory} />
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ── TRANSACTIONS TAB ──────────────────────────────────────────────────────────
function TransactionsTab({ transactions, allTransactionsCount, timeRange, accounts, rules, onAdd, onDelete, onUpdateCategory, onTxClick, onSaveRule, onDeleteRule, onApplyRules, onClearRange }: {
  transactions: VaultTransaction[];
  allTransactionsCount: number;
  timeRange: TimeRange;
  accounts: VaultAccount[];
  rules: TransactionRule[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => void;
  onTxClick: (tx: VaultTransaction) => void;
  onSaveRule: (pattern: string, category: string) => void;
  onDeleteRule: (id: string) => void;
  onApplyRules: () => void;
  onClearRange?: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [newPattern, setNewPattern] = useState('');
  const [newCategory, setNewCategory] = useState('Food & Drink');
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [hideTransfers, setHideTransfers] = useState(true);

  const filtered = transactions
    .filter(t => filter === 'all' ? true : filter === 'transfer' ? (t.type === 'transfer' || t.category === 'Transfer') : t.type === filter)
    .filter(t => !hideTransfers || filter === 'transfer' || (t.type !== 'transfer' && t.category !== 'Transfer'))
    .filter(t => accountFilter === 'all' || t.accountId === accountFilter || t.accountName === accounts.find(a => a.id === accountFilter)?.name)
    .filter(t => !recurringOnly || isRecurringTx(t))
    .filter(t => !search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.merchant?.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase()));

  const uncategorized = transactions.filter(t => !t.category || t.category === 'Other').length;
  const recurringCount = transactions.filter(isRecurringTx).length;

  return (
    <div className="space-y-4">
      {/* Rules panel */}
      {showRules && (
        <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono font-semibold text-sm" style={{ color: '#e5e5e5' }}>Auto-categorization Rules</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Merchant/description contains → assign category</p>
            </div>
            <button onClick={onApplyRules}
              className="text-xs px-3 py-1.5 rounded-lg font-mono transition-all"
              style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88' }}>
              Apply to all transactions
            </button>
          </div>
          {/* Add new rule */}
          <div className="flex gap-2">
            <input
              value={newPattern}
              onChange={e => setNewPattern(e.target.value)}
              placeholder="e.g. Netflix, Chipotle, Amazon..."
              className="flex-1 text-xs px-3 py-2 rounded-lg focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e5e5', caretColor: '#00ff88' }}
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="text-xs px-2 py-2 rounded-lg focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e5e5' }}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button
              onClick={() => { if (newPattern.trim()) { onSaveRule(newPattern.trim(), newCategory); setNewPattern(''); } }}
              className="text-xs px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
            >
              Add
            </button>
          </div>
          {rules.length > 0 && (
            <div className="space-y-1.5">
              {rules.map(r => (
                <div key={r.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span style={{ color: '#e5e5e5' }}><span className="font-medium">"{r.pattern}"</span> → <span style={{ color: '#00ff88' }}>{r.category}</span></span>
                  <button onClick={() => onDeleteRule(r.id)}
                    className="transition-colors ml-2"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {(['all', 'income', 'expense', 'transfer'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1 rounded-md text-sm capitalize transition-all font-mono"
                style={filter === f
                  ? { background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }
                  : { color: 'rgba(255,255,255,0.4)' }}>
                {f}
              </button>
            ))}
          </div>
          {accounts.length > 1 && (
            <select
              value={accountFilter}
              onChange={e => setAccountFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            >
              <option value="all">All accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm focus:outline-none w-36"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e5e5' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setRecurringOnly(p => !p)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm transition-colors"
            style={recurringOnly
              ? { border: '1px solid #3b82f6', color: '#3b82f6', background: 'rgba(59,130,246,0.07)' }
              : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
            title="Show only recurring payments"
          >
            <Repeat className="w-3.5 h-3.5" />
            Recurring {recurringCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-500">{recurringCount}</span>}
          </button>
          <button
            onClick={() => setHideTransfers(p => !p)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm transition-colors"
            style={!hideTransfers
              ? { border: '1px solid #f59e0b', color: '#f59e0b', background: 'rgba(245,158,11,0.07)' }
              : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
            title="Toggle transfers visibility (Zelle, Venmo, etc.)"
          >
            {hideTransfers ? 'Show' : 'Hide'} Transfers
          </button>
          <button
            onClick={() => setShowRules(p => !p)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm transition-colors"
            style={showRules
              ? { border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88' }
              : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          >
            Rules {uncategorized > 0 && <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{uncategorized}</span>}
          </button>
          <button onClick={onAdd}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-mono font-medium"
            style={{ background: '#00ff88', color: '#000' }}>
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {filtered.length === 0
        ? (
          allTransactionsCount > 0 && timeRange !== 'all' ? (
            <EmptyState
              icon={<ArrowUpRight className="w-8 h-8" />}
              label={`No transactions in ${TIME_RANGE_LABELS[timeRange]}`}
              sub={`You have ${allTransactionsCount} transactions overall — try a wider range`}
              action="Show All Time"
              onAction={onClearRange}
            />
          ) : (
            <EmptyState icon={<ArrowUpRight className="w-8 h-8" />} label="No transactions" sub="Sync your bank or add one manually" />
          )
        )
        : (
          <div className="space-y-2">
            {filtered.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl transition-colors group cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'}
                onClick={() => onTxClick(tx)}
              >
                <TxRow tx={tx} onUpdateCategory={onUpdateCategory} />
                <button onClick={e => { e.stopPropagation(); onDelete(tx.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 transition-all ml-2 flex-shrink-0"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── BUDGET TAB ────────────────────────────────────────────────────────────────
function BudgetTab({ budgets, onAdd, onDelete, onUpdate }: {
  budgets: BudgetCategory[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<BudgetCategory>) => void;
}) {
  const totalBudgeted = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const overallPct = pct(totalSpent, totalBudgeted);
  const isOverBudget = totalSpent > totalBudgeted;
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | null>(null);

  // Month pacing: what % of the month has passed
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const monthPacingPct = Math.round((dayOfMonth / daysInMonth) * 100);
  const onTrackCount = budgets.filter(b => pct(b.spent || 0, b.monthlyLimit) <= monthPacingPct + 10).length;

  return (
    <div className="space-y-4">
      {editingBudget && (
        <EditBudgetModal
          budget={editingBudget}
          onClose={() => setEditingBudget(null)}
          onSave={updates => { onUpdate(editingBudget.id, updates); setEditingBudget(null); }}
          onDelete={() => { onDelete(editingBudget.id); setEditingBudget(null); }}
        />
      )}
      {/* Left to Spend — RM-style donut */}
      <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-6">
          {/* Donut ring */}
          {(() => {
            const r = 52, strokeW = 11;
            const circ = 2 * Math.PI * r;
            const fillPct = Math.min(100, overallPct);
            const filled = (fillPct / 100) * circ;
            const ringColor = isOverBudget ? '#ef4444' : overallPct > monthPacingPct + 10 ? '#f59e0b' : '#10b981';
            const remaining = totalBudgeted - totalSpent;
            return (
              <div className="relative flex-shrink-0">
                <svg width="128" height="128" className="-rotate-90">
                  <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeW} />
                  <circle cx="64" cy="64" r={r} fill="none" stroke={ringColor} strokeWidth={strokeW}
                    strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {isOverBudget ? 'over by' : 'left'}
                  </p>
                  <p className="font-mono text-lg font-bold leading-tight" style={{ color: isOverBudget ? '#ef4444' : '#e5e5e5' }}>
                    {isOverBudget ? fmtFull(totalSpent - totalBudgeted) : totalBudgeted > 0 ? fmtFull(Math.abs(remaining)) : '—'}
                  </p>
                </div>
              </div>
            );
          })()}
          {/* Labels */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {isOverBudget ? 'Over Budget' : 'Left to Spend'}
              </p>
              <p className="font-mono text-2xl font-bold" style={{ color: isOverBudget ? '#ef4444' : '#e5e5e5' }}>
                {totalBudgeted > 0
                  ? (isOverBudget ? `-${fmtFull(totalSpent - totalBudgeted)}` : fmtFull(totalBudgeted - totalSpent))
                  : '—'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                of {fmtFull(totalBudgeted)} budget
              </p>
            </div>
            <div className="space-y-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <div className="flex justify-between">
                <span>Spent so far</span>
                <span className="font-mono font-medium" style={{ color: '#e5e5e5' }}>{fmtFull(totalSpent)}</span>
              </div>
              <div className="flex justify-between">
                <span>Day {dayOfMonth} of {daysInMonth}</span>
                <span className="font-mono">{monthPacingPct}% through month</span>
              </div>
              {budgets.length > 0 && (
                <div className="flex justify-between">
                  <span>On pace</span>
                  <span className="font-mono font-medium text-emerald-400">{onTrackCount}/{budgets.length} categories</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-mono font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Categories <span className="text-xs">(click to edit)</span></p>
          <BudgetInfoTip />
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-mono font-medium"
          style={{ background: '#00ff88', color: '#000' }}>
          <Plus className="w-4 h-4" /> Category
        </button>
      </div>

      {budgets.length === 0
        ? <EmptyState icon={<Target className="w-8 h-8" />} label="No budget categories" sub="Add categories to track your spending limits" action="Add Category" onAction={onAdd} />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {budgets.map(b => {
              const spent = b.spent || 0;
              const over = spent > b.monthlyLimit;
              const progress = pct(spent, b.monthlyLimit);
              const overpacing = !over && progress > monthPacingPct + 10;
              return (
                <div
                  key={b.id}
                  className="p-4 rounded-xl cursor-pointer transition-all group"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'}
                  onClick={() => setEditingBudget(b)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{b.emoji}</span>
                      <span className="font-medium text-sm" style={{ color: '#e5e5e5' }}>{b.name}</span>
                    </div>
                    <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  </div>
                  <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <span>{fmtFull(spent)} spent</span>
                    <span className={over ? 'text-red-400 font-medium' : ''}>{fmtFull(b.monthlyLimit)} limit</span>
                  </div>
                  <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div
                      className={cn("h-full rounded-full transition-all", over ? "bg-red-500" : overpacing ? "bg-amber-500" : "")}
                      style={{ width: `${Math.min(100, progress)}%`, backgroundColor: over ? undefined : overpacing ? undefined : b.color }}
                    />
                    <div className="absolute top-0 bottom-0 w-0.5" style={{ left: `${Math.min(99, monthPacingPct)}%`, background: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  {over ? (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Over by {fmtFull(spent - b.monthlyLimit)}
                    </p>
                  ) : overpacing ? (
                    <p className="text-xs text-amber-500 mt-1.5">Spending ahead of pace</p>
                  ) : (
                    <p className="text-xs text-emerald-500 mt-1.5">{fmtFull(b.monthlyLimit - spent)} left</p>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ── DEBT TAB ──────────────────────────────────────────────────────────────────
function debtPayoffProjection(balance: number, rate: number, minPayment: number): { months: number; totalInterest: number } | null {
  if (minPayment <= 0 || balance <= 0) return null;
  const monthlyRate = rate / 100 / 12;
  if (monthlyRate === 0) {
    const months = Math.ceil(balance / minPayment);
    return { months, totalInterest: 0 };
  }
  const monthlyInterest = balance * monthlyRate;
  if (minPayment <= monthlyInterest) return null;
  const months = Math.ceil(-Math.log(1 - (monthlyRate * balance) / minPayment) / Math.log(1 + monthlyRate));
  let rem = balance, totalInterest = 0;
  for (let i = 0; i < months && rem > 0; i++) {
    const interest = rem * monthlyRate;
    totalInterest += interest;
    rem = rem + interest - minPayment;
  }
  return { months, totalInterest: Math.max(0, totalInterest) };
}

function DebtTab({ debts, transactions, nudges, onAdd, onDelete, onUpdate, onImport, onApplyNudge, onDismissNudge }: {
  debts: DebtEntry[];
  transactions: VaultTransaction[];
  nudges: VaultAiNudge[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<DebtEntry>) => void;
  onImport: (rows: Omit<DebtEntry, 'id'>[]) => void;
  onApplyNudge: (nudge: VaultAiNudge) => void;
  onDismissNudge: (id: string) => void;
}) {
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.originalBalance, 0);
  const overallPct = pct(totalOriginal - totalDebt, totalOriginal);
  const monthlyTotal = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const [showImport, setShowImport] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtEntry | null>(null);
  const [quickPayDebt, setQuickPayDebt] = useState<DebtEntry | null>(null);
  const [quickPayAmt, setQuickPayAmt] = useState('');

  const handleQuickPay = async () => {
    if (!quickPayDebt) return;
    const amt = parseFloat(quickPayAmt);
    if (!amt || amt <= 0) return;
    const newBalance = Math.max(0, quickPayDebt.balance - amt);
    await onUpdate(quickPayDebt.id, { balance: newBalance });
    setQuickPayDebt(null);
    setQuickPayAmt('');
  };

  return (
    <div className="space-y-4">
      {showImport && (
        <DebtCsvImportModal
          onClose={() => setShowImport(false)}
          onImport={rows => { onImport(rows); setShowImport(false); }}
        />
      )}
      {editingDebt && (
        <EditDebtModal
          debt={editingDebt}
          onClose={() => setEditingDebt(null)}
          onSave={updates => { onUpdate(editingDebt.id, updates); setEditingDebt(null); }}
          onDelete={() => { onDelete(editingDebt.id); setEditingDebt(null); }}
        />
      )}

      {/* AI Nudges */}
      {nudges.map(nudge => (
        <div key={nudge.id} className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">{nudge.message}</p>
            {nudge.debtName && nudge.suggestedBalance !== undefined && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {nudge.debtName}: {fmtFull(nudge.amount)} payment → new balance {fmtFull(nudge.suggestedBalance)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => onApplyNudge(nudge)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
              Apply
            </button>
            <button onClick={() => onDismissNudge(nudge.id)}
              className="p-1 rounded-lg transition-all"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      <StudentLoanMatcher debts={debts} transactions={transactions} />

      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Remaining</p>
          <p className="font-mono text-xl font-bold text-red-400">{fmtFull(totalDebt)}</p>
          {totalOriginal > 0 && <p className="text-xs mt-0.5 text-red-400/60">{overallPct}% paid off</p>}
        </div>
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Monthly Payments</p>
          <p className="font-mono text-xl font-bold" style={{ color: '#e5e5e5' }}>{fmtFull(monthlyTotal)}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>minimum/mo</p>
        </div>
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Debts Tracked</p>
          <p className="font-mono text-xl font-bold" style={{ color: '#e5e5e5' }}>{debts.length}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>accounts</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>Your Debts</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <Upload className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: '#00ff88', color: '#000' }}>
            <Plus className="w-3.5 h-3.5" /> Add Debt
          </button>
        </div>
      </div>

      {/* Quick pay modal */}
      {quickPayDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setQuickPayDebt(null)}>
          <div className="w-full max-w-sm p-5 rounded-2xl space-y-4" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-white">Record Payment — {quickPayDebt.name}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Current balance: <span className="text-red-400 font-mono">{fmtFull(quickPayDebt.balance)}</span>
            </p>
            <input
              type="number"
              value={quickPayAmt}
              onChange={e => setQuickPayAmt(e.target.value)}
              placeholder={`Payment amount (min. ${fmtFull(quickPayDebt.minimumPayment)})`}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e5e5', caretColor: '#00ff88' }}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleQuickPay()}
            />
            {quickPayAmt && parseFloat(quickPayAmt) > 0 && (
              <p className="text-xs text-emerald-400">
                New balance: {fmtFull(Math.max(0, quickPayDebt.balance - parseFloat(quickPayAmt)))}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={handleQuickPay}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#00ff88', color: '#000' }}>
                Record Payment
              </button>
              <button onClick={() => setQuickPayDebt(null)}
                className="px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {debts.length === 0
        ? <EmptyState icon={<TrendingDown className="w-8 h-8" />} label="No debts tracked" sub="Add your debts to see payoff timelines and track every payment" action="Add Debt" onAction={onAdd} />
        : (
          <div className="space-y-3">
            {debts.map(debt => {
              const paid = debt.originalBalance - debt.balance;
              const progress = pct(paid, debt.originalBalance);
              const projection = debtPayoffProjection(debt.balance, debt.interestRate, debt.minimumPayment);
              const monthlyInterest = debt.balance * (debt.interestRate / 100) / 12;
              const payoffDate = projection
                ? new Date(Date.now() + projection.months * 30.44 * 86400000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : null;
              return (
                <div key={debt.id} className="p-4 rounded-2xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold" style={{ color: '#e5e5e5' }}>{debt.name}</p>
                      <p className="text-xs capitalize mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {debt.type.replace(/_/g, ' ')} · {debt.interestRate}% APR
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-mono font-bold text-red-400">{fmtFull(debt.balance)}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>of {fmtFull(debt.originalBalance)}</p>
                      </div>
                      <button onClick={() => setQuickPayDebt(debt)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
                        <Zap className="w-3 h-3" /> Pay
                      </button>
                      <button onClick={() => setEditingDebt(debt)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar with paid-off marker */}
                  <div className="relative h-2.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, backgroundColor: debt.color || '#10b981' }} />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <span className="text-emerald-400 font-semibold">{progress}% paid</span>
                      <span>{fmtFull(paid)} cleared</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Min {fmtFull(debt.minimumPayment)}/mo</span>
                  </div>

                  {/* Projection row */}
                  {projection && (
                    <div className="flex items-center gap-4 mt-2.5 pt-2.5 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <CalendarClock className="w-3 h-3 text-blue-400" />
                        <span>Payoff <span className="text-blue-300 font-semibold">{payoffDate}</span></span>
                        <span className="text-blue-400/60">({projection.months} mo)</span>
                      </div>
                      {projection.totalInterest > 0 && (
                        <div className="text-xs">
                          <span className="text-amber-500 font-semibold">{fmtFull(projection.totalInterest)}</span>
                          <span style={{ color: 'rgba(255,255,255,0.35)' }}> in interest</span>
                        </div>
                      )}
                      {monthlyInterest > 0 && (
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {fmtFull(monthlyInterest)}/mo accruing
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ── GOALS TAB ─────────────────────────────────────────────────────────────────
function GoalsTab({ goals, nudges, onAdd, onDelete, onUpdate, onApplyNudge, onDismissNudge }: {
  goals: SavingsGoal[];
  nudges: VaultAiNudge[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SavingsGoal>) => void;
  onApplyNudge: (nudge: VaultAiNudge) => void;
  onDismissNudge: (id: string) => void;
}) {
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [quickAddGoal, setQuickAddGoal] = useState<SavingsGoal | null>(null);
  const [quickAddAmt, setQuickAddAmt] = useState('');

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const completedCount = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  const handleQuickAdd = async () => {
    if (!quickAddGoal) return;
    const amt = parseFloat(quickAddAmt);
    if (!amt || amt <= 0) return;
    const newAmount = quickAddGoal.currentAmount + amt;
    await onUpdate(quickAddGoal.id, { currentAmount: newAmount });
    setQuickAddGoal(null);
    setQuickAddAmt('');
  };

  return (
    <div className="space-y-4">
      {editingGoal && (
        <EditGoalModal
          goal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSave={updates => { onUpdate(editingGoal.id, updates); setEditingGoal(null); }}
          onDelete={() => { onDelete(editingGoal.id); setEditingGoal(null); }}
        />
      )}

      {/* AI Nudges */}
      {nudges.map(nudge => (
        <div key={nudge.id} className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-300">{nudge.message}</p>
            {nudge.goalName && nudge.suggestedAmount !== undefined && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {nudge.goalName}: +{fmtFull(nudge.amount)} → new total {fmtFull(nudge.suggestedAmount)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => onApplyNudge(nudge)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
              Apply
            </button>
            <button onClick={() => onDismissNudge(nudge.id)}
              className="p-1 rounded-lg" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Summary stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)' }}>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Saved</p>
            <p className="font-mono text-xl font-bold text-emerald-400">{fmtFull(totalSaved)}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>of {fmtFull(totalTarget)}</p>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Goals</p>
            <p className="font-mono text-xl font-bold" style={{ color: '#e5e5e5' }}>{goals.length}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>active</p>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Completed</p>
            <p className="font-mono text-xl font-bold text-emerald-400">{completedCount}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>goals hit</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: '#e5e5e5' }}>Savings Goals</p>
        <button onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: '#00ff88', color: '#000' }}>
          <Plus className="w-3.5 h-3.5" /> Add Goal
        </button>
      </div>

      {/* Quick deposit modal */}
      {quickAddGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setQuickAddGoal(null)}>
          <div className="w-full max-w-sm p-5 rounded-2xl space-y-4" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-white">Add to {quickAddGoal.emoji} {quickAddGoal.name}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Current: <span className="text-emerald-400 font-mono">{fmtFull(quickAddGoal.currentAmount)}</span>
              {' '}/ Target: <span className="font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>{fmtFull(quickAddGoal.targetAmount)}</span>
            </p>
            <input
              type="number"
              value={quickAddAmt}
              onChange={e => setQuickAddAmt(e.target.value)}
              placeholder="Amount to add..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e5e5', caretColor: '#00ff88' }}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
            />
            {quickAddAmt && parseFloat(quickAddAmt) > 0 && (
              <p className="text-xs text-emerald-400">
                New total: {fmtFull(quickAddGoal.currentAmount + parseFloat(quickAddAmt))}
                {' '}({Math.min(100, Math.round(((quickAddGoal.currentAmount + parseFloat(quickAddAmt)) / quickAddGoal.targetAmount) * 100))}%)
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={handleQuickAdd}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#00ff88', color: '#000' }}>
                Add Funds
              </button>
              <button onClick={() => setQuickAddGoal(null)}
                className="px-4 py-2.5 rounded-xl text-sm"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {goals.length === 0
        ? <EmptyState icon={<PiggyBank className="w-8 h-8" />} label="No savings goals" sub="Set a goal and watch your progress grow" action="Add Goal" onAction={onAdd} />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map(goal => {
              const progress = pct(goal.currentAmount, goal.targetAmount);
              const done = goal.currentAmount >= goal.targetAmount;
              const remaining = goal.targetAmount - goal.currentAmount;
              const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
              const monthsLeft = deadlineDate
                ? Math.max(1, Math.round((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
                : null;
              const monthlyNeeded = monthsLeft && remaining > 0 ? remaining / monthsLeft : null;
              const isOnTrack = monthlyNeeded
                ? (goal.currentAmount / goal.targetAmount) >= ((deadlineDate!.getTime() - Date.now() - monthsLeft! * 30.44 * 86400000) / (deadlineDate!.getTime() - (goal.deadline ? new Date(goal.deadline).getTime() : Date.now()) + monthsLeft! * 30.44 * 86400000))
                : true;
              // SVG ring
              const r = 38, sw = 7, circ = 2 * Math.PI * r;
              const filled = (Math.min(100, progress) / 100) * circ;
              const ringColor = done ? '#10b981' : progress > 75 ? '#00ff88' : progress > 40 ? '#3b82f6' : '#f59e0b';

              return (
                <div key={goal.id} className="p-5 rounded-2xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                  <div className="flex items-start gap-4">
                    {/* Ring */}
                    <div className="relative flex-shrink-0">
                      <svg width="96" height="96" className="-rotate-90">
                        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
                        <circle cx="48" cy="48" r={r} fill="none" stroke={ringColor} strokeWidth={sw}
                          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl leading-none">{goal.emoji || '🎯'}</span>
                        <span className="font-mono text-xs font-bold mt-0.5" style={{ color: ringColor }}>{progress}%</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-sm" style={{ color: '#e5e5e5' }}>{goal.name}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setQuickAddGoal(goal)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all"
                            style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
                            <Plus className="w-3 h-3" /> Add
                          </button>
                          <button onClick={() => setEditingGoal(goal)}
                            className="p-1 rounded-lg" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="font-mono text-xs font-bold text-emerald-400">{fmtFull(goal.currentAmount)}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        of {fmtFull(goal.targetAmount)}
                        {done && <span className="text-emerald-400 ml-1">✓ Complete!</span>}
                      </p>

                      {goal.deadline && (
                        <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          by {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          {monthsLeft && <span className="ml-1">· {monthsLeft} mo left</span>}
                        </p>
                      )}

                      {!done && monthlyNeeded && (
                        <div className="mt-2 px-2 py-1.5 rounded-lg inline-flex items-center gap-1.5"
                          style={{ background: isOnTrack ? 'rgba(0,255,136,0.08)' : 'rgba(251,191,36,0.08)' }}>
                          <span className="text-[11px] font-semibold" style={{ color: isOnTrack ? '#00ff88' : '#fbbf24' }}>
                            {fmtFull(monthlyNeeded)}/mo needed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function AccountCard({ account, onDelete }: { account: VaultAccount; onDelete: () => void }) {
  const isLiability = account.type === 'credit' || account.type === 'loan';
  return (
    <div className="flex items-center justify-between p-3 rounded-xl transition-colors group"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: account.color }}>
          {ACCOUNT_ICONS[account.type]}
        </div>
        <div>
          <p className="font-medium text-sm" style={{ color: '#e5e5e5' }}>{account.name}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {account.institution}{account.mask ? ` ··${account.mask}` : ''}
            {account.isTellerLinked && <span className="ml-1 text-emerald-500">· Linked</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className={cn("font-semibold", isLiability ? "text-red-400" : "")} style={isLiability ? {} : { color: '#e5e5e5' }}>
          {isLiability ? '-' : ''}{fmtFull(account.balance)}
        </p>
        <button onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 transition-all"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function TxRow({ tx, onUpdateCategory }: { tx: VaultTransaction; onUpdateCategory?: (id: string, cat: string) => void }) {
  const isIncome = tx.type === 'income';
  const [showCatPicker, setShowCatPicker] = useState(false);
  const needsCategory = !tx.category || tx.category === 'Other';

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isIncome ? "bg-emerald-500/10" : "bg-red-500/10"
        )}>
          {isIncome
            ? <ArrowDownRight className="w-4 h-4 text-emerald-500" />
            : <ArrowUpRight className="w-4 h-4 text-red-400" />
          }
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-medium truncate">{prettyMerchant(tx.merchant, tx.description)}</p>
            {tx.isPending && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                Pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {needsCategory && onUpdateCategory ? (
              <div className="relative">
                <button
                  onClick={() => setShowCatPicker(p => !p)}
                  className="text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-0.5 transition-colors font-semibold uppercase tracking-wider"
                >
                  + Add category
                </button>
                {showCatPicker && (
                  <div className="absolute left-0 top-5 z-20 rounded-xl shadow-xl p-2 grid grid-cols-2 gap-1 w-56"
                    style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => { onUpdateCategory(tx.id, cat); setShowCatPicker(false); }}
                        className="text-xs px-2 py-1.5 rounded-lg text-left transition-colors truncate"
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onUpdateCategory && setShowCatPicker(p => !p)}
                className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded transition-all"
                style={{
                  background: categoryChipBg(tx.category),
                  color: categoryChipText(tx.category),
                  cursor: onUpdateCategory ? 'pointer' : 'default',
                }}
              >
                {tx.category || 'Other'}
              </button>
            )}
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            {!needsCategory && onUpdateCategory && showCatPicker && (
              <div className="absolute left-0 top-5 z-20 rounded-xl shadow-xl p-2 grid grid-cols-2 gap-1 w-56"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => { onUpdateCategory(tx.id, cat); setShowCatPicker(false); }}
                    className="text-xs px-2 py-1.5 rounded-lg text-left transition-colors truncate"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className={cn("font-semibold text-sm flex-shrink-0 ml-3", isIncome ? "text-emerald-500" : "")}
        style={isIncome ? {} : { color: '#e5e5e5' }}>
        {isIncome ? '+' : '-'}{fmtFull(tx.amount)}
      </p>
    </div>
  );
}

function BudgetInfoTip() {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setShow(p => !p)}
        className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors"
        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.15)'; (e.currentTarget as HTMLElement).style.color = '#00ff88'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
      >
        ?
      </button>
      {show && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShow(false)} />
          <div className="absolute left-0 top-6 z-50 w-72 p-3 rounded-xl shadow-xl text-xs space-y-2"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="font-semibold" style={{ color: '#e5e5e5' }}>How budgets work</p>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              A budget sets a <span style={{ color: '#e5e5e5' }} className="font-medium">monthly spending limit</span> per category.
              Transactions you categorize (e.g. "Food & Drink") automatically count toward that budget.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              The <span style={{ color: '#e5e5e5' }} className="font-medium">tick mark</span> on the bar shows where you <em>should</em> be today if spending evenly through the month.
              Red = over limit. Amber = ahead of pace.
            </p>
            <p className="pt-2" style={{ color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              For <span style={{ color: '#e5e5e5' }} className="font-medium">saving toward something</span> (vacation, new laptop, emergency fund) — use the <span style={{ color: '#00ff88' }} className="font-medium">Goals</span> tab instead.
            </p>
            <button onClick={() => setShow(false)} className="text-xs hover:underline" style={{ color: '#00ff88' }}>Got it</button>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({ icon, label, sub, action, onAction }: {
  icon: React.ReactNode; label: string; sub: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>
      <div className="flex justify-center mb-3 opacity-30">{icon}</div>
      <p className="font-medium" style={{ color: '#e5e5e5' }}>{label}</p>
      <p className="text-sm mt-1">{sub}</p>
      {action && onAction && (
        <button onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl text-sm font-mono font-medium"
          style={{ background: '#00ff88', color: '#000' }}>
          {action}
        </button>
      )}
    </div>
  );
}

// ── RECURRING TAB ─────────────────────────────────────────────────────────────
const FREQ_COLOR: Record<string, string> = {
  monthly: '#3b82f6', weekly: '#10b981', 'bi-weekly': '#8b5cf6',
  quarterly: '#f59e0b', annual: '#6b7280',
};

function toMonthly(amount: number, freq: string): number {
  if (freq === 'monthly')    return amount;
  if (freq === 'weekly')     return amount * 4.33;
  if (freq === 'bi-weekly')  return amount * 2.17;
  if (freq === 'quarterly')  return amount / 3;
  if (freq === 'annual')     return amount / 12;
  return amount;
}

function RecurringCalendar({
  upcoming,
  onDayClick,
}: {
  upcoming: UpcomingPayment[];
  onDayClick?: (date: Date, payments: UpcomingPayment[]) => void;
}) {
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const paymentsOn = (day: number) => upcoming.filter(p => {
    const d = new Date(p.nextDate);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });
  const monthLabel = calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goPrevMonth = () => setCalMonth(new Date(year, month - 1, 1));
  const goNextMonth = () => setCalMonth(new Date(year, month + 1, 1));

  const monthTotal = upcoming
    .filter(p => p.nextDate.getFullYear() === year && p.nextDate.getMonth() === month)
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={goPrevMonth}
          className="px-3 py-1.5 rounded-lg font-mono text-xs transition-all hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
          ← {new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })}
        </button>
        <div className="text-center">
          <p className="font-semibold text-sm text-white">{monthLabel}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {fmtFull(monthTotal)} this month
          </p>
        </div>
        <button onClick={goNextMonth}
          className="px-3 py-1.5 rounded-lg font-mono text-xs transition-all hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
          {new Date(year, month + 1, 1).toLocaleDateString('en-US', { month: 'short' })} →
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center font-mono text-[10px] uppercase tracking-widest py-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="aspect-square" />;
          const pms = paymentsOn(day);
          const isToday = isCurrentMonth && day === today.getDate();
          const isPast = isCurrentMonth ? day < today.getDate() : new Date(year, month, day) < today;
          const total = pms.reduce((s, p) => s + p.amount, 0);
          const clickable = pms.length > 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => clickable && onDayClick?.(new Date(year, month, day), pms)}
              disabled={!clickable}
              className="flex flex-col items-center py-1.5 rounded-xl gap-1 transition-all"
              style={{
                opacity: isPast && !isToday ? 0.35 : 1,
                background: isToday ? 'rgba(239,68,68,0.08)'
                  : pms.length ? 'rgba(124,58,237,0.06)'
                  : 'rgba(255,255,255,0.02)',
                border: isToday ? '1px solid rgba(239,68,68,0.4)'
                  : pms.length ? '1px solid rgba(124,58,237,0.15)'
                  : '1px solid rgba(255,255,255,0.04)',
                minHeight: 64,
                cursor: clickable ? 'pointer' : 'default',
              }}
              aria-label={pms.length ? `${day} — ${pms.length} payment${pms.length === 1 ? '' : 's'} totalling ${fmtFull(total)}` : `${day} — no payments`}
            >
              <span className="font-mono text-xs font-semibold" style={{ color: isToday ? '#ef4444' : 'rgba(255,255,255,0.7)' }}>{day}</span>
              {pms.slice(0, 2).map((p, j) => {
                const letter = (p.name || '?')[0].toUpperCase();
                const hue = (letter.charCodeAt(0) * 137) % 360;
                return (
                  <div key={j} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                    style={{ background: p.color || `hsl(${hue},65%,50%)` }}>
                    {letter}
                  </div>
                );
              })}
              {pms.length > 0 && (
                <span className="font-mono text-[8px] font-semibold" style={{ color: '#f59e0b' }}>${Math.round(total)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecurringTab({ transactions, subscriptions, onSave, onUpdate, onDelete, onDetectRecurring, onReviewed, onOpenTransaction }: {
  transactions: VaultTransaction[];
  subscriptions: Subscription[];
  onSave: (s: Omit<Subscription, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Subscription>) => void;
  onDelete: (id: string) => void;
  onDetectRecurring?: () => Promise<void> | void;
  onReviewed?: () => void;
  onOpenTransaction?: (tx: VaultTransaction) => void;
}) {
  const [view, setView] = useState<'upcoming' | 'all' | 'calendar'>('upcoming');
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [detailSub, setDetailSub] = useState<Subscription | null>(null);
  const [calendarDay, setCalendarDay] = useState<{ date: Date; payments: UpcomingPayment[] } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  // Map "payment key" (used in UpcomingPayment) → subscription so the calendar
  // day modal can drill into the rich detail view on tap.
  const subsByKey = new Map<string, Subscription>();
  for (const s of subscriptions) {
    const k = (s.merchantPattern || s.name || '').toLowerCase();
    if (k) subsByKey.set(k, s);
    subsByKey.set(s.name.toLowerCase(), s);
  }
  const openSubByKey = (key: string) => {
    const sub = subsByKey.get(key.toLowerCase());
    if (sub) {
      setCalendarDay(null);
      setDetailSub(sub);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // All upcoming payments (45-day window, sorted by date)
  const upcoming = buildUpcoming(transactions, subscriptions);

  // Split into next-7 and coming-later
  const next7 = upcoming.filter(p => {
    const diff = Math.ceil((p.nextDate.getTime() - today.getTime()) / 86400000);
    return diff >= 0 && diff <= 7;
  });
  const later = upcoming.filter(p => {
    const diff = Math.ceil((p.nextDate.getTime() - today.getTime()) / 86400000);
    return diff > 7;
  });
  const next7Total = next7.reduce((s, p) => s + p.amount, 0);
  const laterTotal = later.reduce((s, p) => s + p.amount, 0);

  // 7-day calendar strip
  const calDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const payments = upcoming.filter(u => {
      const nd = new Date(u.nextDate);
      nd.setHours(0, 0, 0, 0);
      return nd.getTime() === d.getTime();
    });
    return { date: d, payments, idx: i };
  });

  const daysLabel = (d: Date) => {
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `in ${diff} days`;
  };

  // Detected recurring for "All" view — engine output is now the dictionary's
  // already-canonicalized name; keep matchKnownSub as a fallback for legacy rows.
  // Saved subs grouped by lifecycle. The engine's status field controls visibility;
  // "active" (and legacy isActive=true with no status) shows up in lists, "pending_review"
  // bubbles up via RecurringReviewQueue, "cancelled" is hidden until user re-enables.
  const liveSubs = subscriptions.filter(s => {
    const st = s.status || (s.isActive ? 'active' : 'cancelled');
    return st === 'active';
  });
  const activeSubs = liveSubs.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.category || '').toLowerCase().includes(search.toLowerCase()),
  );
  const bills = activeSubs.filter(s => s.category === 'Bills & Utilities');
  const otherSubs = activeSubs.filter(s => s.category !== 'Bills & Utilities');
  const savedMonthly = activeSubs.reduce((s, sub) => s + toMonthly(sub.amount, sub.frequency), 0);

  const handleDetect = async () => {
    if (!onDetectRecurring || isDetecting) return;
    setIsDetecting(true);
    try { await onDetectRecurring(); } finally { setIsDetecting(false); }
  };

  return (
    <div className="space-y-5">
      {(editingSub || showAdd) && (
        <EditSubscriptionModal
          subscription={editingSub}
          onClose={() => { setEditingSub(null); setShowAdd(false); }}
          onSave={sub => { onSave(sub); setShowAdd(false); }}
          onUpdate={(id, u) => { onUpdate(id, u); setEditingSub(null); }}
          onDelete={id => { onDelete(id); setEditingSub(null); }}
        />
      )}

      {/* Review queue: subscriptions the engine flagged as "needs your eyes". */}
      {onReviewed && (
        <RecurringReviewQueue subscriptions={subscriptions} onReviewed={onReviewed} />
      )}

      <BillsCalendarSummary subscriptions={subscriptions} />

      {/* View toggle + actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {([['upcoming', 'Upcoming'], ['all', 'All Recurring'], ['calendar', 'Calendar']] as const).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-lg text-sm transition-all font-mono"
              style={view === v
                ? { background: 'rgba(124,58,237,0.15)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.3)' }
                : { color: 'rgba(255,255,255,0.4)' }}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {onDetectRecurring && (
            <button onClick={handleDetect} disabled={isDetecting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
              title="Re-scan transactions for recurring patterns">
              <RefreshCw className={cn("w-3.5 h-3.5", isDetecting && "animate-spin")} />
              {isDetecting ? 'Scanning' : 'Detect'}
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-mono font-medium"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.3)' }}>
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* ── UPCOMING VIEW ── */}
      {view === 'upcoming' && (
        <div className="space-y-6">
          {/* 7-day calendar strip — tap a day to open day modal. */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Next 7 Days</p>
            <div className="grid grid-cols-7 gap-2">
              {calDays.map(({ date, payments, idx }) => {
                const isToday = idx === 0;
                const hasPayment = payments.length > 0;
                const totalAmt = payments.reduce((s, p) => s + p.amount, 0);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => hasPayment && setCalendarDay({ date, payments })}
                    disabled={!hasPayment}
                    className="flex flex-col items-center gap-1.5 transition-all"
                    style={{ cursor: hasPayment ? 'pointer' : 'default' }}
                    aria-label={hasPayment ? `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} — ${payments.length} payment${payments.length === 1 ? '' : 's'}` : `${date.toLocaleDateString('en-US', { weekday: 'long' })} — no payments`}
                  >
                    <span className="font-mono text-[10px] uppercase font-medium"
                      style={{ color: isToday ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <div className="w-full aspect-square rounded-xl flex items-center justify-center font-mono text-sm font-bold transition-all"
                      style={{
                        background: isToday ? 'rgba(248,113,113,0.15)'
                          : hasPayment ? 'rgba(251,191,36,0.1)'
                          : 'rgba(255,255,255,0.03)',
                        border: isToday ? '1px solid rgba(248,113,113,0.5)'
                          : hasPayment ? '1px solid rgba(251,191,36,0.3)'
                          : '1px solid rgba(255,255,255,0.06)',
                        color: isToday ? '#f87171'
                          : hasPayment ? '#fbbf24'
                          : 'rgba(255,255,255,0.25)',
                      }}>
                      {date.getDate()}
                    </div>
                    {hasPayment
                      ? <span className="font-mono text-[9px] font-bold text-amber-400">${Math.round(totalAmt)}</span>
                      : <span className="text-[9px] text-transparent">-</span>
                    }
                  </button>
                );
              })}
            </div>
          </div>

          {/* NEXT 7 DAYS list — clickable rows. */}
          {next7.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Next 7 Days
                </p>
                <p className="font-mono text-xs font-bold text-red-400">
                  {next7.length} charge{next7.length !== 1 ? 's' : ''} · {fmtFull(next7Total)}
                </p>
              </div>
              <div className="space-y-2">
                {next7.map(p => {
                  const diff = Math.round((p.nextDate.getTime() - today.getTime()) / 86400000);
                  const isToday = diff === 0;
                  const isTomorrow = diff === 1;
                  return (
                    <button key={p.key} onClick={() => openSubByKey(p.key)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-white/[0.05]"
                      style={{
                        background: isToday ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.03)',
                        border: isToday ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <span className="text-xl flex-shrink-0">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate" style={{ color: '#e5e5e5' }}>{p.name}</p>
                        <p className="font-mono text-[10px] capitalize" style={{ color: 'rgba(255,255,255,0.3)' }}>{p.frequency}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono text-sm font-bold" style={{ color: '#e5e5e5' }}>{fmtFull(p.amount)}</p>
                        <p className="font-mono text-[10px] font-medium"
                          style={{ color: isToday ? '#f87171' : isTomorrow ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>
                          {daysLabel(p.nextDate)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* COMING LATER list — clickable rows. */}
          {later.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Coming Later
                </p>
                <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {later.length} charge{later.length !== 1 ? 's' : ''} · {fmtFull(laterTotal)}
                </p>
              </div>
              <div className="space-y-2">
                {later.map(p => (
                  <button key={p.key} onClick={() => openSubByKey(p.key)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-white/[0.05]"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-xl flex-shrink-0 opacity-60">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{p.name}</p>
                      <p className="font-mono text-[10px] capitalize" style={{ color: 'rgba(255,255,255,0.25)' }}>{p.frequency}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-sm font-bold" style={{ color: 'rgba(255,255,255,0.55)' }}>{fmtFull(p.amount)}</p>
                      <p className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {p.nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {upcoming.length === 0 && (
            <EmptyState
              icon={<CalendarClock className="w-8 h-8" />}
              label="No upcoming payments"
              sub="Add subscriptions or sync more transactions to see what's coming"
              action="Add Recurring"
              onAction={() => setShowAdd(true)}
            />
          )}
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <RecurringCalendar upcoming={upcoming} onDayClick={(date, pms) => setCalendarDay({ date, payments: pms })} />
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {detailSub && (
          <SubscriptionDetailModal
            subscription={detailSub}
            transactions={transactions}
            onClose={() => setDetailSub(null)}
            onEdit={() => { setEditingSub(detailSub); setDetailSub(null); }}
            onMarkCancelled={() => { onUpdate(detailSub.id, { status: 'cancelled', isActive: false, cancelledAt: new Date() }); setDetailSub(null); }}
            onDelete={() => { onDelete(detailSub.id); setDetailSub(null); }}
            onOpenTransaction={tx => { setDetailSub(null); onOpenTransaction?.(tx); }}
          />
        )}
        {calendarDay && (
          <CalendarDayModal
            date={calendarDay.date}
            payments={calendarDay.payments}
            onClose={() => setCalendarDay(null)}
            onOpenPayment={openSubByKey}
          />
        )}
      </AnimatePresence>

      {/* ── ALL RECURRING VIEW ── */}
      {view === 'all' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search bills and subscriptions..."
                className="w-full px-4 py-2.5 rounded-xl text-sm font-mono transition-all outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e5e5e5',
                }}
              />
            </div>
          </div>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active', value: String(activeSubs.length), sub: 'recurring', color: '#e5e5e5' },
              { label: 'Monthly', value: fmtFull(savedMonthly), sub: 'per month', color: '#f87171' },
              { label: 'Annual', value: fmtFull(savedMonthly * 12), sub: 'per year', color: '#f59e0b' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                <p className="font-mono text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Subscriptions group */}
          {otherSubs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {otherSubs.length} Subscription{otherSubs.length !== 1 ? 's' : ''}
                </p>
                <p className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {fmtFull(otherSubs.reduce((s, sub) => s + toMonthly(sub.amount, sub.frequency), 0) * 12)}/yr
                </p>
              </div>
              <div className="space-y-1.5">
                {otherSubs.map(sub => {
                  const daysUntil = sub.nextBillingDate
                    ? Math.round((new Date(sub.nextBillingDate).getTime() - today.getTime()) / 86400000)
                    : null;
                  return (
                    <button key={sub.id}
                      onClick={() => setDetailSub(sub)}
                      className="w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all text-left hover:bg-white/[0.05]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: (sub.color || '#6b7280') + '20' }}>
                          {sub.emoji || '💳'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#e5e5e5' }}>{sub.name}</p>
                          <p className="text-[10px] capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub.frequency}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-mono text-sm font-semibold" style={{ color: '#e5e5e5' }}>{fmtFull(sub.amount)}</p>
                        {daysUntil !== null && (
                          <p className="font-mono text-[10px]" style={{ color: daysUntil <= 3 ? '#f87171' : 'rgba(255,255,255,0.25)' }}>
                            {daysUntil === 0 ? 'Today' : daysUntil > 0 ? `in ${daysUntil}d` : 'overdue'}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bills & Utilities group */}
          {bills.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {bills.length} Bill{bills.length !== 1 ? 's' : ''} & Utilities
                </p>
                <p className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {fmtFull(bills.reduce((s, sub) => s + toMonthly(sub.amount, sub.frequency), 0) * 12)}/yr
                </p>
              </div>
              <div className="space-y-1.5">
                {bills.map(sub => {
                  const daysUntil = sub.nextBillingDate
                    ? Math.round((new Date(sub.nextBillingDate).getTime() - today.getTime()) / 86400000)
                    : null;
                  return (
                    <button key={sub.id}
                      onClick={() => setDetailSub(sub)}
                      className="w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all text-left hover:bg-white/[0.05]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: (sub.color || '#6b7280') + '20' }}>
                          {sub.emoji || '🏠'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#e5e5e5' }}>{sub.name}</p>
                          <p className="text-[10px] capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub.frequency}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-mono text-sm font-semibold" style={{ color: '#e5e5e5' }}>{fmtFull(sub.amount)}</p>
                        {daysUntil !== null && (
                          <p className="font-mono text-[10px]" style={{ color: daysUntil <= 3 ? '#f87171' : 'rgba(255,255,255,0.25)' }}>
                            {daysUntil === 0 ? 'Today' : daysUntil > 0 ? `in ${daysUntil}d` : 'overdue'}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubs.length === 0 && (
            <EmptyState
              icon={<Repeat className="w-8 h-8" />}
              label="No recurring charges found"
              sub="Click Detect to scan your transactions, or add one manually"
              action="Add Recurring"
              onAction={() => setShowAdd(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── SUBSCRIPTION DETAIL MODAL — Rocket Money-style rich detail card ─────────
//
// Click a recurring item → this modal pops up with:
//   - hero: name, emoji, monthly cost
//   - lifecycle stats (frequency, confidence, charges, avg interval)
//   - next/last charge with date + amount + transaction id
//   - charge history (last 8 occurrences) — click a row to open that tx
//   - actions: Edit, Mark Cancelled, Delete
//
function SubscriptionDetailModal({
  subscription,
  transactions,
  onClose,
  onEdit,
  onMarkCancelled,
  onDelete,
  onOpenTransaction,
}: {
  subscription: Subscription;
  transactions: VaultTransaction[];
  onClose: () => void;
  onEdit: () => void;
  onMarkCancelled?: () => void;
  onDelete: () => void;
  onOpenTransaction?: (tx: VaultTransaction) => void;
}) {
  // Find every charge that matches this subscription's merchant pattern.
  // Falls back to the display name when no pattern is stored (manual entries).
  const pattern = (subscription.merchantPattern || subscription.name || '').toLowerCase();
  const history = transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      const hay = `${t.merchant || ''} ${t.description || ''}`.toLowerCase();
      return pattern.length >= 3 && hay.includes(pattern);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const monthlyEquiv = toMonthly(subscription.amount, subscription.frequency);
  const annualEquiv = monthlyEquiv * 12;
  const nextDate = subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : null;
  const lastDate = subscription.lastChargeDate
    ? new Date(subscription.lastChargeDate)
    : history[0]?.date
    ? new Date(history[0].date)
    : null;
  const lastAmount = subscription.lastChargeAmount ?? history[0]?.amount;
  const lastTx = history[0];

  const statusTone =
    subscription.status === 'pending_review'
      ? { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', label: 'Needs review' }
      : subscription.status === 'cancelled'
      ? { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', label: 'Cancelled' }
      : { bg: 'rgba(16,185,129,0.12)', text: '#10b981', label: 'Active' };

  const daysUntilNext = nextDate
    ? Math.ceil((nextDate.getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh' }}
      >
        {/* Hero */}
        <div className="relative p-6"
          style={{
            background: `linear-gradient(180deg, ${subscription.color || 'rgba(124,58,237,0.15)'}25, transparent)`,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            aria-label="Close">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{
                background: subscription.color ? `${subscription.color}25` : 'rgba(255,255,255,0.06)',
                border: `1px solid ${subscription.color || 'rgba(255,255,255,0.1)'}`,
              }}>
              {subscription.emoji || '💳'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold truncate" style={{ color: '#e5e5e5' }}>{subscription.name}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ background: statusTone.bg, color: statusTone.text }}>
                  {statusTone.label}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {subscription.category}
                {subscription.confidence !== undefined && ` · ${subscription.confidence}% confidence`}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono" style={{ color: '#e5e5e5' }}>
                  {fmtFull(subscription.amount)}
                </span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  / {subscription.frequency}
                </span>
              </div>
              <p className="font-mono text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                ≈ {fmtFull(monthlyEquiv)}/mo · {fmtFull(annualEquiv)}/yr
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Next + Last charge cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)' }}>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Next Charge</p>
              {nextDate ? (
                <>
                  <p className="font-mono font-bold text-sm" style={{ color: '#e5e5e5' }}>
                    {nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: daysUntilNext !== null && daysUntilNext <= 3 ? '#fbbf24' : 'rgba(255,255,255,0.5)' }}>
                    {daysUntilNext === 0 ? 'Today' : daysUntilNext === 1 ? 'Tomorrow' : daysUntilNext !== null && daysUntilNext > 0 ? `in ${daysUntilNext} days` : 'Overdue'}
                  </p>
                </>
              ) : (
                <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Unknown</p>
              )}
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Last Charge</p>
              {lastDate ? (
                <>
                  <p className="font-mono font-bold text-sm" style={{ color: '#e5e5e5' }}>
                    {lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {lastAmount !== undefined ? fmtFull(lastAmount) : '—'}
                  </p>
                </>
              ) : (
                <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>No history</p>
              )}
            </div>
          </div>

          {/* Lifecycle stats — only show when engine has populated them. */}
          {(subscription.chargeCount || subscription.avgIntervalDays) && (
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Charges</p>
                <p className="font-mono font-bold text-base" style={{ color: '#e5e5e5' }}>{subscription.chargeCount ?? '—'}</p>
              </div>
              <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Cadence</p>
                <p className="font-mono font-bold text-base" style={{ color: '#e5e5e5' }}>
                  {subscription.avgIntervalDays ? `${Math.round(subscription.avgIntervalDays)}d` : '—'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Since</p>
                <p className="font-mono font-bold text-base" style={{ color: '#e5e5e5' }}>
                  {subscription.firstSeenDate ? new Date(subscription.firstSeenDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : '—'}
                </p>
              </div>
            </div>
          )}

          {/* Charge history */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Payment History
                </p>
                <p className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {history.length} charge{history.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="space-y-1.5">
                {history.slice(0, 8).map(tx => (
                  <button
                    key={tx.id}
                    onClick={() => onOpenTransaction?.(tx)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left hover:bg-white/[0.06]"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs truncate" style={{ color: '#e5e5e5' }}>
                        {prettyMerchant(tx.merchant, tx.description)}
                      </p>
                      <p className="font-mono text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {tx.tellerTransactionId && (
                          <span className="ml-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            · #{tx.tellerTransactionId.slice(-8)}
                          </span>
                        )}
                        {tx.isPending && <span className="ml-1.5 text-amber-500">· Pending</span>}
                      </p>
                    </div>
                    <p className="font-mono text-sm font-bold flex-shrink-0 ml-3" style={{ color: '#e5e5e5' }}>
                      {fmtFull(tx.amount)}
                    </p>
                  </button>
                ))}
              </div>
              {history.length > 8 && (
                <p className="font-mono text-[10px] mt-2 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  + {history.length - 8} more
                </p>
              )}
            </div>
          )}

          {subscription.notes && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Notes</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{subscription.notes}</p>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 p-4"
          style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-mono text-sm font-medium transition-all"
            style={{ background: 'rgba(0,255,136,0.12)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.25)' }}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          {onMarkCancelled && subscription.status !== 'cancelled' && (
            <button onClick={onMarkCancelled}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-mono text-sm font-medium transition-all"
              style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}
              title="Mark cancelled (hides from active list)">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
          <button onClick={onDelete}
            className="px-3 py-2.5 rounded-xl transition-all"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
            title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── CALENDAR DAY MODAL — clicking a day pops this instead of scrolling ──────
function CalendarDayModal({
  date,
  payments,
  onClose,
  onOpenPayment,
}: {
  date: Date;
  payments: UpcomingPayment[];
  onClose: () => void;
  onOpenPayment?: (key: string) => void;
}) {
  const total = payments.reduce((s, p) => s + p.amount, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  const relative = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff === -1 ? 'Yesterday' : diff > 0 ? `in ${diff} days` : `${Math.abs(diff)} days ago`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg, rgba(124,58,237,0.1), transparent)' }}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{relative}</p>
            <h3 className="font-bold text-base" style={{ color: '#e5e5e5' }}>
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <p className="font-mono text-sm mt-1" style={{ color: '#a78bfa' }}>
              {payments.length} charge{payments.length === 1 ? '' : 's'} · {fmtFull(total)}
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {payments.map(p => (
            <button
              key={p.key}
              onClick={() => onOpenPayment?.(p.key)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-2xl flex-shrink-0">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold truncate" style={{ color: '#e5e5e5' }}>{p.name}</p>
                <p className="font-mono text-[10px] mt-0.5 capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {p.frequency}{p.category ? ` · ${p.category}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-base font-bold" style={{ color: '#e5e5e5' }}>{fmtFull(p.amount)}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── TRANSACTION DETAIL MODAL ──────────────────────────────────────────────────
function TransactionDetailModal({ tx, onClose, onUpdateCategory, onCreateRule, onDelete }: {
  tx: VaultTransaction;
  onClose: () => void;
  onUpdateCategory: (id: string, category: string) => void;
  onCreateRule: (pattern: string, category: string) => void;
  onDelete: (id: string) => void;
}) {
  const [category, setCategory] = useState(tx.category || 'Other');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [makeRule, setMakeRule] = useState(false);
  const rulePattern = tx.merchant || tx.description || '';
  const isIncome = tx.type === 'income';

  return (
    <ModalShell title="Transaction Details" onClose={onClose}>
      <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          isIncome ? "bg-emerald-500/10" : "bg-red-500/10"
        )}>
          {isIncome ? <ArrowDownRight className="w-6 h-6 text-emerald-500" /> : <ArrowUpRight className="w-6 h-6 text-red-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-lg" style={{ color: '#e5e5e5' }}>{isIncome ? '+' : '-'}{fmtFull(tx.amount)}</p>
          <p className="font-medium truncate" style={{ color: '#e5e5e5' }}>{tx.merchant || tx.description}</p>
          {tx.merchant && tx.description && tx.merchant !== tx.description && (
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{tx.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Date</p>
          <p className="font-medium" style={{ color: '#e5e5e5' }}>{new Date(tx.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Account</p>
          <p className="font-medium truncate" style={{ color: '#e5e5e5' }}>{tx.accountName || '—'}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Type</p>
          <p className="font-medium capitalize" style={{ color: '#e5e5e5' }}>{tx.type}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Status</p>
          <p className="font-medium" style={{ color: '#e5e5e5' }}>{tx.isPending ? '⏳ Pending' : '✓ Cleared'}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className={selectCls} style={inputStyle}
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => onUpdateCategory(tx.id, category)}
            className="flex-1 py-2 rounded-xl text-sm font-mono font-medium"
            style={{ background: '#00ff88', color: '#000' }}
          >
            Save Category
          </button>
          {rulePattern && (
            <button
              onClick={() => setMakeRule(p => !p)}
              className="px-3 py-2 rounded-xl border text-sm transition-colors"
              style={makeRule
                ? { border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88' }
                : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              title="Always categorize this merchant this way"
            >
              Auto-rule
            </button>
          )}
        </div>
        {makeRule && rulePattern && (
          <div className="p-3 rounded-xl text-xs space-y-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Always categorize <span className="font-semibold" style={{ color: '#e5e5e5' }}>"{rulePattern}"</span> as <span className="font-semibold" style={{ color: '#00ff88' }}>{category}</span>?</p>
            <button
              onClick={() => { onCreateRule(rulePattern, category); }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
            >
              Create Rule
            </button>
          </div>
        )}
      </div>

      {confirmDelete ? (
        <div className="flex gap-2">
          <button onClick={() => onDelete(tx.id)} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium">Confirm Delete</button>
          <button onClick={() => setConfirmDelete(false)}
            className="flex-1 py-2 rounded-xl text-sm transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)}
          className="w-full py-2 rounded-xl text-sm transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248,113,113,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
          Delete Transaction
        </button>
      )}
    </ModalShell>
  );
}

// ── EDIT SUBSCRIPTION MODAL ───────────────────────────────────────────────────
function EditSubscriptionModal({ subscription, onClose, onSave, onUpdate, onDelete }: {
  subscription: Subscription | null;
  onClose: () => void;
  onSave: (s: Omit<Subscription, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Subscription>) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(subscription?.name || '');
  const [emoji, setEmoji] = useState(subscription?.emoji || '💳');
  const [amount, setAmount] = useState(String(subscription?.amount || ''));
  const [frequency, setFrequency] = useState<SubscriptionFrequency>(subscription?.frequency || 'monthly');
  const [category, setCategory] = useState(subscription?.category || 'Entertainment');
  const [isActive, setIsActive] = useState(subscription?.isActive ?? true);
  const [nextBilling, setNextBilling] = useState(subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toISOString().split('T')[0] : '');
  const [notes, setNotes] = useState(subscription?.notes || '');
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6b7280'];
  const [color, setColor] = useState(subscription?.color || COLORS[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEdit = !!subscription;
  const monthly = toMonthly(parseFloat(amount) || 0, frequency);

  const handleSave = () => {
    const sub = {
      name, emoji, amount: parseFloat(amount) || 0, frequency, category, color, isActive,
      nextBillingDate: nextBilling ? new Date(nextBilling) : undefined,
      notes: notes || undefined,
      autoDetected: false,
    };
    if (isEdit) onUpdate(subscription.id, sub);
    else onSave(sub);
  };

  return (
    <ModalShell title={isEdit ? 'Edit Subscription' : 'Add Subscription'} onClose={onClose}>
      <div className="flex gap-3">
        <Field label="Emoji">
          <input className={cn(inputCls, "w-16 text-center text-xl")} value={emoji} onChange={e => setEmoji(e.target.value)} />
        </Field>
        <div className="flex-1">
          <Field label="Name">
            <input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Netflix, Gym, Adobe" />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount ($)">
          <input className={inputCls} style={inputStyle} type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Frequency">
          <select className={selectCls} style={inputStyle} value={frequency} onChange={e => setFrequency(e.target.value as SubscriptionFrequency)}>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </Field>
      </div>

      {frequency !== 'monthly' && parseFloat(amount) > 0 && (
        <p className="text-xs rounded-xl px-3 py-2" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}>
          ~{fmtFull(monthly)}/mo · {fmtFull(monthly * 12)}/year
        </p>
      )}

      <Field label="Category">
        <select className={selectCls} style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>

      <Field label="Next Billing Date (optional)">
        <input className={inputCls} style={inputStyle} type="date" value={nextBilling} onChange={e => setNextBilling(e.target.value)} />
      </Field>

      <Field label="Notes (optional)">
        <input className={inputCls} style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Family plan, can cancel anytime" />
      </Field>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Active</label>
        <button
          onClick={() => setIsActive(p => !p)}
          className="relative w-11 h-6 rounded-full transition-colors"
          style={{ background: isActive ? '#10b981' : 'rgba(255,255,255,0.1)' }}
        >
          <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", isActive ? "left-6" : "left-1")} />
        </button>
      </div>

      <Field label="Color">
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className={cn("w-7 h-7 rounded-full border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
          ))}
        </div>
      </Field>

      <button onClick={handleSave} disabled={!name || !amount} className="w-full py-2.5 rounded-xl font-mono font-medium disabled:opacity-50 transition-all" style={{ background: '#00ff88', color: '#000' }}>
        {isEdit ? 'Save Changes' : 'Add Subscription'}
      </button>

      {isEdit && (
        confirmDelete ? (
          <div className="flex gap-2">
            <button onClick={() => onDelete(subscription.id)} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium">Confirm Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl text-sm transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="w-full py-2 rounded-xl text-sm transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248,113,113,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
            Delete Subscription
          </button>
        )
      )}
    </ModalShell>
  );
}

// ── MODALS ────────────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-mono font-semibold" style={{ color: '#e5e5e5' }}>{title}</h3>
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </motion.div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-xl text-sm focus:outline-none";
const selectCls = "w-full px-3 py-2 rounded-xl text-sm focus:outline-none";
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e5e5' } as React.CSSProperties;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-mono font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</label>
      {children}
    </div>
  );
}

function AddAccountModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (a: Omit<VaultAccount, 'id' | 'createdAt'>) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');
  const [institution, setInstitution] = useState('');

  return (
    <ModalShell title="Add Account" onClose={onClose}>
      <Field label="Account Name">
        <input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chase Checking" />
      </Field>
      <Field label="Type">
        <select className={selectCls} style={inputStyle} value={type} onChange={e => setType(e.target.value as AccountType)}>
          {(['checking', 'savings', 'credit', 'loan', 'investment', 'cash'] as AccountType[]).map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </Field>
      <Field label="Current Balance ($)">
        <input className={inputCls} style={inputStyle} type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" />
      </Field>
      <Field label="Institution (optional)">
        <input className={inputCls} style={inputStyle} value={institution} onChange={e => setInstitution(e.target.value)} placeholder="e.g. Chase Bank" />
      </Field>
      <button
        onClick={() => onSave({ name, type, balance: parseFloat(balance) || 0, institution, currency: 'USD', isTellerLinked: false, color: ACCOUNT_COLORS[type] })}
        disabled={!name || !balance}
        className="w-full py-2.5 rounded-xl font-mono font-medium disabled:opacity-50 transition-all" style={{ background: '#00ff88', color: '#000' }}
      >
        Save Account
      </button>
    </ModalShell>
  );
}

function AddTransactionModal({ accounts, onClose, onSave }: {
  accounts: VaultAccount[];
  onClose: () => void;
  onSave: (t: Omit<VaultTransaction, 'id'>) => void;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Food & Drink');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const CATS = ['Food & Drink', 'Shopping', 'Transport', 'Housing', 'Entertainment', 'Health', 'Income', 'Transfer', 'Other'];

  return (
    <ModalShell title="Add Transaction" onClose={onClose}>
      <Field label="Description">
        <input className={inputCls} style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Chipotle" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount ($)">
          <input className={inputCls} style={inputStyle} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Type">
          <select className={selectCls} style={inputStyle} value={type} onChange={e => setType(e.target.value as TransactionType)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
        </Field>
      </div>
      <Field label="Category">
        <select className={selectCls} style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
          {CATS.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      {accounts.length > 0 && (
        <Field label="Account">
          <select className={selectCls} style={inputStyle} value={accountId} onChange={e => setAccountId(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
      )}
      <Field label="Date">
        <input className={inputCls} style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
      </Field>
      <button
        onClick={() => onSave({ description, amount: parseFloat(amount) || 0, type, category, accountId, date: new Date(date), isPending: false })}
        disabled={!description || !amount}
        className="w-full py-2.5 rounded-xl font-mono font-medium disabled:opacity-50 transition-all" style={{ background: '#00ff88', color: '#000' }}
      >
        Save Transaction
      </button>
    </ModalShell>
  );
}

// ── CSV IMPORT ────────────────────────────────────────────────────────────────
function parseDebtCsv(text: string): Omit<DebtEntry, 'id'>[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  // Normalize header names
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));

  const col = (row: string[], names: string[]): string => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.includes(name));
      if (idx >= 0 && row[idx]?.trim()) return row[idx].trim().replace(/[$,"%]/g, '');
    }
    return '';
  };

  const DEBT_COLORS: Record<string, string> = {
    credit_card: '#ef4444', student_loan: '#f59e0b', personal_loan: '#8b5cf6', medical: '#3b82f6', other: '#6b7280',
  };

  const guessType = (name: string, typeRaw: string): DebtEntry['type'] => {
    const s = (name + ' ' + typeRaw).toLowerCase();
    if (s.includes('student') || s.includes('loan') && s.includes('edu')) return 'student_loan';
    if (s.includes('credit') || s.includes('card')) return 'credit_card';
    if (s.includes('personal')) return 'personal_loan';
    if (s.includes('medical') || s.includes('hospital') || s.includes('health')) return 'medical';
    return 'other';
  };

  return lines.slice(1).map(line => {
    const row = line.split(',');
    const name    = col(row, ['name', 'description', 'loan_name', 'account', 'creditor', 'debt']) || 'Unnamed Debt';
    const balance = parseFloat(col(row, ['current_balance', 'balance', 'outstanding', 'amount', 'remaining'])) || 0;
    const orig    = parseFloat(col(row, ['original_balance', 'original', 'principal', 'loan_amount'])) || balance;
    const rate    = parseFloat(col(row, ['interest_rate', 'rate', 'apr', 'interest'])) || 0;
    const minPay  = parseFloat(col(row, ['minimum_payment', 'min_payment', 'payment', 'monthly'])) || 0;
    const typeRaw = col(row, ['type', 'loan_type', 'account_type', 'category']);
    const type    = guessType(name, typeRaw);
    return { name, balance, originalBalance: orig, interestRate: rate, minimumPayment: minPay, type, color: DEBT_COLORS[type] };
  }).filter(d => d.balance > 0);
}

function DebtCsvImportModal({ onClose, onImport }: {
  onClose: () => void;
  onImport: (rows: Omit<DebtEntry, 'id'>[]) => void;
}) {
  const [rows, setRows] = useState<Omit<DebtEntry, 'id'>[]>([]);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = parseDebtCsv(ev.target?.result as string);
        if (parsed.length === 0) { setError('No valid debt rows found. Check your CSV format.'); setRows([]); }
        else { setRows(parsed); setError(''); }
      } catch { setError('Failed to parse CSV.'); }
    };
    reader.readAsText(file);
  };

  return (
    <ModalShell title="Import Debts from CSV" onClose={onClose}>
      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)' }}>
          <p className="font-mono font-medium flex items-center gap-1.5" style={{ color: '#e5e5e5' }}><FileText className="w-3.5 h-3.5" /> Expected columns (any order, flexible names):</p>
          <p><span style={{ color: '#e5e5e5' }}>Name</span> · <span style={{ color: '#e5e5e5' }}>Balance</span> · Original Balance · <span style={{ color: '#e5e5e5' }}>Interest Rate</span> · Min Payment · Type</p>
          <p style={{ color: 'rgba(255,255,255,0.3)' }}>Works with exports from MOHELA, Navient, SoFi, and most bank CSV exports.</p>
        </div>

        {/* File picker */}
        <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-all"
          style={{ border: '2px dashed rgba(255,255,255,0.12)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,136,0.4)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'}>
          <Upload className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.35)' }} />
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>{fileName || 'Click to select a .csv file'}</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Preview */}
        {rows.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{rows.length} debt{rows.length !== 1 ? 's' : ''} found — preview:</p>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl text-xs"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <p className="font-medium" style={{ color: '#e5e5e5' }}>{r.name}</p>
                    <p className="capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.type.replace('_', ' ')} · {r.interestRate}% APR</p>
                  </div>
                  <p className="font-semibold text-red-400">{fmtFull(r.balance)}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => onImport(rows)}
              className="w-full py-2.5 rounded-xl font-mono font-medium"
              style={{ background: '#00ff88', color: '#000' }}
            >
              Import {rows.length} Debt{rows.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

const DEBT_PRESETS: { label: string; type: DebtEntry['type']; placeholder: string }[] = [
  { label: '💳 Credit Card',  type: 'credit_card',  placeholder: 'e.g. Chase Sapphire' },
  { label: '🎓 Student Loan', type: 'student_loan', placeholder: 'e.g. Federal Loan — Direct Subsidized' },
  { label: '🏦 Personal Loan',type: 'personal_loan',placeholder: 'e.g. SoFi Personal Loan' },
  { label: '🏥 Medical',      type: 'medical',       placeholder: 'e.g. Hospital Bill' },
  { label: '📦 Other',        type: 'other',         placeholder: 'e.g. Family loan' },
];

function AddDebtModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (d: Omit<DebtEntry, 'id'>) => void;
}) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [originalBalance, setOriginalBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [type, setType] = useState<DebtEntry['type']>('credit_card');

  const DEBT_COLORS: Record<DebtEntry['type'], string> = {
    credit_card: '#ef4444', student_loan: '#f59e0b', personal_loan: '#8b5cf6', medical: '#3b82f6', other: '#6b7280',
  };

  const balNum = parseFloat(balance) || 0;
  const rateNum = parseFloat(interestRate) || 0;
  const monthlyInterest = balNum > 0 && rateNum > 0 ? (balNum * (rateNum / 100)) / 12 : 0;
  const selectedPreset = DEBT_PRESETS.find(p => p.type === type);

  return (
    <ModalShell title="Add Debt" onClose={onClose}>
      {/* Type quick-pick */}
      <div className="grid grid-cols-5 gap-1">
        {DEBT_PRESETS.map(p => (
          <button key={p.type} onClick={() => setType(p.type)}
            className="py-2 px-1 rounded-xl text-[10px] font-mono font-medium text-center transition-all"
            style={type === p.type
              ? { border: '1px solid rgba(0,255,136,0.4)', background: 'rgba(0,255,136,0.1)', color: '#00ff88' }
              : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
            {p.label}
          </button>
        ))}
      </div>

      <Field label="Name">
        <input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)}
          placeholder={selectedPreset?.placeholder || 'Debt name'} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Current Balance ($)">
          <input className={inputCls} style={inputStyle} type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Original Balance ($)">
          <input className={inputCls} style={inputStyle} type="number" value={originalBalance} onChange={e => setOriginalBalance(e.target.value)} placeholder="Same as current" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Interest Rate (%)">
          <input className={inputCls} style={inputStyle} type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="e.g. 6.5" />
        </Field>
        <Field label="Min. Monthly Payment ($)">
          <input className={inputCls} style={inputStyle} type="number" value={minimumPayment} onChange={e => setMinimumPayment(e.target.value)} placeholder="0.00" />
        </Field>
      </div>

      {monthlyInterest > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>~{fmtFull(monthlyInterest)}/mo in interest at {rateNum}% APR</span>
        </div>
      )}

      <Field label="Target Payoff Date (optional)">
        <input className={inputCls} style={inputStyle} type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
      </Field>

      <button
        onClick={() => onSave({
          name, type,
          balance: balNum,
          originalBalance: parseFloat(originalBalance || balance) || balNum,
          interestRate: rateNum,
          minimumPayment: parseFloat(minimumPayment) || 0,
          targetDate: targetDate ? new Date(targetDate) : undefined,
          color: DEBT_COLORS[type],
        })}
        disabled={!name || !balance}
        className="w-full py-2.5 rounded-xl font-mono font-medium disabled:opacity-50 transition-all" style={{ background: '#00ff88', color: '#000' }}
      >
        Save Debt
      </button>
    </ModalShell>
  );
}

const GOAL_PRESETS = [
  { emoji: '🏠', name: 'House Down Payment' },
  { emoji: '🚗', name: 'New Car' },
  { emoji: '🌴', name: 'Vacation' },
  { emoji: '🛡️', name: 'Emergency Fund' },
  { emoji: '💻', name: 'New Laptop' },
  { emoji: '🎓', name: 'Tuition' },
  { emoji: '💍', name: 'Ring / Wedding' },
  { emoji: '🚀', name: 'Investments' },
];

function AddGoalModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (g: Omit<SavingsGoal, 'id'>) => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
  const [color, setColor] = useState(COLORS[0]);

  const target = parseFloat(targetAmount) || 0;
  const current = parseFloat(currentAmount) || 0;
  const remaining = target - current;
  const deadlineDate = deadline ? new Date(deadline) : null;
  const monthsLeft = deadlineDate ? Math.max(1, Math.round((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : null;
  const monthlyNeeded = monthsLeft && remaining > 0 ? remaining / monthsLeft : null;

  return (
    <ModalShell title="Add Savings Goal" onClose={onClose}>
      {/* Quick presets */}
      <div>
        <p className="text-xs font-mono mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Quick presets</p>
        <div className="grid grid-cols-4 gap-1.5">
          {GOAL_PRESETS.map(p => (
            <button key={p.name} onClick={() => { setEmoji(p.emoji); setName(p.name); }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-center"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,136,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.05)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <span className="text-lg">{p.emoji}</span>
              <span className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Field label="Emoji">
          <input className={cn(inputCls, "w-16 text-center text-xl")} value={emoji} onChange={e => setEmoji(e.target.value)} />
        </Field>
        <div className="flex-1">
          <Field label="Goal Name">
            <input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emergency Fund" />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Target ($)">
          <input className={inputCls} style={inputStyle} type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Already Saved ($)">
          <input className={inputCls} style={inputStyle} type="number" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0.00" />
        </Field>
      </div>

      <Field label="Target Date (optional)">
        <input className={inputCls} style={inputStyle} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
      </Field>

      {monthlyNeeded && monthlyNeeded > 0 && (
        <div className="text-xs text-emerald-500 bg-emerald-500/10 rounded-xl px-3 py-2">
          Save ~{fmtFull(monthlyNeeded)}/mo to hit your goal in {monthsLeft} month{monthsLeft !== 1 ? 's' : ''}
        </div>
      )}

      <Field label="Color">
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className={cn("w-7 h-7 rounded-full border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
          ))}
        </div>
      </Field>

      <button
        onClick={() => onSave({ name, emoji, targetAmount: target, currentAmount: current, deadline: deadline ? new Date(deadline) : undefined, color })}
        disabled={!name || !targetAmount}
        className="w-full py-2.5 rounded-xl font-mono font-medium disabled:opacity-50 transition-all" style={{ background: '#00ff88', color: '#000' }}
      >
        Save Goal
      </button>
    </ModalShell>
  );
}

const BUDGET_PRESETS = [
  { emoji: '🍔', name: 'Food & Drink',      color: '#f59e0b', limit: 400 },
  { emoji: '🛒', name: 'Groceries',          color: '#10b981', limit: 300 },
  { emoji: '🚗', name: 'Transportation',     color: '#3b82f6', limit: 200 },
  { emoji: '🎮', name: 'Entertainment',      color: '#8b5cf6', limit: 150 },
  { emoji: '🏠', name: 'Housing',            color: '#6b7280', limit: 1500 },
  { emoji: '💊', name: 'Medical',            color: '#ef4444', limit: 100 },
  { emoji: '👗', name: 'Shopping',           color: '#ec4899', limit: 200 },
  { emoji: '📱', name: 'Bills & Utilities',  color: '#06b6d4', limit: 200 },
];

function AddBudgetModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (b: Omit<BudgetCategory, 'id' | 'spent'>) => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💰');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const [color, setColor] = useState(COLORS[0]);

  return (
    <ModalShell title="Add Budget Category" onClose={onClose}>
      {/* Quick presets */}
      <div>
        <p className="text-xs font-mono mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Quick presets</p>
        <div className="grid grid-cols-4 gap-1.5">
          {BUDGET_PRESETS.map(p => (
            <button key={p.name} onClick={() => { setEmoji(p.emoji); setName(p.name); setColor(p.color); setMonthlyLimit(String(p.limit)); }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-center"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,136,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.05)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <span className="text-lg">{p.emoji}</span>
              <span className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Field label="Emoji">
          <input className={cn(inputCls, "w-16 text-center text-xl")} value={emoji} onChange={e => setEmoji(e.target.value)} />
        </Field>
        <div className="flex-1">
          <Field label="Category Name">
            <input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Food & Drink" />
          </Field>
        </div>
      </div>

      <Field label="Monthly Limit ($)">
        <input className={inputCls} style={inputStyle} type="number" value={monthlyLimit} onChange={e => setMonthlyLimit(e.target.value)} placeholder="0.00" />
      </Field>

      <Field label="Color">
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className={cn("w-7 h-7 rounded-full border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
          ))}
        </div>
      </Field>

      <button
        onClick={() => onSave({ name, emoji, monthlyLimit: parseFloat(monthlyLimit) || 0, color })}
        disabled={!name || !monthlyLimit}
        className="w-full py-2.5 rounded-xl font-mono font-medium disabled:opacity-50 transition-all" style={{ background: '#00ff88', color: '#000' }}
      >
        Save Category
      </button>
    </ModalShell>
  );
}

// ── EDIT MODALS ───────────────────────────────────────────────────────────────

function EditDebtModal({ debt, onClose, onSave, onDelete }: {
  debt: DebtEntry;
  onClose: () => void;
  onSave: (updates: Partial<DebtEntry>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(debt.name);
  const [balance, setBalance] = useState(String(debt.balance));
  const [originalBalance, setOriginalBalance] = useState(String(debt.originalBalance));
  const [interestRate, setInterestRate] = useState(String(debt.interestRate));
  const [minimumPayment, setMinimumPayment] = useState(String(debt.minimumPayment));
  const [targetDate, setTargetDate] = useState(debt.targetDate ? debt.targetDate.toISOString().split('T')[0] : '');
  const [type, setType] = useState<DebtEntry['type']>(debt.type);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const DEBT_COLORS: Record<DebtEntry['type'], string> = {
    credit_card: '#ef4444', student_loan: '#f59e0b', personal_loan: '#8b5cf6', medical: '#3b82f6', other: '#6b7280',
  };

  const balNum = parseFloat(balance) || 0;
  const rateNum = parseFloat(interestRate) || 0;
  const monthlyInterest = balNum > 0 && rateNum > 0 ? (balNum * (rateNum / 100)) / 12 : 0;
  const projection = debtPayoffProjection(balNum, rateNum, parseFloat(minimumPayment) || 0);

  return (
    <ModalShell title="Edit Debt" onClose={onClose}>
      <div className="grid grid-cols-5 gap-1">
        {DEBT_PRESETS.map(p => (
          <button key={p.type} onClick={() => setType(p.type)}
            className="py-2 px-1 rounded-xl text-[10px] font-mono font-medium text-center transition-all"
            style={type === p.type
              ? { border: '1px solid rgba(0,255,136,0.4)', background: 'rgba(0,255,136,0.1)', color: '#00ff88' }
              : { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
            {p.label}
          </button>
        ))}
      </div>

      <Field label="Name">
        <input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Current Balance ($)">
          <input className={inputCls} style={inputStyle} type="number" value={balance} onChange={e => setBalance(e.target.value)} />
        </Field>
        <Field label="Original Balance ($)">
          <input className={inputCls} style={inputStyle} type="number" value={originalBalance} onChange={e => setOriginalBalance(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Interest Rate (%)">
          <input className={inputCls} style={inputStyle} type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
        </Field>
        <Field label="Min. Payment ($)">
          <input className={inputCls} style={inputStyle} type="number" value={minimumPayment} onChange={e => setMinimumPayment(e.target.value)} />
        </Field>
      </div>

      {monthlyInterest > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>~{fmtFull(monthlyInterest)}/mo in interest at {rateNum}% APR</span>
        </div>
      )}

      {projection && (
        <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 rounded-xl px-3 py-2">
          <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Payoff in ~{projection.months} months · {fmtFull(projection.totalInterest)} total interest
          </span>
        </div>
      )}

      <Field label="Target Payoff Date (optional)">
        <input className={inputCls} style={inputStyle} type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
      </Field>

      <button
        onClick={() => onSave({
          name, type,
          balance: balNum,
          originalBalance: parseFloat(originalBalance) || balNum,
          interestRate: rateNum,
          minimumPayment: parseFloat(minimumPayment) || 0,
          targetDate: targetDate ? new Date(targetDate) : undefined,
          color: DEBT_COLORS[type],
        })}
        disabled={!name || !balance}
        className="w-full py-2.5 rounded-xl font-mono font-medium disabled:opacity-50 transition-all" style={{ background: '#00ff88', color: '#000' }}
      >
        Save Changes
      </button>

      {confirmDelete ? (
        <div className="flex gap-2">
          <button onClick={onDelete} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">
            Confirm Delete
          </button>
          <button onClick={() => setConfirmDelete(false)}
            className="flex-1 py-2 rounded-xl text-sm transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="w-full py-2 rounded-xl text-sm transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248,113,113,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
          Delete Debt
        </button>
      )}
    </ModalShell>
  );
}

function EditBudgetModal({ budget, onClose, onSave, onDelete }: {
  budget: BudgetCategory;
  onClose: () => void;
  onSave: (updates: Partial<BudgetCategory>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(budget.name);
  const [emoji, setEmoji] = useState(budget.emoji || '💰');
  const [monthlyLimit, setMonthlyLimit] = useState(String(budget.monthlyLimit));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const [color, setColor] = useState(budget.color || COLORS[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <ModalShell title="Edit Budget Category" onClose={onClose}>
      <div className="flex gap-3">
        <Field label="Emoji">
          <input className={cn(inputCls, "w-16 text-center text-xl")} value={emoji} onChange={e => setEmoji(e.target.value)} />
        </Field>
        <div className="flex-1">
          <Field label="Category Name">
            <input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
          </Field>
        </div>
      </div>

      <Field label="Monthly Limit ($)">
        <input className={inputCls} style={inputStyle} type="number" value={monthlyLimit} onChange={e => setMonthlyLimit(e.target.value)} />
      </Field>

      <Field label="Color">
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className={cn("w-7 h-7 rounded-full border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
          ))}
        </div>
      </Field>

      <button
        onClick={() => onSave({ name, emoji, monthlyLimit: parseFloat(monthlyLimit) || 0, color })}
        disabled={!name || !monthlyLimit}
        className="w-full py-2.5 rounded-xl font-mono font-medium disabled:opacity-50 transition-all" style={{ background: '#00ff88', color: '#000' }}
      >
        Save Changes
      </button>

      {confirmDelete ? (
        <div className="flex gap-2">
          <button onClick={onDelete} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">Confirm Delete</button>
          <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl text-sm transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="w-full py-2 rounded-xl text-sm transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248,113,113,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
          Delete Category
        </button>
      )}
    </ModalShell>
  );
}

function EditGoalModal({ goal, onClose, onSave, onDelete }: {
  goal: SavingsGoal;
  onClose: () => void;
  onSave: (updates: Partial<SavingsGoal>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(goal.name);
  const [emoji, setEmoji] = useState(goal.emoji || '🎯');
  const [targetAmount, setTargetAmount] = useState(String(goal.targetAmount));
  const [currentAmount, setCurrentAmount] = useState(String(goal.currentAmount));
  const [deadline, setDeadline] = useState(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '');
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
  const [color, setColor] = useState(goal.color || COLORS[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const target = parseFloat(targetAmount) || 0;
  const current = parseFloat(currentAmount) || 0;
  const remaining = target - current;
  const deadlineDate = deadline ? new Date(deadline) : null;
  const monthsLeft = deadlineDate ? Math.max(1, Math.round((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : null;
  const monthlyNeeded = monthsLeft && remaining > 0 ? remaining / monthsLeft : null;

  return (
    <ModalShell title="Edit Savings Goal" onClose={onClose}>
      <div className="flex gap-3">
        <Field label="Emoji">
          <input className={cn(inputCls, "w-16 text-center text-xl")} value={emoji} onChange={e => setEmoji(e.target.value)} />
        </Field>
        <div className="flex-1">
          <Field label="Goal Name">
            <input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Target ($)">
          <input className={inputCls} style={inputStyle} type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
        </Field>
        <Field label="Already Saved ($)">
          <input className={inputCls} style={inputStyle} type="number" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} />
        </Field>
      </div>

      <Field label="Target Date (optional)">
        <input className={inputCls} style={inputStyle} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
      </Field>

      {monthlyNeeded && monthlyNeeded > 0 && (
        <div className="text-xs text-emerald-500 bg-emerald-500/10 rounded-xl px-3 py-2">
          Save ~{fmtFull(monthlyNeeded)}/mo to hit your goal in {monthsLeft} month{monthsLeft !== 1 ? 's' : ''}
        </div>
      )}

      <Field label="Color">
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className={cn("w-7 h-7 rounded-full border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
          ))}
        </div>
      </Field>

      <button
        onClick={() => onSave({ name, emoji, targetAmount: target, currentAmount: current, deadline: deadline ? new Date(deadline) : undefined, color })}
        disabled={!name || !targetAmount}
        className="w-full py-2.5 rounded-xl font-mono font-medium disabled:opacity-50 transition-all" style={{ background: '#00ff88', color: '#000' }}
      >
        Save Changes
      </button>

      {confirmDelete ? (
        <div className="flex gap-2">
          <button onClick={onDelete} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600">Confirm Delete</button>
          <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl text-sm transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="w-full py-2 rounded-xl text-sm transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248,113,113,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
          Delete Goal
        </button>
      )}
    </ModalShell>
  );
}
