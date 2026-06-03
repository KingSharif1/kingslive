'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { VaultDataService } from '@/app/ctroom/services/vaultDataService';
import type { InvestmentPosition } from '@/app/ctroom/types';
import { VaultCard, VaultStat } from './VaultCard';

const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const BLANK = { symbol: '', name: '', shares: '', costBasis: '', currentPrice: '', positionType: 'etf' as const };

export function InvestmentsPanel() {
  const [positions, setPositions] = useState<InvestmentPosition[]>([]);
  const [roth, setRoth] = useState({ contributed: 0, limit: 7000, year: new Date().getFullYear() });
  const [form, setForm] = useState(BLANK);
  const [showForm, setShowForm] = useState(false);
  const [rothInput, setRothInput] = useState('');

  const load = useCallback(async () => {
    const [pos, r] = await Promise.all([
      VaultDataService.fetchInvestments(),
      VaultDataService.fetchRothIra(),
    ]);
    setPositions(pos);
    if (r) setRoth(r);
    for (const p of pos) {
      if (p.currentPrice <= 0 && p.symbol) {
        const q = await fetch(`/api/ctroom/vault/quote?symbol=${encodeURIComponent(p.symbol)}`);
        const data = await q.json();
        if (data.price) {
          await VaultDataService.updateInvestment(p.id, { currentPrice: data.price });
        }
      }
    }
    setPositions(await VaultDataService.fetchInvestments());
  }, []);

  useEffect(() => { load(); }, [load]);

  const portfolioValue = positions.reduce((s, p) => s + p.shares * p.currentPrice, 0);
  const portfolioCost = positions.reduce((s, p) => s + p.shares * p.costBasis, 0);
  const gain = portfolioValue - portfolioCost;

  const savePosition = async () => {
    let price = parseFloat(form.currentPrice) || 0;
    if (!price && form.symbol) {
      const q = await fetch(`/api/ctroom/vault/quote?symbol=${encodeURIComponent(form.symbol.toUpperCase())}`);
      const data = await q.json();
      price = data.price || 0;
    }
    await VaultDataService.saveInvestment({
      symbol: form.symbol.toUpperCase(),
      name: form.name || form.symbol.toUpperCase(),
      shares: parseFloat(form.shares) || 0,
      costBasis: parseFloat(form.costBasis) || 0,
      currentPrice: price,
      positionType: form.positionType,
    });
    setShowForm(false);
    setForm(BLANK);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <VaultStat label="Total Value" value={fmtFull(portfolioValue)} sub={`${positions.length} positions`} />
        <VaultStat label="Gain" value={`${gain >= 0 ? '+' : ''}${fmtFull(gain)}`} valueClassName={gain >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        <VaultStat label="Cost Basis" value={fmtFull(portfolioCost)} sub="Invested" valueClassName="text-white/60" />
      </div>

      <VaultCard>
        <p className="text-[10px] uppercase tracking-widest font-bold mb-2 text-vault-muted">Roth IRA — {roth.year}</p>
        <p className="text-xs text-vault-muted mb-2">${roth.contributed.toLocaleString()} of ${roth.limit.toLocaleString()}</p>
        <div className="h-2 rounded-full mb-3 bg-white/10">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (roth.contributed / roth.limit) * 100)}%` }} />
        </div>
        <div className="flex gap-2">
          <input type="number" value={rothInput} onChange={e => setRothInput(e.target.value)} placeholder="Total contributed ($)"
            className="flex-1 px-3 py-2 rounded-lg text-xs font-mono text-white border border-white/10 bg-transparent" />
          <button type="button" onClick={async () => {
            const v = parseFloat(rothInput);
            if (!isNaN(v)) { await VaultDataService.saveRothIra(v); setRothInput(''); load(); }
          }} className="px-3 py-2 rounded-lg text-xs font-bold text-vault-accent border border-vault-accent/30">Update</button>
        </div>
      </VaultCard>

      <VaultCard>
        <div className="flex justify-between items-center mb-4">
          <p className="text-[10px] uppercase tracking-widest font-bold text-vault-muted">Positions</p>
          <button type="button" onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs font-semibold text-vault-accent">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {showForm && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {['symbol', 'name', 'shares', 'costBasis', 'currentPrice'].map(key => (
              <input key={key} placeholder={key} value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="px-3 py-2 rounded-lg text-xs text-white border border-white/10 bg-transparent" />
            ))}
            <button type="button" onClick={savePosition} className="col-span-2 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-black">Save</button>
          </div>
        )}
        <div className="space-y-2">
          {positions.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <p className="font-mono font-bold text-white">{p.symbol}</p>
                <p className="text-xs text-vault-muted">{p.shares} sh · {fmtFull(p.currentPrice)}/sh</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-mono text-sm text-white">{fmtFull(p.shares * p.currentPrice)}</p>
                <button type="button" onClick={async () => { await VaultDataService.deleteInvestment(p.id); load(); }} className="text-red-400/60 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {!positions.length && <p className="text-sm text-vault-muted py-4 text-center">No positions yet. Add your S&P 500 or Fidelity holdings.</p>}
        </div>
      </VaultCard>
    </div>
  );
}
