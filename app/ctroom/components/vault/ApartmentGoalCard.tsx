'use client';

import { useState } from 'react';
import { Home } from 'lucide-react';
import type { SavingsGoal } from '../../types/index';
import { VaultDataService } from '../../services/vaultDataService';
import { fmtUsd } from '@/lib/vault/bills';

const GOAL_NAME = 'Apartment setup';

export function ApartmentGoalCard({
  goals,
  onSaved,
}: {
  goals: SavingsGoal[];
  onSaved: () => void;
}) {
  const existing = goals.find(
    g => g.name.toLowerCase().includes('apartment') || g.name.toLowerCase().includes('home setup'),
  );
  const [target, setTarget] = useState(existing ? String(existing.targetAmount) : '2000');
  const [saved, setSaved] = useState(existing?.currentAmount ?? 0);
  const [draftSaved, setDraftSaved] = useState(String(saved));
  const [busy, setBusy] = useState(false);

  if (existing && existing.currentAmount >= existing.targetAmount) {
    return (
      <div className="rounded-2xl px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
        <Home className="w-5 h-5 text-emerald-400" />
        <p className="text-sm text-emerald-300/90">Apartment setup goal funded — nice work.</p>
      </div>
    );
  }

  const progress = existing
    ? Math.min(100, Math.round((existing.currentAmount / existing.targetAmount) * 100))
    : 0;

  const createOrUpdate = async () => {
    const targetAmt = parseFloat(target) || 0;
    const currentAmt = parseFloat(draftSaved) || 0;
    if (targetAmt <= 0) return;
    setBusy(true);
    if (existing) {
      await VaultDataService.updateSavingsGoal(existing.id, {
        targetAmount: targetAmt,
        currentAmount: currentAmt,
      });
    } else {
      await VaultDataService.saveSavingsGoal({
        name: GOAL_NAME,
        emoji: '🛋️',
        targetAmount: targetAmt,
        currentAmount: currentAmt,
        color: '#a78bfa',
        goalType: 'save',
      });
    }
    setBusy(false);
    onSaved();
  };

  return (
    <div className="rounded-2xl p-4 bg-stone-900/40 backdrop-blur-sm space-y-3">
      <div className="flex items-start gap-3">
        <Home className="w-5 h-5 text-violet-400 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-stone-200">Make it home</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Furniture and setup are a project, not a monthly bill — track them here.
          </p>
        </div>
      </div>
      {existing && (
        <div>
          <div className="h-1.5 rounded-full bg-stone-800 overflow-hidden">
            <div className="h-full bg-violet-500/80 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {fmtUsd(existing.currentAmount)} of {fmtUsd(existing.targetAmount)}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] text-stone-500">
          Goal target
          <input
            type="number"
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="block w-full mt-0.5 px-2 py-1.5 rounded-lg text-sm font-mono bg-stone-950/60 border border-stone-700/50 text-stone-200"
          />
        </label>
        <label className="text-[10px] text-stone-500">
          Already saved
          <input
            type="number"
            value={draftSaved}
            onChange={e => setDraftSaved(e.target.value)}
            className="block w-full mt-0.5 px-2 py-1.5 rounded-lg text-sm font-mono bg-stone-950/60 border border-stone-700/50 text-stone-200"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={createOrUpdate}
        className="w-full py-2 rounded-xl text-xs font-semibold bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 disabled:opacity-50"
      >
        {existing ? 'Update goal' : 'Create apartment goal'}
      </button>
    </div>
  );
}
