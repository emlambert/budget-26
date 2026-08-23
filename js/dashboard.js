import { GBP, PCT } from './utils.js';

export function renderDashboard(totals, takeHome) {
  document.getElementById('stat-takehome').textContent = GBP(takeHome);
  document.getElementById('stat-savingsrate').textContent = PCT(totals.savingsRate);
  document.getElementById('stat-fundsbalance').textContent = GBP(totals.balanceTotal);
  document.getElementById('stat-truegrowth').textContent = PCT(totals.trueGrowthRate);

  const petals = document.querySelectorAll('.bloom-petal');
  const litCount = Math.round(Math.min(totals.trueGrowthRate / 0.30, 1) * petals.length);
  petals.forEach((p, i) => p.classList.toggle('lit', i < litCount));

  document.getElementById('bloom-figure').textContent = PCT(totals.trueGrowthRate);
  document.getElementById('bloom-sub').textContent =
    `£${Math.round(totals.trueGrowth)}/mo genuinely building your net worth — money already committed to trips, weddings and hen dos (£${Math.round(totals.spendingTypeMonthly)}/mo) is set aside separately.`;
}
