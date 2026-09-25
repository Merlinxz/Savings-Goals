import React, { useState, useMemo } from 'react';
import { Sparkles, CalendarCheck, Check, SlidersHorizontal, ArrowRight, TrendingUp } from 'lucide-react';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Transaction } from '@/types';
import {
  getSuggestedEndDate,
  calculateUserSavingsVelocity,
  SavingFrequency,
} from '@/lib/savingsForecast';
import { cn } from '@/lib/utils';

interface SuggestedDateBannerProps {
  targetAmount: number;
  currentAmount: number;
  selectedDeadline: string; // 'yyyy-MM-dd'
  onApplyDate: (formattedDate: string) => void;
  transactions: Transaction[];
  currencySymbol: string;
}

export function SuggestedDateBanner({
  targetAmount,
  currentAmount,
  selectedDeadline,
  onApplyDate,
  transactions,
  currencySymbol,
}: SuggestedDateBannerProps) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const velocity = useMemo(() => calculateUserSavingsVelocity(transactions), [transactions]);

  const [frequency, setFrequency] = useState<SavingFrequency>(velocity.detectedFrequency);
  const [customMonthlyPace, setCustomMonthlyPace] = useState<number>(velocity.monthlySavingsRate);

  // Synchronize base pace when velocity changes unless user customized it
  React.useEffect(() => {
    if (!isCustomizing) {
      setCustomMonthlyPace(velocity.monthlySavingsRate);
      setFrequency(velocity.detectedFrequency);
    }
  }, [velocity, isCustomizing]);

  const forecast = useMemo(() => {
    return getSuggestedEndDate(
      targetAmount,
      currentAmount,
      customMonthlyPace,
      transactions
    );
  }, [targetAmount, currentAmount, customMonthlyPace, transactions]);

  const isAlreadyApplied = selectedDeadline === forecast.suggestedFormatted;

  // Compare selected deadline vs suggested deadline
  const pacingComparison = useMemo(() => {
    if (!selectedDeadline || forecast.isAlreadyFunded) return null;
    const selectedDate = parseISO(selectedDeadline);
    if (!isValid(selectedDate)) return null;

    const daysToSelected = differenceInDays(selectedDate, new Date());
    if (daysToSelected <= 0) return null;

    const monthsToSelected = Math.max(0.1, daysToSelected / 30.416);
    const remainingToSave = Math.max(0, targetAmount - currentAmount);
    const requiredMonthlyPace = Math.round(remainingToSave / monthsToSelected);

    const paceDifference = requiredMonthlyPace - customMonthlyPace;

    return {
      requiredMonthlyPace,
      paceDifference,
      isFasterThanPace: paceDifference > 20,
      isSlowerThanPace: paceDifference < -20,
    };
  }, [selectedDeadline, targetAmount, currentAmount, customMonthlyPace, forecast.isAlreadyFunded]);

  const remaining = Math.max(0, (targetAmount || 0) - (currentAmount || 0));

  const handleFrequencyChange = (newFreq: SavingFrequency) => {
    setFrequency(newFreq);
  };

  const handlePaceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCustomMonthlyPace(isNaN(val) || val <= 0 ? 10 : val);
  };

  // Compute display amount according to selected frequency
  const frequencyAmount = useMemo(() => {
    if (frequency === 'weekly') return Math.round(customMonthlyPace / 4.333);
    if (frequency === 'biweekly') return Math.round(customMonthlyPace / 2.167);
    return customMonthlyPace;
  }, [frequency, customMonthlyPace]);

  if (forecast.isAlreadyFunded) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2 font-medium">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Goal is fully funded with current deposit</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-3 transition-colors">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                Suggested Target Date
              </span>
              <span className="text-[11px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {forecast.displayDate}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {forecast.monthsRemaining < 1
                ? `In ~${forecast.daysRemaining} days`
                : `In ~${forecast.monthsRemaining} months`}{' '}
              based on saving {currencySymbol}
              {customMonthlyPace.toLocaleString()}/month
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing((prev) => !prev)}
            className="h-7 text-xs px-2"
            title="Adjust frequency or contribution pace"
          >
            <SlidersHorizontal className="h-3 w-3 mr-1" />
            {isCustomizing ? 'Hide Pace' : 'Adjust Pace'}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onApplyDate(forecast.suggestedFormatted)}
            disabled={isAlreadyApplied}
            className={cn(
              'h-7 text-xs px-2.5 transition-all',
              isAlreadyApplied && 'bg-emerald-600 hover:bg-emerald-600 text-white'
            )}
          >
            {isAlreadyApplied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Applied
              </>
            ) : (
              <>
                <CalendarCheck className="h-3 w-3 mr-1" />
                Apply Date
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expandable Pace & Frequency Adjuster */}
      {isCustomizing && (
        <div className="pt-2 border-t border-border/60 space-y-2.5 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium">Saving Frequency</span>
              <div className="flex rounded-md bg-muted/60 p-0.5 border border-border">
                <button
                  type="button"
                  onClick={() => handleFrequencyChange('weekly')}
                  className={cn(
                    'px-2 py-1 rounded text-[11px] font-medium transition-colors',
                    frequency === 'weekly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => handleFrequencyChange('biweekly')}
                  className={cn(
                    'px-2 py-1 rounded text-[11px] font-medium transition-colors',
                    frequency === 'biweekly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Bi-weekly
                </button>
                <button
                  type="button"
                  onClick={() => handleFrequencyChange('monthly')}
                  className={cn(
                    'px-2 py-1 rounded text-[11px] font-medium transition-colors',
                    frequency === 'monthly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="space-y-1 w-full sm:w-44">
              <span className="text-muted-foreground font-medium">
                Pace ({currencySymbol}/month)
              </span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="5"
                  step="10"
                  value={customMonthlyPace}
                  onChange={handlePaceInputChange}
                  className="h-7 text-xs"
                />
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  (~{currencySymbol}{frequencyAmount}/
                  {frequency === 'weekly'
                    ? 'wk'
                    : frequency === 'biweekly'
                    ? '2wks'
                    : 'mo'}
                  )
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {velocity.hasHistory
                ? `Historical baseline: ${currencySymbol}${velocity.monthlySavingsRate.toLocaleString()}/mo (${velocity.frequencyDescription})`
                : 'Default baseline: No historical deposits recorded yet'}
            </span>
            {customMonthlyPace !== velocity.monthlySavingsRate && (
              <button
                type="button"
                onClick={() => {
                  setCustomMonthlyPace(velocity.monthlySavingsRate);
                  setFrequency(velocity.detectedFrequency);
                }}
                className="text-primary hover:underline font-medium"
              >
                Reset to baseline
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pacing Comparison note if selected deadline differs significantly */}
      {pacingComparison && pacingComparison.isFasterThanPace && !isAlreadyApplied && (
        <div className="text-[11px] text-amber-700 dark:text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded p-2 flex items-start gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Your manually chosen deadline requires saving{' '}
            <strong className="font-semibold text-foreground">
              {currencySymbol}
              {pacingComparison.requiredMonthlyPace.toLocaleString()}/month
            </strong>
            , which is {currencySymbol}
            {pacingComparison.paceDifference.toLocaleString()}/month above your current pace.
          </span>
        </div>
      )}
    </div>
  );
}
