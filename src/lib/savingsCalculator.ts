import { addMonths, format } from 'date-fns';

export interface SavingsCalculatorInput {
  targetAmount: number;
  currentSavings: number;
  monthlyContribution: number;
  annualInterestRate?: number; // Annual interest percentage (e.g. 4.5 for 4.5% APY)
}

export interface MonthlyChartPoint {
  month: number;
  monthLabel: string;
  displayMonth: string;
  balance: number;
  principal: number;
  interest: number;
  target: number;
}

export interface CalculatorMilestone {
  percent: number;
  label: string;
  amount: number;
  month: number;
  dateStr: string;
  isCompletedInitially: boolean;
}

export interface ContributionScenario {
  monthlyAmount: number;
  difference: number;
  months: number;
  monthsDifference: number; // positive = saves months, negative = adds months
  targetDateStr: string;
}

export interface TargetPaceOption {
  months: number;
  label: string;
  requiredMonthly: number;
  targetDateStr: string;
}

export interface SavingsCalculatorResult {
  isAlreadyReached: boolean;
  targetAmount: number;
  currentSavings: number;
  monthlyContribution: number;
  annualInterestRate: number;
  remainingAmount: number;
  monthsRequired: number;
  formattedDuration: string;
  targetDate: Date;
  formattedTargetDate: string;
  totalContributions: number;
  totalInterestEarned: number;
  finalBalance: number;
  chartData: MonthlyChartPoint[];
  milestones: CalculatorMilestone[];
  scenarios: ContributionScenario[];
  paceOptions: TargetPaceOption[];
}

export function calculateSavingsTimeline({
  targetAmount,
  currentSavings,
  monthlyContribution,
  annualInterestRate = 0,
}: SavingsCalculatorInput): SavingsCalculatorResult {
  const target = Math.max(0, targetAmount);
  const current = Math.max(0, currentSavings);
  const monthly = Math.max(0, monthlyContribution);
  const apy = Math.max(0, annualInterestRate);

  const remaining = Math.max(0, target - current);
  const isAlreadyReached = current >= target && target > 0;

  if (isAlreadyReached || target === 0) {
    const now = new Date();
    return {
      isAlreadyReached: true,
      targetAmount: target,
      currentSavings: current,
      monthlyContribution: monthly,
      annualInterestRate: apy,
      remainingAmount: 0,
      monthsRequired: 0,
      formattedDuration: 'Goal Reached',
      targetDate: now,
      formattedTargetDate: format(now, 'MMMM yyyy'),
      totalContributions: 0,
      totalInterestEarned: 0,
      finalBalance: current,
      chartData: [
        {
          month: 0,
          monthLabel: 'Start',
          displayMonth: format(now, 'MMM yyyy'),
          balance: current,
          principal: current,
          interest: 0,
          target,
        },
      ],
      milestones: [
        {
          percent: 100,
          label: '100% Target',
          amount: target,
          month: 0,
          dateStr: format(now, 'MMM yyyy'),
          isCompletedInitially: true,
        },
      ],
      scenarios: [],
      paceOptions: [],
    };
  }

  // If monthly contribution is zero and interest is zero or won't reach target
  const monthlyRate = apy > 0 ? apy / 100 / 12 : 0;
  const isInfinite = monthly <= 0 && (current <= 0 || monthlyRate <= 0);

  if (isInfinite) {
    const farFuture = addMonths(new Date(), 1200);
    return {
      isAlreadyReached: false,
      targetAmount: target,
      currentSavings: current,
      monthlyContribution: monthly,
      annualInterestRate: apy,
      remainingAmount: remaining,
      monthsRequired: Infinity,
      formattedDuration: 'Contribution needed',
      targetDate: farFuture,
      formattedTargetDate: 'Never without contributions',
      totalContributions: 0,
      totalInterestEarned: 0,
      finalBalance: current,
      chartData: [],
      milestones: [],
      scenarios: [],
      paceOptions: [],
    };
  }

  // Simulation: Month by month simulation for precise compounding and milestone tracking
  const maxSimMonths = 600; // Cap at 50 years to prevent infinite loops
  let balance = current;
  let totalDeposited = 0;
  let totalInterest = 0;
  let monthsCount = 0;

  const chartData: MonthlyChartPoint[] = [];
  const milestones: CalculatorMilestone[] = [
    {
      percent: 25,
      label: '25% Milestone',
      amount: target * 0.25,
      month: -1,
      dateStr: '',
      isCompletedInitially: current >= target * 0.25,
    },
    {
      percent: 50,
      label: '50% Halfway',
      amount: target * 0.5,
      month: -1,
      dateStr: '',
      isCompletedInitially: current >= target * 0.5,
    },
    {
      percent: 75,
      label: '75% Home Stretch',
      amount: target * 0.75,
      month: -1,
      dateStr: '',
      isCompletedInitially: current >= target * 0.75,
    },
    {
      percent: 100,
      label: '100% Target Met',
      amount: target,
      month: -1,
      dateStr: '',
      isCompletedInitially: false,
    },
  ];

  const now = new Date();

  // Add initial point
  chartData.push({
    month: 0,
    monthLabel: 'Start',
    displayMonth: format(now, 'MMM yyyy'),
    balance: current,
    principal: current,
    interest: 0,
    target,
  });

  while (balance < target && monthsCount < maxSimMonths) {
    monthsCount++;
    const interestThisMonth = balance * monthlyRate;
    balance += interestThisMonth + monthly;
    totalInterest += interestThisMonth;
    totalDeposited += monthly;

    const simDate = addMonths(now, monthsCount);

    // Record milestone arrivals
    milestones.forEach((m) => {
      if (m.month === -1 && balance >= m.amount) {
        m.month = monthsCount;
        m.dateStr = format(simDate, 'MMM yyyy');
      }
    });

    // Sample data points for chart so we don't have too many points
    // If <= 24 months, record every month. If > 24 months, record every 2 or 3 months.
    const shouldRecord =
      monthsCount <= 24 ||
      monthsCount % (monthsCount > 120 ? 6 : monthsCount > 60 ? 3 : 2) === 0 ||
      balance >= target;

    if (shouldRecord) {
      chartData.push({
        month: monthsCount,
        monthLabel: `M${monthsCount}`,
        displayMonth: format(simDate, 'MMM yyyy'),
        balance: Math.round(balance),
        principal: Math.round(current + totalDeposited),
        interest: Math.round(totalInterest),
        target,
      });
    }
  }

  // Ensure 100% milestone has a date if reached
  const targetDate = addMonths(now, monthsCount);
  const targetMilestone = milestones.find((m) => m.percent === 100);
  if (targetMilestone && targetMilestone.month === -1) {
    targetMilestone.month = monthsCount;
    targetMilestone.dateStr = format(targetDate, 'MMM yyyy');
  }

  // Format readable duration (e.g. "1 year, 3 months", or "7 months")
  const years = Math.floor(monthsCount / 12);
  const remainingMonths = monthsCount % 12;

  let formattedDuration = '';
  if (years > 0) {
    formattedDuration += `${years} ${years === 1 ? 'year' : 'years'}`;
    if (remainingMonths > 0) {
      formattedDuration += `, ${remainingMonths} ${remainingMonths === 1 ? 'mo' : 'mos'}`;
    }
  } else {
    formattedDuration = `${monthsCount} ${monthsCount === 1 ? 'month' : 'months'}`;
  }

  // Compute what-if scenarios (e.g. +$25, +$50, +$100, +$200, -$50)
  const deltas = [-100, -50, -25, 25, 50, 100, 200].filter(
    (delta) => monthly + delta > 0 && delta !== 0
  );

  const scenarios: ContributionScenario[] = deltas.map((delta) => {
    const testMonthly = monthly + delta;
    let testBal = current;
    let testMonths = 0;
    while (testBal < target && testMonths < maxSimMonths) {
      testMonths++;
      testBal += testBal * monthlyRate + testMonthly;
    }
    const monthsDifference = monthsCount - testMonths; // positive means saves time
    return {
      monthlyAmount: testMonthly,
      difference: delta,
      months: testMonths,
      monthsDifference,
      targetDateStr: format(addMonths(now, testMonths), 'MMM yyyy'),
    };
  });

  // Calculate target pace options (e.g. if you want to reach goal in 6 mos, 12 mos, 24 mos)
  const paceHorizons = [6, 12, 18, 24, 36, 60].filter(
    (h) => h !== monthsCount && (monthsCount > h ? true : h <= monthsCount * 2)
  );

  const paceOptions: TargetPaceOption[] = paceHorizons.map((h) => {
    let reqMonthly = 0;
    if (monthlyRate === 0) {
      reqMonthly = Math.max(1, Math.ceil(remaining / h));
    } else {
      // Compound annuity formula to solve for PMT:
      // FV = PV*(1+r)^n + PMT * [((1+r)^n - 1) / r]
      // PMT = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)
      const factor = Math.pow(1 + monthlyRate, h);
      const numerator = (target - current * factor) * monthlyRate;
      const denominator = factor - 1;
      reqMonthly = Math.max(1, Math.ceil(numerator / denominator));
    }

    return {
      months: h,
      label: h >= 12 && h % 12 === 0 ? `${h / 12} ${h === 12 ? 'Year' : 'Years'}` : `${h} Months`,
      requiredMonthly: reqMonthly,
      targetDateStr: format(addMonths(now, h), 'MMM yyyy'),
    };
  });

  return {
    isAlreadyReached: false,
    targetAmount: target,
    currentSavings: current,
    monthlyContribution: monthly,
    annualInterestRate: apy,
    remainingAmount: remaining,
    monthsRequired: monthsCount,
    formattedDuration,
    targetDate,
    formattedTargetDate: format(targetDate, 'MMMM yyyy'),
    totalContributions: Math.round(totalDeposited),
    totalInterestEarned: Math.round(totalInterest),
    finalBalance: Math.round(balance),
    chartData,
    milestones,
    scenarios,
    paceOptions,
  };
}
