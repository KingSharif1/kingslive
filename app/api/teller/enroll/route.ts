import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import axios from 'axios';

// ── PEM normalizer ───────────────────────────────────────────────────────────
function normalizePem(raw: string): string {
  if (!raw) return '';
  // Already has real newlines
  if (raw.includes('\n')) return raw;
  // Has literal \n escape sequences
  if (raw.includes('\\n')) return raw.replace(/\\n/g, '\n');

  // All on one line — insert newlines at boundaries then wrap body at 64 chars
  let pem = raw
    .replace(/(-----BEGIN [A-Z ]+-----)/g, '$1\n')
    .replace(/(-----END [A-Z ]+-----)/g, '\n$1');

  const lines = pem.split('\n').filter(l => l.length > 0);
  const out: string[] = [];
  for (const line of lines) {
    if (line.startsWith('-----')) {
      out.push(line);
    } else {
      // wrap base64 body at 64 chars
      const chunks = line.match(/.{1,64}/g) || [line];
      out.push(...chunks);
    }
  }
  return out.join('\n') + '\n';
}

// ── Teller mTLS client ───────────────────────────────────────────────────────
function getTellerClient(accessToken: string) {
  const cert = normalizePem(process.env.TELLER_CERT || '');
  const key  = normalizePem(process.env.TELLER_PRIVATE_KEY || '');

  if (!cert || !key) {
    console.error('Teller: missing TELLER_CERT or TELLER_PRIVATE_KEY');
  } else {
    // Log first/last line so we can confirm format without exposing the full key
    const certLines = cert.split('\n');
    console.log('Teller cert format check:', certLines[0], '...', certLines[certLines.length - 2]);
  }

  const agent = cert && key
    ? new https.Agent({ cert, key })
    : undefined;

  return axios.create({
    baseURL: 'https://api.teller.io',
    httpsAgent: agent,
    auth: { username: accessToken, password: '' },
  });
}

function mapTellerAccountType(type: string, subtype?: string): string {
  if (type === 'depository') return subtype === 'savings' ? 'savings' : 'checking';
  if (type === 'credit')     return 'credit';
  if (type === 'loan')       return 'loan';
  if (type === 'investment') return 'investment';
  return 'checking';
}

function getAccountColor(type: string): string {
  const colors: Record<string, string> = {
    depository: '#3b82f6',
    credit:     '#ef4444',
    loan:       '#f59e0b',
    investment: '#10b981',
  };
  return colors[type] || '#6b7280';
}

// ── POST /api/teller/enroll ───────────────────────────────────────────────────
// Called after Teller Connect onSuccess with { accessToken, enrollmentId, institution }
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

    const { accessToken, enrollmentId, institution } = await req.json();
    if (!accessToken || !enrollmentId) {
      return NextResponse.json({ error: 'Missing accessToken or enrollmentId' }, { status: 400 });
    }

    const teller = getTellerClient(accessToken);

    // Fetch accounts from Teller
    let accountsRes;
    try {
      accountsRes = await teller.get('/accounts');
    } catch (tellerErr: any) {
      const status = tellerErr.response?.status;
      const detail = tellerErr.response?.data || tellerErr.message;
      console.error('Teller /accounts call failed:', status, detail);
      return NextResponse.json(
        { error: `Teller API error: ${status || 'network'} — ${JSON.stringify(detail)}` },
        { status: 502 }
      );
    }
    const tellerAccounts: any[] = accountsRes.data;

    // Store enrollment
    const { error: enrollError } = await supabase
      .from('teller_enrollments')
      .upsert({
        user_id:          user.id,
        enrollment_id:    enrollmentId,
        access_token:     accessToken,
        institution_name: institution?.name || 'Unknown Bank',
        institution_type: institution?.type || 'depository',
        last_synced:      new Date().toISOString(),
      }, { onConflict: 'enrollment_id' });

    if (enrollError) {
      console.error('Error storing enrollment:', enrollError);
      return NextResponse.json({ error: 'Failed to store enrollment' }, { status: 500 });
    }

    // Upsert accounts into vault_accounts
    const accountRows = tellerAccounts.map(acc => ({
      user_id:            user.id,
      teller_account_id:  acc.id,
      enrollment_id:      enrollmentId,
      name:               acc.name,
      official_name:      acc.full_name || acc.name,
      type:               mapTellerAccountType(acc.type, acc.subtype),
      balance:            parseFloat(acc.balance?.available ?? acc.balance?.ledger ?? 0),
      available_balance:  acc.balance?.available ? parseFloat(acc.balance.available) : null,
      mask:               acc.last_four || null,
      institution:        institution?.name || 'Unknown Bank',
      currency:           acc.currency || 'USD',
      is_teller_linked:   true,
      color:              getAccountColor(acc.type),
    }));

    const { error: accountsError } = await supabase
      .from('vault_accounts')
      .upsert(accountRows, { onConflict: 'teller_account_id' });

    if (accountsError) console.error('Error storing accounts:', accountsError);

    return NextResponse.json({
      success:         true,
      enrollment_id:   enrollmentId,
      accounts_synced: tellerAccounts.length,
    });
  } catch (error: any) {
    console.error('Teller enroll error:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
  }
}
