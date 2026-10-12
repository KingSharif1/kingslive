import { NextRequest, NextResponse } from 'next/server';
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getVaultSupabaseUser } from '@/lib/vault/supabaseAuth';
import { buildAdvisorSystemPrompt } from '@/lib/vault/advisorContext';
import { createAdvisorTools } from '@/lib/vault/advisorTools';

// NOTE (2026-10-12): Gemini models are deprecated (404) and the Gemini account
// has depleted credits (402). Advisor now runs on OpenAI (verified working).
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function executeConfirmedAction(
  supabase: NonNullable<Awaited<ReturnType<typeof getVaultSupabaseUser>>['supabase']>,
  userId: string,
  action: string,
  payload: Record<string, unknown>,
) {
  switch (action) {
    case 'createGoal': {
      const { name, targetAmount, goalType, emoji } = payload as {
        name: string;
        targetAmount: number;
        goalType?: string;
        emoji?: string;
      };
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          user_id: userId,
          name,
          target_amount: targetAmount,
          current_amount: 0,
          goal_type: goalType || 'save',
          emoji: emoji || '🎯',
          color: '#10b981',
        })
        .select('id')
        .single();
      return { success: !error, id: data?.id, error: error?.message };
    }
    case 'logDebtPayment': {
      const { debtId, newBalance } = payload as { debtId: string; newBalance: number };
      const { error } = await supabase
        .from('vault_debts')
        .update({ balance: newBalance })
        .eq('id', debtId)
        .eq('user_id', userId);
      return { success: !error, error: error?.message };
    }
    case 'addBudget': {
      const { name, monthlyLimit, emoji } = payload as {
        name: string;
        monthlyLimit: number;
        emoji?: string;
      };
      const { data, error } = await supabase
        .from('budget_categories')
        .insert({
          user_id: userId,
          name,
          monthly_limit: monthlyLimit,
          emoji: emoji || '📊',
          color: '#3b82f6',
        })
        .select('id')
        .single();
      return { success: !error, id: data?.id, error: error?.message };
    }
    default:
      return { success: false, error: 'Unknown action' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supabase, user, error: authError } = await getVaultSupabaseUser(req);
    if (authError || !supabase || !user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    if (body.confirmAction) {
      const result = await executeConfirmedAction(
        supabase,
        user.id,
        body.confirmAction.action,
        body.confirmAction.payload,
      );
      return NextResponse.json(result);
    }

    const messages = (body.messages || []) as UIMessage[];
    const system = await buildAdvisorSystemPrompt(supabase, user.id);
    const tools = createAdvisorTools(supabase, user.id);

    const result = streamText({
      model: openaiProvider('gpt-4o-mini'),
      system,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('[advisor]', err);
    return NextResponse.json({ error: 'Advisor failed' }, { status: 500 });
  }
}

// Legacy non-streaming fallback for simple clients
export async function PUT(req: NextRequest) {
  try {
    const { message } = await req.json() as { message: string };
    const { supabase, user, error: authError } = await getVaultSupabaseUser(req);
    if (authError || !supabase || !user) {
      return NextResponse.json({ reply: 'Unauthorized' }, { status: 401 });
    }

    const system = await buildAdvisorSystemPrompt(supabase, user.id);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: 'No OpenAI API key configured.' });
    }

    const res = await fetch(
      `https://api.openai.com/v1/chat/completions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: `${system}\n\nUser: ${message}` }],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      },
    );
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || 'No response.';
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: 'Something went wrong.' }, { status: 500 });
  }
}
