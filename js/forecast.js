import { addMonths, monthLabel, fundType } from './utils.js';

// Projects sinking-fund balances forward month by month:
//  - a dated pot (has a target date) grows by its own required monthly contribution
//  - a "Spending" dated pot (trip/occasion) empties out the month its date arrives —
//    simulating the money actually being spent
//  - whatever's left of the monthly savings pool after all dated pots are funded
//    ("leftover") flows to the Emergency fund up to its target, then to the Baby fund,
//    exactly matching the priority order on the Monthly Savings Allocation section
// Returns { labels, totalSeries, growthOnlySeries } ready for Chart.js.
export function computeForecast(sinkingFunds, savingsPool, emergencyFloor, monthsAhead = 24, today = new Date()) {
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

  const startOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1);
  const cursor = startOfMonth(today);

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

    // Step 2: whatever's left of the monthly savings pool goes to Emergency, then Baby
    let leftover = Math.max(savingsPool - datedContributionThisMonth, 0);
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
  }

  return { labels, totalSeries, growthOnlySeries };
}
