'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import type { Subscription } from '../../types/index';
import { VaultDataService } from '../../services/vaultDataService';
import {
  EXPECTED_BILL_PRESETS,
  findPresetBill,
  fmtUsd,
  nextBillingDateForDay,
  type ExpectedBillPreset,
} from '@/lib/vault/bills';
import { cn } from '@/lib/utils';

export function ExpectedBillsPanel({
  subscriptions,
  onSaved,
}: {
  subscriptions: Subscription[];
  onSaved: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const getAmount = (preset: ExpectedBillPreset) => {
    const existing = findPresetBill(subscriptions, preset);
    if (drafts[preset.id] !== undefined) return drafts[preset.id];
    if (existing && existing.amount > 0) return String(existing.amount);
    return '';
  };

  const save = async (preset: ExpectedBillPreset) => {
    const raw = getAmount(preset);
    const amount = parseFloat(raw);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSavingId(preset.id);
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
    setSavingId(null);
    if (ok) {
      setDrafts(d => {
        const next = { ...d };
        delete next[preset.id];
        return next;
      });
      onSaved();
    }
  };

  const configuredCount = EXPECTED_BILL_PRESETS.filter(p => {
    const b = findPresetBill(subscriptions, p);
    return b && b.amount > 0;
  }).length;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <p className="text-sm font-semibold text-stone-200">Expected bills</p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {configuredCount}/{EXPECTED_BILL_PRESETS.length} set · auto-detect fills in later
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-stone-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {EXPECTED_BILL_PRESETS.map(preset => {
            const existing = findPresetBill(subscriptions, preset);
            const amountStr = getAmount(preset);
            const isSaving = savingId === preset.id;
            const isSet = existing && existing.amount > 0;

            return (
              <div
                key={preset.id}
                className="flex flex-wrap items-center gap-2 py-2 border-t border-white/5 first:border-t-0"
              >
                <span className="text-lg w-8 text-center">{preset.emoji}</span>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-sm text-stone-200">{preset.name}</p>
                  <p className="text-[10px] text-stone-600 capitalize">{preset.billType.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 text-sm">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={amountStr}
                    onChange={e => setDrafts(d => ({ ...d, [preset.id]: e.target.value }))}
                    className="w-24 px-2 py-1.5 rounded-lg text-sm font-mono bg-stone-900/60 text-stone-200 border border-stone-700/50 focus:outline-none focus:border-emerald-500/40"
                  />
                  <span className="text-[10px] text-stone-600">/mo</span>
                  <button
                    type="button"
                    disabled={isSaving || !amountStr}
                    onClick={() => save(preset)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors',
                      isSet
                        ? 'bg-stone-800 text-stone-400 hover:text-emerald-300'
                        : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25',
                    )}
                  >
                    <Save className="w-3 h-3" />
                    {isSet ? 'Update' : 'Save'}
                  </button>
                </div>
                {isSet && existing && (
                  <span className="text-[10px] text-stone-600 w-full sm:w-auto sm:ml-auto">
                    Tracking {fmtUsd(existing.amount)}/mo
                  </span>
                )}
              </div>
            );
          })}
          <p className="text-[10px] text-stone-600 pt-2">
            Subscriptions also appear from bank sync — confirm them in the review queue above.
          </p>
        </div>
      )}
    </div>
  );
}
