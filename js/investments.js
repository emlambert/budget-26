import { GBP, PCT } from './utils.js';

export function portfolioTotal(investments) {
  return investments.holdings.reduce((s, h) => s + h.value, 0);
}

// Standard compound-growth-with-monthly-contribution projection.
// This is a planning estimate based on an assumed return, not a forecast
// or guarantee — markets don't move in a straight line.
export function computeInvestmentProjection(startBalance, monthlyContribution, annualReturnPct, months) {
  const monthlyRate = annualReturnPct / 100 / 12;
  const series = [];
  let balance = startBalance;
  for (let i = 0; i <= months; i++) {
    series.push(balance);
    balance = balance * (1 + monthlyRate) + monthlyContribution;
  }
  return series;
}

export function renderInvestments(data, onChange) {
  const inv = data.investments;
  const total = portfolioTotal(inv);

  document.getElementById('inv-platform').textContent = `${inv.portfolioName} — ${inv.platform}, ${inv.accountType}`;
  document.getElementById('inv-total').textContent = GBP(total);
  document.getElementById('inv-asof').textContent = new Date(inv.asOf).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const tbody = document.getElementById('inv-holdings-body');
  tbody.innerHTML = '';
  inv.holdings.forEach(h => {
    const actualPct = total > 0 ? (h.value / total) * 100 : 0;
    const drift = actualPct - h.targetAllocationPct;
    const driftLabel = Math.abs(drift) < 1.5
      ? '<span class="badge growth">on target</span>'
      : drift > 0
        ? `<span class="badge spending">+${drift.toFixed(1)}pp over</span>`
        : `<span class="badge spending">${drift.toFixed(1)}pp under</span>`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${h.name} <span class="notes-cell">(${h.ticker})</span></td>
      <td class="num-cell">${GBP(h.value)}</td>
      <td class="num-cell">${actualPct.toFixed(1)}%</td>
      <td class="num-cell">${h.targetAllocationPct}%</td>
      <td>${driftLabel}</td>
    `;
    tbody.appendChild(tr);
  });

  // Editable assumptions
  const contribInput = document.getElementById('inv-contribution');
  const returnInput = document.getElementById('inv-return');
  contribInput.value = inv.monthlyContribution;
  returnInput.value = inv.expectedAnnualReturnPct;

  contribInput.onchange = () => { inv.monthlyContribution = Number(contribInput.value) || 0; onChange(); };
  returnInput.onchange = () => { inv.expectedAnnualReturnPct = Number(returnInput.value) || 0; onChange(); };

  // Quick 5/10 year headline figures at the current assumption
  const proj5 = computeInvestmentProjection(total, inv.monthlyContribution, inv.expectedAnnualReturnPct, 60);
  const proj10 = computeInvestmentProjection(total, inv.monthlyContribution, inv.expectedAnnualReturnPct, 120);
  document.getElementById('inv-proj-5yr').textContent = GBP(proj5[proj5.length - 1]);
  document.getElementById('inv-proj-10yr').textContent = GBP(proj10[proj10.length - 1]);

  return { total };
}
