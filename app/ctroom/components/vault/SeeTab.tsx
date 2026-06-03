'use client';

import type {
  SavingsGoal,
  Subscription,
  VaultAccount,
  VaultTransaction,
} from '../../types/index';
import { ApartmentGoalCard } from './ApartmentGoalCard';
import { TriageInbox } from './TriageInbox';
import { MonthlySnapshot } from './MonthlySnapshot';
import { BillsStatusLine } from './BillsStatusLine';
import { CashFlowSummary } from './CashFlowSummary';
import {
  computeBillsStatus,
  computeCommittedMonthly,
  computeMonthlyIncome,
} from '@/lib/vault/bills';

export function SeeTab({
  transactions,
  allTransactions,
  subscriptions,
  accounts,
  goals,
  onUpdateCategory,
  onReviewed,
  onGoalsSaved,
}: {
  transactions: VaultTransaction[];
  allTransactions: VaultTransaction[];
  subscriptions: Subscription[];
  accounts: VaultAccount[];
  goals: SavingsGoal[];
  onUpdateCategory: (id: string, category: string) => void;
  onReviewed: () => void;
  onGoalsSaved: () => void;
}) {
  const income = computeMonthlyIncome(allTransactions);
  const committed = computeCommittedMonthly(subscriptions);
  const billsStatus = computeBillsStatus(subscriptions, allTransactions);

  return (
    <div className="space-y-5 max-w-3xl">
      <TriageInbox
        transactions={allTransactions}
        subscriptions={subscriptions}
        onUpdateCategory={onUpdateCategory}
        onReviewed={onReviewed}
      />

      <MonthlySnapshot
        income={income.total}
        committed={committed}
        incomeNote={income.note}
        paycheckCount={income.paycheckCount}
      />

      <BillsStatusLine status={billsStatus} />

      <p className="text-xs text-stone-600 px-1 rounded-xl py-3 bg-stone-900/30 border border-stone-800/50 text-center">
        Set rent, utilities, and loan targets in{' '}
        <span className="text-stone-400 font-medium">Plan → Assign</span> — they sync to Bills automatically.
      </p>

      <ApartmentGoalCard goals={goals} onSaved={onGoalsSaved} />

      <CashFlowSummary
        accounts={accounts}
        transactions={transactions}
        subscriptions={subscriptions}
      />
    </div>
  );
}
