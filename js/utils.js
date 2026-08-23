// Shared formatting & date helpers used across every component.

export const GBP = n =>
  n === null || n === undefined || isNaN(n) ? '—' : '£' + Math.round(n).toLocaleString('en-GB');

export const PCT = n =>
  n === null || n === undefined || isNaN(n) ? '—' : (n * 100).toFixed(1) + '%';

export function monthsUntil(dateStr, from = new Date()) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const months = (target.getFullYear() - from.getFullYear()) * 12 + (target.getMonth() - from.getMonth());
  return Math.max(months, 0);
}

export function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

export function monthLabel(date) {
  return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

export const fundType = category =>
  (category === 'Buffer' || category === 'Long-term') ? 'Growth' : 'Spending';
