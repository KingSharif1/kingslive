import { NextRequest, NextResponse } from 'next/server';
import { getMiloAdmin } from '@/lib/milo/auth';

// Milo's hands — executes actions across CTROOM and logs them.
// POST { action: 'task.create' | 'task.complete' | 'memory.remember' | 'project.update', params: {...} }
// Every execution is logged to milo_actions (visible in Settings > Milo > Action history).
// Consequential money writes require params.confirm === true.

type ActionDef = {
  run: (supabase: any, params: any) => Promise<{ result: string; target?: string }>;
  needsConfirm: boolean;
};

const ACTIONS: Record<string, ActionDef> = {
  'task.create': {
    needsConfirm: false,
    run: async (sb, p) => {
      if (!p.title) throw new Error('title required');
      const { data } = await sb.from('tasks').insert({
        title: p.title,
        priority: p.priority || 'medium',
        category: p.category || 'personal',
        due_date: p.dueDate || null,
        project: p.project || null,
        status: 'pending',
      }).select().single();
      return { result: `Created task: ${p.title}`, target: data?.id };
    },
  },
  'task.complete': {
    needsConfirm: false,
    run: async (sb, p) => {
      if (!p.id && !p.title) throw new Error('id or title required');
      let q = sb.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() });
      q = p.id ? q.eq('id', p.id) : q.ilike('title', `%${p.title}%`);
      const { data } = await q.select('title').limit(1);
      return { result: `Completed: ${data?.[0]?.title || p.title || p.id}` };
    },
  },
  'memory.remember': {
    needsConfirm: false,
    run: async (sb, p) => {
      if (!p.fact) throw new Error('fact required');
      await sb.from('milo_memories').insert({
        fact: p.fact,
        category: p.category || 'general',
        importance: Math.max(1, Math.min(10, p.importance || 5)),
        source: 'milo-action',
      });
      return { result: `Remembered: ${p.fact.slice(0, 80)}` };
    },
  },
  'project.update': {
    needsConfirm: false,
    run: async (sb, p) => {
      if (!p.id) throw new Error('id required');
      const updates: any = {};
      if (p.status) updates.status = p.status;
      if (p.progress !== undefined) updates.progress = p.progress;
      if (p.notes) updates.notes = p.notes;
      await sb.from('missions').update(updates).eq('id', p.id);
      return { result: `Updated project ${p.id}`, target: p.id };
    },
  },
  'transaction.add': {
    needsConfirm: true, // money writes need explicit confirmation
    run: async (sb, p) => {
      if (!p.amount || !p.description) throw new Error('amount and description required');
      const { data } = await sb.from('vault_transactions').insert({
        amount: p.amount,
        description: p.description,
        category: p.category || 'uncategorized',
        date: p.date || new Date().toISOString().split('T')[0],
        type: p.type || 'expense',
      }).select().single();
      return { result: `Logged ${p.type || 'expense'}: $${p.amount} — ${p.description}`, target: data?.id };
    },
  },
};

export async function POST(req: NextRequest) {
  const { supabase, error } = await getMiloAdmin(req);
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });

  const { action, params = {} } = await req.json();
  const def = ACTIONS[action];
  if (!def) {
    return NextResponse.json(
      { error: `Unknown action. Available: ${Object.keys(ACTIONS).join(', ')}` },
      { status: 400 },
    );
  }
  if (def.needsConfirm && params.confirm !== true) {
    return NextResponse.json(
      { error: 'This action needs explicit confirmation', needsConfirm: true },
      { status: 428 },
    );
  }

  try {
    const { result, target } = await def.run(supabase, params);
    await supabase.from('milo_actions').insert({ action, target, detail: params, result, status: 'done' });
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    await supabase.from('milo_actions').insert({
      action, detail: params, result: e.message, status: 'failed',
    });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET lists available actions (for the chat UI / docs).
export async function GET(req: NextRequest) {
  const { error } = await getMiloAdmin(req);
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
  return NextResponse.json({
    actions: Object.entries(ACTIONS).map(([name, def]) => ({
      name,
      needsConfirm: def.needsConfirm,
    })),
  });
}
