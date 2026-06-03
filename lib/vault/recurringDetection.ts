/**
 * Recurring detection engine — Rocket-Money-style.
 *
 * The detector consumes raw expense transactions and a dictionary of known
 * merchants + per-user overrides. It returns one row per merchant pattern with:
 *   - a lifecycle status (active / pending_review / cancelled)
 *   - a confidence bucket (high / medium / low) and numeric score
 *   - the predicted next charge date + amount + frequency
 *
 * The scoring is intentionally conservative: a candidate must show stable
 * intervals AND stable amounts AND clear an explicit denylist before it
 * earns "active" status. Otherwise it lands in the review queue (HITL).
 *
 * Consumers:
 *   - /api/ctroom/vault/recurring-refresh (full scan, called after sync)
 *   - /api/ctroom/vault/detect-recurring  (manual rescan trigger)
 */

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type LifecycleStatus = 'active' | 'pending_review' | 'cancelled';
export type BillType = 'subscription' | 'bill' | 'loan' | 'income' | 'denylist';
export type ConfidenceBucket = 'high' | 'medium' | 'low';

export interface RawTransaction {
  id?: string;
  merchant?: string | null;
  description: string;
  amount: number;          // always positive — sign carried by `type`
  date: string | Date;
  type: string;            // 'expense' | 'income' | ...
}

export interface DictionaryEntry {
  pattern: string;         // already normalized
  display_name: string;
  category: string;
  emoji: string;
  bill_type: BillType;
  default_frequency: Frequency | null;
}

export interface UserOverride {
  merchant_pattern: string;
  decision: 'confirmed' | 'dismissed' | 'category';
  category?: string | null;
  bill_type?: BillType | null;
}

export interface RecurringCandidate {
  /** Pattern used for dedupe / upsert (always normalized lowercase) */
  merchantPattern: string;
  /** Friendly merchant label for the UI */
  name: string;
  emoji: string;
  category: string;
  billType: BillType;
  /** Median amount across observed charges */
  amount: number;
  frequency: Frequency;
  /** When we expect the next charge to hit (best estimate) */
  nextBillingDate: string; // YYYY-MM-DD
  lastChargeDate: string;  // YYYY-MM-DD
  lastChargeAmount: number;
  firstSeenDate: string;   // YYYY-MM-DD
  chargeCount: number;
  avgIntervalDays: number;
  /** 0-100 confidence score */
  confidence: number;
  confidenceBucket: ConfidenceBucket;
  /** Lifecycle status the engine recommends */
  status: LifecycleStatus;
  /** Days since the last charge — used to flag cancellations */
  daysSinceLastCharge: number;
  /**
   * If the engine downgraded the row to pending/cancelled, the reason is
   * captured for the review UI ("missed 2 expected charges", etc.).
   */
  reason?: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   Normalization — convert "KROGER #1842 ABILENE TX" into "kroger" so we
   can group safely. We strip store numbers, common corporate suffixes,
   anything that looks like a transaction id or city, and collapse spaces.
   ────────────────────────────────────────────────────────────────────────── */
export function normalizeMerchant(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[#]\s*\d+/g, ' ')                  // "#1234"
    .replace(/\*\w{2,}/g, ' ')                   // "*ZZZZ" Stripe-style suffix
    .replace(/\b(llc|inc|co|corp|ltd|the)\b/g, ' ')
    .replace(/\b\d{3,}\b/g, ' ')                 // store numbers / phone tails
    .replace(/[^a-z0-9&'\- ]+/g, ' ')            // punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/* ──────────────────────────────────────────────────────────────────────────
   Statistics helpers (intentionally tiny — not worth a math library)
   ────────────────────────────────────────────────────────────────────────── */
function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function stdev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
  const variance = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function toDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * When one merchant has multiple stable payment amounts (e.g. two student loans
 * through the same servicer), split into separate recurring rows.
 */
function splitByAmountClusters(txs: RawTransaction[], maxCv: number): RawTransaction[][] {
  if (txs.length < 2) return [txs];
  const amounts = txs.map(t => t.amount);
  const med = median(amounts);
  const st = stdev(amounts);
  const cv = med > 0 ? st / med : 1;
  if (cv <= maxCv) return [txs];

  const unique = [...new Set(amounts.map(a => Math.round(a * 100) / 100))].sort((a, b) => a - b);
  const clusterCenters: number[] = [];
  for (const amt of unique) {
    const existing = clusterCenters.find(c => Math.abs(amt - c) / c <= 0.1);
    if (existing != null) continue;
    clusterCenters.push(amt);
  }

  if (clusterCenters.length < 2) return [txs];

  const clusters: RawTransaction[][] = clusterCenters.map(() => []);
  for (const tx of txs) {
    let bestIdx = 0;
    let bestDist = Infinity;
    clusterCenters.forEach((c, i) => {
      const d = Math.abs(tx.amount - c);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    clusters[bestIdx].push(tx);
  }

  return clusters.filter(c => c.length >= 2);
}

/* ──────────────────────────────────────────────────────────────────────────
   Frequency classification — maps the median interval (days) to a label.
   Returns null when the cadence is too erratic to call recurring.
   ────────────────────────────────────────────────────────────────────────── */
const FREQUENCY_WINDOWS: { freq: Frequency; min: number; max: number; nominal: number }[] = [
  { freq: 'weekly',    min:   6, max:   8, nominal:   7 },
  { freq: 'biweekly',  min:  12, max:  16, nominal:  14 },
  { freq: 'monthly',   min:  25, max:  35, nominal:  30 },
  { freq: 'quarterly', min:  85, max:  95, nominal:  91 },
  { freq: 'yearly',    min: 350, max: 380, nominal: 365 },
];

function classifyFrequency(medianInterval: number): {
  freq: Frequency;
  nominal: number;
} | null {
  for (const w of FREQUENCY_WINDOWS) {
    if (medianInterval >= w.min && medianInterval <= w.max) {
      return { freq: w.freq, nominal: w.nominal };
    }
  }
  return null;
}

/* ──────────────────────────────────────────────────────────────────────────
   Dictionary lookup — matches a normalized merchant against the seeded
   dictionary by longest substring. Returns the entry with the longest
   matching pattern so "apple music" beats "apple".
   ────────────────────────────────────────────────────────────────────────── */
export function lookupDictionary(
  normalizedMerchant: string,
  dict: DictionaryEntry[],
): DictionaryEntry | null {
  let best: DictionaryEntry | null = null;
  for (const entry of dict) {
    if (!normalizedMerchant.includes(entry.pattern)) continue;
    if (!best || entry.pattern.length > best.pattern.length) best = entry;
  }
  return best;
}

/* ──────────────────────────────────────────────────────────────────────────
   Core detector — pure function, no DB access. Server routes call this
   after fetching their inputs and persist the result themselves.
   ────────────────────────────────────────────────────────────────────────── */
export interface DetectOptions {
  /** Today (injectable for tests). */
  now?: Date;
  /** Only look at this many days of history. Default: 180. */
  windowDays?: number;
  /** Minimum number of charges before we'll even consider it recurring. */
  minOccurrences?: number;
  /** Max allowed coefficient of variation on the amount (0.15 = ±15%). */
  maxAmountCv?: number;
  /** Max allowed std-dev of the interval, in days. */
  maxIntervalStdev?: number;
}

const DEFAULTS: Required<DetectOptions> = {
  now: new Date(),
  windowDays: 180,
  // Bump to 4 so a single quirky biweekly visit can't masquerade as a subscription.
  // Real subs always show 4+ charges inside the 6-month window.
  minOccurrences: 4,
  // Tighten amount jitter: real subs almost never vary >8% (tax/fee changes only).
  maxAmountCv: 0.08,
  maxIntervalStdev: 4,
};

export function detectRecurring(
  transactions: RawTransaction[],
  dict: DictionaryEntry[] = [],
  overrides: UserOverride[] = [],
  opts: DetectOptions = {},
): RecurringCandidate[] {
  const { now, windowDays, minOccurrences, maxAmountCv, maxIntervalStdev } = {
    ...DEFAULTS,
    ...opts,
  };

  const overrideMap = new Map(overrides.map(o => [o.merchant_pattern, o]));
  const dictByExact = new Map(dict.map(d => [d.pattern, d]));

  // 1. Bucket transactions by normalized merchant.
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const groups = new Map<string, RawTransaction[]>();

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
    if (Number.isNaN(txDate.getTime()) || txDate < cutoff) continue;
    if (!Number.isFinite(tx.amount) || tx.amount <= 0) continue;

    const key = normalizeMerchant(tx.merchant || tx.description || '');
    if (!key || key.length < 3) continue;

    let bucket = groups.get(key);
    if (!bucket) {
      bucket = [];
      groups.set(key, bucket);
    }
    bucket.push({ ...tx, date: txDate });
  }

  const out: RecurringCandidate[] = [];

  for (const [pattern, allTxs] of Array.from(groups.entries())) {
    // ── Dictionary lookup (longest-match) ──────────────────────────────────
    const dictEntry = dictByExact.get(pattern) || lookupDictionary(pattern, dict);

    // ── User override takes precedence over everything ─────────────────────
    const override = overrideMap.get(pattern);

    // Utilities vary more than Netflix; bills get a slightly wider amount band.
    const effectiveMaxCv =
      dictEntry?.bill_type === 'bill' ? 0.18 : dictEntry?.bill_type === 'loan' ? 0.12 : maxAmountCv;

    const amountClusters = splitByAmountClusters(allTxs, effectiveMaxCv);

    for (let clusterIndex = 0; clusterIndex < amountClusters.length; clusterIndex++) {
      const txs = amountClusters[clusterIndex];
      const clusterSuffix =
        amountClusters.length > 1
          ? `#${Math.round(median(txs.map(t => t.amount)) * 100)}`
          : '';
      const clusterPattern = `${pattern}${clusterSuffix}`;
      const clusterOverride = overrideMap.get(clusterPattern) ?? override;

    // Bills/loans often have only 2–3 charges after a move; subs need more history.
    const effectiveMinOccurrences =
      clusterOverride?.decision === 'confirmed'
        ? 1
        : dictEntry?.bill_type === 'bill' || dictEntry?.bill_type === 'loan'
          ? 2
          : minOccurrences;

    if (txs.length < effectiveMinOccurrences) continue;
    if (clusterOverride?.decision === 'dismissed') continue;

    // ── Denylist: skip unless user explicitly confirmed ────────────────────
    if (dictEntry?.bill_type === 'denylist' && clusterOverride?.decision !== 'confirmed') {
      continue;
    }

    // ── Sort by date ascending so intervals make sense ─────────────────────
    const sorted = [...txs].sort(
      (a, b) => (a.date as Date).getTime() - (b.date as Date).getTime(),
    );

    // ── Interval stats ─────────────────────────────────────────────────────
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(daysBetween(sorted[i].date as Date, sorted[i - 1].date as Date));
    }
    const medianInterval = median(intervals);
    const intervalStdev = stdev(intervals);

    // ── Amount stats ───────────────────────────────────────────────────────
    const amounts = sorted.map(t => t.amount);
    const medianAmount = median(amounts);
    const amountStdev = stdev(amounts);
    // Tiny-amount guard: when the average is under $5 (e.g. $1 Google fees)
    // the CV blows up at noise levels that don't actually matter, so fall
    // back to an absolute stdev gate of $2.
    const amountCv = medianAmount > 0
      ? medianAmount < 5
        ? amountStdev / 2 // treat $2 stdev as the budget
        : amountStdev / medianAmount
      : 1;

    // ── Classify cadence ───────────────────────────────────────────────────
    const cadence = classifyFrequency(medianInterval);
    const dictDefault = dictEntry?.default_frequency || null;
    let frequency: Frequency;
    let nominalInterval: number;

    if (cadence && dictDefault && cadence.freq !== dictDefault) {
      // Dictionary disagrees with the observed cadence (e.g. Microsoft 365 is
      // monthly but a sparse window can look weekly). Trust the dictionary
      // and treat the cadence variance as a confidence penalty.
      frequency = dictDefault;
      nominalInterval = FREQUENCY_WINDOWS.find(w => w.freq === dictDefault)?.nominal || 30;
    } else if (cadence) {
      frequency = cadence.freq;
      nominalInterval = cadence.nominal;
    } else if (dictDefault) {
      frequency = dictDefault;
      nominalInterval = FREQUENCY_WINDOWS.find(w => w.freq === dictDefault)?.nominal || 30;
    } else if (clusterOverride?.decision === 'confirmed') {
      frequency = 'monthly';
      nominalInterval = 30;
    } else {
      continue; // cadence is too erratic
    }

    // ── Score ──────────────────────────────────────────────────────────────
    // Start from 0, layer in confidence boosts. Stable interval is the
    // single strongest signal; stable amount and dictionary match come next.
    let score = 0;

    // base for hitting the minimum count
    score += 20;
    if (sorted.length >= 6) score += 10;
    if (sorted.length >= 12) score += 5;

    // interval stability
    if (intervalStdev <= 1) score += 30;
    else if (intervalStdev <= 2) score += 22;
    else if (intervalStdev <= maxIntervalStdev) score += 12;
    else score -= 10; // erratic — penalize hard

    // amount stability
    if (amountCv <= 0.02) score += 25;
    else if (amountCv <= 0.05) score += 18;
    else if (amountCv <= effectiveMaxCv) score += 8;
    else score -= 15;

    // dictionary boost
    if (dictEntry?.bill_type === 'subscription') score += 12;
    else if (dictEntry?.bill_type === 'bill' || dictEntry?.bill_type === 'loan') score += 10;

    // user-confirmed: lock to high confidence
    if (clusterOverride?.decision === 'confirmed') score = Math.max(score, 95);

    score = Math.max(0, Math.min(100, Math.round(score)));

    const bucket: ConfidenceBucket = score >= 80 ? 'high' : score >= 55 ? 'medium' : 'low';

    // Hard reject if we don't pass minimum gates AND have no dictionary backing.
    if (!dictEntry && (amountCv > effectiveMaxCv || intervalStdev > maxIntervalStdev)) {
      continue;
    }

    // ── Lifecycle: did we miss expected charges? ──────────────────────────
    const lastDate = sorted[sorted.length - 1].date as Date;
    const daysSinceLast = daysBetween(now, lastDate);
    const missedRatio = daysSinceLast / nominalInterval;

    let status: LifecycleStatus;
    let reason: string | undefined;

    if (clusterOverride?.decision === 'confirmed') {
      status = daysSinceLast > nominalInterval * 2.5 ? 'cancelled' : 'active';
      if (status === 'cancelled') reason = `No charge in ${Math.round(daysSinceLast)} days`;
    } else if (missedRatio >= 2.5) {
      status = 'cancelled';
      reason = `Missed ${Math.floor(missedRatio - 1)} expected charge(s)`;
    } else if (missedRatio >= 1.4) {
      status = 'pending_review';
      reason = 'One charge overdue';
    } else if (bucket === 'low') {
      status = 'pending_review';
      reason = 'Low confidence — needs review';
    } else if (!dictEntry && bucket === 'medium') {
      status = 'pending_review';
      reason = 'Unknown merchant — confirm to keep';
    } else {
      status = 'active';
    }

    // ── Predict next charge ───────────────────────────────────────────────
    const nextDate = new Date(lastDate.getTime() + nominalInterval * 24 * 60 * 60 * 1000);

    // ── Display niceties from the dictionary ──────────────────────────────
    const baseName =
      dictEntry?.display_name ||
      sorted[sorted.length - 1].merchant ||
      sorted[sorted.length - 1].description;
    const displayName =
      amountClusters.length > 1
        ? `${baseName} (${clusterIndex + 1} of ${amountClusters.length})`
        : baseName;

    out.push({
      merchantPattern: clusterPattern,
      name: displayName,
      emoji: dictEntry?.emoji || '💳',
      category: clusterOverride?.category || dictEntry?.category || 'Subscriptions',
      billType: (clusterOverride?.bill_type as BillType) || dictEntry?.bill_type || 'subscription',
      amount: Math.round(medianAmount * 100) / 100,
      frequency,
      nextBillingDate: toDateOnly(nextDate),
      lastChargeDate: toDateOnly(lastDate),
      lastChargeAmount: Math.round(sorted[sorted.length - 1].amount * 100) / 100,
      firstSeenDate: toDateOnly(sorted[0].date as Date),
      chargeCount: sorted.length,
      avgIntervalDays: Math.round(medianInterval * 10) / 10,
      confidence: score,
      confidenceBucket: bucket,
      status,
      daysSinceLastCharge: Math.round(daysSinceLast),
      reason,
    });
    }
  }

  // Income: payroll / recurring deposits (separate pass — Rocket Money shows these on calendar)
  const incomeGroups = new Map<string, RawTransaction[]>();
  for (const tx of transactions) {
    if (tx.type !== 'income') continue;
    const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
    if (Number.isNaN(txDate.getTime()) || txDate < cutoff) continue;
    if (!Number.isFinite(tx.amount) || tx.amount <= 0) continue;
    const key = normalizeMerchant(tx.merchant || tx.description || '');
    if (!key || key.length < 3) continue;
    const hay = `${tx.merchant || ''} ${tx.description || ''}`.toLowerCase();
    const looksLikePayroll =
      hay.includes('payroll') ||
      hay.includes('direct dep') ||
      hay.includes('salary') ||
      hay.includes('wage') ||
      hay.includes('paycheck');
    if (!looksLikePayroll && tx.amount < 200) continue;
    let bucket = incomeGroups.get(key);
    if (!bucket) {
      bucket = [];
      incomeGroups.set(key, bucket);
    }
    bucket.push({ ...tx, date: txDate });
  }

  for (const [pattern, txs] of Array.from(incomeGroups.entries())) {
    if (txs.length < 2) continue;
    const sorted = [...txs].sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(daysBetween(sorted[i].date as Date, sorted[i - 1].date as Date));
    }
    const medianInterval = median(intervals);
    const cadence = classifyFrequency(medianInterval);
    if (!cadence) continue;
    const amounts = sorted.map(t => t.amount);
    const medianAmount = median(amounts);
    const lastDate = sorted[sorted.length - 1].date as Date;
    const nextDate = new Date(lastDate.getTime() + cadence.nominal * 24 * 60 * 60 * 1000);
    out.push({
      merchantPattern: `income:${pattern}`,
      name: sorted[sorted.length - 1].merchant || sorted[sorted.length - 1].description || 'Payroll',
      emoji: '💵',
      category: 'Income',
      billType: 'income',
      amount: Math.round(medianAmount * 100) / 100,
      frequency: cadence.freq,
      nextBillingDate: toDateOnly(nextDate),
      lastChargeDate: toDateOnly(lastDate),
      lastChargeAmount: Math.round(sorted[sorted.length - 1].amount * 100) / 100,
      firstSeenDate: toDateOnly(sorted[0].date as Date),
      chargeCount: sorted.length,
      avgIntervalDays: Math.round(medianInterval * 10) / 10,
      confidence: Math.min(99, 70 + sorted.length * 5),
      confidenceBucket: 'high',
      status: 'active',
      daysSinceLastCharge: Math.round(daysBetween(now, lastDate)),
    });
  }

  // Highest-confidence active subscriptions first, then review queue.
  return out.sort((a, b) => {
    const statusRank = (s: LifecycleStatus) =>
      s === 'active' ? 0 : s === 'pending_review' ? 1 : 2;
    const sr = statusRank(a.status) - statusRank(b.status);
    if (sr !== 0) return sr;
    return b.confidence - a.confidence;
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Backwards-compatible export. Older code imports
   `detectRecurringFromTransactions` and expects the old return shape; keep
   it around so we don't break a build mid-refactor.
   ────────────────────────────────────────────────────────────────────────── */
export interface LegacyCandidate {
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'bi-weekly' | 'quarterly' | 'annual';
  merchantPattern: string;
  category: string;
  confidence: number;
}

const LEGACY_FREQ: Record<Frequency, LegacyCandidate['frequency']> = {
  weekly: 'weekly',
  biweekly: 'bi-weekly',
  monthly: 'monthly',
  quarterly: 'quarterly',
  yearly: 'annual',
};

export function detectRecurringFromTransactions(
  transactions: { merchant?: string | null; description: string; amount: number; date: string; type: string }[],
): LegacyCandidate[] {
  return detectRecurring(transactions as RawTransaction[]).map(c => ({
    name: c.name,
    amount: c.amount,
    frequency: LEGACY_FREQ[c.frequency],
    merchantPattern: c.merchantPattern,
    category: c.category,
    confidence: c.confidence,
  }));
}
