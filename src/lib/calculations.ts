import {
  differenceInDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  parseISO,
  isPast,
  endOfDay,
  isValid,
  format,
  addWeeks,
  addMonths,
} from 'date-fns';
import { Goal, GoalStatus } from '@/types';

export interface GoalMetrics {
  percentage: number;
  remainingAmount: number;
  daysRemaining: number;
  weeksRemaining: number;
  monthsRemaining: number;
  weeklyRequired: number;
  monthlyRequired: number;
  status: GoalStatus;
  statusLabel: string;
  isOverdue: boolean;
  formattedDeadline: string;
  recurringPlan?: RecurringPlanMetrics;
}

export interface RecurringPlanMetrics {
  enabled: boolean;
  frequency: 'weekly' | 'monthly';
  amount: number;
  scheduleLabel: string;
  requiredPerPeriod: number;
  paceDifference: number; // positive = surplus, negative = deficit
  isPaceAdequate: boolean;
  periodsNeeded: number;
  projectedCompletionDate: Date | null;
  formattedProjectedDate: string | null;
  completionComparison: string; // e.g. "Finishes ~2 weeks ahead of deadline"
  completionComparisonType: 'ahead' | 'on_time' | 'delayed';
  expectedPlanAmountToDate: number;
  adherenceStatus: 'ahead' | 'on_track' | 'behind';
  adherenceDifference: number;
}

export function calculateGoalMetrics(goal: Goal): GoalMetrics {
  const target = Math.max(goal.targetAmount, 1);
  const current = Math.max(goal.currentAmount, 0);
  const percentage = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  const remainingAmount = Math.max(0, target - current);

  const today = new Date();
  const rawDeadline = parseISO(goal.deadline);
  const deadlineDate = isValid(rawDeadline) ? rawDeadline : new Date(today.getTime() + 30 * 86400000);
  const deadlineEndOfDay = endOfDay(deadlineDate);

  const rawCreated = goal.createdAt ? parseISO(goal.createdAt) : null;
  const createdDate = rawCreated && isValid(rawCreated) ? rawCreated : new Date(today.getTime() - 30 * 86400000);

  // A goal is only overdue if past the end of the deadline day and not completed
  const isOverdue = isPast(deadlineEndOfDay) && percentage < 100;
  const daysRemaining = isOverdue ? 0 : Math.max(0, differenceInDays(deadlineEndOfDay, today));
  const weeksRemaining = isOverdue ? 0 : Math.max(1, Math.ceil(daysRemaining / 7));
  const monthsRemaining = isOverdue ? 0 : Math.max(1, Math.ceil(daysRemaining / 30.416));

  // If already reached or overdue, required pace is 0 or remaining balance
  const weeklyRequired =
    remainingAmount === 0 ? 0 : Math.round((remainingAmount / Math.max(1, Math.ceil(daysRemaining / 7))) * 100) / 100;
  const monthlyRequired =
    remainingAmount === 0 ? 0 : Math.round((remainingAmount / Math.max(1, daysRemaining / 30.416)) * 100) / 100;

  let status: GoalStatus = 'on_track';
  let statusLabel = 'On Track';

  if (percentage >= 100) {
    status = 'completed';
    statusLabel = 'Done';
  } else if (isOverdue) {
    status = 'urgent';
    statusLabel = 'Urgent';
  } else {
    // Determine pacing
    const totalDurationDays = Math.max(1, differenceInDays(deadlineEndOfDay, createdDate));
    const elapsedDays = Math.max(0, differenceInDays(today, createdDate));
    const expectedRatio = Math.min(1, elapsedDays / totalDurationDays);
    const actualRatio = current / target;

    // Buffer of 10%
    const isBehind = actualRatio < expectedRatio - 0.1;

    if (isBehind) {
      // If behind schedule and deadline is approaching within 60 days, elevate to urgent
      if (daysRemaining <= 60) {
        status = 'urgent';
        statusLabel = 'Urgent';
      } else {
        status = 'behind';
        statusLabel = 'Behind';
      }
    } else if (daysRemaining <= 14 && percentage < 80) {
      // Deadline within 2 weeks with noticeable funding gap remaining
      status = 'urgent';
      statusLabel = 'Urgent';
    } else {
      status = 'on_track';
      statusLabel = 'On Track';
    }
  }

  const baseResult: GoalMetrics = {
    percentage,
    remainingAmount,
    daysRemaining,
    weeksRemaining,
    monthsRemaining,
    weeklyRequired,
    monthlyRequired,
    status,
    statusLabel,
    isOverdue,
    formattedDeadline: format(deadlineDate, 'MMM d, yyyy'),
  };

  baseResult.recurringPlan = calculateRecurringPlanMetrics(goal, baseResult);

  return baseResult;
}

export function calculateRecurringPlanMetrics(
  goal: Goal,
  baseMetrics?: GoalMetrics
): RecurringPlanMetrics {
  const recurring = goal.recurringContribution;
  const metrics = baseMetrics || calculateGoalMetrics(goal);
  const remaining = metrics.remainingAmount;
  const target = goal.targetAmount;
  const current = goal.currentAmount;

  if (!recurring || !recurring.enabled || recurring.amount <= 0) {
    const frequency = recurring?.frequency || 'monthly';
    const req = frequency === 'weekly' ? metrics.weeklyRequired : metrics.monthlyRequired;
    return {
      enabled: false,
      frequency,
      amount: recurring?.amount || 0,
      scheduleLabel: 'No recurring plan enabled',
      requiredPerPeriod: req,
      paceDifference: 0 - req,
      isPaceAdequate: false,
      periodsNeeded: 0,
      projectedCompletionDate: null,
      formattedProjectedDate: null,
      completionComparison: 'No scheduled plan active',
      completionComparisonType: 'on_time',
      expectedPlanAmountToDate: 0,
      adherenceStatus: 'on_track',
      adherenceDifference: 0,
    };
  }

  const frequency = recurring.frequency || 'monthly';
  const amount = recurring.amount;
  const requiredPerPeriod = frequency === 'weekly' ? metrics.weeklyRequired : metrics.monthlyRequired;
  const paceDifference = Math.round((amount - requiredPerPeriod) * 100) / 100;
  const isPaceAdequate = paceDifference >= -0.5; // within 50 cent margin

  // Schedule Label
  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let scheduleLabel = '';
  if (frequency === 'weekly') {
    const dayName = recurring.dayOfWeek !== undefined ? DAYS_OF_WEEK[recurring.dayOfWeek] : 'Monday';
    scheduleLabel = `Weekly on ${dayName}`;
  } else {
    const dom = recurring.dayOfMonth || 1;
    const suffix = dom === 1 || dom === 21 || dom === 31 ? 'st' : dom === 2 || dom === 22 ? 'nd' : dom === 3 || dom === 23 ? 'rd' : 'th';
    scheduleLabel = `Monthly on the ${dom}${suffix}`;
  }

  // Periods needed
  const periodsNeeded = remaining > 0 && amount > 0 ? Math.ceil(remaining / amount) : 0;

  // Projected completion date
  const today = new Date();
  let projectedCompletionDate: Date | null = null;
  if (remaining === 0) {
    projectedCompletionDate = today;
  } else if (amount > 0) {
    projectedCompletionDate =
      frequency === 'weekly' ? addWeeks(today, periodsNeeded) : addMonths(today, periodsNeeded);
  }

  const formattedProjectedDate = projectedCompletionDate
    ? format(projectedCompletionDate, 'MMM d, yyyy')
    : null;

  // Compare with deadline
  const deadlineDate = parseISO(goal.deadline);
  let completionComparison = '';
  let completionComparisonType: 'ahead' | 'on_time' | 'delayed' = 'on_time';

  if (projectedCompletionDate && isValid(deadlineDate)) {
    const daysDiff = differenceInDays(deadlineDate, projectedCompletionDate);
    if (daysDiff > 7) {
      const weeksEarly = Math.max(1, Math.round(daysDiff / 7));
      if (weeksEarly >= 8) {
        const monthsEarly = Math.max(1, Math.round(weeksEarly / 4.33));
        completionComparison = `Finishes ~${monthsEarly} ${monthsEarly === 1 ? 'month' : 'months'} ahead of deadline`;
      } else {
        completionComparison = `Finishes ~${weeksEarly} ${weeksEarly === 1 ? 'week' : 'weeks'} ahead of deadline`;
      }
      completionComparisonType = 'ahead';
    } else if (daysDiff < -7) {
      const weeksLate = Math.max(1, Math.round(Math.abs(daysDiff) / 7));
      if (weeksLate >= 8) {
        const monthsLate = Math.max(1, Math.round(weeksLate / 4.33));
        completionComparison = `Projected ~${monthsLate} ${monthsLate === 1 ? 'month' : 'months'} after deadline`;
      } else {
        completionComparison = `Projected ~${weeksLate} ${weeksLate === 1 ? 'week' : 'weeks'} after deadline`;
      }
      completionComparisonType = 'delayed';
    } else {
      completionComparison = 'Finishes right on deadline target';
      completionComparisonType = 'on_time';
    }
  }

  // Plan Adherence: calculate expected savings from plan start
  const startDate = recurring.startDate ? parseISO(recurring.startDate) : (goal.createdAt ? parseISO(goal.createdAt) : today);
  const validStartDate = isValid(startDate) ? startDate : today;
  const elapsedDays = Math.max(0, differenceInDays(today, validStartDate));
  const elapsedPeriods = frequency === 'weekly' ? Math.floor(elapsedDays / 7) : Math.floor(elapsedDays / 30.416);
  const expectedPlanAmountToDate = Math.min(target, Math.max(0, (elapsedPeriods + 1) * amount));
  const adherenceDifference = Math.round((current - expectedPlanAmountToDate) * 100) / 100;

  let adherenceStatus: 'ahead' | 'on_track' | 'behind' = 'on_track';
  if (adherenceDifference > amount * 0.4) {
    adherenceStatus = 'ahead';
  } else if (adherenceDifference < -amount * 0.4) {
    adherenceStatus = 'behind';
  }

  return {
    enabled: true,
    frequency,
    amount,
    scheduleLabel,
    requiredPerPeriod,
    paceDifference,
    isPaceAdequate,
    periodsNeeded,
    projectedCompletionDate,
    formattedProjectedDate,
    completionComparison,
    completionComparisonType,
    expectedPlanAmountToDate,
    adherenceStatus,
    adherenceDifference,
  };
}
