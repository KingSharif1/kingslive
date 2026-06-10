'use client';

import { useState } from 'react';
import { Download, FileText, Save, X } from 'lucide-react';
import type { SnapshotData } from '@/lib/vault/financeSnapshot';
import { FinanceSnapshotCard } from './FinanceSnapshotCard';
import { HealthCheckCard } from './HealthCheckCard';
import { downloadCsv, downloadPdf } from '@/lib/vault/snapshotExport';
import { cn } from '@/lib/utils';

export function SnapshotReportModal({
  snapshot,
  onClose,
  onSave,
  readOnly,
}: {
  snapshot: SnapshotData;
  onClose: () => void;
  onSave?: () => Promise<void>;
  readOnly?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    setMessage('');
    try {
      await onSave();
      setMessage('Saved to history');
    } catch {
      setMessage('Could not save — try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0c0a09] border border-stone-800 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-5 py-4 bg-[#0c0a09]/95 backdrop-blur border-b border-stone-800">
          <div>
            <p className="text-sm font-semibold text-stone-200">Finance snapshot report</p>
            <p className="text-[11px] text-stone-500">{snapshot.monthLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-stone-500 hover:text-stone-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <FinanceSnapshotCard snapshot={snapshot} />
          <HealthCheckCard metrics={snapshot.health} healthScore={snapshot.healthScore} />

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => downloadPdf(snapshot)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-800 text-stone-200 hover:bg-stone-700"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(snapshot)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-800 text-stone-200 hover:bg-stone-700"
            >
              <FileText className="w-3.5 h-3.5" /> CSV
            </button>
            {onSave && !readOnly && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold',
                  'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50',
                )}
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save to history'}
              </button>
            )}
          </div>
          {message && <p className="text-xs text-stone-500">{message}</p>}
        </div>
      </div>
    </div>
  );
}
