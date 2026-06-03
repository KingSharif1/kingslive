'use client';

import { useEffect, useState } from 'react';
import { Link2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DebtEntry, VaultTransaction } from '../../types/index';
import { fmtUsd } from '@/lib/vault/bills';
import {
  findPaymentsForDebt,
  loadDebtPaymentRules,
  saveDebtPaymentRules,
  suggestStudentLoanRules,
  upsertDebtPaymentRule,
  type DebtPaymentRule,
} from '@/lib/vault/debtPayments';
export function StudentLoanMatcher({
  debts,
  transactions,
}: {
  debts: DebtEntry[];
  transactions: VaultTransaction[];
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [rules, setRules] = useState<DebtPaymentRule[]>([]);
  const studentDebts = debts.filter(d => d.type === 'student_loan');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null;
      setUserId(id);
      if (id) setRules(loadDebtPaymentRules(id));
    });
  }, []);

  if (studentDebts.length === 0) return null;

  const applySuggestions = () => {
    if (!userId) return;
    const suggested = suggestStudentLoanRules(studentDebts, transactions);
    saveDebtPaymentRules(userId, suggested);
    setRules(suggested);
  };

  const ruleFor = (debtId: string) => rules.find(r => r.debtId === debtId);

  return (
    <div className="rounded-2xl p-4 space-y-3 bg-stone-900/40 border border-stone-800/80">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-stone-200">Which payment goes where?</p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Match bank charges to each student loan — like Rocket Money&apos;s &quot;Loan 1 of 2&quot;.
          </p>
        </div>
        <button
          type="button"
          onClick={applySuggestions}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-violet-500/15 text-violet-300 shrink-0"
        >
          <Sparkles className="w-3 h-3" /> Auto-match
        </button>
      </div>

      {studentDebts.map(debt => {
        const rule = ruleFor(debt.id);
        const payments = findPaymentsForDebt(debt, transactions, rule);
        const last = payments[0];

        return (
          <div key={debt.id} className="rounded-xl p-3 bg-stone-950/50 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-stone-200 truncate">{debt.name}</p>
              <p className="font-mono text-sm text-stone-400">{fmtUsd(debt.balance)}</p>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <label className="text-[10px] text-stone-600 flex-1 min-w-[120px]">
                Typical payment
                <input
                  type="number"
                  defaultValue={(rule?.expectedAmount ?? debt.minimumPayment) || ''}
                  onBlur={e => {
                    if (!userId) return;
                    const amt = parseFloat(e.target.value);
                    upsertDebtPaymentRule(userId, {
                      debtId: debt.id,
                      keywords: rule?.keywords ?? ['student loan'],
                      expectedAmount: Number.isFinite(amt) ? amt : undefined,
                      servicer: rule?.servicer,
                      loanGroupLabel: rule?.loanGroupLabel,
                    });
                    setRules(loadDebtPaymentRules(userId));
                  }}
                  className="block w-full mt-0.5 px-2 py-1 rounded-lg text-xs font-mono bg-stone-900 border border-stone-700 text-stone-200"
                  placeholder="e.g. 184.75"
                />
              </label>
              {last && (
                <p className="text-[11px] text-stone-500">
                  Last paid {new Date(last.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
                  {fmtUsd(last.amount)}
                </p>
              )}
            </div>
            {payments.length > 0 && (
              <div className="border-t border-stone-800 pt-2 space-y-1 max-h-24 overflow-y-auto">
                {payments.slice(0, 4).map(tx => (
                  <div key={tx.id} className="flex justify-between text-[11px]">
                    <span className="text-stone-500 truncate pr-2">
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
                      {(tx.merchant || tx.description || '').slice(0, 28)}
                    </span>
                    <span className="font-mono text-stone-400">{fmtUsd(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            {!payments.length && (
              <p className="text-[11px] text-stone-600 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Set amount or run Auto-match after sync
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
