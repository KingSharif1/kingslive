import type { Subscription } from '@/app/ctroom/types/index';
import { getLiveBills, toMonthly } from '@/lib/vault/bills';

export interface UpcomingBill {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  nextDate: Date;
  daysUntil: number;
  frequency: string;
  billType?: string;
  category?: string;
  monthly: number;
}

export function getUpcomingBills(subscriptions: Subscription[], windowDays = 45): UpcomingBill[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return getLiveBills(subscriptions)
    .map(s => {
      const nextDate = s.nextBillingDate
        ? new Date(s.nextBillingDate)
        : new Date(today.getFullYear(), today.getMonth() + 1, 1);
      nextDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);
      return {
        id: s.id,
        name: s.name,
        emoji: s.emoji || '💳',
        amount: s.amount,
        nextDate,
        daysUntil,
        frequency: s.frequency || 'monthly',
        billType: s.billType,
        category: s.category,
        monthly: toMonthly(s.amount, s.frequency),
      };
    })
    .filter(p => p.daysUntil >= 0 && p.daysUntil <= windowDays)
    .sort((a, b) => {
      if (a.billType === 'income' && b.billType !== 'income') return -1;
      if (b.billType === 'income' && a.billType !== 'income') return 1;
      return a.nextDate.getTime() - b.nextDate.getTime();
    });
}

export function getAllLiveBills(subscriptions: Subscription[]): UpcomingBill[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return getLiveBills(subscriptions)
    .map(s => {
      const nextDate = s.nextBillingDate ? new Date(s.nextBillingDate) : today;
      nextDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);
      return {
        id: s.id,
        name: s.name,
        emoji: s.emoji || '💳',
        amount: s.amount,
        nextDate,
        daysUntil,
        frequency: s.frequency || 'monthly',
        billType: s.billType,
        category: s.category,
        monthly: toMonthly(s.amount, s.frequency),
      };
    })
    .sort((a, b) => a.monthly - b.monthly)
    .reverse();
}
