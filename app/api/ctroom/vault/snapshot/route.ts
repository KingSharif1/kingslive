import { NextRequest, NextResponse } from 'next/server';
import { getVaultSupabaseUser } from '@/lib/vault/supabaseAuth';

export async function POST(req: NextRequest) {
  const { supabase, user, error } = await getVaultSupabaseUser(req);
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const [{ data: accounts }, { data: debts }, { data: investments }] = await Promise.all([
    supabase.from('vault_accounts').select('type, balance').eq('user_id', user.id),
    supabase.from('vault_debts').select('balance').eq('user_id', user.id),
    supabase.from('investments').select('shares, current_price').eq('user_id', user.id),
  ]);

  let cash = 0;
  let debtTotal = 0;
  for (const a of accounts || []) {
    const bal = parseFloat(String(a.balance));
    if (a.type === 'credit' || a.type === 'loan') debtTotal += bal;
    else cash += bal;
  }
  for (const d of debts || []) {
    debtTotal += parseFloat(String(d.balance));
  }
  const investTotal = (investments || []).reduce(
    (s, p) => s + parseFloat(String(p.shares)) * parseFloat(String(p.current_price)),
    0,
  );
  const netWorth = cash + investTotal - debtTotal;
  const today = new Date().toISOString().split('T')[0];

  const { error: upsertErr } = await supabase.from('vault_net_worth_snapshots').upsert(
    {
      user_id: user.id,
      snapshot_date: today,
      net_worth: netWorth,
      cash,
      debt: debtTotal,
      investments: investTotal,
    },
    { onConflict: 'user_id,snapshot_date' },
  );

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  return NextResponse.json({ netWorth, cash, debt: debtTotal, investments: investTotal, date: today });
}

export async function GET(req: NextRequest) {
  const { supabase, user, error } = await getVaultSupabaseUser(req);
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data } = await supabase
    .from('vault_net_worth_snapshots')
    .select('snapshot_date, net_worth, cash, debt, investments')
    .eq('user_id', user.id)
    .order('snapshot_date', { ascending: true })
    .limit(365);

  return NextResponse.json({ snapshots: data || [] });
}
