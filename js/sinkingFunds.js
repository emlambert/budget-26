import { GBP } from './utils.js';

export function renderSinkingFunds(funds, totals) {
  const tbody = document.getElementById('funds-body');
  tbody.innerHTML = '';

  funds.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${f.name}</td>
      <td><span class="badge ${f.fundType.toLowerCase()}">${f.fundType}</span></td>
      <td class="notes-cell">${f.notes || ''}</td>
      <td class="num-cell">${f.target !== null ? GBP(f.target) : '—'}</td>
      <td class="num-cell">${f.targetDate ? new Date(f.targetDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
      <td class="num-cell">${GBP(f.balance)}</td>
      <td class="num-cell">${f.stillNeeded !== null ? GBP(f.stillNeeded) : '—'}</td>
      <td class="num-cell">${typeof f.monthly === 'number' ? GBP(f.monthly) : '—'}</td>
      <td>${f.status}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('funds-total-target').textContent = GBP(totals.targetTotal);
  document.getElementById('funds-total-balance').textContent = GBP(totals.balanceTotal);
  document.getElementById('funds-total-monthly').textContent = GBP(totals.nearTermTotal);
  document.getElementById('funds-spending-monthly').textContent = GBP(totals.spendingTypeMonthly);
  document.getElementById('funds-growth-monthly').textContent = GBP(totals.growthTypeMonthly);
}
