import type { Subscription, SubscriptionBillType, VaultTransaction } from '@/app/ctroom/types/index';

export const fmtUsd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export function toMonthly(amount: number, freq: string): number {
  if (freq === 'monthly') return amount;
  if (freq === 'weekly') return amount * 4.33;
  if (freq === 'bi-weekly') return amount * 2.17;
  if (freq === 'quarterly') return amount / 3;
  if (freq === 'annual') return amount / 12;
  return amount;
}

function toLocalMidnight(d: Date | string): Date {
  if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const parsed = new Date(d);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/** Active recurring rows (manual expected bills + confirmed auto-detect). */
export function getLiveBills(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter(s => {
    const st = s.status || (s.isActive ? 'active' : 'cancelled');
    return st === 'active' && s.amount > 0;
  });
}

/** Match bank transactions to a recurring bill / subscription row. */
export function getBillPaymentHistory(
  bill: Subscription,
  transactions: VaultTransaction[],
  limit = 12,
): VaultTransaction[] {
  const pat = (bill.merchantPattern || bill.name).toLowerCase();
  const normName = bill.name.toLowerCase();
  const isIncome = bill.billType === 'income';

  return transactions
    .filter(t => {
      if (isIncome ? t.type !== 'income' : t.type !== 'expense') return false;
      const hay = `${t.merchant || ''} ${t.description || ''}`.toLowerCase();
      if (pat.startsWith('expected-')) {
        if (hay.includes(normName.split(' ')[0])) return true;
        if (bill.amount > 0 && Math.abs(t.amount - bill.amount) / bill.amount <= 0.12) return true;
        return false;
      }
      if (pat.startsWith('income:')) {
        const inner = pat.replace(/^income:/, '');
        return hay.includes(inner) || hay.includes(normName);
      }
      if (hay.includes(pat) || hay.includes(normName)) return true;
      if (bill.amount > 0 && Math.abs(t.amount - bill.amount) / bill.amount <= 0.08) {
        return hay.includes(pat.split('#')[0]);
      }
      return false;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export function computeCommittedMonthly(subscriptions: Subscription[]): number {
  return getLiveBills(subscriptions).reduce((sum, s) => sum + toMonthly(s.amount, s.frequency), 0);
}

export function computeMonthlyIncome(transactions: VaultTransaction[], ref = new Date()): {
  total: number;
  paycheckCount: number;
  note: string;
} {
  const monthTxs = transactions.filter(t => {
    if (t.type !== 'income') return false;
    const d = toLocalMidnight(t.date);
    return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
  });
  const total = monthTxs.reduce((s, t) => s + t.amount, 0);
  const paycheckCount = monthTxs.length;
  let note = 'No paychecks detected this month yet';
  if (paycheckCount === 1) note = 'Based on 1 detected deposit';
  else if (paycheckCount > 1) note = `Based on ${paycheckCount} detected deposits`;
  return { total, paycheckCount, note };
}

export interface BillsStatus {
  liveCount: number;
  monthlyTotal: number;
  nextName?: string;
  nextAmount?: number;
  nextDays?: number;
  paidThisMonth: number;
}

export function computeBillsStatus(
  subscriptions: Subscription[],
  transactions: VaultTransaction[],
): BillsStatus {
  const live = getLiveBills(subscriptions);
  const monthlyTotal = computeCommittedMonthly(subscriptions);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const withDates = live
    .map(s => {
      const next = s.nextBillingDate ? new Date(s.nextBillingDate) : null;
      if (next) next.setHours(0, 0, 0, 0);
      return { sub: s, next };
    })
    .filter(x => x.next && x.next >= now)
    .sort((a, b) => (a.next!.getTime() - b.next!.getTime()));

  const next = withDates[0];
  const nextDays = next?.next
    ? Math.ceil((next.next.getTime() - now.getTime()) / 86400000)
    : undefined;

  // Rough "paid" signal: expense tx this month matching bill name or >= 90% of amount
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let paidThisMonth = 0;
  for (const bill of live) {
    const pat = (bill.merchantPattern || bill.name).toLowerCase();
    const paid = transactions.some(t => {
      if (t.type !== 'expense') return false;
      const d = toLocalMidnight(t.date);
      if (d < monthStart) return false;
      const hay = `${t.merchant || ''} ${t.description || ''}`.toLowerCase();
      const amountOk = t.amount >= bill.amount * 0.85;
      return (hay.includes(pat) || hay.includes(bill.name.toLowerCase())) && amountOk;
    });
    if (paid) paidThisMonth++;
  }

  return {
    liveCount: live.length,
    monthlyTotal,
    nextName: next?.sub.name,
    nextAmount: next?.sub.amount,
    nextDays,
    paidThisMonth,
  };
}

export interface ExpectedBillPreset {
  id: string;
  name: string;
  emoji: string;
  billType: SubscriptionBillType;
  category: string;
  merchantPattern: string;
  defaultDay?: number;
}

export const EXPECTED_BILL_PRESETS: ExpectedBillPreset[] = [
  { id: 'rent', name: 'Rent', emoji: '🏠', billType: 'bill', category: 'Housing', merchantPattern: 'expected-rent', defaultDay: 1 },
  { id: 'utilities', name: 'Utilities', emoji: '💡', billType: 'bill', category: 'Bills & Utilities', merchantPattern: 'expected-utilities', defaultDay: 15 },
  { id: 'car-insurance', name: 'Car Insurance', emoji: '🚗', billType: 'bill', category: 'Bills & Utilities', merchantPattern: 'expected-car-insurance', defaultDay: 1 },
  { id: 'student-loan', name: 'Student Loan', emoji: '🎓', billType: 'loan', category: 'Loan Payments', merchantPattern: 'expected-student-loan', defaultDay: 1 },
  { id: 'family-loan', name: 'Family Loan', emoji: '👨‍👩‍👧', billType: 'loan', category: 'Loan Payments', merchantPattern: 'expected-family-loan', defaultDay: 1 },
  { id: 'subscriptions', name: 'Subscriptions', emoji: '📱', billType: 'subscription', category: 'Subscriptions', merchantPattern: 'expected-subscriptions-bundle', defaultDay: 1 },
];

export function nextBillingDateForDay(dayOfMonth: number, ref = new Date()): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), Math.min(dayOfMonth, 28));
  d.setHours(0, 0, 0, 0);
  if (d < ref) d.setMonth(d.getMonth() + 1);
  return d;
}

export function findPresetBill(
  subscriptions: Subscription[],
  preset: ExpectedBillPreset,
): Subscription | undefined {
  const pat = preset.merchantPattern.toLowerCase();
  return subscriptions.find(
    s => (s.merchantPattern || '').toLowerCase() === pat || s.name.toLowerCase() === preset.name.toLowerCase(),
  );
}
