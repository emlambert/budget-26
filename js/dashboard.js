import { GBP, PCT } from './utils.js';

export function renderDashboard(totals, takeHome, investmentsTotal, investmentsAsOf) {
  document.getElementById('stat-takehome').textContent = GBP(takeHome);
  document.getElementById('stat-savingsrate').textContent = PCT(totals.savingsRate);
  document.getElementById('stat-fundsbalance').textContent = GBP(totals.balanceTotal);
  document.getElementById('stat-truegrowth').textContent = PCT(totals.trueGrowthRate);

  // Net worth snapshot — sinking funds balance + investments, so the two
  // places money is actually building up show up together, first thing.
  const netWorth = totals.balanceTotal + investmentsTotal;
  document.getElementById('stat-networth').textContent = GBP(netWorth);
  document.getElementById('stat-networth-asof').textContent =
    new Date(investmentsAsOf).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const petals = document.querySelectorAll('.bloom-petal');
  const litCount = Math.round(Math.min(totals.trueGrowthRate / 0.30, 1) * petals.length);
  petals.forEach((p, i) => p.classList.toggle('lit', i < litCount));

  document.getElementById('bloom-figure').textContent = PCT(totals.trueGrowthRate);
  document.getElementById('bloom-sub').textContent =
    `£${Math.round(totals.trueGrowth)}/mo genuinely building your net worth — £${Math.round(totals.spendingTypeMonthly)}/mo already committed to named trips/weddings and £${Math.round(totals.annualPlanMonthly)}/mo set aside for your annual lifestyle plan are both accounted for separately.`;
}
