import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Repeat,
  Calendar,
  Clock,
  TrendingUp,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Goal, CurrencyCode, RecurringContribution } from '@/types';
import { calculateGoalMetrics, calculateRecurringPlanMetrics } from '@/lib/calculations';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { GoalThumbnail } from '@/components/common/GoalThumbnail';
import { useGoalsStore } from '@/store/useGoalsStore';
import { RecurringScheduleDialog } from '@/features/goals/RecurringScheduleDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RecurringContributionsWidgetProps {
  goals: Goal[];
  currency: CurrencyCode;
  onOpenDeposit: (goal: Goal, amount?: number) => void;
  className?: string;
}

export function RecurringContributionsWidget({
  goals,
  currency,
  onOpenDeposit,
  className,
}: RecurringContributionsWidgetProps) {
  const navigate = useNavigate();
  const { updateGoal } = useGoalsStore();
  const [selectedGoalForSchedule, setSelectedGoalForSchedule] = useState<Goal | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // Active goals with recurring plans enabled
  const activeRecurringGoals = goals.filter(
    (g) => g.recurringContribution?.enabled && g.recurringContribution.amount > 0
  );

  // Goals without recurring plans
  const nonRecurringGoals = goals.filter(
    (g) => !g.recurringContribution?.enabled || g.recurringContribution.amount <= 0
  );

  // Compute total automated weekly and monthly amounts
  const totalWeeklyAutomated = activeRecurringGoals
    .filter((g) => g.recurringContribution?.frequency === 'weekly')
    .reduce((sum, g) => sum + (g.recurringContribution?.amount || 0), 0);

  const totalMonthlyAutomated = activeRecurringGoals
    .filter((g) => g.recurringContribution?.frequency === 'monthly')
    .reduce((sum, g) => sum + (g.recurringContribution?.amount || 0), 0);

  // Approximate combined monthly automated savings
  const combinedMonthlyEquivalent = totalMonthlyAutomated + totalWeeklyAutomated * 4.33;

  const handleTogglePlan = (goal: Goal, checked: boolean) => {
    const existing = goal.recurringContribution;
    const metrics = calculateGoalMetrics(goal);
    const freq = existing?.frequency || 'monthly';
    const fallbackAmount = freq === 'weekly' ? metrics.weeklyRequired : metrics.monthlyRequired;

    const updatedPlan: RecurringContribution = {
      enabled: checked,
      frequency: freq,
      amount: existing?.amount && existing.amount > 0 ? existing.amount : fallbackAmount,
      dayOfWeek: existing?.dayOfWeek ?? 1,
      dayOfMonth: existing?.dayOfMonth ?? 1,
      startDate: existing?.startDate || new Date().toISOString(),
    };

    updateGoal(goal.id, {
      ...goal,
      recurringContribution: updatedPlan,
    });

    toast.success(
      checked
        ? `Recurring contribution activated for "${goal.name}"`
        : `Recurring contribution paused for "${goal.name}"`
    );
  };

  const handleOpenConfig = (goal: Goal) => {
    setSelectedGoalForSchedule(goal);
    setScheduleDialogOpen(true);
  };

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Repeat className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">
                    Recurring Deposit Plans
                  </CardTitle>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {activeRecurringGoals.length} Active {activeRecurringGoals.length === 1 ? 'Plan' : 'Plans'}
                  </span>
                </div>
                <CardDescription className="text-xs">
                  Automated schedules and pacing projections to reach goals on time
                </CardDescription>
              </div>
            </div>

            {/* Quick summary totals */}
            <div className="flex items-center gap-2 text-xs self-end sm:self-auto font-medium">
              <span className="text-muted-foreground">Automated pace:</span>
              <strong className="text-foreground">
                ~{formatCurrency(Math.round(combinedMonthlyEquivalent), currency)}/mo
              </strong>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {activeRecurringGoals.length === 0 ? (
            /* Empty state: No active recurring contributions */
            <div className="py-6 px-4 text-center rounded-xl border border-dashed border-border/80 bg-muted/10 space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Repeat className="h-5 w-5" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-semibold text-sm text-foreground">
                  No automated deposit schedules active
                </h4>
                <p className="text-xs text-muted-foreground">
                  Toggle on weekly or monthly recurring contributions on any goal to automate target progress and calculate exact finish dates.
                </p>
              </div>

              {goals.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {goals.slice(0, 3).map((g) => (
                    <Button
                      key={g.id}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleOpenConfig(g)}
                    >
                      <Plus className="h-3 w-3 text-primary" />
                      Automate {g.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Active recurring goals list */
            <div className="space-y-2.5">
              {activeRecurringGoals.map((goal) => {
                const plan = goal.recurringContribution!;
                const metrics = calculateGoalMetrics(goal);
                const recurringMetrics = calculateRecurringPlanMetrics(goal, metrics);

                return (
                  <div
                    key={goal.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:border-border transition-colors gap-3"
                  >
                    {/* Left: Thumbnail & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <GoalThumbnail
                        icon={goal.icon}
                        imageUrl={goal.imageUrl}
                        color={goal.color}
                        name={goal.name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className="font-medium text-xs sm:text-sm text-foreground truncate cursor-pointer hover:underline"
                            onClick={() => navigate(`/goals/${goal.id}`)}
                          >
                            {goal.name}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-normal">
                            {plan.frequency === 'weekly' ? 'Weekly' : 'Monthly'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {recurringMetrics.scheduleLabel} • Projected finish:{' '}
                          <strong className="text-foreground font-medium">
                            {recurringMetrics.formattedProjectedDate || 'On target'}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Middle: Deposit Rate & Status */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-xs sm:text-sm font-bold text-foreground">
                          {formatCurrency(plan.amount, currency)}
                          <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                            /{plan.frequency === 'weekly' ? 'wk' : 'mo'}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-medium block',
                            recurringMetrics.completionComparisonType === 'ahead'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : recurringMetrics.completionComparisonType === 'delayed'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground'
                          )}
                        >
                          {recurringMetrics.completionComparison}
                        </span>
                      </div>

                      {/* Right: Quick Toggle & Log Button */}
                      <div className="flex items-center gap-2 pl-2 border-l border-border/60">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenConfig(goal)}
                          title="Configure Schedule"
                        >
                          <SlidersHorizontal className="h-3 w-3" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2.5 gap-1 text-primary border-primary/30 hover:bg-primary/10"
                          onClick={() => onOpenDeposit(goal, plan.amount)}
                          title="Log scheduled contribution"
                        >
                          <Plus className="h-3 w-3" />
                          Log
                        </Button>

                        {/* Interactive Toggle */}
                        <Switch
                          checked={plan.enabled}
                          onCheckedChange={(checked) => handleTogglePlan(goal, checked)}
                          aria-label={`Toggle recurring plan for ${goal.name}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Suggestions to automate non-recurring goals */}
              {nonRecurringGoals.length > 0 && (
                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50">
                  <span className="text-[11px] flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {nonRecurringGoals.length} other goal{nonRecurringGoals.length === 1 ? '' : 's'} available to automate
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-primary hover:underline px-1"
                    onClick={() => handleOpenConfig(nonRecurringGoals[0])}
                  >
                    + Add to {nonRecurringGoals[0].name}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <RecurringScheduleDialog
        goal={selectedGoalForSchedule}
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
      />
    </>
  );
}
