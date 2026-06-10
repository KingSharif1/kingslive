'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { VaultDataService } from '../../services/vaultDataService';
import type { FinanceSnapshotRecord } from '../../types/index';
import type { SnapshotData } from '@/lib/vault/financeSnapshot';
import { SnapshotReportModal } from './SnapshotReportModal';
import { fmtUsd } from '@/lib/vault/bills';

export function SnapshotHistory({ onDeleted }: { onDeleted?: () => void }) {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<FinanceSnapshotRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<SnapshotData | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await VaultDataService.fetchFinanceSnapshots();
    setRecords(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleDelete = async (id: string) => {
    const ok = await VaultDataService.deleteFinanceSnapshot(id);
    if (ok) {
      setConfirmId(null);
      await load();
      onDeleted?.();
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-stone-800/60 bg-stone-900/30 overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          onClick={() => setOpen(o => !o)}
        >
          <div>
            <p className="text-sm font-semibold text-stone-300">Saved snapshots</p>
            <p className="text-[11px] text-stone-600">View, re-export, or delete past reports</p>
          </div>
          {open ? (
            <ChevronUp className="w-4 h-4 text-stone-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-500" />
          )}
        </button>

        {open && (
          <div className="px-4 pb-4 space-y-2 border-t border-stone-800/60">
            {loading && <p className="text-xs text-stone-600 py-3">Loading…</p>}
            {!loading && records.length === 0 && (
              <p className="text-xs text-stone-600 py-3">No saved snapshots yet.</p>
            )}
            {records.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 py-2 border-b border-stone-800/40 last:border-0"
              >
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => setViewing(r.data)}
                >
                  <p className="text-sm text-stone-300">{r.data.monthLabel}</p>
                  <p className="text-[11px] text-stone-600">
                    Saved {new Date(r.createdAt).toLocaleDateString()} · Net{' '}
                    {fmtUsd(r.data.netRemaining)}
                  </p>
                </button>
                {confirmId === r.id ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="text-[10px] px-2 py-1 rounded bg-rose-500/20 text-rose-400"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="text-[10px] px-2 py-1 rounded bg-stone-800 text-stone-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(r.id)}
                    className="p-2 text-stone-600 hover:text-rose-400"
                    aria-label="Delete snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {viewing && (
        <SnapshotReportModal
          snapshot={viewing}
          onClose={() => setViewing(null)}
          readOnly
        />
      )}
    </>
  );
}
