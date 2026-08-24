import { GBP } from './utils.js';

export function computeAnnualPlanMonthly(annualSpendingPlan) {
  const annualTotal = annualSpendingPlan.reduce((s, c) => s + (c.annualAmount || 0), 0);
  return { annualTotal, monthlyTotal: annualTotal / 12 };
}

export function renderAnnualPlan(data, onChange) {
  const tbody = document.getElementById('annual-plan-body');
  tbody.innerHTML = '';

  data.annualSpendingPlan.forEach((c, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <input type="text" data-idx="${idx}" class="in-category" value="${c.category}" style="width:100%; border:1px solid var(--line); border-radius:3px; padding:0.3rem; font-family:var(--font-body); font-size:0.85rem;">
      </td>
      <td class="notes-cell">
        <input type="text" data-idx="${idx}" class="in-notes" value="${c.notes || ''}" style="width:100%; border:1px solid var(--line); border-radius:3px; padding:0.3rem; font-family:var(--font-body); font-size:0.78rem;">
      </td>
      <td class="num-cell">
        <input type="number" data-idx="${idx}" class="in-amount" value="${c.annualAmount}" style="width:80px; text-align:right; border:1px solid var(--line); border-radius:3px; padding:0.3rem; font-family:var(--font-mono); font-size:0.85rem;">
      </td>
      <td class="num-cell">${GBP(c.annualAmount / 12)}/mo</td>
      <td><button data-idx="${idx}" class="remove-annual" title="Remove" style="border:none;background:none;color:var(--terracotta);cursor:pointer;font-size:1rem;">✕</button></td>
    `;
    tbody.appendChild(tr);
  });

  const { annualTotal, monthlyTotal } = computeAnnualPlanMonthly(data.annualSpendingPlan);
  document.getElementById('annual-plan-total-year').textContent = GBP(annualTotal);
  document.getElementById('annual-plan-total-month').textContent = GBP(monthlyTotal) + '/mo';

  tbody.querySelectorAll('input').forEach(el => {
    el.addEventListener('change', e => {
      const idx = +e.target.dataset.idx;
      const c = data.annualSpendingPlan[idx];
      if (e.target.classList.contains('in-category')) c.category = e.target.value;
      if (e.target.classList.contains('in-notes')) c.notes = e.target.value;
      if (e.target.classList.contains('in-amount')) c.annualAmount = Number(e.target.value) || 0;
      onChange();
    });
  });

  tbody.querySelectorAll('.remove-annual').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = +e.target.dataset.idx;
      data.annualSpendingPlan.splice(idx, 1);
      onChange();
    });
  });

  document.getElementById('add-annual').onclick = () => {
    data.annualSpendingPlan.push({ category: 'New category', annualAmount: 0, notes: '' });
    onChange();
  };
}
