import {
  differenceInDays,
  parseISO,
  isValid,
  isPast,
  endOfDay,
  format,
  addWeeks,
  addMonths,
} from 'date-fns';
import { Goal, Transaction } from '@/types';
import { calculateGoalMetrics, GoalMetrics } from '@/lib/calculations';
import { calculateUserSavingsVelocity } from '@/lib/savingsForecast';

export type AlertSeverity = 'critical' | 'warning' | 'caution';
export type AlertType = 'overdue' | 'projected_delay' | 'pacing_deficit' | 'no_plan_approaching';

export interface PacingAlert {
  id: string;
  goalId: string;
  goal: Goal;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  detail: string;
  currentRateLabel: string;
  currentRateAmount: number;
  currentRateFrequency: 'weekly' | 'monthly' | 'none';
  requiredRateLabel: string;
  requiredWeekly: number;
  requiredMonthly: number;
  daysRemaining: number;
  projectedDate: Date | null;
  projectedDateFormatted: string | null;
  delayDescription: string;
  delayWeeks: number;
  recommendedWeekly: number;
  recommendedMonthly: number;
  suggestedDeadline: string; // 'yyyy-MM-dd'
  suggestedDeadlineFormatted: string; // 'MMM d, yyyy'
  catchUpDepositAmount: number;
}

/**
 * Analyzes active goals and transaction histories to detect when a user's
 * current savings rate is insufficient to meet their set goal deadline.
 */
export function getGoalPacingAlert(
  goal: Goal,
  transactions: Transaction[] = []
): PacingAlert | null {
  const target = Math.max(goal.targetAmount, 1);
  const current = Math.max(goal.currentAmount, 0);

  // If goal is already completed (100%), no alert needed
  if (current >= target) {
    return null;
  }

  const today = new Date();
  const rawDeadline = parseISO(goal.deadline);
  const deadlineDate = isValid(rawDeadline) ? rawDeadline : new Date(today.getTime() + 30 * 86400000);
  const deadlineEndOfDay = endOfDay(deadlineDate);

  const metrics: GoalMetrics = calculateGoalMetrics(goal);
  const remainingAmount = metrics.remainingAmount;
  const daysRemaining = metrics.daysRemaining;
  const isOverdue = metrics.isOverdue;

  const recurring = goal.recurringContribution;
  const hasRecurring = Boolean(recurring?.enabled && recurring.amount > 0);
  const frequency = recurring?.frequency || 'monthly';
  const recurringAmount = recurring?.amount || 0;

  // Compute actual recent savings rate for this specific goal
  const goalTransactions = transactions.filter((t) => t.goalId === goal.id);
  const goalDeposits = goalTransactions.filter((t) => t.type === 'deposit');

  let historicalMonthlyRate = 0;
  if (goalDeposits.length > 0) {
    const sorted = [...goalDeposits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const earliestDate = parseISO(sorted[0].date);
    const validEarliest = isValid(earliestDate) ? earliestDate : today;
    const spanDays = Math.max(14, differenceInDays(today, validEarliest));
    const totalDeposited = goalDeposits.reduce((acc, t) => acc + t.amount, 0);
    historicalMonthlyRate = Math.round((totalDeposited / spanDays) * 30.416);
  }

  // Fallback to user overall velocity if no goal-specific deposit history
  const overallVelocity = calculateUserSavingsVelocity(transactions);
  const effectiveMonthlyPace = hasRecurring
    ? (frequency === 'weekly' ? recurringAmount * 4.333 : recurringAmount)
    : (historicalMonthlyRate > 0 ? historicalMonthlyRate : overallVelocity.monthlySavingsRate);

  const effectiveWeeklyPace = Math.round(effectiveMonthlyPace / 4.333);

  // 1. SCENARIO: OVERDUE GOAL
  if (isOverdue) {
    const overdueDays = Math.abs(differenceInDays(today, deadlineEndOfDay));
    const overdueWeeks = Math.max(1, Math.round(overdueDays / 7));
    const realisticMonths = Math.max(1, Math.ceil(remainingAmount / Math.max(25, effectiveMonthlyPace)));
    const suggestedDate = addMonths(today, realisticMonths);

    return {
      id: `alert-overdue-${goal.id}`,
      goalId: goal.id,
      goal,
      type: 'overdue',
      severity: 'critical',
      title: 'Deadline Passed',
      message: `Passed deadline ${overdueWeeks} week${overdueWeeks === 1 ? '' : 's'} ago with remaining balance needed.`,
      detail: `Your goal "${goal.name}" passed its target date on ${metrics.formattedDeadline}.`,
      currentRateLabel: hasRecurring ? `${recurringAmount}/${frequency}` : 'No active schedule',
      currentRateAmount: recurringAmount,
      currentRateFrequency: hasRecurring ? frequency : 'none',
      requiredRateLabel: 'Due immediately',
      requiredWeekly: remainingAmount,
      requiredMonthly: remainingAmount,
      daysRemaining: 0,
      projectedDate: suggestedDate,
      projectedDateFormatted: format(suggestedDate, 'MMM d, yyyy'),
      delayDescription: `Overdue by ${overdueWeeks} week${overdueWeeks === 1 ? '' : 's'}`,
      delayWeeks: overdueWeeks,
      recommendedWeekly: Math.ceil(remainingAmount / 4),
      recommendedMonthly: Math.ceil(remainingAmount / 2),
      suggestedDeadline: format(suggestedDate, 'yyyy-MM-dd'),
      suggestedDeadlineFormatted: format(suggestedDate, 'MMM d, yyyy'),
      catchUpDepositAmount: remainingAmount,
    };
  }

  // 2. SCENARIO: RECURRING PLAN ACTIVE, BUT PROJECTED TO MISS DEADLINE
  if (hasRecurring) {
    const periodsNeeded = Math.ceil(remainingAmount / recurringAmount);
    const projectedCompletionDate =
      frequency === 'weekly'
        ? addWeeks(today, periodsNeeded)
        : addMonths(today, periodsNeeded);

    const daysDifference = differenceInDays(deadlineEndOfDay, projectedCompletionDate);

    // If projected to finish more than 5 days AFTER the deadline:
    if (daysDifference < -5) {
      const delayDays = Math.abs(daysDifference);
      const delayWeeks = Math.max(1, Math.round(delayDays / 7));
      const requiredAmount = frequency === 'weekly' ? metrics.weeklyRequired : metrics.monthlyRequired;
      const deficit = Math.round((requiredAmount - recurringAmount) * 100) / 100;

      // Severity: if delay is > 4 weeks or deadline in <= 45 days, critical; otherwise warning
      const severity: AlertSeverity = (delayWeeks >= 4 || daysRemaining <= 45) ? 'critical' : 'warning';

      const delayText =
        delayWeeks >= 8
          ? `~${Math.round(delayWeeks / 4.333)} months after deadline`
          : `~${delayWeeks} week${delayWeeks === 1 ? '' : 's'} after deadline`;

      return {
        id: `alert-recurring-delay-${goal.id}`,
        goalId: goal.id,
        goal,
        type: 'projected_delay',
        severity,
        title: 'Projected Deadline Miss',
        message: `Current contribution rate will miss deadline by ${delayText}.`,
        detail: `At your current plan of ${recurringAmount}/${frequency}, you are projected to complete on ${format(projectedCompletionDate, 'MMM d, yyyy')}, which is short by ~${deficit}/${frequency}.`,
        currentRateLabel: `${recurringAmount}/${frequency}`,
        currentRateAmount: recurringAmount,
        currentRateFrequency: frequency,
        requiredRateLabel: `${requiredAmount}/${frequency}`,
        requiredWeekly: metrics.weeklyRequired,
        requiredMonthly: metrics.monthlyRequired,
        daysRemaining,
        projectedDate: projectedCompletionDate,
        projectedDateFormatted: format(projectedCompletionDate, 'MMM d, yyyy'),
        delayDescription: delayText,
        delayWeeks,
        recommendedWeekly: metrics.weeklyRequired,
        recommendedMonthly: metrics.monthlyRequired,
        suggestedDeadline: format(projectedCompletionDate, 'yyyy-MM-dd'),
        suggestedDeadlineFormatted: format(projectedCompletionDate, 'MMM d, yyyy'),
        catchUpDepositAmount: Math.min(remainingAmount, Math.round(deficit * (frequency === 'weekly' ? metrics.weeksRemaining : metrics.monthsRemaining))),
      };
    }
  }

  // 3. SCENARIO: NO RECURRING PLAN & BEHIND SCHEDULE OR IMMINENT DEADLINE
  if (!hasRecurring) {
    // If deadline is within 60 days and less than 70% funded:
    const percent = metrics.percentage;
    const isImminent = daysRemaining <= 60 && percent < 75;
    const isBehind = metrics.status === 'behind' || metrics.status === 'urgent';

    if (isImminent || isBehind) {
      const requiredMonthly = metrics.monthlyRequired;
      const requiredWeekly = metrics.weeklyRequired;

      // Estimate realistic projected completion date at user's historical deposit pace
      const realisticPace = Math.max(25, effectiveMonthlyPace);
      const monthsNeeded = Math.ceil(remainingAmount / realisticPace);
      const projectedDate = addMonths(today, monthsNeeded);
      const daysDiff = differenceInDays(deadlineEndOfDay, projectedDate);
      const delayWeeks = daysDiff < 0 ? Math.max(1, Math.round(Math.abs(daysDiff) / 7)) : 0;

      const severity: AlertSeverity = (daysRemaining <= 30 && percent < 60) ? 'critical' : 'warning';

      return {
        id: `alert-pacing-deficit-${goal.id}`,
        goalId: goal.id,
        goal,
        type: isImminent ? 'no_plan_approaching' : 'pacing_deficit',
        severity,
        title: isImminent ? 'Deadline Approaching' : 'Savings Pace Behind',
        message: `Requires ${requiredMonthly}/mo to hit deadline (${daysRemaining} days remaining).`,
        detail: `No active contribution schedule is set to ensure you hit your ${metrics.formattedDeadline} deadline.`,
        currentRateLabel: effectiveMonthlyPace > 0 ? `~${effectiveMonthlyPace}/mo (deposit avg)` : 'No active schedule',
        currentRateAmount: effectiveMonthlyPace,
        currentRateFrequency: 'monthly',
        requiredRateLabel: `${requiredMonthly}/mo`,
        requiredWeekly,
        requiredMonthly,
        daysRemaining,
        projectedDate,
        projectedDateFormatted: format(projectedDate, 'MMM d, yyyy'),
        delayDescription: delayWeeks > 0 ? `~${delayWeeks} weeks behind pace` : 'Unscheduled deadline',
        delayWeeks,
        recommendedWeekly: requiredWeekly,
        recommendedMonthly: requiredMonthly,
        suggestedDeadline: format(projectedDate, 'yyyy-MM-dd'),
        suggestedDeadlineFormatted: format(projectedDate, 'MMM d, yyyy'),
        catchUpDepositAmount: Math.round(remainingAmount * 0.3),
      };
    }
  }

  return null;
}

/**
 * Returns all active pacing alerts across all goals, sorted by urgency/severity.
 */
export function getAllPacingAlerts(
  goals: Goal[],
  transactions: Transaction[] = [],
  dismissedGoalIds: string[] = []
): PacingAlert[] {
  const alerts: PacingAlert[] = [];

  for (const goal of goals) {
    if (dismissedGoalIds.includes(goal.id)) {
      continue;
    }
    const alert = getGoalPacingAlert(goal, transactions);
    if (alert) {
      alerts.push(alert);
    }
  }

  // Sort critical first, then warning, then by daysRemaining ascending
  return alerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (b.severity === 'critical' && a.severity !== 'critical') return 1;
    return a.daysRemaining - b.daysRemaining;
  });
}
