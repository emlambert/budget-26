import { computeAllFunds, computeTotals } from './computeFunds.js';
import { computeAnnualPlanMonthly, renderAnnualPlan } from './annualPlan.js';
import { renderInvestments, portfolioTotal } from './investments.js';
import { renderDashboard } from './dashboard.js';
import { renderSinkingFunds } from './sinkingFunds.js';
import { renderAllocation } from './allocation.js';
import { renderConsidering } from './considering.js';
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
  renderConsidering(data, totals, data.takeHome, () => renderConsideringOnly(data, totals));
  renderAllCharts(data, totals);

  document.getElementById('last-updated').textContent = data.lastUpdated;
}

// Re-renders only the "considering" section on user interaction, without
// re-fetching data.json or redrawing charts/tables that haven't changed.
function renderConsideringOnly(data, totals) {
  renderConsidering(data, totals, data.takeHome, () => renderConsideringOnly(data, totals));
}

fetch('data.json?_=' + Date.now())
  .then(r => r.json())
  .then(renderAll)
  .catch(err => {
    document.body.innerHTML = `<div style="padding:2rem;font-family:sans-serif">Couldn't load data.json — ${err}</div>`;
  });
