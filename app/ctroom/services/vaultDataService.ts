import { supabase } from '@/lib/supabase';
import {
  VaultAccount, VaultTransaction, BudgetCategory, DebtEntry, SavingsGoal,
  TransactionRule, Subscription, SubscriptionFrequency,
  IncomeStream, InvestmentPosition, NetWorthSnapshot, FinanceSnapshotRecord,
} from '../types/index';
import type { SnapshotData } from '@/lib/vault/financeSnapshot';

/**
 * Parse a date the way the UI expects.
 *
 * Postgres `date` columns serialize as "YYYY-MM-DD". JavaScript's `new Date("YYYY-MM-DD")`
 * interprets that as UTC midnight, which in negative-offset timezones (e.g. US/Central, UTC-5)
 * becomes the *previous calendar day* in local time. That caused the Vault's "Month" filter
 * to drop today's transactions and show "No transactions" even though they were in the DB.
 *
 * For bare YYYY-MM-DD inputs we construct a local-midnight Date so range comparisons stay
 * timezone-correct. Anything else (full ISO timestamps) parses normally.
 */
function parseDbDate(input: string | Date | null | undefined): Date {
  if (!input) return new Date(NaN);
  if (input instanceof Date) return input;
  const s = String(input);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(s);
}

export class VaultDataService {

  private static async getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  // ==================== ACCOUNTS ====================

  static async fetchAccounts(): Promise<VaultAccount[]> {
    try {
      const { data, error } = await supabase
        .from('vault_accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) return [];

      return (data || []).map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: parseFloat(a.balance),
        institution: a.institution,
        mask: a.mask,
        currency: a.currency || 'USD',
        isTellerLinked: a.is_teller_linked,
        tellerAccountId: a.teller_account_id,
        color: a.color || '#3b82f6',
        createdAt: new Date(a.created_at),
      })) as VaultAccount[];
    } catch {
      return [];
    }
  }

  static async saveAccount(account: Omit<VaultAccount, 'id' | 'createdAt'>): Promise<VaultAccount | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('vault_accounts')
        .insert([{
          user_id: userId,
          name: account.name,
          type: account.type,
          balance: account.balance,
          institution: account.institution,
          mask: account.mask,
          currency: account.currency,
          is_teller_linked: account.isTellerLinked,
          teller_account_id: account.tellerAccountId,
          color: account.color,
        }])
        .select()
        .single();

      if (error || !data) return null;
      return { ...account, id: data.id, createdAt: new Date(data.created_at) };
    } catch {
      return null;
    }
  }

  static async updateAccountBalance(id: string, balance: number): Promise<boolean> {
    const { error } = await supabase
      .from('vault_accounts')
      .update({ balance })
      .eq('id', id);
    return !error;
  }

  static async deleteAccount(id: string): Promise<boolean> {
    const { error } = await supabase.from('vault_accounts').delete().eq('id', id);
    return !error;
  }

  // ==================== TRANSACTIONS ====================

  static async fetchTransactions(limit = 50, accountId?: string): Promise<VaultTransaction[]> {
    try {
      let query = supabase
        .from('vault_transactions')
        .select('*, vault_accounts(name)')
        .order('date', { ascending: false })
        .limit(limit);

      if (accountId) query = query.eq('teller_account_id', accountId);

      const { data, error } = await query;
      if (error) {
        console.error('[VaultDataService.fetchTransactions] error:', error);
        return [];
      }

      return (data || []).map(t => ({
        id: t.id,
        accountId: t.account_id || t.teller_account_id,
        accountName: t.vault_accounts?.name,
        amount: parseFloat(t.amount),
        type: t.type,
        category: t.category,
        subcategory: t.subcategory,
        description: t.description,
        merchant: t.merchant,
        date: parseDbDate(t.date),
        isPending: t.is_pending,
        tellerTransactionId: t.teller_transaction_id,
      })) as VaultTransaction[];
    } catch (err) {
      console.error('[VaultDataService.fetchTransactions] throw:', err);
      return [];
    }
  }

  static async saveTransaction(tx: Omit<VaultTransaction, 'id'>): Promise<VaultTransaction | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('vault_transactions')
        .insert([{
          user_id: userId,
          account_id: tx.accountId,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          subcategory: tx.subcategory,
          description: tx.description,
          merchant: tx.merchant,
          date: tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : tx.date,
          is_pending: tx.isPending || false,
        }])
        .select()
        .single();

      if (error || !data) return null;
      return { ...tx, id: data.id };
    } catch {
      return null;
    }
  }

  static async updateTransaction(id: string, updates: { category?: string; description?: string }): Promise<boolean> {
    const { error } = await supabase.from('vault_transactions').update(updates).eq('id', id);
    return !error;
  }

  static async deleteTransaction(id: string): Promise<boolean> {
    const { error } = await supabase.from('vault_transactions').delete().eq('id', id);
    return !error;
  }

  // ==================== BUDGET CATEGORIES ====================

  static async fetchBudgetCategories(): Promise<BudgetCategory[]> {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .order('name');

      if (error) return [];

      return (data || []).map(c => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        monthlyLimit: parseFloat(c.monthly_limit),
        color: c.color,
        spent: 0,
      }));
    } catch {
      return [];
    }
  }

  static async saveBudgetCategory(cat: Omit<BudgetCategory, 'id' | 'spent'>): Promise<BudgetCategory | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('budget_categories')
        .insert([{
          user_id: userId,
          name: cat.name,
          emoji: cat.emoji,
          monthly_limit: cat.monthlyLimit,
          color: cat.color,
        }])
        .select()
        .single();

      if (error || !data) return null;
      return { ...cat, id: data.id, spent: 0 };
    } catch {
      return null;
    }
  }

  static async updateBudgetCategory(id: string, updates: Partial<BudgetCategory>): Promise<boolean> {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.emoji) dbUpdates.emoji = updates.emoji;
    if (updates.monthlyLimit !== undefined) dbUpdates.monthly_limit = updates.monthlyLimit;
    if (updates.color) dbUpdates.color = updates.color;
    const { error } = await supabase.from('budget_categories').update(dbUpdates).eq('id', id);
    return !error;
  }

  static async deleteBudgetCategory(id: string): Promise<boolean> {
    const { error } = await supabase.from('budget_categories').delete().eq('id', id);
    return !error;
  }

  // ==================== DEBTS ====================

  static async fetchDebts(): Promise<DebtEntry[]> {
    try {
      const { data, error } = await supabase
        .from('vault_debts')
        .select('*')
        .order('balance', { ascending: false });

      if (error) return [];

      return (data || []).map(d => ({
        id: d.id,
        name: d.name,
        balance: parseFloat(d.balance),
        originalBalance: parseFloat(d.original_balance),
        interestRate: parseFloat(d.interest_rate),
        minimumPayment: parseFloat(d.minimum_payment),
        targetDate: d.target_date ? new Date(d.target_date) : undefined,
        type: d.type,
        color: d.color,
      })) as DebtEntry[];
    } catch {
      return [];
    }
  }

  static async saveDebt(debt: Omit<DebtEntry, 'id'>): Promise<DebtEntry | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('vault_debts')
        .insert([{
          user_id: userId,
          name: debt.name,
          balance: debt.balance,
          original_balance: debt.originalBalance,
          interest_rate: debt.interestRate,
          minimum_payment: debt.minimumPayment,
          target_date: debt.targetDate?.toISOString().split('T')[0],
          type: debt.type,
          color: debt.color,
        }])
        .select()
        .single();

      if (error || !data) return null;
      return { ...debt, id: data.id };
    } catch {
      return null;
    }
  }

  static async updateDebt(id: string, updates: Partial<DebtEntry>): Promise<boolean> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.originalBalance !== undefined) dbUpdates.original_balance = updates.originalBalance;
    if (updates.interestRate !== undefined) dbUpdates.interest_rate = updates.interestRate;
    if (updates.minimumPayment !== undefined) dbUpdates.minimum_payment = updates.minimumPayment;
    if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate ? updates.targetDate.toISOString().split('T')[0] : null;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    const { error } = await supabase.from('vault_debts').update(dbUpdates).eq('id', id);
    return !error;
  }

  static async deleteDebt(id: string): Promise<boolean> {
    const { error } = await supabase.from('vault_debts').delete().eq('id', id);
    return !error;
  }

  // ==================== SAVINGS GOALS ====================

  static async fetchSavingsGoals(): Promise<SavingsGoal[]> {
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .order('created_at');

      if (error) return [];

      return (data || []).map(g => ({
        id: g.id,
        name: g.name,
        emoji: g.emoji,
        targetAmount: parseFloat(g.target_amount),
        currentAmount: parseFloat(g.current_amount),
        deadline: g.deadline ? new Date(g.deadline) : undefined,
        color: g.color,
        goalType: g.goal_type || 'save',
        linkedAccountId: g.linked_account_id,
      })) as SavingsGoal[];
    } catch {
      return [];
    }
  }

  static async saveSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('savings_goals')
        .insert([{
          user_id: userId,
          name: goal.name,
          emoji: goal.emoji,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          deadline: goal.deadline?.toISOString().split('T')[0],
          color: goal.color,
          goal_type: goal.goalType || 'save',
          linked_account_id: goal.linkedAccountId,
        }])
        .select()
        .single();

      if (error || !data) return null;
      return { ...goal, id: data.id };
    } catch {
      return null;
    }
  }

  static async updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): Promise<boolean> {
    const dbUpdates: any = {};
    if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.deadline) dbUpdates.deadline = updates.deadline.toISOString().split('T')[0];
    if (updates.goalType) dbUpdates.goal_type = updates.goalType;
    if (updates.linkedAccountId !== undefined) dbUpdates.linked_account_id = updates.linkedAccountId;
    const { error } = await supabase.from('savings_goals').update(dbUpdates).eq('id', id);
    return !error;
  }

  static async deleteSavingsGoal(id: string): Promise<boolean> {
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    return !error;
  }

  // ==================== HELPERS ====================

  static computeNetWorth(accounts: VaultAccount[]): number {
    return accounts.reduce((total, acc) => {
      if (acc.type === 'credit' || acc.type === 'loan') {
        return total - acc.balance;
      }
      return total + acc.balance;
    }, 0);
  }

  static computeMonthlySpending(transactions: VaultTransaction[]): Record<string, number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions
      .filter(t => t.type === 'expense' && parseDbDate(t.date as unknown as string) >= startOfMonth)
      .reduce((acc, t) => {
        const cat = t.category || 'Other';
        acc[cat] = (acc[cat] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
  }

  static computeTotalDebt(debts: DebtEntry[]): number {
    return debts.reduce((total, d) => total + d.balance, 0);
  }

  // ==================== TRANSACTION RULES ====================

  static async fetchRules(): Promise<TransactionRule[]> {
    try {
      const { data, error } = await supabase
        .from('transaction_rules')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) return [];
      return (data || []).map(r => ({ id: r.id, pattern: r.pattern, category: r.category }));
    } catch { return []; }
  }

  static async saveRule(pattern: string, category: string): Promise<TransactionRule | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;
      const { data, error } = await supabase
        .from('transaction_rules')
        .insert([{ user_id: userId, pattern: pattern.trim(), category }])
        .select().single();
      if (error || !data) return null;
      return { id: data.id, pattern: data.pattern, category: data.category };
    } catch { return null; }
  }

  static async deleteRule(id: string): Promise<boolean> {
    const { error } = await supabase.from('transaction_rules').delete().eq('id', id);
    return !error;
  }

  /** Apply rules to a list of transactions (client-side, does not mutate DB) */
  static applyRules(
    transactions: VaultTransaction[],
    rules: TransactionRule[]
  ): VaultTransaction[] {
    if (!rules.length) return transactions;
    return transactions.map(tx => {
      const target = (tx.merchant || tx.description || '').toLowerCase();
      const match = rules.find(r => target.includes(r.pattern.toLowerCase()));
      return match ? { ...tx, category: match.category } : tx;
    });
  }

  /** Persist rule-applied categories back to DB in bulk */
  static async applyRulesToDb(rules: TransactionRule[]): Promise<number> {
    if (!rules.length) return 0;
    const { data: txs } = await supabase
      .from('vault_transactions')
      .select('id, merchant, description, category');
    if (!txs?.length) return 0;
    let updated = 0;
    for (const tx of txs) {
      const target = (tx.merchant || tx.description || '').toLowerCase();
      const match = rules.find(r => target.includes(r.pattern.toLowerCase()));
      if (match && tx.category !== match.category) {
        await supabase.from('vault_transactions').update({ category: match.category }).eq('id', tx.id);
        updated++;
      }
    }
    return updated;
  }

  // ==================== SUBSCRIPTIONS ====================

  static async fetchSubscriptions(): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('amount', { ascending: false });
      if (error) return [];
      return (data || []).map(s => ({
        id: s.id,
        name: s.name,
        emoji: s.emoji,
        amount: parseFloat(s.amount),
        frequency: s.frequency as SubscriptionFrequency,
        category: s.category,
        color: s.color,
        isActive: s.is_active,
        nextBillingDate: s.next_billing_date ? parseDbDate(s.next_billing_date) : undefined,
        merchantPattern: s.merchant_pattern,
        autoDetected: s.auto_detected,
        notes: s.notes,
        status: s.status,
        billType: s.bill_type,
        confidence: s.confidence !== null ? Number(s.confidence) : undefined,
        chargeCount: s.charge_count !== null ? Number(s.charge_count) : undefined,
        avgIntervalDays: s.avg_interval_days !== null ? parseFloat(s.avg_interval_days) : undefined,
        lastChargeDate: s.last_charge_date ? parseDbDate(s.last_charge_date) : undefined,
        lastChargeAmount: s.last_charge_amount !== null ? parseFloat(s.last_charge_amount) : undefined,
        firstSeenDate: s.first_seen_date ? parseDbDate(s.first_seen_date) : undefined,
        cancelledAt: s.cancelled_at ? new Date(s.cancelled_at) : undefined,
      }));
    } catch { return []; }
  }

  /** HITL — confirm/dismiss/recategorize a recurring subscription. */
  static async reviewRecurring(decision: {
    pattern: string;
    decision: 'confirmed' | 'dismissed' | 'category';
    category?: string;
    billType?: string;
    notes?: string;
  }): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return false;
    const res = await fetch('/api/ctroom/vault/recurring-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(decision),
    });
    return res.ok;
  }

  /** Manual rescan trigger (also fires automatically after Teller sync). */
  static async rescanRecurring(): Promise<{ detected: number; updated: number; inserted: number; cancelled: number; pendingReview: number } | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    const res = await fetch('/api/ctroom/vault/recurring-refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return null;
    return res.json();
  }

  /**
   * Manual "expected bill" — locks immediately (no 4-charge wait).
   * Upserts subscriptions + user_overrides confirmed.
   */
  static async upsertExpectedBill(bill: {
    name: string;
    emoji: string;
    amount: number;
    frequency: Subscription['frequency'];
    category: string;
    billType: NonNullable<Subscription['billType']>;
    merchantPattern: string;
    nextBillingDate?: Date;
  }): Promise<boolean> {
    try {
      const userId = await this.getUserId();
      if (!userId) return false;
      const pattern = bill.merchantPattern.toLowerCase();
      const row = {
        user_id: userId,
        name: bill.name,
        emoji: bill.emoji,
        amount: bill.amount,
        frequency: bill.frequency,
        category: bill.category,
        bill_type: bill.billType,
        merchant_pattern: pattern,
        is_active: true,
        auto_detected: false,
        status: 'active',
        confidence: 95,
        next_billing_date: bill.nextBillingDate?.toISOString().split('T')[0] ?? null,
        color: bill.billType === 'loan' ? '#f97316' : bill.billType === 'bill' ? '#3b82f6' : '#8b5cf6',
        cancelled_at: null,
        updated_at: new Date().toISOString(),
      };
      const { error: subErr } = await supabase
        .from('subscriptions')
        .upsert(row, { onConflict: 'user_id,merchant_pattern' });
      if (subErr) {
        console.error('[upsertExpectedBill] subscription error:', subErr);
        return false;
      }
      const { error: ovErr } = await supabase
        .from('user_overrides')
        .upsert(
          {
            user_id: userId,
            merchant_pattern: pattern,
            decision: 'confirmed',
            category: bill.category,
            bill_type: bill.billType,
            notes: 'Expected bill (user-declared)',
          },
          { onConflict: 'user_id,merchant_pattern' },
        );
      if (ovErr) console.error('[upsertExpectedBill] override error:', ovErr);
      return !ovErr;
    } catch {
      return false;
    }
  }

  static async saveSubscription(sub: Omit<Subscription, 'id'>): Promise<Subscription | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: userId,
          name: sub.name,
          emoji: sub.emoji,
          amount: sub.amount,
          frequency: sub.frequency,
          category: sub.category,
          color: sub.color,
          is_active: sub.isActive,
          next_billing_date: sub.nextBillingDate?.toISOString().split('T')[0],
          merchant_pattern: sub.merchantPattern,
          auto_detected: sub.autoDetected || false,
          notes: sub.notes,
        }])
        .select().single();
      if (error || !data) return null;
      return { ...sub, id: data.id };
    } catch { return null; }
  }

  static async updateSubscription(id: string, updates: Partial<Subscription>): Promise<boolean> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.nextBillingDate !== undefined) dbUpdates.next_billing_date = updates.nextBillingDate?.toISOString().split('T')[0] ?? null;
    if (updates.merchantPattern !== undefined) dbUpdates.merchant_pattern = updates.merchantPattern;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.billType !== undefined) dbUpdates.bill_type = updates.billType;
    const { error } = await supabase.from('subscriptions').update(dbUpdates).eq('id', id);
    return !error;
  }

  static async deleteSubscription(id: string): Promise<boolean> {
    const { error } = await supabase.from('subscriptions').delete().eq('id', id);
    return !error;
  }

  // ==================== VAULT AI CHAT ====================

  static async fetchVaultChats(): Promise<{ id: string; title: string; messages: { role: string; content: string; timestamp: string }[]; model: string; updated_at: string }[]> {
    const { data } = await supabase
      .from('vault_ai_chats')
      .select('id, title, messages, model, updated_at')
      .order('updated_at', { ascending: false })
      .limit(30);
    return data || [];
  }

  static async saveVaultChat(
    id: string | null,
    messages: { role: string; content: string; timestamp: string }[],
    title: string,
    model: string,
  ): Promise<string | null> {
    if (id) {
      await supabase
        .from('vault_ai_chats')
        .update({ messages, title, model })
        .eq('id', id);
      return id;
    }
    const userId = await this.getUserId();
    if (!userId) return null;
    const { data } = await supabase
      .from('vault_ai_chats')
      .insert({ user_id: userId, messages, title, model })
      .select('id')
      .single();
    return data?.id || null;
  }

  static async deleteVaultChat(id: string): Promise<void> {
    await supabase.from('vault_ai_chats').delete().eq('id', id);
  }

  // ==================== INCOME STREAMS ====================

  static async fetchIncomeStreams(): Promise<IncomeStream[]> {
    const { data } = await supabase.from('income_streams').select('*').order('name');
    return (data || []).map(s => ({
      id: s.id,
      name: s.name,
      streamType: s.stream_type,
      sourceAccountId: s.source_account_id,
      color: s.color,
    }));
  }

  static async saveIncomeStream(stream: Omit<IncomeStream, 'id'>): Promise<IncomeStream | null> {
    const userId = await this.getUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('income_streams')
      .insert({
        user_id: userId,
        name: stream.name,
        stream_type: stream.streamType,
        source_account_id: stream.sourceAccountId,
        color: stream.color,
      })
      .select()
      .single();
    if (error || !data) return null;
    return { ...stream, id: data.id };
  }

  // ==================== INVESTMENTS ====================

  static async fetchInvestments(): Promise<InvestmentPosition[]> {
    const { data } = await supabase.from('investments').select('*').order('symbol');
    return (data || []).map(p => ({
      id: p.id,
      symbol: p.symbol,
      name: p.name,
      shares: parseFloat(p.shares),
      costBasis: parseFloat(p.cost_basis),
      currentPrice: parseFloat(p.current_price),
      positionType: p.position_type,
      accountId: p.account_id,
    }));
  }

  static async saveInvestment(pos: Omit<InvestmentPosition, 'id'>): Promise<InvestmentPosition | null> {
    const userId = await this.getUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('investments')
      .insert({
        user_id: userId,
        symbol: pos.symbol,
        name: pos.name,
        shares: pos.shares,
        cost_basis: pos.costBasis,
        current_price: pos.currentPrice,
        position_type: pos.positionType,
        account_id: pos.accountId,
      })
      .select()
      .single();
    if (error || !data) return null;
    return { ...pos, id: data.id };
  }

  static async updateInvestment(id: string, updates: Partial<InvestmentPosition>): Promise<boolean> {
    const db: Record<string, unknown> = {};
    if (updates.shares !== undefined) db.shares = updates.shares;
    if (updates.costBasis !== undefined) db.cost_basis = updates.costBasis;
    if (updates.currentPrice !== undefined) db.current_price = updates.currentPrice;
    if (updates.name !== undefined) db.name = updates.name;
    const { error } = await supabase.from('investments').update(db).eq('id', id);
    return !error;
  }

  static async deleteInvestment(id: string): Promise<boolean> {
    const { error } = await supabase.from('investments').delete().eq('id', id);
    return !error;
  }

  // ==================== FINANCE SNAPSHOTS ====================

  static async fetchFinanceSnapshots(): Promise<FinanceSnapshotRecord[]> {
    try {
      const { data, error } = await supabase
        .from('vault_finance_snapshots')
        .select('id, month, data, created_at')
        .order('created_at', { ascending: false })
        .limit(24);

      if (error) return [];

      return (data || []).map(row => ({
        id: row.id,
        month: row.month,
        createdAt: row.created_at,
        data: row.data as SnapshotData,
      }));
    } catch {
      return [];
    }
  }

  static async saveFinanceSnapshot(snapshot: SnapshotData): Promise<FinanceSnapshotRecord | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('vault_finance_snapshots')
        .insert({
          user_id: userId,
          month: snapshot.monthKey,
          data: snapshot,
        })
        .select('id, month, data, created_at')
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        month: data.month,
        createdAt: data.created_at,
        data: data.data as SnapshotData,
      };
    } catch {
      return null;
    }
  }

  static async deleteFinanceSnapshot(id: string): Promise<boolean> {
    const { error } = await supabase.from('vault_finance_snapshots').delete().eq('id', id);
    return !error;
  }

  // ==================== NET WORTH SNAPSHOTS ====================

  static async fetchNetWorthSnapshots(): Promise<NetWorthSnapshot[]> {
    const { data } = await supabase
      .from('vault_net_worth_snapshots')
      .select('snapshot_date, net_worth, cash, debt, investments')
      .order('snapshot_date', { ascending: true })
      .limit(365);
    return (data || []).map(s => ({
      snapshotDate: s.snapshot_date,
      netWorth: parseFloat(s.net_worth),
      cash: parseFloat(s.cash),
      debt: parseFloat(s.debt),
      investments: parseFloat(s.investments),
    }));
  }

  static async fetchRothIra(): Promise<{ contributed: number; limit: number; year: number } | null> {
    const userId = await this.getUserId();
    if (!userId) return null;
    const { data } = await supabase.from('roth_ira_contributions').select('*').eq('user_id', userId).maybeSingle();
    if (!data) return { contributed: 0, limit: 7000, year: new Date().getFullYear() };
    return {
      contributed: parseFloat(data.contributed),
      limit: parseFloat(data.annual_limit),
      year: data.tax_year,
    };
  }

  static async saveRothIra(contributed: number, limit?: number): Promise<boolean> {
    const userId = await this.getUserId();
    if (!userId) return false;
    const year = new Date().getFullYear();
    const { error } = await supabase.from('roth_ira_contributions').upsert({
      user_id: userId,
      tax_year: year,
      contributed,
      annual_limit: limit ?? 7000,
      updated_at: new Date().toISOString(),
    });
    return !error;
  }
}
