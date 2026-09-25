import { format, addMonths } from 'date-fns';

export type DebtStrategy = 'snowball' | 'avalanche';

export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // Annual interest rate in percent, e.g., 16 for 16%
  minPayment: number;
}

export interface MonthlyPayoffStep {
  month: number;
  date: string;
  totalRemainingBalance: number;
  totalInterestPaidToDate: number;
  debtsPaidOffCount: number;
  paidOffDebtsThisMonth: string[];
}

export interface PayoffStrategyResult {
  strategy: DebtStrategy;
  totalMonths: number;
  payoffDate: Date;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  totalAmountPaid: number;
  monthlySteps: MonthlyPayoffStep[];
  debtPayoffOrder: {
    id: string;
    name: string;
    monthPaidOff: number;
    interestPaid: number;
  }[];
}

export interface DebtComparisonResult {
  snowball: PayoffStrategyResult;
  avalanche: PayoffStrategyResult;
  minimumOnlyMonths: number;
  minimumOnlyInterest: number;
  interestDifference: number; // Avalanche interest savings vs Snowball
  fasterMonths: number;
  freedMonthlyCashflow: number; // Total minimum payments + extra payment that will become available
}

export const SAMPLE_DEBTS: DebtItem[] = [
  {
    id: 'debt-1',
    name: 'Credit Card A',
    balance: 28000,
    interestRate: 16.0,
    minPayment: 1500,
  },
  {
    id: 'debt-2',
    name: 'Personal Loan',
    balance: 75000,
    interestRate: 18.0,
    minPayment: 3200,
  },
  {
    id: 'debt-3',
    name: 'Auto Loan',
    balance: 140000,
    interestRate: 6.5,
    minPayment: 4800,
  },
  {
    id: 'debt-4',
    name: 'Gadget Installment (0-8%)',
    balance: 15000,
    interestRate: 8.0,
    minPayment: 1200,
  },
];

/**
 * Simulates debt payoff given a list of debts, an extra monthly payment, and a chosen strategy.
 */
export function simulateDebtPayoff(
  debts: DebtItem[],
  extraMonthlyPayment: number,
  strategy: DebtStrategy
): PayoffStrategyResult {
  if (debts.length === 0) {
    return {
      strategy,
      totalMonths: 0,
      payoffDate: new Date(),
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      totalAmountPaid: 0,
      monthlySteps: [],
      debtPayoffOrder: [],
    };
  }

  // Create mutable working copies
  interface WorkingDebt {
    id: string;
    name: string;
    balance: number;
    interestRate: number;
    monthlyInterestRate: number;
    minPayment: number;
    totalInterestPaid: number;
    monthPaidOff: number;
  }

  const workingDebts: WorkingDebt[] = debts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: Math.max(0, d.balance),
    interestRate: Math.max(0, d.interestRate),
    monthlyInterestRate: Math.max(0, d.interestRate) / 100 / 12,
    minPayment: Math.max(0, d.minPayment),
    totalInterestPaid: 0,
    monthPaidOff: 0,
  }));

  const initialPrincipal = workingDebts.reduce((sum, d) => sum + d.balance, 0);
  let totalInterestAccumulated = 0;
  let currentMonth = 0;
  const maxMonths = 360; // 30 years safety cap
  const steps: MonthlyPayoffStep[] = [];
  const initialDate = new Date();

  // Initial step 0
  steps.push({
    month: 0,
    date: format(initialDate, 'MMM yyyy'),
    totalRemainingBalance: initialPrincipal,
    totalInterestPaidToDate: 0,
    debtsPaidOffCount: 0,
    paidOffDebtsThisMonth: [],
  });

  while (currentMonth < maxMonths) {
    const activeDebts = workingDebts.filter((d) => d.balance > 0.01);
    if (activeDebts.length === 0) break;

    currentMonth++;
    const paidOffThisMonth: string[] = [];

    // 1. Accrue monthly interest on all active debts
    for (const debt of activeDebts) {
      const interest = debt.balance * debt.monthlyInterestRate;
      debt.balance += interest;
      debt.totalInterestPaid += interest;
      totalInterestAccumulated += interest;
    }

    // 2. Pay minimums first
    let availableRolloverPayment = extraMonthlyPayment;

    for (const debt of activeDebts) {
      const payment = Math.min(debt.balance, debt.minPayment);
      debt.balance -= payment;
      if (debt.balance <= 0.01) {
        debt.balance = 0;
        debt.monthPaidOff = currentMonth;
        paidOffThisMonth.push(debt.name);
      }
    }

    // 3. Add minimum payments from already paid off debts to the rollover pool
    const completedDebts = workingDebts.filter((d) => d.balance <= 0.01 && d.monthPaidOff < currentMonth);
    const rolledOverMinPayments = completedDebts.reduce((acc, d) => acc + d.minPayment, 0);
    availableRolloverPayment += rolledOverMinPayments;

    // 4. Sort remaining active debts based on strategy
    const remainingToAccelerate = workingDebts.filter((d) => d.balance > 0.01);
    if (strategy === 'snowball') {
      // Smallest balance first
      remainingToAccelerate.sort((a, b) => a.balance - b.balance);
    } else {
      // Highest interest rate first
      remainingToAccelerate.sort((a, b) => b.interestRate - a.interestRate);
    }

    // 5. Apply rollover / extra payments to priority debt(s)
    for (const priorityDebt of remainingToAccelerate) {
      if (availableRolloverPayment <= 0.01) break;

      const extraApplied = Math.min(priorityDebt.balance, availableRolloverPayment);
      priorityDebt.balance -= extraApplied;
      availableRolloverPayment -= extraApplied;

      if (priorityDebt.balance <= 0.01) {
        priorityDebt.balance = 0;
        priorityDebt.monthPaidOff = currentMonth;
        if (!paidOffThisMonth.includes(priorityDebt.name)) {
          paidOffThisMonth.push(priorityDebt.name);
        }
      }
    }

    const currentRemainingTotal = workingDebts.reduce((acc, d) => acc + d.balance, 0);

    // Save monthly step
    steps.push({
      month: currentMonth,
      date: format(addMonths(initialDate, currentMonth), 'MMM yyyy'),
      totalRemainingBalance: Math.max(0, Math.round(currentRemainingTotal * 100) / 100),
      totalInterestPaidToDate: Math.round(totalInterestAccumulated * 100) / 100,
      debtsPaidOffCount: workingDebts.filter((d) => d.balance <= 0.01).length,
      paidOffDebtsThisMonth: paidOffThisMonth,
    });

    if (currentRemainingTotal <= 0.01) break;
  }

  const payoffDate = addMonths(initialDate, currentMonth);

  return {
    strategy,
    totalMonths: currentMonth,
    payoffDate,
    totalInterestPaid: Math.round(totalInterestAccumulated * 100) / 100,
    totalPrincipalPaid: Math.round(initialPrincipal * 100) / 100,
    totalAmountPaid: Math.round((initialPrincipal + totalInterestAccumulated) * 100) / 100,
    monthlySteps: steps,
    debtPayoffOrder: workingDebts
      .map((d) => ({
        id: d.id,
        name: d.name,
        monthPaidOff: d.monthPaidOff || currentMonth,
        interestPaid: Math.round(d.totalInterestPaid * 100) / 100,
      }))
      .sort((a, b) => a.monthPaidOff - b.monthPaidOff),
  };
}

/**
 * Runs comparative analysis between Snowball, Avalanche, and Minimum-only baseline.
 */
export function calculateDebtComparison(
  debts: DebtItem[],
  extraMonthlyPayment: number
): DebtComparisonResult {
  const snowball = simulateDebtPayoff(debts, extraMonthlyPayment, 'snowball');
  const avalanche = simulateDebtPayoff(debts, extraMonthlyPayment, 'avalanche');
  const minOnly = simulateDebtPayoff(debts, 0, 'avalanche');

  const interestDifference = Math.max(0, snowball.totalInterestPaid - avalanche.totalInterestPaid);
  const fasterMonths = Math.max(0, minOnly.totalMonths - Math.min(snowball.totalMonths, avalanche.totalMonths));

  const totalMinPayments = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const freedMonthlyCashflow = totalMinPayments + extraMonthlyPayment;

  return {
    snowball,
    avalanche,
    minimumOnlyMonths: minOnly.totalMonths,
    minimumOnlyInterest: minOnly.totalInterestPaid,
    interestDifference,
    fasterMonths,
    freedMonthlyCashflow,
  };
}
