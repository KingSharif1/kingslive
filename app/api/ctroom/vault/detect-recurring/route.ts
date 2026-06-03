import { NextRequest, NextResponse } from 'next/server';
import { getVaultSupabaseUser } from '@/lib/vault/supabaseAuth';
import { runRecurringScan } from '@/lib/vault/recurringScan';

/**
 * Manual rescan trigger — same engine as recurring-refresh, just kept
 * around because the UI calls this endpoint from a "Re-scan" button.
 */
export async function POST(req: NextRequest) {
  const { supabase, user, error } = await getVaultSupabaseUser(req);
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const result = await runRecurringScan(supabase, user.id);
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err: unknown) {
    console.error('[detect-recurring] error:', err);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}
