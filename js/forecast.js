import { addMonths, monthLabel, fundType } from './utils.js';

// Projects sinking-fund balances forward month by month:
//  - a dated pot (has a target date) grows by its own required monthly contribution
//  - a "Spending" dated pot (trip/occasion) empties out the month its date arrives —
//    simulating the money actually being spent
//  - the annual spending plan (holidays, gifts, garden, etc.) draws from the same
//    monthly savings pool before anything reaches Emergency/Baby, and is modelled
//    as its own rolling balance that resets every 12 months as it's spent through the year
//  - whatever's left after dated pots AND the annual plan flows to the Emergency
//    fund up to its target, then to the Baby fund — same priority order as the
//    Monthly Savings Allocation section
// Returns { labels, totalSeries, growthOnlySeries, lifestyleSeries } ready for Chart.js.
export function computeForecast(sinkingFunds, savingsPool, emergencyFloor, annualPlanMonthly = 0, monthsAhead = 24, today = new Date()) {
  const state = sinkingFunds.map(f => ({
    ...f,
    fundType: fundType(f.category),
    balance: f.balance,
    target: f.target,
    targetDate: f.targetDate ? new Date(f.targetDate) : null
  }));
  const emergency = state.find(f => f.name.toLowerCase().includes('emergency'));
  const baby = state.find(f => f.name.toLowerCase().includes('baby'));

  const labels = [];
  const totalSeries = [];
  const growthOnlySeries = [];
  const lifestyleSeries = [];

  const startOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1);
  const cursor = startOfMonth(today);

  let lifestyleBalance = 0;

  for (let i = 0; i <= monthsAhead; i++) {
    const monthDate = addMonths(cursor, i);
    labels.push(monthLabel(monthDate));

    let datedContributionThisMonth = 0;

    // Step 1: fund every dated pot (trips, occasions, and dated growth pots like Car)
    state.forEach(f => {
      if (!f.targetDate) return;
      if (f.target == null || f.balance >= f.target) return;

      const monthsLeft = Math.max(
        (f.targetDate.getFullYear() - monthDate.getFullYear()) * 12 + (f.targetDate.getMonth() - monthDate.getMonth()),
        0
      );
      const stillNeeded = Math.max(f.target - f.balance, 0);
      const contribution = monthsLeft === 0 ? stillNeeded : Math.round(stillNeeded / (monthsLeft + 1));
      f.balance += contribution;
      datedContributionThisMonth += contribution;

      // Spend event: a committed Spending-type pot empties out the month it's due
      if (monthsLeft === 0 && f.fundType === 'Spending') {
        f.balance = 0;
        f.target = 0; // fully spent, stop projecting further contributions
      }
    });

    // Step 2: the annual lifestyle plan draws from the same pool, and rolls over
    // (spent down) every 12 months rather than accumulating indefinitely
    lifestyleBalance += annualPlanMonthly;
    if (i > 0 && i % 12 === 0) lifestyleBalance = 0; // simulated annual spend-down

    // Step 3: whatever's left of the monthly savings pool goes to Emergency, then Baby
    let leftover = Math.max(savingsPool - datedContributionThisMonth - annualPlanMonthly, 0);
    if (emergency && emergency.balance < emergency.target) {
      const room = emergency.target - emergency.balance;
      const toEmergency = Math.min(leftover, room);
      emergency.balance += toEmergency;
      leftover -= toEmergency;
    }
    if (baby && leftover > 0) {
      baby.balance += leftover;
    }

    const total = state.reduce((s, f) => s + f.balance, 0);
    const growthOnly = state.filter(f => f.fundType === 'Growth').reduce((s, f) => s + f.balance, 0);

    totalSeries.push(total);
    growthOnlySeries.push(growthOnly);
    lifestyleSeries.push(lifestyleBalance);
  }

  return { labels, totalSeries, growthOnlySeries, lifestyleSeries };
}
