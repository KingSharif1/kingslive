import type { DebtEntry, VaultTransaction } from '@/app/ctroom/types/index';

export interface DebtPaymentRule {
  debtId: string;
  /** Substrings matched against merchant + description (lowercase) */
  keywords: string[];
  /** If set, payment amount must be within 15% of this */
  expectedAmount?: number;
  servicer?: string;
  loanGroupLabel?: string;
}

const RULES_STORAGE = 'vault_debt_payment_rules_v1';

export const STUDENT_SERVICER_KEYWORDS: { label: string; keywords: string[] }[] = [
  { label: 'Nelnet', keywords: ['nelnet'] },
  { label: 'MOHELA', keywords: ['mohela'] },
  { label: 'Navient', keywords: ['navient'] },
  { label: 'Aidvantage', keywords: ['aidvantage'] },
  { label: 'Great Lakes', keywords: ['great lakes', 'greatlakes'] },
  { label: 'FedLoan', keywords: ['fedloan', 'fed loan'] },
  { label: 'OSLA', keywords: ['osla'] },
  { label: 'EdFinancial', keywords: ['edfinancial', 'ed financial'] },
  { label: 'Generic student loan', keywords: ['student loan', 'student ln', 'dept of ed', 'department of ed'] },
];

export function guessServicerFromText(text: string): string | undefined {
  const hay = text.toLowerCase();
  for (const s of STUDENT_SERVICER_KEYWORDS) {
    if (s.keywords.some(k => hay.includes(k))) return s.label;
  }
  return undefined;
}

export function loadDebtPaymentRules(userId: string): DebtPaymentRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${RULES_STORAGE}_${userId}`);
    return raw ? (JSON.parse(raw) as DebtPaymentRule[]) : [];
  } catch {
    return [];
  }
}

export function saveDebtPaymentRules(userId: string, rules: DebtPaymentRule[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${RULES_STORAGE}_${userId}`, JSON.stringify(rules));
}

export function upsertDebtPaymentRule(userId: string, rule: DebtPaymentRule) {
  const rules = loadDebtPaymentRules(userId).filter(r => r.debtId !== rule.debtId);
  rules.push(rule);
  saveDebtPaymentRules(userId, rules);
}

function txHaystack(tx: VaultTransaction): string {
  return `${tx.merchant || ''} ${tx.description || ''}`.toLowerCase();
}

export function transactionMatchesRule(tx: VaultTransaction, rule: DebtPaymentRule): boolean {
  if (tx.type !== 'expense') return false;
  const hay = txHaystack(tx);
  if (rule.keywords.length > 0 && !rule.keywords.some(k => hay.includes(k.toLowerCase()))) {
    return false;
  }
  if (rule.expectedAmount != null && rule.expectedAmount > 0) {
    const tol = rule.expectedAmount * 0.15;
    if (Math.abs(tx.amount - rule.expectedAmount) > tol) return false;
  }
  return true;
}

export function findPaymentsForDebt(
  debt: DebtEntry,
  transactions: VaultTransaction[],
  rule?: DebtPaymentRule,
): VaultTransaction[] {
  const defaultKeywords =
    debt.type === 'student_loan'
      ? STUDENT_SERVICER_KEYWORDS.flatMap(s => s.keywords)
      : [debt.name.toLowerCase()];

  const effective: DebtPaymentRule = rule ?? {
    debtId: debt.id,
    keywords: defaultKeywords,
    expectedAmount: debt.minimumPayment > 0 ? debt.minimumPayment : undefined,
  };

  return transactions
    .filter(t => transactionMatchesRule(t, effective))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Suggest rules when user has multiple student debts and recurring-like payment amounts. */
export function suggestStudentLoanRules(
  debts: DebtEntry[],
  transactions: VaultTransaction[],
): DebtPaymentRule[] {
  const studentDebts = debts.filter(d => d.type === 'student_loan');
  if (studentDebts.length === 0) return [];

  const loanTxs = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const hay = txHaystack(t);
    return STUDENT_SERVICER_KEYWORDS.some(s => s.keywords.some(k => hay.includes(k)));
  });

  const amountBuckets = new Map<number, VaultTransaction[]>();
  for (const tx of loanTxs) {
    const key = Math.round(tx.amount * 100) / 100;
    const list = amountBuckets.get(key) ?? [];
    list.push(tx);
    amountBuckets.set(key, list);
  }

  const sortedAmounts = [...amountBuckets.entries()]
    .filter(([, txs]) => txs.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  const rules: DebtPaymentRule[] = [];
  sortedAmounts.forEach(([amount], i) => {
    const debt = studentDebts[i];
    if (!debt) return;
    const sample = amountBuckets.get(amount)![0];
    const servicer = guessServicerFromText(txHaystack(sample));
    rules.push({
      debtId: debt.id,
      keywords: servicer
        ? (STUDENT_SERVICER_KEYWORDS.find(s => s.label === servicer)?.keywords ?? ['student loan'])
        : ['student loan'],
      expectedAmount: amount,
      servicer,
      loanGroupLabel:
        studentDebts.length > 1 ? `Payment group ${i + 1} of ${studentDebts.length}` : undefined,
    });
  });

  return rules;
}
