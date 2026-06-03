export function mapTellerAccountType(type: string, subtype?: string): string {
  if (type === 'depository') return subtype === 'savings' ? 'savings' : 'checking';
  if (type === 'credit') return 'credit';
  if (type === 'loan') return 'loan';
  if (type === 'investment') return 'investment';
  return 'checking';
}

export function getAccountColor(type: string): string {
  const colors: Record<string, string> = {
    depository: '#3b82f6',
    credit: '#ef4444',
    loan: '#f59e0b',
    investment: '#10b981',
  };
  return colors[type] || '#6b7280';
}
