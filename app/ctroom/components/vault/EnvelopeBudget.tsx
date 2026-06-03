'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { VaultDataService } from '../../services/vaultDataService';
import type { Subscription, VaultTransaction } from '../../types/index';
import {
  EXPECTED_BILL_PRESETS,
  findPresetBill,
  fmtUsd,
  computeMonthlyIncome,
  nextBillingDateForDay,
  type ExpectedBillPreset,
} from '@/lib/vault/bills';
import {
  computeUnallocated,
  getMonthKey,
  loadZbbState,
  saveZbbState,
  seedEnvelopesFromSubscriptions,
  type ZbbEnvelope,
} from '@/lib/vault/zbb';
import { cn } from '@/lib/utils';

const MACRO_ORDER: ('needs' | 'wants' | 'savings')[] = ['needs', 'wants', 'savings'];
const MACRO_LABELS = { needs: 'Needs', wants: 'Wants', savings: 'Savings & goals' };

function presetForEnvelope(envId: string): ExpectedBillPreset | undefined {
  return EXPECTED_BILL_PRESETS.find(p => p.id === envId);
}

export function EnvelopeBudget({
  transactions,
  subscriptions,
  onShowClassicBudget,
  onBillsChanged,
}: {
  transactions: VaultTransaction[];
  subscriptions: Subscription[];
  onShowClassicBudget?: () => void;
  onBillsChanged?: () => void;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [envelopes, setEnvelopes] = useState<ZbbEnvelope[]>([]);
  const [mounted, setMounted] = useState(false);
  const [savingBillId, setSavingBillId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const monthKey = getMonthKey();

  const income = computeMonthlyIncome(transactions);
  const monthlyIncome = income.total;
  const unallocated = computeUnallocated(monthlyIncome, envelopes);
  const isZero = monthlyIncome > 0 && Math.abs(unallocated) < 0.01;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null;
      setUserId(id);
      if (!id) {
        setMounted(true);
        return;
      }
      const saved = loadZbbState(id, monthKey);
      const seeded = seedEnvelopesFromSubscriptions(subscriptions, saved?.envelopes ?? null);
      setEnvelopes(seeded);
      if (!saved) saveZbbState(id, { monthKey, envelopes: seeded });
      setMounted(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  useEffect(() => {
    if (!mounted || !userId) return;
    const seeded = seedEnvelopesFromSubscriptions(subscriptions, envelopes);
    setEnvelopes(seeded);
    saveZbbState(userId, { monthKey, envelopes: seeded });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions]);

  const persist = useCallback(
    (next: ZbbEnvelope[]) => {
      setEnvelopes(next);
      if (userId) saveZbbState(userId, { monthKey, envelopes: next });
    },
    [userId, monthKey],
  );

  const grouped = useMemo(() => {
    const map: Record<string, ZbbEnvelope[]> = { needs: [], wants: [], savings: [] };
    envelopes.forEach(e => {
      const key = e.macroCategory || 'needs';
      map[key].push(e);
    });
    return map;
  }, [envelopes]);

  const updateAssigned = (id: string, assigned: number) => {
    persist(envelopes.map(e => (e.id === id ? { ...e, assigned: Math.max(0, assigned) } : e)));
  };

  const updateTarget = (id: string, target: number) => {
    persist(envelopes.map(e => (e.id === id ? { ...e, target: Math.max(0, target) } : e)));
  };

  const assignAllTargets = () => {
    persist(envelopes.map(e => ({ ...e, assigned: e.target })));
  };

  const addEnvelope = () => {
    persist([
      ...envelopes,
      { id: `custom-${Date.now()}`, name: 'New envelope', emoji: '💰', target: 0, assigned: 0, macroCategory: 'wants' },
    ]);
  };

  const saveBillTarget = async (preset: ExpectedBillPreset, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSavingBillId(preset.id);
    const ok = await VaultDataService.upsertExpectedBill({
      name: preset.name,
      emoji: preset.emoji,
      amount,
      frequency: 'monthly',
      category: preset.category,
      billType: preset.billType,
      merchantPattern: preset.merchantPattern,
      nextBillingDate: nextBillingDateForDay(preset.defaultDay ?? 1),
    });
    setSavingBillId(null);
    if (ok) {
      updateTarget(preset.id, Math.round(amount));
      onBillsChanged?.();
    }
  };

  if (!mounted) {
    return <div className="h-32 rounded-3xl bg-stone-900/40 animate-pulse" />;
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div
        className="rounded-3xl p-5 md:p-6"
        style={{
          background: isZero
            ? 'linear-gradient(160deg, rgba(110,231,160,0.12) 0%, rgba(28,25,23,0.9) 60%)'
            : 'linear-gradient(160deg, rgba(251,191,36,0.08) 0%, rgba(28,25,23,0.9) 60%)',
          border: `1px solid ${isZero ? 'rgba(110,231,160,0.2)' : 'rgba(255,255,255,0.08)'}`,
        }}
      >
        <p className="text-xs text-stone-500 uppercase tracking-wide">Assign · bills + envelopes</p>
        <p className="text-sm text-stone-400 mt-2">
          Income:{' '}
          <span className="font-mono text-emerald-300/90">{monthlyIncome > 0 ? fmtUsd(monthlyIncome) : '—'}</span>
          {income.paycheckCount > 0 && <span className="text-stone-600 text-xs ml-1">({income.note})</span>}
        </p>
        <p
          className={cn(
            'font-mono text-3xl font-bold mt-1',
            !monthlyIncome ? 'text-stone-600' : isZero ? 'text-emerald-300' : unallocated > 0 ? 'text-white' : 'text-rose-400',
          )}
        >
          {monthlyIncome > 0 ? fmtUsd(unallocated) : '—'}
        </p>
        <p className="text-xs text-stone-500 mt-1">
          {monthlyIncome <= 0
            ? 'Sync your bank — then set bill amounts and assign every dollar.'
            : isZero
              ? 'Every dollar has a job.'
              : unallocated > 0
                ? 'Unassigned — use targets below or Fill from targets.'
                : 'Over-assigned — lower some envelopes.'}
        </p>
        <button
          type="button"
          onClick={assignAllTargets}
          disabled={monthlyIncome <= 0}
          className="mt-3 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40"
        >
          Fill assigned from targets
        </button>
      </div>

      <p className="text-[11px] text-stone-600 px-1">
        Bill targets and envelopes are the same thing — setting a target here updates Plan → Bills and your monthly
        committed total.
      </p>

      {MACRO_ORDER.map(macro => {
        const list = grouped[macro];
        if (!list.length) return null;
        const isOpen = !collapsed[macro];
        const macroAssigned = list.reduce((s, e) => s + e.assigned, 0);
        const macroTarget = list.reduce((s, e) => s + e.target, 0);

        return (
          <section key={macro} className="rounded-2xl overflow-hidden bg-stone-900/30 border border-stone-800/60">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setCollapsed(c => ({ ...c, [macro]: isOpen }))}
            >
              <div>
                <p className="text-sm font-semibold text-stone-200">{MACRO_LABELS[macro]}</p>
                <p className="text-[11px] text-stone-500">
                  Target {fmtUsd(macroTarget)} · Assigned {fmtUsd(macroAssigned)}
                </p>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
            </button>

            {isOpen && (
              <div className="px-3 pb-3 space-y-2">
                {list.map(env => {
                  const preset = presetForEnvelope(env.id);
                  const existing = preset ? findPresetBill(subscriptions, preset) : undefined;
                  const isBillSaving = savingBillId === env.id;

                  return (
                    <div
                      key={env.id}
                      className="rounded-xl px-3 py-3 bg-stone-950/40 flex flex-wrap items-center gap-3 gap-y-2"
                    >
                      <span className="text-xl">{env.emoji}</span>
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-sm text-stone-200">{env.name}</p>
                        {preset && (
                          <p className="text-[10px] text-stone-600">
                            {existing?.autoDetected ? 'Detected + your target' : 'Your monthly bill'}
                          </p>
                        )}
                      </div>
                      <label className="text-[10px] text-stone-500">
                        Target / bill
                        <input
                          type="number"
                          value={env.target || ''}
                          disabled={isBillSaving}
                          onChange={e => updateTarget(env.id, parseFloat(e.target.value) || 0)}
                          onBlur={e => {
                            const v = parseFloat(e.target.value);
                            if (preset && Number.isFinite(v) && v > 0) saveBillTarget(preset, v);
                          }}
                          className="block w-24 mt-0.5 px-2 py-1.5 rounded-lg text-xs font-mono bg-stone-900 border border-stone-700 text-stone-200"
                        />
                      </label>
                      <label className="text-[10px] text-stone-500">
                        Assigned
                        <input
                          type="number"
                          value={env.assigned || ''}
                          onChange={e => updateAssigned(env.id, parseFloat(e.target.value) || 0)}
                          className="block w-24 mt-0.5 px-2 py-1.5 rounded-lg text-xs font-mono bg-stone-900 border border-stone-700 text-emerald-300/90"
                        />
                      </label>
                      <div className="w-full h-1 rounded-full bg-stone-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500/50 rounded-full transition-all"
                          style={{
                            width: `${env.target > 0 ? Math.min(100, (env.assigned / env.target) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => updateAssigned(env.id, env.target)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
                      >
                        Assign target
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <button
        type="button"
        onClick={addEnvelope}
        className="flex items-center gap-1 text-xs font-semibold text-emerald-400/90 hover:text-emerald-300"
      >
        <Plus className="w-3.5 h-3.5" /> Add custom envelope
      </button>

      {onShowClassicBudget && (
        <button
          type="button"
          onClick={onShowClassicBudget}
          className="text-xs text-stone-600 hover:text-stone-400 underline-offset-2 hover:underline"
        >
          Switch to classic category budgets →
        </button>
      )}
    </div>
  );
}
