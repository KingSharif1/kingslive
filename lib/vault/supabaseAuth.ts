import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export async function getVaultSupabaseUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace('Bearer ', '');
  if (!jwt) return { supabase: null, user: null, error: 'Unauthorized' as const };

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase: null, user: null, error: 'Unauthorized' as const };

  return { supabase, user, error: null };
}
