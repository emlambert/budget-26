import { GBP } from './utils.js';
import { computeForecast } from './forecast.js';
import { computeInvestmentProjection, portfolioTotal } from './investments.js';

let pieChart, trackerChart, forecastChart;

function chartFallback(canvasId, message) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = message || 'Chart library didn\'t load (offline or blocked) — figures are still correct above, just not plotted here.';
  canvas.replaceWith(note);
}

export function renderAllCharts(data, totals) {
  if (!window.Chart) {
    console.warn('Chart.js did not load — showing charts as plain text instead');
    chartFallback('pie-chart');
    chartFallback('tracker-chart');
    chartFallback('forecast-chart');
    return;
  }
  try { renderPie(data.budgetItems); } catch (e) { console.error('pie chart failed', e); chartFallback('pie-chart'); }
  try { renderTracker(data.savingsTracker); } catch (e) { console.error('tracker chart failed', e); chartFallback('tracker-chart'); }
  try { renderForecast(data.sinkingFunds, totals.savingsAmt, data.monthlySavingsAllocation.emergencyFloor, totals.annualPlanMonthly, data.investments); } catch (e) { console.error('forecast chart failed', e); chartFallback('forecast-chart'); }
}

// Exposed so the page router can force Chart.js to recompute sizing when a
// tab containing a chart becomes visible (canvases in display:none containers
// can otherwise render at zero size).
window.__resizeAllCharts = () => {
  [pieChart, trackerChart, forecastChart].forEach(c => { if (c) c.resize(); });
};

function renderPie(items) {
  const ctx = document.getElementById('pie-chart');
  const labels = items.map(i => i.name);
  const values = items.map(i => i.amount);
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#1B3A34', '#4C7A5E', '#A97F2E', '#B5533C', '#7C9885', '#C9A876', '#8B5A4A', '#5C7A6E', '#D4B483', '#3C5C54', '#9C6B4F', '#6B8E7A'],
        borderColor: '#F7F8F3',
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'IBM Plex Sans', size: 10 }, boxWidth: 12 } },
        tooltip: { callbacks: { label: c => `${c.label}: ${GBP(c.raw)}/mo` } }
      }
    }
  });
}

function renderTracker(tracker) {
  const ctx = document.getElementById('tracker-chart');
  const labels = tracker.map(t => t.quarter);
  const values = tracker.map(t => t.balance);
  if (trackerChart) trackerChart.destroy();
  trackerChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total savings & investment balance',
        data: values,
        borderColor: '#4C7A5E',
        backgroundColor: 'rgba(76,122,94,0.12)',
        fill: true,
        tension: 0.25,
        spanGaps: true,
        pointRadius: 4
      }]
    },
    options: {
      scales: { y: { ticks: { callback: v => '£' + v.toLocaleString() } } },
      plugins: { legend: { display: false } }
    }
  });
}

function renderForecast(sinkingFunds, savingsPool, emergencyFloor, annualPlanMonthly, investments) {
  const ctx = document.getElementById('forecast-chart');
  const { labels, totalSeries, growthOnlySeries, lifestyleSeries } = computeForecast(sinkingFunds, savingsPool, emergencyFloor, annualPlanMonthly, 24);
  const investmentSeries = computeInvestmentProjection(
    portfolioTotal(investments), investments.monthlyContribution, investments.expectedAnnualReturnPct, 24
  );
  const netWorthSeries = totalSeries.map((v, i) => v + investmentSeries[i]);

  if (forecastChart) forecastChart.destroy();
  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Total net worth (all pots + investments)',
          data: netWorthSeries,
          borderColor: '#1B3A34',
          backgroundColor: 'rgba(27,58,52,0.06)',
          borderWidth: 2.5,
          fill: false,
          tension: 0.15,
          pointRadius: 0
        },
        {
          label: 'All sinking funds (grows, then dips when a trip/wedding is paid for)',
          data: totalSeries,
          borderColor: '#A97F2E',
          backgroundColor: 'rgba(169,127,46,0.10)',
          fill: true,
          tension: 0.15,
          pointRadius: 0
        },
        {
          label: 'Growth-only (Emergency + Baby + Car — never dips)',
          data: growthOnlySeries,
          borderColor: '#4C7A5E',
          backgroundColor: 'rgba(76,122,94,0.12)',
          fill: true,
          tension: 0.15,
          pointRadius: 0
        },
        {
          label: 'Annual lifestyle plan (builds up, resets each year as it\'s spent)',
          data: lifestyleSeries,
          borderColor: '#B5533C',
          backgroundColor: 'rgba(181,83,60,0.08)',
          borderDash: [4, 3],
          fill: true,
          tension: 0.1,
          pointRadius: 0
        },
        {
          label: 'Investments (compounding, planning estimate)',
          data: investmentSeries,
          borderColor: '#3C6E96',
          backgroundColor: 'rgba(60,110,150,0.08)',
          borderDash: [2, 2],
          fill: true,
          tension: 0.15,
          pointRadius: 0
        }
      ]
    },
    options: {
      interaction: { mode: 'index', intersect: false },
      scales: { y: { ticks: { callback: v => '£' + v.toLocaleString() } } },
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'IBM Plex Sans', size: 10 }, boxWidth: 12 } },
        tooltip: { callbacks: { label: c => `${c.dataset.label.split(' (')[0]}: ${GBP(c.raw)}` } }
      }
    }
  });
}
