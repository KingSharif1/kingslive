import { NextRequest, NextResponse } from 'next/server';
import { getVaultSupabaseUser } from '@/lib/vault/supabaseAuth';
import { runRecurringScan } from '@/lib/vault/recurringScan';

/**
 * Auto-refresh endpoint. Same engine as detect-recurring, but the name
 * makes its intent clear (called inline after a Teller sync completes).
 * The two routes exist separately so we can wire metrics/alerts differently
 * for auto vs manual runs without conditional logic.
 */
export async function POST(req: NextRequest) {
  const { supabase, user, error } = await getVaultSupabaseUser(req);
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const result = await runRecurringScan(supabase, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    console.error('[recurring-refresh] error:', err);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
