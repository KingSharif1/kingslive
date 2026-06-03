'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VaultDataService } from '../services/vaultDataService';
import type {
  BudgetCategory,
  DebtEntry,
  SavingsGoal,
  Subscription,
  TransactionRule,
  VaultAccount,
  VaultTransaction,
} from '../types/index';

/* ──────────────────────────────────────────────────────────────────────────
   Query keys — single source of truth so invalidation is consistent.
   Use vaultKeys.all to nuke every vault query at once after a sync.
   ────────────────────────────────────────────────────────────────────────── */
export const vaultKeys = {
  all: ['vault'] as const,
  accounts: () => [...vaultKeys.all, 'accounts'] as const,
  transactions: (limit: number) => [...vaultKeys.all, 'transactions', limit] as const,
  budgets: () => [...vaultKeys.all, 'budgets'] as const,
  debts: () => [...vaultKeys.all, 'debts'] as const,
  goals: () => [...vaultKeys.all, 'goals'] as const,
  rules: () => [...vaultKeys.all, 'rules'] as const,
  subscriptions: () => [...vaultKeys.all, 'subscriptions'] as const,
  incomeStreams: () => [...vaultKeys.all, 'income-streams'] as const,
  snapshots: () => [...vaultKeys.all, 'snapshots'] as const,
  investments: () => [...vaultKeys.all, 'investments'] as const,
  rothIra: () => [...vaultKeys.all, 'roth-ira'] as const,
};

/* ──────────────────────────────────────────────────────────────────────────
   Reads
   ────────────────────────────────────────────────────────────────────────── */

export function useVaultAccounts() {
  return useQuery({
    queryKey: vaultKeys.accounts(),
    queryFn: () => VaultDataService.fetchAccounts(),
  });
}

export function useVaultTransactions(limit = 500) {
  return useQuery({
    queryKey: vaultKeys.transactions(limit),
    queryFn: () => VaultDataService.fetchTransactions(limit),
  });
}

export function useBudgetCategories() {
  return useQuery({
    queryKey: vaultKeys.budgets(),
    queryFn: () => VaultDataService.fetchBudgetCategories(),
  });
}

export function useDebts() {
  return useQuery({
    queryKey: vaultKeys.debts(),
    queryFn: () => VaultDataService.fetchDebts(),
  });
}

export function useSavingsGoals() {
  return useQuery({
    queryKey: vaultKeys.goals(),
    queryFn: () => VaultDataService.fetchSavingsGoals(),
  });
}

export function useTransactionRules() {
  return useQuery({
    queryKey: vaultKeys.rules(),
    queryFn: () => VaultDataService.fetchRules(),
  });
}

export function useSubscriptions() {
  return useQuery({
    queryKey: vaultKeys.subscriptions(),
    queryFn: () => VaultDataService.fetchSubscriptions(),
  });
}

export function useIncomeStreams() {
  return useQuery({
    queryKey: vaultKeys.incomeStreams(),
    queryFn: () => VaultDataService.fetchIncomeStreams(),
    staleTime: 5 * 60_000,
  });
}

export function useNetWorthSnapshots() {
  return useQuery({
    queryKey: vaultKeys.snapshots(),
    queryFn: () => VaultDataService.fetchNetWorthSnapshots(),
    staleTime: 5 * 60_000,
  });
}

export function useInvestments() {
  return useQuery({
    queryKey: vaultKeys.investments(),
    queryFn: () => VaultDataService.fetchInvestments(),
    staleTime: 2 * 60_000,
  });
}

export function useRothIra() {
  return useQuery({
    queryKey: vaultKeys.rothIra(),
    queryFn: () => VaultDataService.fetchRothIra(),
    staleTime: 10 * 60_000,
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Cache helpers — used by VaultView to refresh on sync.
   ────────────────────────────────────────────────────────────────────────── */
export function useVaultCache() {
  const qc = useQueryClient();
  return {
    invalidateAll: () => qc.invalidateQueries({ queryKey: vaultKeys.all }),
    invalidateTransactions: () =>
      qc.invalidateQueries({ queryKey: [...vaultKeys.all, 'transactions'] }),
    invalidateAccounts: () => qc.invalidateQueries({ queryKey: vaultKeys.accounts() }),
    invalidateSubscriptions: () =>
      qc.invalidateQueries({ queryKey: vaultKeys.subscriptions() }),
    invalidateSnapshots: () => qc.invalidateQueries({ queryKey: vaultKeys.snapshots() }),
    /** Optimistically patch one transaction in the cached list (any limit). */
    patchTransaction: (id: string, patch: Partial<VaultTransaction>) => {
      qc.getQueriesData<VaultTransaction[]>({
        queryKey: [...vaultKeys.all, 'transactions'],
      }).forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<VaultTransaction[]>(key, data.map(t => (t.id === id ? { ...t, ...patch } : t)));
      });
    },
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Mutations — short, generic; invalidate the matching list on success.
   ────────────────────────────────────────────────────────────────────────── */

export function useDeleteAccount() {
  const { invalidateAccounts } = useVaultCache();
  return useMutation({
    mutationFn: (id: string) => VaultDataService.deleteAccount(id),
    onSuccess: () => invalidateAccounts(),
  });
}

export function useSaveAccount() {
  const { invalidateAccounts } = useVaultCache();
  return useMutation({
    mutationFn: (a: Omit<VaultAccount, 'id' | 'createdAt'>) => VaultDataService.saveAccount(a),
    onSuccess: () => invalidateAccounts(),
  });
}

export function useDeleteTransaction() {
  const { invalidateTransactions } = useVaultCache();
  return useMutation({
    mutationFn: (id: string) => VaultDataService.deleteTransaction(id),
    onSuccess: () => invalidateTransactions(),
  });
}

export function useSaveTransaction() {
  const { invalidateTransactions } = useVaultCache();
  return useMutation({
    mutationFn: (tx: Omit<VaultTransaction, 'id'>) => VaultDataService.saveTransaction(tx),
    onSuccess: () => invalidateTransactions(),
  });
}

/** Optimistic category update — patches cache before the network round-trip. */
export function useUpdateTransactionCategory() {
  const qc = useQueryClient();
  const { patchTransaction } = useVaultCache();
  return useMutation({
    mutationFn: ({ id, category }: { id: string; category: string }) =>
      VaultDataService.updateTransaction(id, { category }),
    onMutate: async ({ id, category }) => {
      await qc.cancelQueries({ queryKey: [...vaultKeys.all, 'transactions'] });
      patchTransaction(id, { category });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: [...vaultKeys.all, 'transactions'] }),
  });
}

export function useSaveBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: Omit<BudgetCategory, 'id' | 'spent'>) =>
      VaultDataService.saveBudgetCategory(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.budgets() }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BudgetCategory> }) =>
      VaultDataService.updateBudgetCategory(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.budgets() }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => VaultDataService.deleteBudgetCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.budgets() }),
  });
}

export function useSaveDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Omit<DebtEntry, 'id'>) => VaultDataService.saveDebt(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.debts() }),
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DebtEntry> }) =>
      VaultDataService.updateDebt(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.debts() }),
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => VaultDataService.deleteDebt(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.debts() }),
  });
}

export function useSaveGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (g: Omit<SavingsGoal, 'id'>) => VaultDataService.saveSavingsGoal(g),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.goals() }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SavingsGoal> }) =>
      VaultDataService.updateSavingsGoal(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.goals() }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => VaultDataService.deleteSavingsGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.goals() }),
  });
}

export function useSaveRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pattern, category }: { pattern: string; category: string }) =>
      VaultDataService.saveRule(pattern, category),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.rules() }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => VaultDataService.deleteRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.rules() }),
  });
}

export function useSaveSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: Omit<Subscription, 'id'>) => VaultDataService.saveSubscription(s),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.subscriptions() }),
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Subscription> }) =>
      VaultDataService.updateSubscription(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.subscriptions() }),
  });
}

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => VaultDataService.deleteSubscription(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vaultKeys.subscriptions() }),
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Aggregate hook — bundles every vault query so VaultView gets one tidy
   object back. Memoization is intentionally minimal; React Query already
   guarantees stable references for unchanged data.
   ────────────────────────────────────────────────────────────────────────── */
export function useVaultData(transactionLimit = 500) {
  const accounts = useVaultAccounts();
  const transactions = useVaultTransactions(transactionLimit);
  const budgets = useBudgetCategories();
  const debts = useDebts();
  const goals = useSavingsGoals();
  const rules = useTransactionRules();
  const subscriptions = useSubscriptions();
  const incomeStreams = useIncomeStreams();
  const snapshots = useNetWorthSnapshots();

  const isLoading =
    accounts.isLoading ||
    transactions.isLoading ||
    budgets.isLoading ||
    debts.isLoading ||
    goals.isLoading ||
    rules.isLoading ||
    subscriptions.isLoading ||
    incomeStreams.isLoading ||
    snapshots.isLoading;

  const isFetching =
    accounts.isFetching ||
    transactions.isFetching ||
    budgets.isFetching ||
    debts.isFetching ||
    goals.isFetching ||
    rules.isFetching ||
    subscriptions.isFetching ||
    incomeStreams.isFetching ||
    snapshots.isFetching;

  // Apply user-defined transaction rules on the client (matches loadAll behavior).
  const rawTxs = transactions.data ?? [];
  const ruleList: TransactionRule[] = rules.data ?? [];
  const transactionsWithRules =
    ruleList.length > 0 ? VaultDataService.applyRules(rawTxs, ruleList) : rawTxs;

  // Compute monthly spending + map onto budgets to populate `spent`.
  const budgetList: BudgetCategory[] = budgets.data ?? [];
  let budgetsWithSpent = budgetList;
  if (budgetList.length > 0 && transactionsWithRules.length > 0) {
    const spending = VaultDataService.computeMonthlySpending(transactionsWithRules);
    const spendingLower = Object.fromEntries(
      Object.entries(spending).map(([k, v]) => [k.toLowerCase().replace(/[_\s]+/g, ''), v]),
    );
    budgetsWithSpent = budgetList.map(b => ({
      ...b,
      spent: spendingLower[b.name.toLowerCase().replace(/[_\s]+/g, '')] || 0,
    }));
  }

  return {
    accounts: accounts.data ?? [],
    transactions: transactionsWithRules,
    rawTransactions: rawTxs,
    budgets: budgetsWithSpent,
    debts: debts.data ?? [],
    goals: goals.data ?? [],
    rules: ruleList,
    subscriptions: subscriptions.data ?? [],
    incomeStreams: incomeStreams.data ?? [],
    netWorthHistory: snapshots.data ?? [],
    isLoading,
    isFetching,
  };
}
