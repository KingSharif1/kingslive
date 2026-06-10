'use client';

import { useMemo, useState } from 'react';
import { FileBarChart } from 'lucide-react';
import type {
  BudgetCategory,
  DebtEntry,
  SavingsGoal,
  Subscription,
  VaultAccount,
  VaultTransaction,
} from '../../types/index';
import { ApartmentGoalCard } from './ApartmentGoalCard';
import { TriageInbox } from './TriageInbox';
import { FinanceSnapshotCard } from './FinanceSnapshotCard';
import { HealthCheckCard } from './HealthCheckCard';
import { BillsStatusLine } from './BillsStatusLine';
import { CashFlowSummary } from './CashFlowSummary';
import { SnapshotReportModal } from './SnapshotReportModal';
import { SnapshotHistory } from './SnapshotHistory';
import { VaultDataService } from '../../services/vaultDataService';
import { computeBillsStatus } from '@/lib/vault/bills';
import { buildFinanceSnapshot } from '@/lib/vault/financeSnapshot';

export function SeeTab({
  transactions,
  allTransactions,
  subscriptions,
  accounts,
  goals,
  debts,
  budgets,
  onUpdateCategory,
  onReviewed,
  onGoalsSaved,
  onSnapshotSaved,
}: {
  transactions: VaultTransaction[];
  allTransactions: VaultTransaction[];
  subscriptions: Subscription[];
  accounts: VaultAccount[];
  goals: SavingsGoal[];
  debts: DebtEntry[];
  budgets: BudgetCategory[];
  onUpdateCategory: (id: string, category: string) => void;
  onReviewed: () => void;
  onGoalsSaved: () => void;
  onSnapshotSaved?: () => void;
}) {
  const [showReport, setShowReport] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  const snapshot = useMemo(
    () =>
      buildFinanceSnapshot(
        allTransactions,
        debts,
        goals,
        subscriptions,
        accounts,
        budgets,
      ),
    [allTransactions, debts, goals, subscriptions, accounts, budgets],
  );

  const billsStatus = computeBillsStatus(subscriptions, allTransactions);

  const handleSaveSnapshot = async () => {
    const saved = await VaultDataService.saveFinanceSnapshot(snapshot);
    if (saved) {
      setHistoryKey(k => k + 1);
      onSnapshotSaved?.();
    } else {
      throw new Error('save failed');
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-stone-600">Your money at a glance — like your finance sheet dashboard.</p>
        <button
          type="button"
          onClick={() => setShowReport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-800/80 text-stone-300 hover:text-white shrink-0"
        >
          <FileBarChart className="w-3.5 h-3.5" />
          Snapshot / Report
        </button>
      </div>

      <FinanceSnapshotCard snapshot={snapshot} />
      <HealthCheckCard metrics={snapshot.health} healthScore={snapshot.healthScore} />

      <TriageInbox
        transactions={allTransactions}
        subscriptions={subscriptions}
        onUpdateCategory={onUpdateCategory}
        onReviewed={onReviewed}
      />

      <BillsStatusLine status={billsStatus} />

      <p className="text-xs text-stone-600 px-1 rounded-xl py-3 bg-stone-900/30 border border-stone-800/50 text-center">
        Set rent, utilities, and loan targets in{' '}
        <span className="text-stone-400 font-medium">Plan → Assign</span> — they sync to Bills automatically.
      </p>

      <ApartmentGoalCard goals={goals} onSaved={onGoalsSaved} />

      <SnapshotHistory key={historyKey} />

      <CashFlowSummary
        accounts={accounts}
        transactions={transactions}
        subscriptions={subscriptions}
      />

      {showReport && (
        <SnapshotReportModal
          snapshot={snapshot}
          onClose={() => setShowReport(false)}
          onSave={handleSaveSnapshot}
        />
      )}
    </div>
  );
}
