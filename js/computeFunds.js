import { monthsUntil, fundType } from './utils.js';

// Turns one raw fund record into a fully-derived fund (still needed, monthly
// contribution, % funded, status) — mirrors the original spreadsheet formulas.
export function computeFund(f, today = new Date()) {
  const stillNeeded = f.target == null ? null : Math.max(f.target - f.balance, 0);
  const months = monthsUntil(f.targetDate, today);

  let monthly = '—';
  if (stillNeeded !== null && stillNeeded > 0) {
    if (!f.targetDate) monthly = '—';
    else if (months === 0) monthly = stillNeeded;
    else monthly = Math.round(stillNeeded / months);
  }

  const pctFunded = f.target ? Math.max(f.balance, 0) / f.target : null;

  let status;
  if (f.target == null) status = 'No target set';
  else if (f.balance >= f.target) status = 'Funded';
  else if (!f.targetDate) status = 'No deadline set';
  else status = 'On track if funding monthly';

  return { ...f, fundType: fundType(f.category), stillNeeded, months, monthly, pctFunded, status };
}

export function computeAllFunds(sinkingFunds, today = new Date()) {
  return sinkingFunds.map(f => computeFund(f, today));
}

// Aggregate figures reused by dashboard, allocation and forecast components.
export function computeTotals(funds, budgetItems, takeHome, annualPlanMonthly = 0) {
  const savingsAmt = budgetItems.filter(i => i.type === 'Savings').reduce((s, i) => s + i.amount, 0);
  const spendingAmt = budgetItems.filter(i => i.type === 'Spending').reduce((s, i) => s + i.amount, 0);
  const savingsRate = savingsAmt / takeHome;

  const numericMonthly = f => typeof f.monthly === 'number';
  const spendingTypeMonthly = funds.filter(f => f.fundType === 'Spending' && numericMonthly(f)).reduce((s, f) => s + f.monthly, 0);
  const growthTypeMonthly = funds.filter(f => f.fundType === 'Growth' && numericMonthly(f)).reduce((s, f) => s + f.monthly, 0);
  const nearTermTotal = funds.filter(numericMonthly).reduce((s, f) => s + f.monthly, 0);

  // True growth strips out BOTH committed sinking-fund spending (trips/weddings)
  // AND the annual lifestyle spending plan (holidays, gifts, garden, etc.) —
  // both are money you intend to spend, not money building your net worth.
  const trueGrowth = savingsAmt - spendingTypeMonthly - annualPlanMonthly;
  const trueGrowthRate = trueGrowth / takeHome;

  const targetTotal = funds.reduce((s, f) => s + (f.target || 0), 0);
  const balanceTotal = funds.reduce((s, f) => s + f.balance, 0);

  return {
    savingsAmt, spendingAmt, savingsRate, spendingTypeMonthly, growthTypeMonthly,
    nearTermTotal, trueGrowth, trueGrowthRate, targetTotal, balanceTotal, annualPlanMonthly
  };
}
