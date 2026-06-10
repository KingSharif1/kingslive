import type {
  BudgetCategory,
  DebtEntry,
  SavingsGoal,
  Subscription,
  VaultAccount,
  VaultTransaction,
} from '@/app/ctroom/types/index';
import { getLiveBills, toMonthly } from '@/lib/vault/bills';
import { isBillCategory, isRealExpense, txsInMonth } from '@/lib/vault/spendingInsights';

export type HealthStatus = 'good' | 'warn' | 'bad';

export interface SnapshotBucket {
  key: string;
  label: string;
  amount: number;
  pctOfIncome: number;
}

export interface HealthMetric {
  key: string;
  label: string;
  current: number;
  currentLabel: string;
  targetLabel: string;
  status: HealthStatus;
  detail?: string;
}

export interface NeedsWantsSavings {
  needs: number;
  wants: number;
  savings: number;
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
}

export interface SnapshotData {
  monthKey: string;
  monthLabel: string;
  generatedAt: string;
  income: number;
  buckets: SnapshotBucket[];
  netRemaining: number;
  netRemainingPct: number;
  health: HealthMetric[];
  needsWantsSavings: NeedsWantsSavings;
  healthScore: number;
  healthBreakdown: { label: string; pts: number; max: number; note: string }[];
  debtTotal: number;
  goalProgressPct: number;
}

function pctOf(income: number, amount: number): number {
  if (income <= 0) return 0;
  return Math.round((amount / income) * 1000) / 10;
}

function isSubscriptionCategory(cat: string | undefined): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase();
  return c.includes('subscription') || c === 'entertainment';
}

function isDebtPaymentCategory(cat: string | undefined): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase();
  return c.includes('loan') || c.includes('credit card');
}

function isFixedCategory(cat: string | undefined): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase();
  return (
    isBillCategory(cat) ||
    c.includes('insurance') ||
    c === 'housing' ||
    c.includes('rent')
  );
}

function isVariableCategory(cat: string | undefined): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase();
  return (
    c.includes('grocery') ||
    c.includes('food') ||
    c.includes('transport') ||
    c.includes('gas') ||
    c.includes('shopping') ||
    c === 'uncategorized'
  );
}

function liquidCash(accounts: VaultAccount[]): number {
  return accounts
    .filter(a => a.type === 'checking' || a.type === 'savings' || a.type === 'cash')
    .reduce((s, a) => s + Math.max(0, a.balance), 0);
}

function monthlyEssentials(fixed: number, debtPayments: number, variable: number): number {
  return fixed + debtPayments + variable * 0.5;
}

function healthStatusForEmergency(months: number): HealthStatus {
  if (months >= 3) return 'good';
  if (months >= 1) return 'warn';
  return 'bad';
}

function healthStatusForDti(dti: number): HealthStatus {
  if (dti < 0.2) return 'good';
  if (dti <= 0.36) return 'warn';
  return 'bad';
}

function healthStatusForSavings(rate: number): HealthStatus {
  if (rate >= 0.2) return 'good';
  if (rate >= 0.1) return 'warn';
  return 'bad';
}

function healthStatusFor503020(needs: number, wants: number, savings: number): HealthStatus {
  const diff =
    Math.abs(needs - 50) + Math.abs(wants - 30) + Math.abs(savings - 20);
  if (diff <= 15) return 'good';
  if (diff <= 30) return 'warn';
  return 'bad';
}

export function computeHealthScoreFromSnapshot(
  income: number,
  expenses: number,
  budgets: BudgetCategory[],
  debts: DebtEntry[],
  goals: SavingsGoal[],
): { score: number; breakdown: { label: string; pts: number; max: number; note: string }[] } {
  const savingsRate = income > 0 ? (income - expenses) / income : 0;
  const savingsPts = Math.round(Math.min(30, Math.max(0, savingsRate * 150)));

  const budgetPts =
    budgets.length === 0
      ? 12
      : Math.round(
          (budgets.filter(b => (b.spent || 0) <= b.monthlyLimit).length / budgets.length) * 25,
        );

  const totalDebtBal = debts.reduce((s, d) => s + d.balance, 0);
  const annualIncome = income * 12;
  const dti = annualIncome > 0 ? totalDebtBal / annualIncome : totalDebtBal > 0 ? 1 : 0;
  const debtPts = debts.length === 0 ? 25 : Math.round(Math.max(0, 25 - dti * 25));

  const goalPts =
    goals.length === 0
      ? 10
      : Math.round(
          (goals.reduce(
            (s, g) => s + Math.min(1, g.currentAmount / (g.targetAmount || 1)),
            0,
          ) /
            goals.length) *
            20,
        );

  const score = Math.min(100, savingsPts + budgetPts + debtPts + goalPts);
  return {
    score,
    breakdown: [
      {
        label: 'Savings Rate',
        pts: savingsPts,
        max: 30,
        note: income > 0 ? `${Math.round(savingsRate * 100)}% saved this month` : 'No income data',
      },
      {
        label: 'Budget Health',
        pts: budgetPts,
        max: 25,
        note:
          budgets.length > 0
            ? `${budgets.filter(b => (b.spent || 0) <= b.monthlyLimit).length}/${budgets.length} on track`
            : 'No budgets set',
      },
      {
        label: 'Debt Load',
        pts: debtPts,
        max: 25,
        note: debts.length > 0 ? `DTI: ${Math.round(dti * 100)}%` : 'No debts tracked',
      },
      {
        label: 'Goal Progress',
        pts: goalPts,
        max: 20,
        note:
          goals.length > 0
            ? `${goals.filter(g => g.currentAmount >= g.targetAmount).length}/${goals.length} complete`
            : 'No goals set',
      },
    ],
  };
}

export function buildFinanceSnapshot(
  transactions: VaultTransaction[],
  debts: DebtEntry[],
  goals: SavingsGoal[],
  subscriptions: Subscription[],
  accounts: VaultAccount[],
  budgets: BudgetCategory[] = [],
  ref = new Date(),
): SnapshotData {
  const monthTxs = txsInMonth(transactions, ref, 0);
  const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const subMonthlyCommitted = getLiveBills(subscriptions)
    .filter(s => s.billType === 'subscription')
    .reduce((s, sub) => s + toMonthly(sub.amount, sub.frequency), 0);

  let fixed = 0;
  let variable = 0;
  let subscriptionsSpend = 0;
  let debtPayments = 0;
  let savings = 0;

  for (const tx of monthTxs) {
    if (tx.type === 'transfer') {
      const toSavings = accounts.some(
        a =>
          (a.type === 'savings' || a.type === 'investment') &&
          tx.description?.toLowerCase().includes(a.name.toLowerCase()),
      );
      if (toSavings) savings += tx.amount;
      continue;
    }

    if (tx.type === 'income') continue;
    if (!isRealExpense(tx)) continue;

    const cat = tx.category || 'Uncategorized';

    if (isDebtPaymentCategory(cat)) {
      debtPayments += tx.amount;
    } else if (isSubscriptionCategory(cat)) {
      subscriptionsSpend += tx.amount;
    } else if (isFixedCategory(cat)) {
      fixed += tx.amount;
    } else if (isVariableCategory(cat)) {
      variable += tx.amount;
    } else {
      variable += tx.amount;
    }
  }

  if (subscriptionsSpend === 0 && subMonthlyCommitted > 0) {
    subscriptionsSpend = subMonthlyCommitted;
  }

  const debtMinMonthly = debts.reduce((s, d) => s + (d.minimumPayment || 0), 0);
  if (debtPayments === 0 && debtMinMonthly > 0) {
    debtPayments = debtMinMonthly;
  }

  const goalContributions = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);
  if (savings === 0 && goalContributions > 0) {
    savings = Math.min(goalContributions, income * 0.5);
  }

  const totalOut = fixed + variable + subscriptionsSpend + debtPayments + savings;
  const netRemaining = income - totalOut;

  const buckets: SnapshotBucket[] = [
    { key: 'income', label: 'Total Monthly Income', amount: income, pctOfIncome: 100 },
    { key: 'fixed', label: 'Total Fixed Expenses', amount: fixed, pctOfIncome: pctOf(income, fixed) },
    {
      key: 'variable',
      label: 'Total Variable Expenses',
      amount: variable,
      pctOfIncome: pctOf(income, variable),
    },
    {
      key: 'subscriptions',
      label: 'Total Subscriptions',
      amount: subscriptionsSpend,
      pctOfIncome: pctOf(income, subscriptionsSpend),
    },
    {
      key: 'debt',
      label: 'Total Debt Payments',
      amount: debtPayments,
      pctOfIncome: pctOf(income, debtPayments),
    },
    {
      key: 'savings',
      label: 'Total Savings / Investing',
      amount: savings,
      pctOfIncome: pctOf(income, savings),
    },
  ];

  const cash = liquidCash(accounts);
  const essentials = monthlyEssentials(fixed, debtPayments, variable);
  const emergencyMonths = essentials > 0 ? cash / essentials : 0;
  const dti = income > 0 ? debtPayments / income : 0;
  const savingsRate = income > 0 ? savings / income : 0;

  const needsAmount = fixed + debtPayments;
  const wantsAmount = variable + subscriptionsSpend;
  const savingsAmount = Math.max(0, netRemaining) + savings;
  const classified = needsAmount + wantsAmount + savingsAmount;
  const needsPct = classified > 0 ? Math.round((needsAmount / classified) * 100) : 0;
  const wantsPct = classified > 0 ? Math.round((wantsAmount / classified) * 100) : 0;
  const savingsPct = classified > 0 ? Math.round((savingsAmount / classified) * 100) : 0;

  const health: HealthMetric[] = [
    {
      key: 'emergency',
      label: 'Emergency Fund',
      current: emergencyMonths,
      currentLabel: `${emergencyMonths.toFixed(1)} mo`,
      targetLabel: '3–6 months',
      status: healthStatusForEmergency(emergencyMonths),
      detail: `Liquid cash ${cash.toFixed(0)} ÷ essentials ~${essentials.toFixed(0)}/mo`,
    },
    {
      key: 'dti',
      label: 'Debt-to-Income',
      current: dti,
      currentLabel: `${Math.round(dti * 1000) / 10}%`,
      targetLabel: '< 20%',
      status: healthStatusForDti(dti),
    },
    {
      key: 'savingsRate',
      label: 'Savings Rate',
      current: savingsRate,
      currentLabel: `${Math.round(savingsRate * 1000) / 10}%`,
      targetLabel: '> 20%',
      status: healthStatusForSavings(savingsRate),
    },
    {
      key: '503020',
      label: 'Needs / Wants / Savings',
      current: 0,
      currentLabel: `${needsPct}% / ${wantsPct}% / ${savingsPct}%`,
      targetLabel: '50% / 30% / 20%',
      status: healthStatusFor503020(needsPct, wantsPct, savingsPct),
    },
  ];

  const expenses = monthTxs.filter(isRealExpense).reduce((s, t) => s + t.amount, 0);
  const { score, breakdown } = computeHealthScoreFromSnapshot(
    income,
    expenses,
    budgets,
    debts,
    goals,
  );

  const debtTotal = debts.reduce((s, d) => s + d.balance, 0);
  const goalProgressPct =
    goals.length > 0
      ? Math.round(
          (goals.reduce(
            (s, g) => s + Math.min(100, (g.currentAmount / (g.targetAmount || 1)) * 100),
            0,
          ) /
            goals.length) *
            10,
        ) / 10
      : 0;

  return {
    monthKey: `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`,
    monthLabel: ref.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    generatedAt: new Date().toISOString(),
    income,
    buckets,
    netRemaining,
    netRemainingPct: pctOf(income, netRemaining),
    health,
    needsWantsSavings: {
      needs: needsAmount,
      wants: wantsAmount,
      savings: savingsAmount,
      needsPct,
      wantsPct,
      savingsPct,
    },
    healthScore: score,
    healthBreakdown: breakdown,
    debtTotal,
    goalProgressPct,
  };
}

export function getMonthKeyFromDate(ref: Date): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`;
}

export function parseMonthKey(key: string): Date {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1);
}
