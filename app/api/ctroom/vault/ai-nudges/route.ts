import { NextRequest, NextResponse } from 'next/server';

interface TxInput {
  description: string;
  merchant?: string;
  amount: number;
  type: string;
  category?: string;
  date: string;
  accountName?: string;
}

interface DebtInput {
  id: string;
  name: string;
  type: string;
  balance: number;
  minimumPayment: number;
}

interface GoalInput {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  emoji?: string;
}

export interface VaultAiNudge {
  id: string;
  type: 'debt_payment' | 'goal_contribution' | 'new_recurring';
  message: string;
  amount: number;
  txDate: string;
  // debt_payment
  debtId?: string;
  debtName?: string;
  suggestedBalance?: number;
  // goal_contribution
  goalId?: string;
  goalName?: string;
  suggestedAmount?: number;
  // new_recurring
  recurringName?: string;
  recurringFrequency?: string;
  recurringEmoji?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { transactions, debts, goals } = await req.json() as {
      transactions: TxInput[];
      debts: DebtInput[];
      goals: GoalInput[];
    };

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ nudges: [] });
    }

    const debtSummary = debts.map(d => `- ${d.name} (${d.type}): $${d.balance.toFixed(2)} remaining, min payment $${d.minimumPayment}/mo [id: ${d.id}]`).join('\n');
    const goalSummary = goals.map(g => `- ${g.emoji || ''} ${g.name}: $${g.currentAmount.toFixed(2)} of $${g.targetAmount.toFixed(2)} [id: ${g.id}]`).join('\n');
    const txSummary = transactions.slice(0, 60).map(t =>
      `${t.date}: ${t.merchant || t.description} | $${t.amount.toFixed(2)} | ${t.type} | ${t.category || 'uncategorized'} | ${t.accountName || ''}`
    ).join('\n');

    const prompt = `You are a personal finance AI assistant. Analyze these recent bank transactions and identify:
1. Loan/debt payments (student loans, credit cards, mortgages, auto loans) → suggest updating the debt balance
2. Savings deposits or transfers to savings → suggest crediting toward a savings goal
3. New recurring charges not yet tracked

Respond ONLY with valid JSON array of nudge objects. No markdown, no explanation. Max 5 nudges.

Each nudge must have exactly this shape:
{
  "id": "unique_string",
  "type": "debt_payment" | "goal_contribution" | "new_recurring",
  "message": "Short user-friendly message (1-2 sentences)",
  "amount": number,
  "txDate": "YYYY-MM-DD",
  "debtId": "id_from_debts_or_null",
  "debtName": "name_or_null",
  "suggestedBalance": number_or_null,
  "goalId": "id_from_goals_or_null",
  "goalName": "name_or_null",
  "suggestedAmount": number_or_null,
  "recurringName": "name_or_null",
  "recurringFrequency": "monthly|weekly|annual|quarterly|bi-weekly or null",
  "recurringEmoji": "emoji_or_null"
}

USER'S TRACKED DEBTS:
${debtSummary || 'None tracked yet.'}

USER'S SAVINGS GOALS:
${goalSummary || 'None tracked yet.'}

RECENT TRANSACTIONS (last 30 days):
${txSummary}

Rules:
- For debt_payment: match transaction description/merchant to a tracked debt by name similarity. Set suggestedBalance = current balance - payment amount (minimum 0). Only include if confidence is high.
- For goal_contribution: match savings transfers or "savings" account deposits to a goal. Set suggestedAmount = currentAmount + deposit.
- For new_recurring: only flag if the charge appears 2+ times at similar amounts and interval, AND it's not already a known subscription.
- Skip transfers between the user's own accounts.
- Be conservative — only flag clear matches. Return [] if nothing is clearly actionable.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1024, temperature: 0.2, responseMimeType: 'application/json' },
          }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      return NextResponse.json({ nudges: [] });
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    let nudges: VaultAiNudge[] = [];
    try {
      const parsed = JSON.parse(raw);
      nudges = Array.isArray(parsed) ? parsed.filter(n => n && n.type && n.message) : [];
      // Ensure each nudge has a stable id
      nudges = nudges.map((n, i) => ({ ...n, id: n.id || `nudge_${Date.now()}_${i}` }));
    } catch {
      nudges = [];
    }

    return NextResponse.json({ nudges });
  } catch (err) {
    console.error('[ai-nudges]', err);
    return NextResponse.json({ nudges: [] });
  }
}
