import React, { useState } from 'react';
import {
  Repeat,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  Edit2,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Goal, CurrencyCode, RecurringContribution } from '@/types';
import { calculateGoalMetrics, calculateRecurringPlanMetrics } from '@/lib/calculations';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { useGoalsStore } from '@/store/useGoalsStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RecurringPlanCardProps {
  goal: Goal;
  currency: CurrencyCode;
  onOpenDeposit: (amount?: number) => void;
  className?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const DAYS_OF_MONTH = [1, 5, 10, 15, 20, 25, 28];

export function RecurringPlanCard({
  goal,
  currency,
  onOpenDeposit,
  className,
}: RecurringPlanCardProps) {
  const { updateGoal } = useGoalsStore();
  const [isEditingInline, setIsEditingInline] = useState(false);

  const goalMetrics = calculateGoalMetrics(goal);
  const recurringMetrics = calculateRecurringPlanMetrics(goal, goalMetrics);

  const recurring = goal.recurringContribution;
  const isEnabled = recurring?.enabled ?? false;

  // Local editing state for inline configuration
  const [editFreq, setEditFreq] = useState<'weekly' | 'monthly'>(recurring?.frequency || 'monthly');
  const [editAmount, setEditAmount] = useState<number>(
    recurring?.amount && recurring.amount > 0
      ? recurring.amount
      : editFreq === 'weekly'
      ? goalMetrics.weeklyRequired
      : goalMetrics.monthlyRequired
  );
  const [editDayOfWeek, setEditDayOfWeek] = useState<number>(recurring?.dayOfWeek ?? 1);
  const [editDayOfMonth, setEditDayOfMonth] = useState<number>(recurring?.dayOfMonth ?? 1);

  const handleToggle = (checked: boolean) => {
    const defaultAmount =
      recurring?.amount && recurring.amount > 0
        ? recurring.amount
        : editFreq === 'weekly'
        ? goalMetrics.weeklyRequired
        : goalMetrics.monthlyRequired;

    const updatedPlan: RecurringContribution = {
      enabled: checked,
      frequency: recurring?.frequency || 'monthly',
      amount: defaultAmount,
      dayOfWeek: recurring?.dayOfWeek ?? 1,
      dayOfMonth: recurring?.dayOfMonth ?? 1,
      startDate: recurring?.startDate || new Date().toISOString(),
    };

    updateGoal(goal.id, {
      ...goal,
      recurringContribution: updatedPlan,
    });

    toast.success(
      checked
        ? `Recurring contribution plan activated for "${goal.name}"`
        : `Recurring plan paused for "${goal.name}"`
    );
  };

  const handleSaveInline = () => {
    if (editAmount <= 0) {
      toast.error('Please specify a positive contribution amount');
      return;
    }

    const updatedPlan: RecurringContribution = {
      enabled: true,
      frequency: editFreq,
      amount: editAmount,
      dayOfWeek: editDayOfWeek,
      dayOfMonth: editDayOfMonth,
      startDate: recurring?.startDate || new Date().toISOString(),
    };

    updateGoal(goal.id, {
      ...goal,
      recurringContribution: updatedPlan,
    });

    setIsEditingInline(false);
    toast.success('Recurring plan updated');
  };

  const handleApplyRequiredPace = () => {
    const required = editFreq === 'weekly' ? goalMetrics.weeklyRequired : goalMetrics.monthlyRequired;
    setEditAmount(required);
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                isEnabled
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">Recurring Contribution Plan</CardTitle>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                    isEnabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isEnabled ? 'Active Plan' : 'Off'}
                </span>
              </div>
              <CardDescription className="text-xs">
                Auto-calculate progress and projected completion based on scheduled savings
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {isEnabled && !isEditingInline && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2 gap-1"
                onClick={() => {
                  setEditFreq(recurring?.frequency || 'monthly');
                  setEditAmount(recurring?.amount || 0);
                  setEditDayOfWeek(recurring?.dayOfWeek ?? 1);
                  setEditDayOfMonth(recurring?.dayOfMonth ?? 1);
                  setIsEditingInline(true);
                }}
              >
                <Edit2 className="h-3 w-3 text-muted-foreground" />
                Edit Plan
              </Button>
            )}
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              <span className="text-xs font-medium text-muted-foreground">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggle}
                aria-label="Toggle recurring contribution"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* State 1: Disabled prompt */}
        {!isEnabled && (
          <div className="py-5 px-4 text-center rounded-xl border border-dashed border-border bg-muted/10 space-y-2.5">
            <div className="flex justify-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="font-semibold text-sm text-foreground">Set up a scheduled contribution plan</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Establish a weekly or monthly commitment. We'll track your schedule adherence, calculate
                exact completion dates, and alert you if pacing slips.
              </p>
            </div>
            <div className="pt-1">
              <Button
                size="sm"
                onClick={() => handleToggle(true)}
                className="gap-2 h-8 text-xs font-medium"
              >
                <Repeat className="h-3.5 w-3.5" />
                Activate Recurring Schedule
              </Button>
            </div>
          </div>
        )}

        {/* State 2: Inline Editing Mode */}
        {isEnabled && isEditingInline && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Edit2 className="h-3.5 w-3.5 text-primary" />
                Customize Contribution Plan
              </span>
              <button
                type="button"
                onClick={() => setIsEditingInline(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Frequency */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Frequency</label>
                <Tabs
                  value={editFreq}
                  onValueChange={(val) => {
                    const newFreq = val as 'weekly' | 'monthly';
                    setEditFreq(newFreq);
                    if (editAmount <= 0) {
                      setEditAmount(
                        newFreq === 'weekly'
                          ? goalMetrics.weeklyRequired
                          : goalMetrics.monthlyRequired
                      );
                    }
                  }}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 h-9 p-0.5 bg-background">
                    <TabsTrigger value="weekly" className="text-xs h-8">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-xs h-8">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Day */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Schedule Day</label>
                {editFreq === 'weekly' ? (
                  <Select
                    value={String(editDayOfWeek)}
                    onValueChange={(val) => setEditDayOfWeek(Number(val))}
                  >
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)} className="text-xs">
                          Every {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={String(editDayOfMonth)}
                    onValueChange={(val) => setEditDayOfMonth(Number(val))}
                  >
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_MONTH.map((dom) => (
                        <SelectItem key={dom} value={String(dom)} className="text-xs">
                          Every {dom}{dom === 1 ? 'st' : dom === 2 ? 'nd' : dom === 3 ? 'rd' : 'th'}
                        </SelectItem>
                      ))}
                      <SelectItem value="30" className="text-xs">
                        End of month (30th)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Amount</label>
                  <button
                    type="button"
                    onClick={handleApplyRequiredPace}
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    Required ({formatCompactCurrency(editFreq === 'weekly' ? goalMetrics.weeklyRequired : goalMetrics.monthlyRequired, currency)})
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    value={editAmount || ''}
                    onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs bg-background pr-14"
                    placeholder="0.00"
                  />
                  <span className="absolute right-2.5 top-2 text-[11px] text-muted-foreground font-medium">
                    /{editFreq === 'weekly' ? 'wk' : 'mo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingInline(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveInline}
                className="h-8 text-xs gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Save Schedule
              </Button>
            </div>
          </div>
        )}

        {/* State 3: Active Plan Display with Auto-Calculated Progress */}
        {isEnabled && !isEditingInline && (
          <div className="space-y-4">
            {/* Plan Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Contribution Rate */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card">
                <span className="text-xs text-muted-foreground block font-medium">Planned Deposit</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(recurringMetrics.amount, currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {recurringMetrics.frequency === 'weekly' ? 'week' : 'month'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 opacity-70" />
                  {recurringMetrics.scheduleLabel}
                </p>
              </div>

              {/* Card 2: Projected Completion */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card">
                <span className="text-xs text-muted-foreground block font-medium">Projected Completion</span>
                <span className="text-xl font-bold text-foreground mt-1 block">
                  {recurringMetrics.formattedProjectedDate || 'Calculating...'}
                </span>
                <p
                  className={cn(
                    'text-[11px] font-medium mt-1 flex items-center gap-1',
                    recurringMetrics.completionComparisonType === 'ahead'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : recurringMetrics.completionComparisonType === 'delayed'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {recurringMetrics.completionComparisonType === 'ahead' && <CheckCircle2 className="h-3 w-3" />}
                  {recurringMetrics.completionComparisonType === 'delayed' && <AlertTriangle className="h-3 w-3" />}
                  {recurringMetrics.completionComparison}
                </p>
              </div>

              {/* Card 3: Pacing Status */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card">
                <span className="text-xs text-muted-foreground block font-medium">Pace vs Requirement</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span
                    className={cn(
                      'text-xl font-bold',
                      recurringMetrics.isPaceAdequate
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {recurringMetrics.paceDifference >= 0 ? '+' : ''}
                    {formatCurrency(recurringMetrics.paceDifference, currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {recurringMetrics.frequency === 'weekly' ? 'wk' : 'mo'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Required: {formatCurrency(recurringMetrics.requiredPerPeriod, currency)} /{' '}
                  {recurringMetrics.frequency === 'weekly' ? 'wk' : 'mo'}
                </p>
              </div>

              {/* Card 4: Remaining Cycles */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card">
                <span className="text-xs text-muted-foreground block font-medium">Deposits Remaining</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-foreground">
                    {recurringMetrics.periodsNeeded}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {recurringMetrics.frequency === 'weekly' ? 'weekly transfers' : 'monthly transfers'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3 opacity-70" />
                  To hit {formatCurrency(goal.targetAmount, currency)}
                </p>
              </div>
            </div>

            {/* Plan Adherence / Progress Tracker */}
            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Plan Adherence</span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-md',
                      recurringMetrics.adherenceStatus === 'ahead'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : recurringMetrics.adherenceStatus === 'behind'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {recurringMetrics.adherenceStatus === 'ahead'
                      ? `Ahead of plan by ${formatCurrency(recurringMetrics.adherenceDifference, currency)}`
                      : recurringMetrics.adherenceStatus === 'behind'
                      ? `Behind scheduled pace by ${formatCurrency(Math.abs(recurringMetrics.adherenceDifference), currency)}`
                      : 'Right on schedule with plan'}
                  </span>
                </div>

                <span className="text-[11px] text-muted-foreground">
                  Expected by today: {formatCurrency(recurringMetrics.expectedPlanAmountToDate, currency)} | Actual:{' '}
                  {formatCurrency(goal.currentAmount, currency)}
                </span>
              </div>

              <div className="space-y-1 pt-1">
                <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                  {/* Expected plan progress marker */}
                  <div
                    className="absolute top-0 bottom-0 bg-muted-foreground/30 z-0"
                    style={{
                      width: `${Math.min(100, Math.round((recurringMetrics.expectedPlanAmountToDate / goal.targetAmount) * 100))}%`,
                    }}
                  />
                  {/* Actual progress bar */}
                  <div
                    className="h-full bg-primary transition-all duration-300 z-10 relative"
                    style={{
                      width: `${goalMetrics.percentage}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Start (0%)</span>
                  <span>Target ({formatCurrency(goal.targetAmount, currency)})</span>
                </div>
              </div>
            </div>

            {/* Quick Action Footer: Log Scheduled Contribution */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Keep your momentum going by logging this cycle's scheduled deposit.
              </p>

              <Button
                onClick={() => onOpenDeposit(recurringMetrics.amount)}
                size="sm"
                className="w-full sm:w-auto h-8 text-xs font-medium gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Log Scheduled Deposit ({formatCurrency(recurringMetrics.amount, currency)})
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
