import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVaultSupabaseUser } from '@/lib/vault/supabaseAuth';
import { runRecurringScan } from '@/lib/vault/recurringScan';

/**
 * Human-in-the-loop review. The UI calls this when the user clicks
 * Confirm / Dismiss / Recategorize on a row in the review queue.
 *
 * - `confirmed` → keep the subscription active, lock it to confidence 95+
 * - `dismissed` → remove the subscription row entirely AND remember to
 *   never auto-create it again (the engine consults user_overrides)
 * - `category`  → keep recurring, but apply the user's category override
 */
const Body = z.object({
  pattern: z.string().min(1).max(200),
  decision: z.enum(['confirmed', 'dismissed', 'category']),
  category: z.string().optional(),
  billType: z.enum(['subscription', 'bill', 'loan', 'income', 'denylist']).optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { supabase, user, error } = await getVaultSupabaseUser(req);
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
  }
  const { pattern, decision, category, billType, notes } = parsed.data;

  // 1. Upsert the override so the engine respects it on every future scan.
  const { error: overrideErr } = await supabase
    .from('user_overrides')
    .upsert(
      {
        user_id: user.id,
        merchant_pattern: pattern.toLowerCase(),
        decision,
        category: category ?? null,
        bill_type: billType ?? null,
        notes: notes ?? null,
      },
      { onConflict: 'user_id,merchant_pattern' },
    );
  if (overrideErr) {
    console.error('[recurring-review] override upsert error:', overrideErr);
    return NextResponse.json({ error: 'Failed to save override' }, { status: 500 });
  }

  // 2. Apply the immediate consequence to the subscription row.
  if (decision === 'dismissed') {
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('merchant_pattern', pattern.toLowerCase());
  } else if (decision === 'category' && category) {
    await supabase
      .from('subscriptions')
      .update({ category, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('merchant_pattern', pattern.toLowerCase());
  } else if (decision === 'confirmed') {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        is_active: true,
        confidence: 95,
        cancelled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('merchant_pattern', pattern.toLowerCase());
  }

  // 3. Re-run the scan so the row picks up the override on its next render.
  //    Cheap because the data is in cache and indexes are tight.
  try {
    const result = await runRecurringScan(supabase, user.id);
    return NextResponse.json({ ok: true, decision, pattern, ...result });
  } catch (err) {
    console.error('[recurring-review] rescan after review error:', err);
    return NextResponse.json({ ok: true, decision, pattern, rescan: 'failed' });
  }
}
