import type { VaultTransaction } from '@/app/ctroom/types/index';

function toLocalMidnight(d: Date | string): Date {
  if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const parsed = new Date(d);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function isRealExpense(tx: VaultTransaction): boolean {
  return tx.type === 'expense' && tx.category !== 'Transfer';
}

export function isBillCategory(cat: string | undefined): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase();
  return (
    c.includes('bill') ||
    c.includes('utilities') ||
    c.includes('loan') ||
    c.includes('housing') ||
    c === 'rent'
  );
}

export function monthRange(ref: Date, offsetMonths = 0): { start: Date; end: Date } {
  const start = new Date(ref.getFullYear(), ref.getMonth() + offsetMonths, 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + offsetMonths + 1, 0, 23, 59, 59);
  return { start, end };
}

export function txsInMonth(transactions: VaultTransaction[], ref: Date, offsetMonths = 0) {
  const { start, end } = monthRange(ref, offsetMonths);
  return transactions.filter(t => {
    const d = toLocalMidnight(t.date);
    return d >= start && d <= end;
  });
}

export interface CategorySpendRow {
  name: string;
  amount: number;
  pct: number;
  prevAmount: number;
  changePct: number | null;
}

export function buildCategorySpend(
  transactions: VaultTransaction[],
  ref = new Date(),
  includeBills = true,
): CategorySpendRow[] {
  const cur = txsInMonth(transactions, ref, 0);
  const prev = txsInMonth(transactions, ref, -1);

  const sumByCategory = (txs: VaultTransaction[]) => {
    const map: Record<string, number> = {};
    txs.filter(isRealExpense).forEach(t => {
      if (!includeBills && isBillCategory(t.category)) return;
      const cat = t.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return map;
  };

  const curMap = sumByCategory(cur);
  const prevMap = sumByCategory(prev);
  const total = Object.values(curMap).reduce((s, v) => s + v, 0);

  return Object.entries(curMap)
    .map(([name, amount]) => {
      const prevAmount = prevMap[name] || 0;
      let changePct: number | null = null;
      if (prevAmount > 0) changePct = Math.round(((amount - prevAmount) / prevAmount) * 100);
      else if (amount > 0) changePct = null;
      return {
        name,
        amount,
        pct: total > 0 ? Math.round((amount / total) * 100) : 0,
        prevAmount,
        changePct,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export interface MonthSummary {
  income: number;
  bills: number;
  spending: number;
  leftForSavings: number;
  incomeEvents: number;
  billPctOfIncome: number;
}

export function buildMonthSummary(transactions: VaultTransaction[], ref = new Date()): MonthSummary {
  const month = txsInMonth(transactions, ref, 0);
  const income = month.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const incomeEvents = month.filter(t => t.type === 'income').length;
  const bills = month
    .filter(t => isRealExpense(t) && isBillCategory(t.category))
    .reduce((s, t) => s + t.amount, 0);
  const spending = month.filter(isRealExpense).reduce((s, t) => s + t.amount, 0);
  const discretionary = spending - bills;
  return {
    income,
    bills,
    spending: discretionary,
    leftForSavings: income - spending,
    incomeEvents,
    billPctOfIncome: income > 0 ? Math.round((bills / income) * 100) : 0,
  };
}

export const CATEGORY_COLORS = [
  '#6ee7a0',
  '#f87171',
  '#60a5fa',
  '#fbbf24',
  '#a78bfa',
  '#fb923c',
  '#94a3b8',
  '#f472b6',
  '#34d399',
  '#818cf8',
];
