import type { SupabaseClient } from '@supabase/supabase-js';

export async function applyTransactionRulesToDb(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data: rules } = await supabase
    .from('transaction_rules')
    .select('pattern, category')
    .eq('user_id', userId);

  if (!rules?.length) return 0;

  const { data: txs } = await supabase
    .from('vault_transactions')
    .select('id, merchant, description, category')
    .eq('user_id', userId);

  if (!txs?.length) return 0;

  let updated = 0;
  for (const tx of txs) {
    const target = `${tx.merchant || ''} ${tx.description || ''}`.toLowerCase();
    const match = rules.find(r => target.includes(r.pattern.toLowerCase()));
    if (match && tx.category !== match.category) {
      const { error } = await supabase
        .from('vault_transactions')
        .update({ category: match.category })
        .eq('id', tx.id);
      if (!error) updated++;
    }
  }
  return updated;
}
