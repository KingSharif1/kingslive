import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

function debtPayoffMonths(balance: number, rate: number, payment: number): number | null {
  if (balance <= 0 || payment <= 0) return 0;
  const monthlyRate = rate / 100 / 12;
  if (monthlyRate === 0) return Math.ceil(balance / payment);
  let b = balance;
  let months = 0;
  while (b > 0 && months < 600) {
    b = b * (1 + monthlyRate) - payment;
    months++;
  }
  return months <= 600 ? months : null;
}

export function createAdvisorTools(supabase: SupabaseClient, userId: string) {
  return {
    getNetWorth: tool({
      description: 'Get current net worth breakdown',
      inputSchema: z.object({}),
      execute: async () => {
        const [{ data: accounts }, { data: debts }, { data: investments }] = await Promise.all([
          supabase.from('vault_accounts').select('name, type, balance').eq('user_id', userId),
          supabase.from('vault_debts').select('balance').eq('user_id', userId),
          supabase.from('investments').select('shares, current_price').eq('user_id', userId),
        ]);
        let cash = 0;
        let debt = 0;
        for (const a of accounts || []) {
          const bal = parseFloat(String(a.balance));
          if (a.type === 'credit' || a.type === 'loan') debt += bal;
          else cash += bal;
        }
        for (const d of debts || []) debt += parseFloat(String(d.balance));
        const invest = (investments || []).reduce(
          (s, p) => s + parseFloat(String(p.shares)) * parseFloat(String(p.current_price)),
          0,
        );
        return { cash, debt, investments: invest, netWorth: cash + invest - debt };
      },
    }),

    getMonthlySpend: tool({
      description: 'Get spending by category for current month, optionally filter one category',
      inputSchema: z.object({ category: z.string().optional() }),
      execute: async ({ category }) => {
        const start = new Date();
        start.setDate(1);
        const { data: txs } = await supabase
          .from('vault_transactions')
          .select('amount, category, type, date')
          .eq('user_id', userId)
          .gte('date', start.toISOString().split('T')[0]);
        const byCat: Record<string, number> = {};
        for (const t of txs || []) {
          if (t.type !== 'expense') continue;
          const cat = t.category || 'Other';
          if (category && !cat.toLowerCase().includes(category.toLowerCase())) continue;
          byCat[cat] = (byCat[cat] || 0) + parseFloat(t.amount);
        }
        return { byCategory: byCat, total: Object.values(byCat).reduce((s, v) => s + v, 0) };
      },
    }),

    getRecentTransactions: tool({
      description: 'List recent transactions',
      inputSchema: z.object({
        limit: z.number().min(1).max(50).default(15),
        type: z.enum(['income', 'expense', 'transfer', 'all']).default('all'),
      }),
      execute: async ({ limit, type }) => {
        let q = supabase
          .from('vault_transactions')
          .select('date, description, merchant, amount, type, category')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(limit);
        if (type !== 'all') q = q.eq('type', type);
        const { data } = await q;
        return { transactions: data || [] };
      },
    }),

    projectDebtPayoff: tool({
      description: 'Project months to pay off a debt with optional extra monthly payment',
      inputSchema: z.object({
        debtId: z.string(),
        extraMonthlyPayment: z.number().min(0).default(0),
      }),
      execute: async ({ debtId, extraMonthlyPayment }) => {
        const { data: debt } = await supabase
          .from('vault_debts')
          .select('name, balance, interest_rate, minimum_payment')
          .eq('id', debtId)
          .eq('user_id', userId)
          .single();
        if (!debt) return { error: 'Debt not found' };
        const balance = parseFloat(debt.balance);
        const rate = parseFloat(debt.interest_rate);
        const payment = parseFloat(debt.minimum_payment) + extraMonthlyPayment;
        const months = debtPayoffMonths(balance, rate, payment);
        const baseline = debtPayoffMonths(balance, rate, parseFloat(debt.minimum_payment));
        return {
          debtName: debt.name,
          balance,
          payment,
          monthsToPayoff: months,
          monthsAtMinimumOnly: baseline,
          monthsSaved: baseline && months ? baseline - months : null,
        };
      },
    }),

    simulateBudget: tool({
      description: 'Simulate a budget category limit change vs current month spend',
      inputSchema: z.object({
        categoryName: z.string(),
        newMonthlyLimit: z.number().positive(),
      }),
      execute: async ({ categoryName, newMonthlyLimit }) => {
        const start = new Date();
        start.setDate(1);
        const { data: txs } = await supabase
          .from('vault_transactions')
          .select('amount, category, type')
          .eq('user_id', userId)
          .gte('date', start.toISOString().split('T')[0]);
        const spent = (txs || [])
          .filter(t => t.type === 'expense' && (t.category || '').toLowerCase() === categoryName.toLowerCase())
          .reduce((s, t) => s + parseFloat(t.amount), 0);
        return {
          categoryName,
          spentThisMonth: spent,
          newLimit: newMonthlyLimit,
          remaining: newMonthlyLimit - spent,
          overBy: spent > newMonthlyLimit ? spent - newMonthlyLimit : 0,
        };
      },
    }),

    previewCreateGoal: tool({
      description: 'Preview creating a savings goal (requires user confirmation in app)',
      inputSchema: z.object({
        name: z.string(),
        targetAmount: z.number().positive(),
        goalType: z.enum(['save', 'earn', 'invest']).default('save'),
        emoji: z.string().optional(),
      }),
      execute: async (params) => ({
        preview: true,
        action: 'createGoal',
        message: `Would create ${params.goalType} goal "${params.name}" targeting $${params.targetAmount}`,
        payload: params,
      }),
    }),

    previewLogDebtPayment: tool({
      description: 'Preview logging an extra debt payment (requires user confirmation)',
      inputSchema: z.object({
        debtId: z.string(),
        paymentAmount: z.number().positive(),
      }),
      execute: async ({ debtId, paymentAmount }) => {
        const { data: debt } = await supabase
          .from('vault_debts')
          .select('name, balance')
          .eq('id', debtId)
          .eq('user_id', userId)
          .single();
        if (!debt) return { error: 'Debt not found' };
        const newBalance = Math.max(0, parseFloat(debt.balance) - paymentAmount);
        return {
          preview: true,
          action: 'logDebtPayment',
          message: `Would reduce "${debt.name}" from $${parseFloat(debt.balance).toFixed(2)} to $${newBalance.toFixed(2)}`,
          payload: { debtId, paymentAmount, newBalance },
        };
      },
    }),

    previewAddBudget: tool({
      description: 'Preview adding a budget category (requires user confirmation)',
      inputSchema: z.object({
        name: z.string(),
        monthlyLimit: z.number().positive(),
        emoji: z.string().optional(),
      }),
      execute: async (params) => ({
        preview: true,
        action: 'addBudget',
        message: `Would add budget "${params.name}" with $${params.monthlyLimit}/mo limit`,
        payload: params,
      }),
    }),
  };
}
