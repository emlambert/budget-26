import { GBP } from './utils.js';

// Status text -> badge colour. "Funded" is unambiguously good; a fund with
// no target/deadline isn't behind, just not time-boxed, so it's neutral
// rather than a warning; anything still needing monthly funding gets the
// gold "in progress" treatment.
const STATUS_BADGE = {
  'Funded': 'growth',
  'No target set': 'neutral',
  'No deadline set': 'neutral',
  'On track if funding monthly': 'gold'
};

function progressBar(pctFunded) {
  if (pctFunded === null) return '';
  const pct = Math.min(Math.max(pctFunded, 0), 1) * 100;
  return `<div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="progress-label">${Math.round(pct)}%</div>`;
}

export function renderSinkingFunds(funds, totals) {
  const tbody = document.getElementById('funds-body');
  tbody.innerHTML = '';

  funds.forEach(f => {
    const tr = document.createElement('tr');
    const badgeClass = STATUS_BADGE[f.status] || 'neutral';
    tr.innerHTML = `
      <td>${f.name}</td>
      <td><span class="badge ${f.fundType.toLowerCase()}">${f.fundType}</span></td>
      <td class="notes-cell">${f.notes || ''}</td>
      <td class="num-cell">${f.target !== null ? GBP(f.target) : '—'}</td>
      <td class="num-cell">${f.targetDate ? new Date(f.targetDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
      <td class="num-cell">${GBP(f.balance)}</td>
      <td>${progressBar(f.pctFunded)}</td>
      <td class="num-cell">${f.stillNeeded !== null ? GBP(f.stillNeeded) : '—'}</td>
      <td class="num-cell">${typeof f.monthly === 'number' ? GBP(f.monthly) : '—'}</td>
      <td><span class="badge ${badgeClass}">${f.status}</span></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('funds-total-target').textContent = GBP(totals.targetTotal);
  document.getElementById('funds-total-balance').textContent = GBP(totals.balanceTotal);
  document.getElementById('funds-total-monthly').textContent = GBP(totals.nearTermTotal);
  document.getElementById('funds-spending-monthly').textContent = GBP(totals.spendingTypeMonthly);
  document.getElementById('funds-growth-monthly').textContent = GBP(totals.growthTypeMonthly);
}
