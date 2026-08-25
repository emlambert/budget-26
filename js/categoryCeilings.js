import { GBP } from './utils.js';

function computeCeiling(ceiling, sinkingFunds, annualSpendingPlan) {
  const items = [];

  sinkingFunds
    .filter(f => ceiling.sinkingFundNames.includes(f.name))
    .forEach(f => items.push({ label: f.name, amount: f.target || 0, source: 'Sinking Fund' }));

  annualSpendingPlan
    .filter(c => ceiling.annualPlanCategories.includes(c.category))
    .forEach(c => items.push({ label: c.category, amount: c.annualAmount || 0, source: 'Annual Plan' }));

  const committed = items.reduce((s, i) => s + i.amount, 0);
  return { items, committed, remaining: ceiling.ceilingPerYear - committed };
}

export function renderCategoryCeilings(data) {
  const box = document.getElementById('ceilings-box');
  box.innerHTML = '';

  data.categoryCeilings.forEach(ceiling => {
    const { items, committed, remaining } = computeCeiling(ceiling, data.sinkingFunds, data.annualSpendingPlan);
    const pctUsed = ceiling.ceilingPerYear > 0 ? Math.min(committed / ceiling.ceilingPerYear, 1.4) : 0;
    const over = remaining < 0;

    const wrap = document.createElement('div');
    wrap.className = 'stat-card';
    wrap.style.marginBottom = '0.75rem';
    wrap.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:0.5rem;">
        <div style="font-family:var(--font-display); font-weight:600; font-size:1.05rem;">${ceiling.name}</div>
        <div class="num" style="font-size:1rem;">${GBP(committed)} <span style="color:var(--ink-soft); font-weight:400; font-size:0.8rem;">of ${GBP(ceiling.ceilingPerYear)}/yr</span></div>
      </div>
      <div style="background:var(--paper); border-radius:999px; height:8px; margin:0.5rem 0; overflow:hidden;">
        <div style="width:${Math.min(pctUsed * 100, 100)}%; height:100%; background:${over ? 'var(--terracotta)' : 'var(--growth)'};"></div>
      </div>
      <div style="font-size:0.8rem; color:${over ? 'var(--terracotta)' : 'var(--ink-soft)'}; margin-bottom:0.4rem;">
        ${over ? `£${Math.abs(remaining).toFixed(0)} over — spread across more than one year's trips, so this may be fine, but worth a look` : `${GBP(remaining)} of headroom left`}
      </div>
      <div class="note" style="margin-top:0.3rem;">
        ${items.map(i => `${i.label} (${i.source}): ${GBP(i.amount)}`).join(' &nbsp;·&nbsp; ')}
      </div>
    `;
    box.appendChild(wrap);
  });
}
