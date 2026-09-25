import React, { useState, useEffect, useMemo } from 'react';
import {
  Repeat,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Goal, RecurringContribution } from '@/types';
import { calculateGoalMetrics, calculateRecurringPlanMetrics } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';
import { useGoalsStore } from '@/store/useGoalsStore';
import { toast } from 'sonner';
import { addWeeks, addMonths, differenceInDays, parseISO, isValid, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecurringScheduleDialogProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const DAYS_OF_MONTH = [1, 5, 10, 15, 20, 25, 28, 30];

export function RecurringScheduleDialog({
  goal,
  open,
  onOpenChange,
}: RecurringScheduleDialogProps) {
  const { updateGoal, settings } = useGoalsStore();
  const currency = settings.currency;

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [amount, setAmount] = useState<number>(0);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);

  // Sync state when dialog opens or goal changes
  useEffect(() => {
    if (goal && open) {
      const plan = goal.recurringContribution;
      const metrics = calculateGoalMetrics(goal);
      const isCurrentlyEnabled = plan?.enabled ?? false;
      const currentFreq = plan?.frequency || 'monthly';
      const required = currentFreq === 'weekly' ? metrics.weeklyRequired : metrics.monthlyRequired;

      setEnabled(isCurrentlyEnabled);
      setFrequency(currentFreq);
      setAmount(plan?.amount && plan.amount > 0 ? plan.amount : required || 100);
      setDayOfWeek(plan?.dayOfWeek ?? 1);
      setDayOfMonth(plan?.dayOfMonth ?? 1);
    }
  }, [goal, open]);

  if (!goal) return null;

  const metrics = calculateGoalMetrics(goal);
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

  // Current required pace for the selected frequency
  const requiredPace = frequency === 'weekly' ? metrics.weeklyRequired : metrics.monthlyRequired;

  // Auto-calculated projection
  const periodsNeeded = remainingAmount > 0 && amount > 0 ? Math.ceil(remainingAmount / amount) : 0;
  const today = new Date();
  const projectedDate =
    remainingAmount === 0
      ? today
      : frequency === 'weekly'
      ? addWeeks(today, periodsNeeded)
      : addMonths(today, periodsNeeded);

  const formattedProjected = format(projectedDate, 'MMM d, yyyy');

  // Deadline comparison
  const deadlineDate = parseISO(goal.deadline);
  let comparisonText = '';
  let comparisonType: 'ahead' | 'on_time' | 'delayed' = 'on_time';

  if (isValid(deadlineDate) && remainingAmount > 0 && amount > 0) {
    const daysDiff = differenceInDays(deadlineDate, projectedDate);
    if (daysDiff > 7) {
      const weeks = Math.max(1, Math.round(daysDiff / 7));
      comparisonText =
        weeks > 4
          ? `Finishes ~${Math.round(weeks / 4.33)} months ahead of deadline`
          : `Finishes ~${weeks} weeks ahead of deadline`;
      comparisonType = 'ahead';
    } else if (daysDiff < -7) {
      const weeks = Math.max(1, Math.round(Math.abs(daysDiff) / 7));
      comparisonText =
        weeks > 4
          ? `Projected ~${Math.round(weeks / 4.33)} months after deadline`
          : `Projected ~${weeks} weeks after deadline`;
      comparisonType = 'delayed';
    } else {
      comparisonText = 'Matches target deadline on schedule';
      comparisonType = 'on_time';
    }
  }

  const paceDiff = amount - requiredPace;

  const handleSave = () => {
    const updatedPlan: RecurringContribution = {
      enabled,
      frequency,
      amount: enabled ? amount : 0,
      dayOfWeek,
      dayOfMonth,
      startDate: goal.recurringContribution?.startDate || new Date().toISOString(),
    };

    updateGoal(goal.id, {
      ...goal,
      recurringContribution: updatedPlan,
    });

    toast.success(
      enabled
        ? `Recurring contribution set for "${goal.name}" (${formatCurrency(amount, currency)} / ${frequency === 'weekly' ? 'week' : 'month'})`
        : `Recurring contributions turned off for "${goal.name}"`
    );

    onOpenChange(false);
  };

  const handleAutoPace = () => {
    setAmount(requiredPace);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Recurring Contribution</DialogTitle>
              <DialogDescription className="text-xs">
                Set a regular savings schedule for <strong className="text-foreground">{goal.name}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Main Toggle Banner */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="dialog-recurring-toggle"
                  className="text-xs font-semibold text-foreground cursor-pointer"
                >
                  Enable Recurring Contribution
                </label>
                {enabled && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Automate your savings plan with weekly or monthly installments.
              </p>
            </div>

            <Switch
              id="dialog-recurring-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* Frequency Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Contribution Frequency</label>
                <Tabs
                  value={frequency}
                  onValueChange={(val) => {
                    const newFreq = val as 'weekly' | 'monthly';
                    setFrequency(newFreq);
                    if (amount <= 0 || amount === requiredPace) {
                      setAmount(newFreq === 'weekly' ? metrics.weeklyRequired : metrics.monthlyRequired);
                    }
                  }}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 h-9 p-0.5 bg-muted/60">
                    <TabsTrigger value="weekly" className="text-xs h-8 gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Weekly
                    </TabsTrigger>
                    <TabsTrigger value="monthly" className="text-xs h-8 gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Monthly
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Day of Week / Month & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    {frequency === 'weekly' ? 'Deposit Day' : 'Day of Month'}
                  </label>
                  {frequency === 'weekly' ? (
                    <Select
                      value={String(dayOfWeek)}
                      onValueChange={(val) => setDayOfWeek(Number(val))}
                    >
                      <SelectTrigger className="h-9 text-xs">
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
                      value={String(dayOfMonth)}
                      onValueChange={(val) => setDayOfMonth(Number(val))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_MONTH.map((dom) => (
                          <SelectItem key={dom} value={String(dom)} className="text-xs">
                            Every {dom}
                            {dom === 1 ? 'st' : dom === 2 ? 'nd' : dom === 3 ? 'rd' : 'th'} of month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">
                      Deposit Amount
                    </label>
                    {requiredPace > 0 && amount !== requiredPace && (
                      <button
                        type="button"
                        onClick={handleAutoPace}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        Match pace
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      step="any"
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="h-9 text-xs pr-14"
                      placeholder="0.00"
                    />
                    <span className="absolute right-2.5 top-2 text-[11px] font-medium text-muted-foreground">
                      /{frequency === 'weekly' ? 'wk' : 'mo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Auto-Calculated Projection Box */}
              {amount > 0 && (
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/15 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      Auto-Calculated Plan Outcome
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md',
                        comparisonType === 'ahead'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : comparisonType === 'delayed'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      )}
                    >
                      {comparisonType === 'ahead' && <CheckCircle2 className="h-3 w-3" />}
                      {comparisonType === 'delayed' && <AlertTriangle className="h-3 w-3" />}
                      {comparisonText || 'Projected on time'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block">Projected Finish</span>
                      <strong className="text-foreground text-xs">{formattedProjected}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Cycles Needed</span>
                      <strong className="text-foreground text-xs">
                        {periodsNeeded} {frequency === 'weekly' ? 'weeks' : 'months'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Pace Difference</span>
                      <span
                        className={cn(
                          'font-semibold text-xs',
                          paceDiff >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        )}
                      >
                        {paceDiff >= 0 ? '+' : ''}
                        {formatCurrency(paceDiff, currency)}/{frequency === 'weekly' ? 'wk' : 'mo'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="h-9 text-xs gap-1.5 font-medium"
          >
            <Check className="h-3.5 w-3.5" />
            {enabled ? 'Save Recurring Plan' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
