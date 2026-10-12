import { NextRequest, NextResponse } from 'next/server';
import { getMiloAdmin } from '@/lib/milo/auth';

// Action history — the visible log of everything Milo did.
// GET: recent actions. POST: log an action (also used internally).
export async function GET(req: NextRequest) {
  const { supabase, error } = await getMiloAdmin(req);
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });

  const limit = Math.min(100, parseInt(new URL(req.url).searchParams.get('limit') || '50', 10));
  const { data } = await supabase
    .from('milo_actions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return NextResponse.json({ actions: data || [] });
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await getMiloAdmin(req);
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });

  const { action, target, detail = {}, result, status = 'done' } = await req.json();
  if (typeof action !== 'string' || !action) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  const { data } = await supabase
    .from('milo_actions')
    .insert({ action, target, detail, result, status })
    .select()
    .single();
  return NextResponse.json({ logged: data });
}
