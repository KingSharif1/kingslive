import { NextRequest, NextResponse } from 'next/server';
import { getMiloAdmin } from '@/lib/milo/auth';

// Milo's soul — the editable personality doc. GET reads, PUT updates.
export async function GET(req: NextRequest) {
  const { supabase, error } = await getMiloAdmin(req);
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });

  const { data } = await supabase.from('milo_config').select('value').eq('key', 'soul').maybeSingle();
  return NextResponse.json({ soul: typeof data?.value === 'string' ? data.value : '' });
}

export async function PUT(req: NextRequest) {
  const { supabase, error } = await getMiloAdmin(req);
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });

  const { soul } = await req.json();
  if (typeof soul !== 'string' || soul.length > 20000) {
    return NextResponse.json({ error: 'Invalid soul' }, { status: 400 });
  }
  await supabase.from('milo_config').upsert({ key: 'soul', value: soul });
  await supabase.from('milo_actions').insert({
    action: 'soul.update',
    detail: { chars: soul.length },
    result: 'Soul updated',
  });
  return NextResponse.json({ ok: true });
}
