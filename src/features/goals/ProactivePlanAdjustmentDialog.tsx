import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  DollarSign,
  CalendarClock,
  Repeat,
  SlidersHorizontal,
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Goal, RecurringFrequency } from '@/types';
import { PacingAlert, getGoalPacingAlert } from '@/lib/pacingAlerts';
import { formatCurrency } from '@/lib/currencies';
import { useGoalsStore } from '@/store/useGoalsStore';
import { GoalThumbnail } from '@/components/common/GoalThumbnail';
import { calculateGoalMetrics } from '@/lib/calculations';
import { toast } from 'sonner';
import { addWeeks, addMonths, differenceInDays, parseISO, isValid, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProactivePlanAdjustmentDialogProps {
  goal: Goal | null;
  alert?: PacingAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenDeposit?: (goalId: string, suggestedAmount?: number) => void;
}

export function ProactivePlanAdjustmentDialog({
  goal,
  alert: propAlert,
  open,
  onOpenChange,
  onOpenDeposit,
}: ProactivePlanAdjustmentDialogProps) {
  const { settings, transactions, updateGoal, dismissAlert } = useGoalsStore();

  // Compute fresh alert if not provided
  const activeAlert = useMemo(() => {
    if (propAlert) return propAlert;
    if (!goal) return null;
    return getGoalPacingAlert(goal, transactions);
  }, [propAlert, goal, transactions]);

  const [activeTab, setActiveTab] = useState<'rate' | 'deadline' | 'deposit'>('rate');

  // Tab 1: Contribution Rate adjustment state
  const [frequency, setFrequency] = useState<RecurringFrequency>('weekly');
  const [rateAmount, setRateAmount] = useState<number>(0);

  // Tab 2: Deadline extension state
  const [newDeadline, setNewDeadline] = useState<string>('');

  // Tab 3: Catch up deposit state
  const [catchUpAmount, setCatchUpAmount] = useState<number>(0);

  // Sync state whenever dialog opens with target goal
  useEffect(() => {
    if (!goal || !open) return;

    const metrics = calculateGoalMetrics(goal);
    const rec = goal.recurringContribution;

    const initialFreq = rec?.enabled ? rec.frequency : 'monthly';
    setFrequency(initialFreq);

    // Initial recommended amount
    const recommended =
      initialFreq === 'weekly' ? metrics.weeklyRequired : metrics.monthlyRequired;
    setRateAmount(Math.max(1, Math.round(recommended)));

    // Initial suggested deadline
    if (activeAlert?.suggestedDeadline) {
      setNewDeadline(activeAlert.suggestedDeadline);
    } else {
      // Default fallback: +3 months
      const currentDead = parseISO(goal.deadline);
      const validDead = isValid(currentDead) ? currentDead : new Date();
      setNewDeadline(format(addMonths(validDead, 3), 'yyyy-MM-dd'));
    }

    // Catch up amount
    const suggestedCatchUp = activeAlert?.catchUpDepositAmount || Math.round(metrics.remainingAmount * 0.3);
    setCatchUpAmount(Math.max(10, suggestedCatchUp));
  }, [goal, open, activeAlert]);

  if (!goal) return null;

  const metrics = calculateGoalMetrics(goal);
  const remaining = metrics.remainingAmount;
  const daysRemaining = metrics.daysRemaining;

  // Real-time calculation for Tab 1 (Rate adjustment)
  const adjustedPeriodsNeeded =
    rateAmount > 0 && remaining > 0 ? Math.ceil(remaining / rateAmount) : 0;
  const adjustedProjectedDate =
    frequency === 'weekly'
      ? addWeeks(new Date(), adjustedPeriodsNeeded)
      : addMonths(new Date(), adjustedPeriodsNeeded);

  const rawGoalDeadline = parseISO(goal.deadline);
  const validGoalDeadline = isValid(rawGoalDeadline) ? rawGoalDeadline : new Date();
  const adjustedDaysDiff = differenceInDays(validGoalDeadline, adjustedProjectedDate);
  const willHitDeadlineWithNewRate = adjustedDaysDiff >= -3; // within 3 days margin

  // Real-time calculation for Tab 2 (Deadline adjustment)
  const targetNewDeadline = parseISO(newDeadline);
  const isValidNewDeadline = isValid(targetNewDeadline);
  const daysExtension = isValidNewDeadline
    ? differenceInDays(targetNewDeadline, validGoalDeadline)
    : 0;

  // Handlers
  const handleApplyNewRate = () => {
    if (rateAmount <= 0) {
      toast.error('Please enter a valid contribution amount.');
      return;
    }

    const existingRec = goal.recurringContribution;
    updateGoal(goal.id, {
      recurringContribution: {
        enabled: true,
        frequency,
        amount: rateAmount,
        dayOfWeek: existingRec?.dayOfWeek ?? 1,
        dayOfMonth: existingRec?.dayOfMonth ?? 1,
        startDate: new Date().toISOString(),
      },
    });

    dismissAlert(goal.id);
    toast.success(
      `Plan adjusted to ${formatCurrency(rateAmount, settings.currency)}/${frequency}. Goal is now on track!`,
      {
        description: `Projected completion: ${format(adjustedProjectedDate, 'MMM d, yyyy')}`,
      }
    );
    onOpenChange(false);
  };

  const handleApplyNewDeadline = () => {
    if (!newDeadline || !isValid(parseISO(newDeadline))) {
      toast.error('Please select a valid deadline date.');
      return;
    }

    updateGoal(goal.id, {
      deadline: newDeadline,
    });

    dismissAlert(goal.id);
    toast.success(`Goal deadline updated to ${format(parseISO(newDeadline), 'MMM d, yyyy')}.`, {
      description: 'Pacing schedule successfully synchronized.',
    });
    onOpenChange(false);
  };

  const handleGoToDeposit = () => {
    onOpenChange(false);
    if (onOpenDeposit) {
      onOpenDeposit(goal.id, catchUpAmount);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-3">
            <GoalThumbnail
              icon={goal.icon}
              imageUrl={goal.imageUrl}
              color={goal.color}
              name={goal.name}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Pacing Risk
                </span>
                <span className="text-xs text-muted-foreground">
                  Deadline: {metrics.formattedDeadline}
                </span>
              </div>
              <DialogTitle className="text-base font-semibold text-foreground truncate mt-1">
                Proactively Adjust: {goal.name}
              </DialogTitle>
            </div>
          </div>

          {/* Issue summary box */}
          <div className="mt-3 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {activeAlert?.message ||
                `Current savings pace indicates you may finish after ${metrics.formattedDeadline}.`}
            </p>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1">
              Remaining to save:{' '}
              <span className="font-mono font-semibold">
                {formatCurrency(remaining, settings.currency)}
              </span>
              {' · '}Required pace:{' '}
              <span className="font-mono font-semibold">
                {formatCurrency(metrics.monthlyRequired, settings.currency)}/mo
              </span>
            </p>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="p-5 pt-3">
          <p className="text-xs text-muted-foreground mb-3">
            Choose how you would like to bring your savings goal back on track:
          </p>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-3 h-10 w-full mb-4">
              <TabsTrigger value="rate" className="text-xs gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Adjust Rate</span>
              </TabsTrigger>
              <TabsTrigger value="deadline" className="text-xs gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                <span>New Deadline</span>
              </TabsTrigger>
              <TabsTrigger value="deposit" className="text-xs gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Catch-up Deposit</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ADJUST RATE */}
            <TabsContent value="rate" className="space-y-4 m-0 focus-visible:outline-hidden">
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Recommended Contribution Pace
                  </span>
                  <span className="text-[10px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    Finishes on time
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground font-medium">Cadence</label>
                    <Select
                      value={frequency}
                      onValueChange={(f: RecurringFrequency) => {
                        setFrequency(f);
                        const rec =
                          f === 'weekly' ? metrics.weeklyRequired : metrics.monthlyRequired;
                        setRateAmount(Math.max(1, Math.round(rec)));
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground font-medium">
                      Amount ({settings.currency})
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={rateAmount || ''}
                        onChange={(e) => setRateAmount(Math.max(0, Number(e.target.value)))}
                        className="h-9 text-xs font-semibold font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Projection preview badge */}
                <div
                  className={cn(
                    'p-2.5 rounded-lg text-xs flex items-center justify-between border',
                    willHitDeadlineWithNewRate
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {willHitDeadlineWithNewRate ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <span>
                      {willHitDeadlineWithNewRate
                        ? `Projected to hit 100% on ${format(adjustedProjectedDate, 'MMM d, yyyy')}`
                        : `Still short of target date (${format(adjustedProjectedDate, 'MMM d, yyyy')})`}
                    </span>
                  </div>
                  <span className="font-semibold text-[11px]">
                    {adjustedPeriodsNeeded} {frequency === 'weekly' ? 'weeks' : 'months'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2 text-primary"
                    onClick={() => {
                      const rec =
                        frequency === 'weekly' ? metrics.weeklyRequired : metrics.monthlyRequired;
                      setRateAmount(Math.ceil(rec));
                    }}
                  >
                    Reset to Exact Required (
                    {formatCurrency(
                      frequency === 'weekly' ? metrics.weeklyRequired : metrics.monthlyRequired,
                      settings.currency
                    )}
                    )
                  </Button>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="gap-1.5" onClick={handleApplyNewRate}>
                  <Repeat className="h-3.5 w-3.5" />
                  Apply New Contribution Pace
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* TAB 2: EXTEND DEADLINE */}
            <TabsContent value="deadline" className="space-y-4 m-0 focus-visible:outline-hidden">
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Keep your current deposit habit, but extend the target date so your pace remains
                  stress-free.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    New Target Deadline
                  </label>
                  <Input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                {isValidNewDeadline && (
                  <div className="p-2.5 rounded-lg bg-muted border border-border/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Original Deadline:</span>
                      <span className="font-medium text-foreground">{metrics.formattedDeadline}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Adjusted Deadline:</span>
                      <span className="font-semibold text-primary">
                        {format(targetNewDeadline, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Timeline Extension:</span>
                      <span className="font-medium text-foreground">
                        +{Math.max(0, Math.round(daysExtension / 7))} weeks ({daysExtension} days)
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick extension shortcuts */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground self-center mr-1">Quick:</span>
                  {[
                    { label: '+1 Month', months: 1 },
                    { label: '+3 Months', months: 3 },
                    { label: '+6 Months', months: 6 },
                    {
                      label: activeAlert?.suggestedDeadlineFormatted
                        ? `Pace Match (${activeAlert.suggestedDeadlineFormatted})`
                        : '+1 Year',
                      date: activeAlert?.suggestedDeadline,
                      months: 12,
                    },
                  ].map((chip) => (
                    <Button
                      key={chip.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => {
                        if (chip.date) {
                          setNewDeadline(chip.date);
                        } else {
                          const base = parseISO(goal.deadline);
                          const validBase = isValid(base) ? base : new Date();
                          setNewDeadline(format(addMonths(validBase, chip.months), 'yyyy-MM-dd'));
                        }
                      }}
                    >
                      {chip.label}
                    </Button>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="gap-1.5" onClick={handleApplyNewDeadline}>
                  <Calendar className="h-3.5 w-3.5" />
                  Update Goal Deadline
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* TAB 3: CATCH-UP DEPOSIT */}
            <TabsContent value="deposit" className="space-y-4 m-0 focus-visible:outline-hidden">
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    One-Time Catch-Up Contribution
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                    Instant Recovery
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Deposit a lump sum right now to close the pacing deficit and maintain your existing
                  schedule without changing dates.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Deposit Amount ({settings.currency})
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    max={remaining}
                    value={catchUpAmount || ''}
                    onChange={(e) => setCatchUpAmount(Math.max(0, Number(e.target.value)))}
                    className="h-9 text-xs font-semibold font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Suggested catch-up amount:{' '}
                    <span className="font-semibold text-foreground font-mono">
                      {formatCurrency(
                        activeAlert?.catchUpDepositAmount || Math.round(remaining * 0.3),
                        settings.currency
                      )}
                    </span>
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {[
                    { label: 'Suggested Deficit', amt: activeAlert?.catchUpDepositAmount || 300 },
                    { label: '50% of Remaining', amt: Math.round(remaining * 0.5) },
                    { label: 'Full Balance', amt: remaining },
                  ].map((p) => (
                    <Button
                      key={p.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setCatchUpAmount(p.amt)}
                    >
                      {p.label} ({formatCurrency(p.amt, settings.currency)})
                    </Button>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleGoToDeposit}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Proceed to Deposit ({formatCurrency(catchUpAmount, settings.currency)})
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
