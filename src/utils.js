// Get current date in Brazil/Fortaleza timezone
export function getBrazilDate() {
  const now = new Date();
  // Convert to Brazil timezone (UTC-3)
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
  return brazilTime.toISOString().split('T')[0];
}

export function getBrazilDateTime() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const diffTime = Math.abs(today - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  return `há ${diffDays} dias`;
}
