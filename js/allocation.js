import { GBP } from './utils.js';

export function renderAllocation(data, totals) {
  const { emergencyFloor: floor } = data.monthlySavingsAllocation;
  const leftover = totals.savingsAmt - totals.nearTermTotal;
  const emergencyRecommended = Math.max(leftover, floor);
  const floorWarning = leftover < floor;

  document.getElementById('alloc-total').textContent = GBP(totals.savingsAmt);
  document.getElementById('alloc-nearterm').textContent = GBP(totals.nearTermTotal);
  document.getElementById('alloc-leftover').textContent = GBP(leftover);
  document.getElementById('alloc-floor').textContent = GBP(floor);
  document.getElementById('alloc-emergency').textContent = GBP(emergencyRecommended);

  const banner = document.getElementById('alloc-banner');
  if (floorWarning) {
    banner.className = 'warning-banner';
    banner.textContent = `⚠ This month's near-term commitments leave less than your £${floor}/mo protected minimum for the Emergency fund.`;
  } else {
    banner.className = 'ok-banner';
    banner.textContent = `OK — the Emergency fund floor is covered this month.`;
  }

  return { leftover, emergencyRecommended, floorWarning };
}
