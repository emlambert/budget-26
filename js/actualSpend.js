import { GBP } from './utils.js';

// Turns one month's raw joint/personal entries into rows with budgeted
// amount, combined total, and variance — mirrors computeFund's derivation
// style but for day-to-day category spend rather than sinking-fund pots.
export function computeActualSpend(monthEntry, budgetItems) {
  const budgetMap = new Map(
    budgetItems.filter(i => i.type === 'Spending').map(i => [i.name, i.amount])
  );

  const rows = (monthEntry ? monthEntry.entries : []).map(e => {
    const budgeted = budgetMap.has(e.category) ? budgetMap.get(e.category) : null;
    const hasData = e.joint !== null || e.personal !== null;
    const total = hasData ? (e.joint || 0) + (e.personal || 0) : null;
    const variance = (budgeted !== null && total !== null) ? budgeted - total : null;
    const pctUsed = (budgeted && total !== null) ? total / budgeted : null;
    return { ...e, budgeted, total, variance, pctUsed, hasData };
  });

  const totals = rows.reduce((acc, r) => {
    acc.budgeted += r.budgeted || 0;
    if (r.hasData) {
      acc.joint += r.joint || 0;
      acc.personal += r.personal || 0;
      acc.total += r.total;
      acc.anyData = true;
    }
    return acc;
  }, { budgeted: 0, joint: 0, personal: 0, total: 0, anyData: false });
  totals.variance = totals.anyData ? totals.budgeted - totals.total : null;

  return { rows, totals };
}

export function renderActualSpend(data) {
  const container = document.getElementById('spending-month-select');
  if (!container) return;

  const months = data.actualSpending || [];
  if (!months.length) return;

  // Simple month picker — most recent month shown by default.
  container.innerHTML = '';
  months.forEach((m, idx) => {
    const opt = document.createElement('option');
    opt.value = m.month;
    opt.textContent = new Date(m.month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (idx === months.length - 1) opt.selected = true;
    container.appendChild(opt);
  });

  const draw = () => {
    const selected = months.find(m => m.month === container.value) || months[months.length - 1];
    const { rows, totals } = computeActualSpend(selected, data.budgetItems);
    const tbody = document.getElementById('spending-body');
    tbody.innerHTML = '';

    rows.forEach(r => {
      const tr = document.createElement('tr');
      const pctBar = r.pctUsed !== null
        ? `<div class="progress-track"><div class="progress-fill ${r.pctUsed > 1 ? 'over' : ''}" style="width:${Math.min(r.pctUsed * 100, 100)}%"></div></div>`
        : '';
      const varianceCell = r.variance === null
        ? '—'
        : `<span class="${r.variance < 0 ? 'over-text' : 'under-text'}">${r.variance < 0 ? '−' : '+'}${GBP(Math.abs(r.variance))}</span>`;
      tr.innerHTML = `
        <td>${r.category}</td>
        <td class="num-cell">${GBP(r.budgeted)}</td>
        <td class="num-cell">${r.joint !== null ? GBP(r.joint) : '—'}</td>
        <td class="num-cell">${r.personal !== null ? GBP(r.personal) : '—'}</td>
        <td class="num-cell">${r.total !== null ? GBP(r.total) : '—'}</td>
        <td>${pctBar}</td>
        <td class="num-cell">${varianceCell}</td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById('spending-total-budgeted').textContent = GBP(totals.budgeted);
    document.getElementById('spending-total-joint').textContent = totals.anyData ? GBP(totals.joint) : '—';
    document.getElementById('spending-total-personal').textContent = totals.anyData ? GBP(totals.personal) : '—';
    document.getElementById('spending-total-actual').textContent = totals.anyData ? GBP(totals.total) : '—';
    document.getElementById('spending-total-variance').textContent = totals.variance === null
      ? '—'
      : `${totals.variance < 0 ? '−' : '+'}${GBP(Math.abs(totals.variance))}`;

    const emptyNote = document.getElementById('spending-empty-note');
    emptyNote.style.display = totals.anyData ? 'none' : 'block';
  };

  container.onchange = draw;
  draw();

  if (data.actualSpendingNote) {
    document.getElementById('spending-note').textContent = data.actualSpendingNote;
  }
}
