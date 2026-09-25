import React from 'react';
import { Control, Controller, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Repeat, Sparkles, Calendar, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { GoalFormData, RecurringContribution } from '@/types';
import { formatCurrency } from '@/lib/currencies';
import { useGoalsStore } from '@/store/useGoalsStore';
import { addWeeks, addMonths, differenceInDays, parseISO, isValid, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecurringContributionFieldsProps {
  control: Control<GoalFormData>;
  watch: UseFormWatch<GoalFormData>;
  setValue: UseFormSetValue<GoalFormData>;
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

export function RecurringContributionFields({
  control,
  watch,
  setValue,
}: RecurringContributionFieldsProps) {
  const { settings } = useGoalsStore();
  const currency = settings.currency;

  const targetAmount = watch('targetAmount') || 0;
  const currentAmount = watch('currentAmount') || 0;
  const deadline = watch('deadline');
  const recurring = watch('recurringContribution');

  const enabled = recurring?.enabled ?? false;
  const frequency = recurring?.frequency || 'monthly';
  const amount = recurring?.amount || 0;
  const dayOfWeek = recurring?.dayOfWeek ?? 1; // default Monday
  const dayOfMonth = recurring?.dayOfMonth ?? 1; // default 1st

  const remainingAmount = Math.max(0, targetAmount - currentAmount);

  // Calculate required pace based on deadline
  const requiredPace = React.useMemo(() => {
    if (!deadline) return { weekly: 0, monthly: 0 };
    const deadlineDate = parseISO(deadline);
    if (!isValid(deadlineDate)) return { weekly: 0, monthly: 0 };
    const days = Math.max(1, differenceInDays(deadlineDate, new Date()));
    const weeks = Math.max(1, Math.ceil(days / 7));
    const months = Math.max(1, days / 30.416);

    return {
      weekly: Math.ceil(remainingAmount / weeks),
      monthly: Math.ceil(remainingAmount / months),
    };
  }, [deadline, remainingAmount]);

  const currentRequired = frequency === 'weekly' ? requiredPace.weekly : requiredPace.monthly;

  // Auto-calculated projection based on current planned contribution
  const projection = React.useMemo(() => {
    if (!enabled || amount <= 0) return null;
    const periodsNeeded = remainingAmount > 0 ? Math.ceil(remainingAmount / amount) : 0;
    const today = new Date();
    const projectedDate =
      remainingAmount === 0
        ? today
        : frequency === 'weekly'
        ? addWeeks(today, periodsNeeded)
        : addMonths(today, periodsNeeded);

    const formattedDate = format(projectedDate, 'MMM d, yyyy');

    let comparisonText = '';
    let comparisonType: 'ahead' | 'on_time' | 'delayed' = 'on_time';

    if (deadline) {
      const deadlineDate = parseISO(deadline);
      if (isValid(deadlineDate)) {
        const daysDiff = differenceInDays(deadlineDate, projectedDate);
        if (daysDiff > 7) {
          const weeks = Math.max(1, Math.round(daysDiff / 7));
          comparisonText = weeks > 4
            ? `Finishes ~${Math.round(weeks / 4.33)} months earlier than target date`
            : `Finishes ~${weeks} weeks earlier than target date`;
          comparisonType = 'ahead';
        } else if (daysDiff < -7) {
          const weeks = Math.max(1, Math.round(Math.abs(daysDiff) / 7));
          comparisonText = weeks > 4
            ? `Needs ~${Math.round(weeks / 4.33)} months after target date`
            : `Needs ~${weeks} weeks after target date`;
          comparisonType = 'delayed';
        } else {
          comparisonText = 'Matches target deadline timeline';
          comparisonType = 'on_time';
        }
      }
    }

    const paceDiff = amount - currentRequired;

    return {
      periodsNeeded,
      projectedDate,
      formattedDate,
      comparisonText,
      comparisonType,
      paceDiff,
      isAhead: paceDiff >= 0,
    };
  }, [enabled, amount, remainingAmount, frequency, deadline, currentRequired]);

  const handleToggle = (checked: boolean) => {
    setValue(
      'recurringContribution',
      {
        enabled: checked,
        frequency: frequency || 'monthly',
        amount: amount > 0 ? amount : currentRequired || 100,
        dayOfWeek,
        dayOfMonth,
        startDate: new Date().toISOString(),
      },
      { shouldValidate: true }
    );
  };

  const handleSetAutoPace = () => {
    setValue(
      'recurringContribution',
      {
        enabled: true,
        frequency,
        amount: currentRequired,
        dayOfWeek,
        dayOfMonth,
      },
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/15 p-4">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Repeat className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label htmlFor="recurring-toggle" className="text-xs font-semibold text-foreground cursor-pointer">
                Recurring Contribution Plan
              </label>
              {enabled && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Automate your target savings pace with weekly or monthly schedules.
            </p>
          </div>
        </div>

        <Controller
          name="recurringContribution.enabled"
          control={control}
          render={({ field }) => (
            <Switch
              id="recurring-toggle"
              checked={field.value ?? false}
              onCheckedChange={(val) => {
                field.onChange(val);
                handleToggle(val);
              }}
            />
          )}
        />
      </div>

      {/* Expanded configuration when enabled */}
      {enabled && (
        <div className="pt-2 space-y-3.5 border-t border-border/50">
          {/* Frequency Tabs: Weekly vs Monthly */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-foreground">Contribution Schedule</label>
            <Tabs
              value={frequency}
              onValueChange={(val) => {
                const newFreq = val as 'weekly' | 'monthly';
                setValue('recurringContribution.frequency', newFreq, { shouldValidate: true });
                // If amount is not customized yet or matches previous required, update it
                if (amount <= 0 || amount === currentRequired) {
                  setValue(
                    'recurringContribution.amount',
                    newFreq === 'weekly' ? requiredPace.weekly : requiredPace.monthly,
                    { shouldValidate: true }
                  );
                }
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 h-8 p-0.5 bg-muted/60">
                <TabsTrigger value="weekly" className="text-xs h-7 gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Weekly Schedule
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs h-7 gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Monthly Schedule
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Schedule Timing (Day of week / Day of month) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-foreground">
                {frequency === 'weekly' ? 'Contribution Day' : 'Day of Month'}
              </label>
              {frequency === 'weekly' ? (
                <Select
                  value={String(dayOfWeek)}
                  onValueChange={(val) =>
                    setValue('recurringContribution.dayOfWeek', Number(val), { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select day" />
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
                  onValueChange={(val) =>
                    setValue('recurringContribution.dayOfMonth', Number(val), { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select day of month" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_MONTH.map((dom) => (
                      <SelectItem key={dom} value={String(dom)} className="text-xs">
                        Every {dom}
                        {dom === 1 ? 'st' : dom === 2 ? 'nd' : dom === 3 ? 'rd' : 'th'} of month
                      </SelectItem>
                    ))}
                    <SelectItem value="30" className="text-xs">
                      End of month (30th/31st)
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Planned Contribution Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-foreground">
                  Planned Deposit ({frequency === 'weekly' ? 'per week' : 'per month'})
                </label>
                {currentRequired > 0 && amount !== currentRequired && (
                  <button
                    type="button"
                    onClick={handleSetAutoPace}
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    Match target pace ({formatCurrency(currentRequired, currency)})
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  step="any"
                  value={amount || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setValue('recurringContribution.amount', val, { shouldValidate: true });
                  }}
                  className="h-9 text-xs pl-3 pr-16"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-2 text-[11px] font-medium text-muted-foreground">
                  / {frequency === 'weekly' ? 'week' : 'month'}
                </span>
              </div>
            </div>
          </div>

          {/* Auto-Calculated Progress Projection Card */}
          {projection && (
            <div className="p-3 rounded-lg border border-border/80 bg-background/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  Auto-Calculated Plan Projection
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md',
                    projection.comparisonType === 'ahead'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : projection.comparisonType === 'delayed'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  )}
                >
                  {projection.comparisonType === 'ahead' && <CheckCircle2 className="h-3 w-3" />}
                  {projection.comparisonType === 'delayed' && <AlertTriangle className="h-3 w-3" />}
                  {projection.comparisonText || 'Projected on time'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-border/50 text-[11px]">
                <div>
                  <span className="text-muted-foreground block">Estimated Finish</span>
                  <strong className="text-foreground text-xs">{projection.formattedDate}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Deposits Needed</span>
                  <strong className="text-foreground text-xs">
                    {projection.periodsNeeded} {frequency === 'weekly' ? 'weeks' : 'months'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Planned vs Req Pace</span>
                  <span
                    className={cn(
                      'font-semibold text-xs',
                      projection.paceDiff >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {formatCurrency(amount, currency)} / {formatCurrency(currentRequired, currency)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
