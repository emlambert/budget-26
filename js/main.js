import { computeAllFunds, computeTotals } from './computeFunds.js';
import { computeAnnualPlanMonthly, renderAnnualPlan } from './annualPlan.js';
import { renderInvestments } from './investments.js';
import { renderDashboard } from './dashboard.js';
import { renderSinkingFunds } from './sinkingFunds.js';
import { renderAllocation } from './allocation.js';
import { renderCategoryCeilings } from './categoryCeilings.js';
import { renderAllCharts } from './charts.js';

function renderAll(data) {
  const funds = computeAllFunds(data.sinkingFunds);
  const { monthlyTotal: annualPlanMonthly } = computeAnnualPlanMonthly(data.annualSpendingPlan);
  const totals = computeTotals(funds, data.budgetItems, data.takeHome, annualPlanMonthly);

  renderInvestments(data, () => renderAll(data));
  renderDashboard(totals, data.takeHome);
  renderSinkingFunds(funds, totals);
  renderAllocation(data, totals);
  renderAnnualPlan(data, () => renderAll(data));
  renderCategoryCeilings(data);
  renderAllCharts(data, totals);

  if (data.savingsTrackerNote) {
    document.getElementById('tracker-note').textContent = data.savingsTrackerNote;
  }

  document.getElementById('last-updated').textContent = data.lastUpdated;
}

fetch('data.json?_=' + Date.now())
  .then(r => r.json())
  .then(renderAll)
  .catch(err => {
    document.body.innerHTML = `<div style="padding:2rem;font-family:sans-serif">Couldn't load data.json — ${err}</div>`;
  });
