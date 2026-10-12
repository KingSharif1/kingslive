import { NextRequest, NextResponse } from 'next/server';
import { getMiloAdmin } from '@/lib/milo/auth';

// Long-term memory. GET lists (top 50 by importance), POST remembers, DELETE forgets.
export async function GET(req: NextRequest) {
  const { supabase, error } = await getMiloAdmin(req);
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });

  const { data } = await supabase
    .from('milo_memories')
    .select('*')
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(50);
  return NextResponse.json({ memories: data || [] });
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await getMiloAdmin(req);
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });

  const { fact, category = 'general', importance = 5 } = await req.json();
  if (typeof fact !== 'string' || !fact.trim() || fact.length > 2000) {
    return NextResponse.json({ error: 'Invalid fact' }, { status: 400 });
  }
  const { data } = await supabase
    .from('milo_memories')
    .insert({ fact: fact.trim(), category, importance: Math.max(1, Math.min(10, importance)) })
    .select()
    .single();
  return NextResponse.json({ memory: data });
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await getMiloAdmin(req);
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await supabase.from('milo_memories').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
