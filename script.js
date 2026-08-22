const GBP = n => n === null || n === undefined || isNaN(n)
  ? '—'
  : '£' + Math.round(n).toLocaleString('en-GB');
const PCT = n => n === null || n === undefined || isNaN(n) ? '—' : (n * 100).toFixed(1) + '%';
const monthsUntil = dateStr => {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(months, 0);
};
const fundType = category => (category === 'Buffer' || category === 'Long-term') ? 'Growth' : 'Spending';

function computeFund(f) {
  const stillNeeded = f.target == null ? null : Math.max(f.target - f.balance, 0);
  const months = monthsUntil(f.targetDate);
  let monthly = '—';
  if (stillNeeded !== null && stillNeeded > 0) {
    if (!f.targetDate) monthly = '—';
    else if (months === 0) monthly = stillNeeded;
    else monthly = Math.round(stillNeeded / months);
  }
  const pctFunded = (f.target && f.balance > 0) ? f.balance / f.target : null;
  let status;
  if (f.target == null) status = 'No target set';
  else if (f.balance >= f.target) status = 'Funded';
  else if (!f.targetDate) status = 'No deadline set';
  else status = 'On track if funding monthly';
  return { ...f, fundType: fundType(f.category), stillNeeded, months, monthly, pctFunded, status };
}

function render(data) {
  const funds = data.sinkingFunds.map(computeFund);

  // ---- Monthly Budget ----
  const savingsAmt = data.budgetItems.filter(i => i.type === 'Savings').reduce((s, i) => s + i.amount, 0);
  const spendingAmt = data.budgetItems.filter(i => i.type === 'Spending').reduce((s, i) => s + i.amount, 0);
  const savingsRate = savingsAmt / data.takeHome;

  const spendingTypeMonthly = funds
    .filter(f => f.fundType === 'Spending' && typeof f.monthly === 'number')
    .reduce((s, f) => s + f.monthly, 0);
  const growthTypeMonthly = funds
    .filter(f => f.fundType === 'Growth' && typeof f.monthly === 'number')
    .reduce((s, f) => s + f.monthly, 0);

  const trueGrowth = savingsAmt - spendingTypeMonthly;
  const trueGrowthRate = trueGrowth / data.takeHome;

  // ---- Monthly Savings Allocation ----
  const nearTermTotal = funds
    .filter(f => typeof f.monthly === 'number')
    .reduce((s, f) => s + f.monthly, 0);
  const leftover = savingsAmt - nearTermTotal;
  const floor = data.monthlySavingsAllocation.emergencyFloor;
  const emergencyRecommended = Math.max(leftover, floor);
  const floorWarning = leftover < floor;

  // ---- Sinking funds totals ----
  const targetTotal = funds.reduce((s, f) => s + (f.target || 0), 0);
  const balanceTotal = funds.reduce((s, f) => s + f.balance, 0);

  // ================= DASHBOARD =================
  document.getElementById('stat-takehome').textContent = GBP(data.takeHome);
  document.getElementById('stat-savingsrate').textContent = PCT(savingsRate);
  document.getElementById('stat-fundsbalance').textContent = GBP(balanceTotal);
  document.getElementById('stat-truegrowth').textContent = PCT(trueGrowthRate);

  // Bloom: 8 petals, lit proportionally to true growth rate (cap display at ~30% = full bloom)
  const petals = document.querySelectorAll('.bloom-petal');
  const litCount = Math.round(Math.min(trueGrowthRate / 0.30, 1) * petals.length);
  petals.forEach((p, i) => p.classList.toggle('lit', i < litCount));
  document.getElementById('bloom-figure').textContent = PCT(trueGrowthRate);
  document.getElementById('bloom-sub').textContent =
    `£${Math.round(trueGrowth)}/mo genuinely building your net worth — money already committed to trips, weddings and hen dos (£${Math.round(spendingTypeMonthly)}/mo) is set aside separately.`;

  // ================= SINKING FUNDS TABLE =================
  const tbody = document.getElementById('funds-body');
  tbody.innerHTML = '';
  funds.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${f.name}</td>
      <td><span class="badge ${f.fundType.toLowerCase()}">${f.fundType}</span></td>
      <td class="notes-cell">${f.notes || ''}</td>
      <td class="num-cell">${f.target !== null ? GBP(f.target) : '—'}</td>
      <td class="num-cell">${f.targetDate ? new Date(f.targetDate).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) : '—'}</td>
      <td class="num-cell">${GBP(f.balance)}</td>
      <td class="num-cell">${f.stillNeeded !== null ? GBP(f.stillNeeded) : '—'}</td>
      <td class="num-cell">${typeof f.monthly === 'number' ? GBP(f.monthly) : '—'}</td>
      <td>${f.status}</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('funds-total-target').textContent = GBP(targetTotal);
  document.getElementById('funds-total-balance').textContent = GBP(balanceTotal);
  document.getElementById('funds-total-monthly').textContent = GBP(nearTermTotal);
  document.getElementById('funds-spending-monthly').textContent = GBP(spendingTypeMonthly);
  document.getElementById('funds-growth-monthly').textContent = GBP(growthTypeMonthly);

  // ================= MONTHLY SAVINGS ALLOCATION =================
  document.getElementById('alloc-total').textContent = GBP(savingsAmt);
  document.getElementById('alloc-nearterm').textContent = GBP(nearTermTotal);
  document.getElementById('alloc-leftover').textContent = GBP(leftover);
  document.getElementById('alloc-floor').textContent = GBP(floor);
  document.getElementById('alloc-emergency').textContent = GBP(emergencyRecommended);
  const bannerEl = document.getElementById('alloc-banner');
  if (floorWarning) {
    bannerEl.className = 'warning-banner';
    bannerEl.textContent = `⚠ This month's near-term commitments leave less than your £${floor}/mo protected minimum for the Emergency fund. Check the "considering" section below before adding more.`;
  } else {
    bannerEl.className = 'ok-banner';
    bannerEl.textContent = `OK — the Emergency fund floor is covered this month.`;
  }

  // ================= CONSIDERING GOALS (interactive, client-side only) =================
  renderConsidering(data, savingsAmt, spendingTypeMonthly, data.takeHome);

  // ================= CHARTS (non-fatal if Chart.js failed to load) =================
  if (window.Chart) {
    try { renderPie(data.budgetItems); } catch (e) { console.error('pie chart failed', e); chartFallback('pie-chart'); }
    try { renderTracker(data.savingsTracker); } catch (e) { console.error('tracker chart failed', e); chartFallback('tracker-chart'); }
  } else {
    console.warn('Chart.js did not load — showing charts as plain text instead');
    chartFallback('pie-chart');
    chartFallback('tracker-chart');
  }

  document.getElementById('last-updated').textContent = data.lastUpdated;
}

function chartFallback(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = 'Chart library didn\'t load (offline or blocked) — figures are still correct above, just not plotted here.';
  canvas.replaceWith(note);
}

function computeConsideringMonthly(g) {
  if (g.target == null || !g.targetDate) return null;
  const months = monthsUntil(g.targetDate);
  if (months === 0) return g.target;
  return Math.round(g.target / months);
}

function renderConsidering(data, savingsAmt, spendingTypeMonthly, takeHome) {
  const box = document.getElementById('considering-rows');
  box.innerHTML = '';

  data.consideringGoals.forEach((g, idx) => {
    const monthly = computeConsideringMonthly(g);
    const row = document.createElement('div');
    row.className = 'considering-row';
    row.innerHTML = `
      <input type="checkbox" data-idx="${idx}" class="cb-considering" ${g.considering ? 'checked' : ''} aria-label="Include this goal in the what-if total">
      <input type="text" data-idx="${idx}" class="in-name" placeholder="Goal name" value="${g.name || ''}" style="width:140px">
      <select data-idx="${idx}" class="in-category">
        <option value="Trip" ${g.category === 'Trip' ? 'selected' : ''}>Trip</option>
        <option value="Occasion" ${g.category === 'Occasion' ? 'selected' : ''}>Occasion</option>
        <option value="Buffer" ${g.category === 'Buffer' ? 'selected' : ''}>Buffer</option>
        <option value="Long-term" ${g.category === 'Long-term' ? 'selected' : ''}>Long-term</option>
      </select>
      <input type="number" data-idx="${idx}" class="in-target" placeholder="Target £" value="${g.target ?? ''}" style="width:90px">
      <input type="date" data-idx="${idx}" class="in-date" value="${g.targetDate || ''}">
      <span class="considering-result">${monthly !== null ? GBP(monthly) + '/mo' : 'add target + date'}</span>
    `;
    box.appendChild(row);
  });

  // What-if total across ticked rows
  const whatIfTotal = data.consideringGoals
    .filter(g => g.considering)
    .reduce((s, g) => s + (computeConsideringMonthly(g) || 0), 0);
  document.getElementById('whatif-total').textContent = GBP(whatIfTotal);

  const whatIfSpendingTotal = data.consideringGoals
    .filter(g => g.considering && fundType(g.category) === 'Spending')
    .reduce((s, g) => s + (computeConsideringMonthly(g) || 0), 0);
  const projectedTrueGrowth = savingsAmt - spendingTypeMonthly - whatIfSpendingTotal;
  document.getElementById('whatif-truegrowth').textContent =
    `${PCT(projectedTrueGrowth / takeHome)} (from ${PCT((savingsAmt - spendingTypeMonthly) / takeHome)})`;

  // wire up interactivity — local state only, does not touch data.json
  box.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', e => {
      const idx = +e.target.dataset.idx;
      const g = data.consideringGoals[idx];
      if (e.target.classList.contains('cb-considering')) g.considering = e.target.checked;
      if (e.target.classList.contains('in-name')) g.name = e.target.value;
      if (e.target.classList.contains('in-category')) g.category = e.target.value;
      if (e.target.classList.contains('in-target')) g.target = e.target.value ? Number(e.target.value) : null;
      if (e.target.classList.contains('in-date')) g.targetDate = e.target.value || null;
      renderConsidering(data, savingsAmt, spendingTypeMonthly, takeHome);
    });
  });

  document.getElementById('add-considering').onclick = () => {
    data.consideringGoals.push({ considering: false, name: '', category: 'Trip', notes: '', target: null, targetDate: null });
    renderConsidering(data, savingsAmt, spendingTypeMonthly, takeHome);
  };
}

let pieChart, trackerChart;
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
        backgroundColor: ['#1B3A34','#4C7A5E','#A97F2E','#B5533C','#7C9885','#C9A876','#8B5A4A','#5C7A6E','#D4B483','#3C5C54','#9C6B4F','#6B8E7A'],
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
      scales: {
        y: { ticks: { callback: v => '£' + v.toLocaleString() } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

fetch('data.json?_=' + Date.now())
  .then(r => r.json())
  .then(render)
  .catch(err => {
    document.body.innerHTML = `<div style="padding:2rem;font-family:sans-serif">Couldn't load data.json — ${err}</div>`;
  });
