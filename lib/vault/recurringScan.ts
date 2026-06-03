/**
 * Server-side recurring scan — fetches transactions + dictionary + overrides
 * for a user, runs the detection engine, and upserts the result into
 * `subscriptions` so the lifecycle state (active / pending_review / cancelled)
 * is always fresh.
 *
 * Used by:
 *   - POST /api/ctroom/vault/recurring-refresh  (called inline after sync)
 *   - POST /api/ctroom/vault/detect-recurring   (manual rescan trigger)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  detectRecurring,
  type DictionaryEntry,
  type RawTransaction,
  type RecurringCandidate,
  type UserOverride,
} from './recurringDetection';

export interface ScanResult {
  scanned: number;
  detected: number;
  inserted: number;
  updated: number;
  cancelled: number;
  pendingReview: number;
  candidates: RecurringCandidate[];
}

/**
 * Pull data, detect, upsert into subscriptions.
 *
 * The supabase client passed in MUST be authenticated as the user
 * (so RLS protects subscriptions writes) OR be a service-role client
 * with `user_id` provided explicitly.
 */
export async function runRecurringScan(
  supabase: SupabaseClient,
  userId: string,
  opts: { windowDays?: number } = {},
): Promise<ScanResult> {
  // 1. Inputs — pull in parallel.
  const [txRes, dictRes, overridesRes, existingSubsRes] = await Promise.all([
    supabase
      .from('vault_transactions')
      .select('id, merchant, description, amount, date, type')
      .eq('user_id', userId)
      .gte(
        'date',
        new Date(Date.now() - (opts.windowDays ?? 180) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      )
      .order('date', { ascending: false })
      .limit(5000),
    supabase
      .from('merchant_dictionary')
      .select('pattern, display_name, category, emoji, bill_type, default_frequency'),
    supabase
      .from('user_overrides')
      .select('merchant_pattern, decision, category, bill_type')
      .eq('user_id', userId),
    supabase
      .from('subscriptions')
      .select('id, merchant_pattern, auto_detected')
      .eq('user_id', userId),
  ]);

  const txs: RawTransaction[] = (txRes.data || []).map(t => ({
    id: t.id,
    merchant: t.merchant,
    description: t.description,
    amount: parseFloat(t.amount as unknown as string),
    date: t.date,
    type: t.type,
  }));

  const dict: DictionaryEntry[] = (dictRes.data || []) as DictionaryEntry[];
  const overrides: UserOverride[] = (overridesRes.data || []) as UserOverride[];
  const existing = (existingSubsRes.data || []) as { id: string; merchant_pattern: string | null; auto_detected: boolean }[];

  // 2. Detect.
  const candidates = detectRecurring(txs, dict, overrides);

  // 3. Upsert. We use the partial unique index (user_id, merchant_pattern)
  // that the migration created.
  let inserted = 0;
  let updated = 0;
  let cancelled = 0;
  let pendingReview = 0;

  if (candidates.length > 0) {
    const rows = candidates.map(c => ({
      user_id:            userId,
      name:               c.name,
      emoji:              c.emoji,
      category:           c.category,
      amount:             c.amount,
      frequency:          c.frequency === 'biweekly' ? 'bi-weekly' : c.frequency, // legacy display tolerance
      merchant_pattern:   c.merchantPattern,
      next_billing_date:  c.nextBillingDate,
      last_charge_date:   c.lastChargeDate,
      last_charge_amount: c.lastChargeAmount,
      first_seen_date:    c.firstSeenDate,
      charge_count:       c.chargeCount,
      avg_interval_days:  c.avgIntervalDays,
      confidence:         c.confidence,
      status:             c.status,
      bill_type:          c.billType,
      is_active:          c.status === 'active',
      auto_detected:      true,
      cancelled_at:       c.status === 'cancelled' ? new Date().toISOString() : null,
      notes:              c.reason || null,
      color:              c.billType === 'income' ? '#10b981' : c.billType === 'loan' ? '#f97316' : c.billType === 'bill' ? '#3b82f6' : '#8b5cf6',
      updated_at:         new Date().toISOString(),
    }));

    const existingPatterns = new Set(
      existing.map(e => (e.merchant_pattern || '').toLowerCase()).filter(Boolean),
    );

    for (const c of candidates) {
      if (existingPatterns.has(c.merchantPattern)) updated++;
      else inserted++;
      if (c.status === 'cancelled') cancelled++;
      if (c.status === 'pending_review') pendingReview++;
    }

    // Supabase upsert with ON CONFLICT requires the column list to match the
    // unique constraint we created (user_id, merchant_pattern).
    const { error } = await supabase
      .from('subscriptions')
      .upsert(rows, { onConflict: 'user_id,merchant_pattern' });
    if (error) {
      console.error('[recurringScan] upsert error:', error);
      throw error;
    }
  }

  // 4. Mark old auto-detected subscriptions that no longer surface in
  //    the scan as cancelled (their merchant stopped appearing entirely).
  const stillSeenPatterns = new Set(candidates.map(c => c.merchantPattern));
  const stale = existing.filter(e =>
    e.auto_detected && e.merchant_pattern && !stillSeenPatterns.has(e.merchant_pattern.toLowerCase()),
  );

  if (stale.length > 0) {
    const { error: staleErr } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        is_active: false,
        cancelled_at: new Date().toISOString(),
        notes: 'Auto-cancelled: merchant no longer appears in recent transactions',
        updated_at: new Date().toISOString(),
      })
      .in(
        'id',
        stale.map(s => s.id),
      );
    if (!staleErr) cancelled += stale.length;
  }

  return {
    scanned: txs.length,
    detected: candidates.length,
    inserted,
    updated,
    cancelled,
    pendingReview,
    candidates,
  };
}
