import type { Subscription } from '@/app/ctroom/types/index';
import { findPresetBill, EXPECTED_BILL_PRESETS, toMonthly } from '@/lib/vault/bills';

export type BudgetFramework = 'zero_based' | '50_30_20' | 'reverse';

export interface ZbbEnvelope {
  id: string;
  name: string;
  emoji: string;
  target: number;
  assigned: number;
  macroCategory?: 'needs' | 'wants' | 'savings';
}

export interface ZbbMonthState {
  monthKey: string;
  envelopes: ZbbEnvelope[];
}

const STORAGE_PREFIX = 'vault_zbb_v1';
const FRAMEWORK_KEY = 'vault_framework_v1';

export const DEFAULT_ZBB_ENVELOPES: Omit<ZbbEnvelope, 'assigned'>[] = [
  { id: 'rent', name: 'Rent', emoji: '🏠', target: 1100, macroCategory: 'needs' },
  { id: 'utilities', name: 'Utilities', emoji: '💡', target: 150, macroCategory: 'needs' },
  { id: 'groceries', name: 'Groceries', emoji: '🛒', target: 300, macroCategory: 'needs' },
  { id: 'transport', name: 'Gas & Transport', emoji: '🚗', target: 120, macroCategory: 'needs' },
  { id: 'car-insurance', name: 'Car Insurance', emoji: '🛡️', target: 150, macroCategory: 'needs' },
  { id: 'student-loan', name: 'Student Loan', emoji: '🎓', target: 0, macroCategory: 'needs' },
  { id: 'family-loan', name: 'Family Loan', emoji: '👨‍👩‍👧', target: 0, macroCategory: 'needs' },
  { id: 'subscriptions', name: 'Subscriptions', emoji: '📱', target: 80, macroCategory: 'wants' },
  { id: 'emergency', name: 'Emergency Buffer', emoji: '🛟', target: 200, macroCategory: 'savings' },
  { id: 'apartment', name: 'Apartment Setup', emoji: '🛋️', target: 200, macroCategory: 'wants' },
  { id: 'avalanche', name: 'Extra Debt (Avalanche)', emoji: '⚡', target: 0, macroCategory: 'savings' },
];

export function getMonthKey(ref = new Date()): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`;
}

function storageKey(userId: string, monthKey: string) {
  return `${STORAGE_PREFIX}_${userId}_${monthKey}`;
}

export function loadFramework(): BudgetFramework {
  if (typeof window === 'undefined') return 'zero_based';
  const v = localStorage.getItem(FRAMEWORK_KEY);
  if (v === '50_30_20' || v === 'reverse') return v;
  return 'zero_based';
}

export function saveFramework(fw: BudgetFramework) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FRAMEWORK_KEY, fw);
}

export function loadZbbState(userId: string, monthKey = getMonthKey()): ZbbMonthState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(userId, monthKey));
    if (!raw) return null;
    return JSON.parse(raw) as ZbbMonthState;
  } catch {
    return null;
  }
}

export function saveZbbState(userId: string, state: ZbbMonthState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId, state.monthKey), JSON.stringify(state));
}

/** Merge subscription amounts into envelope targets (does not overwrite assigned). */
export function seedEnvelopesFromSubscriptions(
  subscriptions: Subscription[],
  existing: ZbbEnvelope[] | null,
): ZbbEnvelope[] {
  const base = existing?.length
    ? existing
    : DEFAULT_ZBB_ENVELOPES.map(e => ({ ...e, assigned: 0 }));

  const byId = new Map(base.map(e => [e.id, { ...e }]));

  for (const preset of EXPECTED_BILL_PRESETS) {
    const sub = findPresetBill(subscriptions, preset);
    if (!sub || sub.amount <= 0) continue;
    const monthly = Math.round(toMonthly(sub.amount, sub.frequency));
    const env = byId.get(preset.id);
    if (env) {
      env.target = monthly;
      if (env.assigned === 0) env.assigned = monthly;
    }
  }

  return Array.from(byId.values());
}

export function computeUnallocated(monthlyIncome: number, envelopes: ZbbEnvelope[]): number {
  const assigned = envelopes.reduce((s, e) => s + (e.assigned || 0), 0);
  return Math.round((monthlyIncome - assigned) * 100) / 100;
}

export function computeTotalAssigned(envelopes: ZbbEnvelope[]): number {
  return envelopes.reduce((s, e) => s + (e.assigned || 0), 0);
}
