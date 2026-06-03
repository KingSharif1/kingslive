import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import axios from 'axios';
import { mapTellerAccountType, getAccountColor } from '@/lib/vault/tellerAccount';
import { applyTransactionRulesToDb } from '@/lib/vault/applyTransactionRules';
import { runRecurringScan } from '@/lib/vault/recurringScan';

// ── Teller category → normalized label ───────────────────────────────────────
const TELLER_CATEGORY_MAP: Record<string, string> = {
  accommodation:  'Travel',
  advertising:    'Business',
  bar:            'Food & Drink',
  charity:        'Charity',
  clothing:       'Shopping',
  dining:         'Food & Drink',
  education:      'Education',
  electronics:    'Shopping',
  entertainment:  'Entertainment',
  fuel:           'Transportation',
  groceries:      'Groceries',
  health:         'Medical',
  home:           'Home Improvement',
  income:         'Income',
  insurance:      'Bills & Utilities',
  investment:     'Investment',
  loan:           'Loan Payments',
  office:         'Business',
  phone:          'Bills & Utilities',
  service:        'Services',
  shopping:       'Shopping',
  software:       'Software',
  sport:          'Personal Care',
  tax:            'Government',
  transport:      'Transportation',
  travel:         'Travel',
  utilities:      'Bills & Utilities',
  transfer:       'Transfer',
};

// Keywords that override Teller's category — checked against description + merchant
const LOAN_KEYWORDS = [
  'dept of ed', 'dept ed', 'dept. of education', 'department of education',
  'navient', 'mohela', 'sallie mae', 'great lakes', 'nelnet', 'aidvantage',
  'edfinancial', 'fed loan servicing', 'student loan', 'student aid',
];

const TRANSFER_KEYWORDS = [
  'zelle payment', 'zelle transfer', 'venmo', 'paypal transfer',
  'external transfer', 'wire transfer', 'ach transfer', 'peer transfer',
  'p2p payment', 'cash app transfer',
];

const RECURRING_MARKER_KEYWORDS = [
  'recurring payment', 'recurring charge', 'autopay', 'auto pay',
  'automatic payment', 'scheduled payment', 'bill pay',
];

function smartCategory(description: string, merchant: string | null, tellerCategory?: string): string {
  const text = `${description} ${merchant || ''}`.toLowerCase();
  if (LOAN_KEYWORDS.some(kw => text.includes(kw))) return 'Loan Payments';
  if (TRANSFER_KEYWORDS.some(kw => text.includes(kw))) return 'Transfer';
  return normalizeCategory(tellerCategory);
}

function smartType(description: string, merchant: string | null, amount: number): 'income' | 'expense' | 'transfer' {
  const text = `${description} ${merchant || ''}`.toLowerCase();
  if (TRANSFER_KEYWORDS.some(kw => text.includes(kw))) return 'transfer';
  return amount < 0 ? 'expense' : 'income';
}

function normalizeCategory(category?: string): string {
  if (!category) return 'Other';
  return TELLER_CATEGORY_MAP[category.toLowerCase()] ||
    category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function normalizePem(raw: string): string {
  if (!raw) return '';
  if (raw.includes('\n')) return raw;
  if (raw.includes('\\n')) return raw.replace(/\\n/g, '\n');

  let pem = raw
    .replace(/(-----BEGIN [A-Z ]+-----)/g, '$1\n')
    .replace(/(-----END [A-Z ]+-----)/g, '\n$1');

  const lines = pem.split('\n').filter(l => l.length > 0);
  const out: string[] = [];
  for (const line of lines) {
    if (line.startsWith('-----')) {
      out.push(line);
    } else {
      const chunks = line.match(/.{1,64}/g) || [line];
      out.push(...chunks);
    }
  }
  return out.join('\n') + '\n';
}

function getTellerClient(accessToken: string) {
  const cert = normalizePem(process.env.TELLER_CERT || '');
  const key  = normalizePem(process.env.TELLER_PRIVATE_KEY || '');

  const agent = cert && key
    ? new https.Agent({ cert, key })
    : undefined;

  return axios.create({
    baseURL: 'https://api.teller.io',
    httpsAgent: agent,
    auth: { username: accessToken, password: '' },
  });
}

// ── POST /api/teller/sync ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const jwt = authHeader?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all Teller enrollments for this user
    const { data: enrollments, error: enrollError } = await supabase
      .from('teller_enrollments')
      .select('*');

    if (enrollError || !enrollments?.length) {
      return NextResponse.json({ synced: 0, message: 'No linked accounts found' });
    }

    let totalTransactions = 0;

    for (const enrollment of enrollments) {
      try {
        const teller = getTellerClient(enrollment.access_token);

        // Refresh accounts & balances
        const accountsRes = await teller.get('/accounts');
        const tellerAccounts: any[] = accountsRes.data;

        for (const acc of tellerAccounts) {
          // Fetch fresh balance
          let balance = 0;
          let availableBalance = null;
          try {
            const balRes = await teller.get(`/accounts/${acc.id}/balances`);
            balance = parseFloat(balRes.data.available ?? balRes.data.ledger ?? 0);
            availableBalance = balRes.data.available ? parseFloat(balRes.data.available) : null;
          } catch {
            balance = parseFloat(acc.balance?.available ?? acc.balance?.ledger ?? 0);
          }

          const { data: vaultAcc, error: vaultAccError } = await supabase
            .from('vault_accounts')
            .upsert({
              user_id: user.id,
              teller_account_id: acc.id,
              enrollment_id: enrollment.enrollment_id,
              name: acc.name,
              official_name: acc.full_name || acc.name,
              type: mapTellerAccountType(acc.type, acc.subtype),
              balance,
              available_balance: availableBalance,
              mask: acc.last_four || null,
              institution: enrollment.institution_name || 'Unknown Bank',
              currency: acc.currency || 'USD',
              is_teller_linked: true,
              color: getAccountColor(acc.type),
            }, { onConflict: 'teller_account_id' })
            .select('id')
            .single();

          if (vaultAccError) {
            console.error('Vault account upsert error:', vaultAccError);
          }

          // Fetch transactions for this account
          try {
            const txRes = await teller.get(`/accounts/${acc.id}/transactions`);
            const tellerTxs: any[] = txRes.data;

            const txRows = tellerTxs.map(tx => {
              const desc     = tx.description || '';
              const merchant = tx.details?.counterparty?.name || null;
              const rawAmt   = parseFloat(tx.amount);
              return {
                user_id:               user.id,
                account_id:            vaultAcc?.id || null,
                teller_account_id:     acc.id,
                teller_transaction_id: tx.id,
                amount:                Math.abs(rawAmt),
                type:                  smartType(desc, merchant, rawAmt),
                category:              smartCategory(desc, merchant, tx.details?.category),
                description:           desc,
                merchant,
                date:                  tx.date,
                is_pending:            tx.status === 'pending',
              };
            });

            if (txRows.length > 0) {
              const { error: txError } = await supabase
                .from('vault_transactions')
                .upsert(txRows, { onConflict: 'teller_transaction_id' });

              if (txError) console.error('Transaction upsert error:', txError);
              else totalTransactions += txRows.length;
            }
          } catch (txErr: any) {
            console.error(`Error fetching transactions for account ${acc.id}:`, txErr.message);
          }
        }

        // Mark last synced
        await supabase
          .from('teller_enrollments')
          .update({ last_synced: new Date().toISOString() })
          .eq('enrollment_id', enrollment.enrollment_id);

      } catch (enrollErr: any) {
        console.error(`Error syncing enrollment ${enrollment.enrollment_id}:`, enrollErr.response?.data || enrollErr.message);
      }
    }

    const rulesUpdated = await applyTransactionRulesToDb(supabase, user.id);

    // Refresh recurring subscriptions inline. We swallow errors so a bad
    // scan never blocks a successful sync — the client can rescan manually.
    let recurring: Awaited<ReturnType<typeof runRecurringScan>> | null = null;
    try {
      recurring = await runRecurringScan(supabase, user.id);
    } catch (scanErr) {
      console.error('Recurring scan failed during sync:', scanErr);
    }

    return NextResponse.json({
      success: true,
      synced: totalTransactions,
      rulesUpdated,
      lastSynced: new Date().toISOString(),
      recurring: recurring
        ? {
            detected: recurring.detected,
            updated: recurring.updated,
            inserted: recurring.inserted,
            cancelled: recurring.cancelled,
            pendingReview: recurring.pendingReview,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Teller sync error:', error.message);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
