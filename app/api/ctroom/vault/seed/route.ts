import { NextRequest, NextResponse } from 'next/server';
import { getVaultSupabaseUser } from '@/lib/vault/supabaseAuth';

const DEFAULT_BUDGETS = [
  { name: 'Groceries', emoji: '🛒', monthly_limit: 400, color: '#22c55e' },
  { name: 'Food & Drink', emoji: '🍽️', monthly_limit: 250, color: '#f59e0b' },
  { name: 'Bills & Utilities', emoji: '💡', monthly_limit: 300, color: '#3b82f6' },
  { name: 'Subscriptions', emoji: '📱', monthly_limit: 150, color: '#8b5cf6' },
  { name: 'Transportation', emoji: '🚗', monthly_limit: 200, color: '#06b6d4' },
  { name: 'Shopping', emoji: '🛍️', monthly_limit: 200, color: '#ec4899' },
];

export async function POST(req: NextRequest) {
  const { supabase, user, error } = await getVaultSupabaseUser(req);
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from('budget_categories')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (existing?.length) {
    return NextResponse.json({ seeded: 0, message: 'Budgets already exist' });
  }

  const rows = DEFAULT_BUDGETS.map(b => ({ ...b, user_id: user.id }));
  const { error: insErr } = await supabase.from('budget_categories').insert(rows);
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ seeded: rows.length });
}
