import type { SupabaseClient } from '@supabase/supabase-js';

export async function buildAdvisorSystemPrompt(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const [
    { data: accounts },
    { data: txs },
    { data: debts },
    { data: goals },
    { data: budgets },
  ] = await Promise.all([
    supabase.from('vault_accounts').select('name, type, balance').eq('user_id', userId),
    supabase
      .from('vault_transactions')
      .select('amount, type, category, description, merchant, date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100),
    supabase.from('vault_debts').select('id, name, balance, interest_rate, minimum_payment, type').eq('user_id', userId),
    supabase.from('savings_goals').select('id, name, target_amount, current_amount, goal_type, emoji').eq('user_id', userId),
    supabase.from('budget_categories').select('name, monthly_limit').eq('user_id', userId),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTxs = (txs || []).filter(t => new Date(t.date) >= monthStart);
  const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const expenses = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

  let netWorth = 0;
  for (const a of accounts || []) {
    const bal = parseFloat(String(a.balance));
    if (a.type === 'credit' || a.type === 'loan') netWorth -= bal;
    else netWorth += bal;
  }
  for (const d of debts || []) {
    netWorth -= parseFloat(String(d.balance));
  }

  const spendByCat: Record<string, number> = {};
  for (const t of monthTxs.filter(t => t.type === 'expense')) {
    const cat = t.category || 'Other';
    spendByCat[cat] = (spendByCat[cat] || 0) + parseFloat(t.amount);
  }
  const topSpend = Object.entries(spendByCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([c, a]) => `- ${c}: $${a.toFixed(2)}`)
    .join('\n');

  return `You are Kings's personal finance advisor (Jarvis-style). Be direct, use real numbers from tools and this snapshot, and give actionable advice.

SNAPSHOT (${now.toISOString().split('T')[0]}):
- Net worth (accounts - tracked debts): $${netWorth.toFixed(2)}
- This month income: $${income.toFixed(2)} | expenses: $${expenses.toFixed(2)} | savings rate: ${income > 0 ? Math.round(((income - expenses) / income) * 100) : 0}%

ACCOUNTS:
${(accounts || []).map(a => `- ${a.name} (${a.type}): $${parseFloat(String(a.balance)).toFixed(2)}`).join('\n') || 'None'}

DEBTS (use debtId in tools):
${(debts || []).map(d => `- [${d.id}] ${d.name}: $${parseFloat(d.balance).toFixed(2)} @ ${d.interest_rate}% APR, min $${parseFloat(d.minimum_payment).toFixed(2)}/mo`).join('\n') || 'None'}

GOALS (use goalId in tools):
${(goals || []).map(g => `- [${g.id}] ${g.emoji || ''} ${g.name} (${g.goal_type}): $${parseFloat(g.current_amount).toFixed(2)} / $${parseFloat(g.target_amount).toFixed(2)}`).join('\n') || 'None'}

BUDGETS:
${(budgets || []).map(b => `- ${b.name}: limit $${parseFloat(b.monthly_limit).toFixed(2)}`).join('\n') || 'None'}

TOP SPEND THIS MONTH:
${topSpend || 'No expense data'}

Use tools for precise calculations. Write tools return previews only — tell the user to confirm in the app before changes apply.`;
}
