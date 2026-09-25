import { addDays, differenceInDays, parseISO, isValid, format } from 'date-fns';
import { Transaction } from '@/types';

export type SavingFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface UserSavingsVelocity {
  hasHistory: boolean;
  depositCount: number;
  totalDeposited: number;
  monthlySavingsRate: number;
  weeklySavingsRate: number;
  biweeklySavingsRate: number;
  averageDepositAmount: number;
  detectedFrequency: SavingFrequency;
  frequencyDescription: string;
}

export interface SuggestedEndDateResult {
  suggestedDate: Date;
  suggestedFormatted: string; // 'yyyy-MM-dd'
  displayDate: string; // 'MMM d, yyyy'
  monthsRemaining: number;
  daysRemaining: number;
  remainingAmount: number;
  isAlreadyFunded: boolean;
  velocity: UserSavingsVelocity;
  effectiveMonthlyRate: number;
}

/**
 * Computes the user's historical saving velocity and cadence based on past transactions.
 */
export function calculateUserSavingsVelocity(transactions: Transaction[]): UserSavingsVelocity {
  const deposits = transactions.filter((t) => t.type === 'deposit');

  if (deposits.length === 0) {
    return {
      hasHistory: false,
      depositCount: 0,
      totalDeposited: 0,
      monthlySavingsRate: 250,
      weeklySavingsRate: Math.round(250 / 4.333),
      biweeklySavingsRate: Math.round(250 / 2.167),
      averageDepositAmount: 100,
      detectedFrequency: 'monthly',
      frequencyDescription: 'Estimated default pace (~$250/mo)',
    };
  }

  // Sort deposits chronologically
  const sorted = [...deposits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const rawEarliest = parseISO(sorted[0].date);
  const earliestDate = isValid(rawEarliest) ? rawEarliest : new Date();
  const today = new Date();

  const totalDeposited = deposits.reduce((acc, t) => acc + t.amount, 0);
  const totalWithdrawals = transactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((acc, t) => acc + t.amount, 0);
  const netSaved = Math.max(0, totalDeposited - totalWithdrawals);

  const daysSpan = Math.max(14, differenceInDays(today, earliestDate));
  const monthsSpan = Math.max(0.5, daysSpan / 30.416);

  // Compute realistic monthly pace (using net savings if positive, otherwise total deposits)
  const baseSaved = netSaved > 0 ? netSaved : totalDeposited;
  const rawMonthlyRate = Math.max(25, Math.round(baseSaved / monthsSpan));
  const averageDeposit = Math.round(totalDeposited / deposits.length);

  // Determine frequency
  const averageDaysBetweenDeposits = daysSpan / deposits.length;
  let detectedFrequency: SavingFrequency = 'monthly';
  let frequencyDescription = 'Monthly savings cadence';

  if (averageDaysBetweenDeposits <= 10) {
    detectedFrequency = 'weekly';
    const timesPerMonth = Math.max(1, Math.round(30.416 / averageDaysBetweenDeposits));
    frequencyDescription = `~${timesPerMonth} deposits/mo (weekly)`;
  } else if (averageDaysBetweenDeposits <= 20) {
    detectedFrequency = 'biweekly';
    frequencyDescription = `~2 deposits/mo (bi-weekly)`;
  } else {
    detectedFrequency = 'monthly';
    frequencyDescription = `~1 deposit/mo (monthly)`;
  }

  return {
    hasHistory: true,
    depositCount: deposits.length,
    totalDeposited,
    monthlySavingsRate: rawMonthlyRate,
    weeklySavingsRate: Math.round(rawMonthlyRate / 4.333),
    biweeklySavingsRate: Math.round(rawMonthlyRate / 2.167),
    averageDepositAmount: averageDeposit,
    detectedFrequency,
    frequencyDescription,
  };
}

/**
 * Calculates a realistic suggested end date for a goal based on target amount,
 * current amount, and savings rate.
 */
export function getSuggestedEndDate(
  targetAmount: number,
  currentAmount: number,
  customMonthlyRate?: number,
  transactions: Transaction[] = []
): SuggestedEndDateResult {
  const velocity = calculateUserSavingsVelocity(transactions);
  const effectiveMonthlyRate = Math.max(
    10,
    customMonthlyRate !== undefined && !isNaN(customMonthlyRate)
      ? customMonthlyRate
      : velocity.monthlySavingsRate
  );

  const target = Math.max(0, targetAmount || 0);
  const current = Math.max(0, currentAmount || 0);
  const remainingAmount = Math.max(0, target - current);

  const today = new Date();

  if (remainingAmount === 0 && target > 0) {
    return {
      suggestedDate: today,
      suggestedFormatted: format(today, 'yyyy-MM-dd'),
      displayDate: format(today, 'MMM d, yyyy'),
      monthsRemaining: 0,
      daysRemaining: 0,
      remainingAmount: 0,
      isAlreadyFunded: true,
      velocity,
      effectiveMonthlyRate,
    };
  }

  // Calculate duration
  const monthsNeeded = remainingAmount / effectiveMonthlyRate;
  // Cap at 20 years to avoid overflowing date calculations
  const boundedMonths = Math.min(240, monthsNeeded);
  const daysNeeded = Math.max(1, Math.ceil(boundedMonths * 30.416));
  const suggestedDate = addDays(today, daysNeeded);

  return {
    suggestedDate,
    suggestedFormatted: format(suggestedDate, 'yyyy-MM-dd'),
    displayDate: format(suggestedDate, 'MMM d, yyyy'),
    monthsRemaining: Math.round(boundedMonths * 10) / 10,
    daysRemaining: daysNeeded,
    remainingAmount,
    isAlreadyFunded: false,
    velocity,
    effectiveMonthlyRate,
  };
}
