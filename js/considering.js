import { GBP, PCT, monthsUntil, fundType } from './utils.js';

function computeConsideringMonthly(g) {
  if (g.target == null || !g.targetDate) return null;
  const months = monthsUntil(g.targetDate);
  if (months === 0) return g.target;
  return Math.round(g.target / months);
}

export function renderConsidering(data, totals, takeHome, onChange) {
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

  const whatIfTotal = data.consideringGoals
    .filter(g => g.considering)
    .reduce((s, g) => s + (computeConsideringMonthly(g) || 0), 0);
  document.getElementById('whatif-total').textContent = GBP(whatIfTotal);

  const whatIfSpendingTotal = data.consideringGoals
    .filter(g => g.considering && fundType(g.category) === 'Spending')
    .reduce((s, g) => s + (computeConsideringMonthly(g) || 0), 0);
  const projectedTrueGrowth = totals.savingsAmt - totals.spendingTypeMonthly - whatIfSpendingTotal;
  document.getElementById('whatif-truegrowth').textContent =
    `${PCT(projectedTrueGrowth / takeHome)} (from ${PCT((totals.savingsAmt - totals.spendingTypeMonthly) / takeHome)})`;

  box.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', e => {
      const idx = +e.target.dataset.idx;
      const g = data.consideringGoals[idx];
      if (e.target.classList.contains('cb-considering')) g.considering = e.target.checked;
      if (e.target.classList.contains('in-name')) g.name = e.target.value;
      if (e.target.classList.contains('in-category')) g.category = e.target.value;
      if (e.target.classList.contains('in-target')) g.target = e.target.value ? Number(e.target.value) : null;
      if (e.target.classList.contains('in-date')) g.targetDate = e.target.value || null;
      onChange();
    });
  });

  document.getElementById('add-considering').onclick = () => {
    data.consideringGoals.push({ considering: false, name: '', category: 'Trip', notes: '', target: null, targetDate: null });
    onChange();
  };
}
