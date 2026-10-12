import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Validates the caller's JWT and confirms admin status.
// Returns { supabase (service-role), user } or { error }.
export async function getMiloAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace('Bearer ', '');
  if (!jwt) return { error: 'Unauthorized' as const };

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );
  const { data: { user }, error } = await anon.auth.getUser();
  if (error || !user?.email) return { error: 'Unauthorized' as const };

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: adminRow } = await admin
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .maybeSingle();
  if (!adminRow) return { error: 'Forbidden' as const };

  return { supabase: admin, user, error: null };
}
