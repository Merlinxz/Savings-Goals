import React from 'react';
import { Check, Lock, Trophy, Sparkles, Target, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/currencies';
import { CurrencyCode } from '@/types';
import { cn } from '@/lib/utils';

interface MilestoneTrackerProps {
  currentAmount: number;
  targetAmount: number;
  currency: CurrencyCode;
  goalColor?: string;
}

const MILESTONE_STEPS = [
  { percent: 25, label: 'Quarterway', badge: '25%' },
  { percent: 50, label: 'Halfway Point', badge: '50%' },
  { percent: 75, label: 'Final Stretch', badge: '75%' },
  { percent: 100, label: 'Goal Reached', badge: '100%' },
];

export function MilestoneTracker({
  currentAmount,
  targetAmount,
  currency,
  goalColor = '#3b82f6',
}: MilestoneTrackerProps) {
  const achievedCount = MILESTONE_STEPS.filter(
    (s) => currentAmount >= (targetAmount * s.percent) / 100
  ).length;

  return (
    <Card className="overflow-hidden border-border/80">
      <CardHeader className="pb-3.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Milestone Tracker
            </CardTitle>
            <CardDescription className="text-xs">
              Key savings threshold markers
            </CardDescription>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {achievedCount} / {MILESTONE_STEPS.length} Achieved
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="relative pl-1">
          {MILESTONE_STEPS.map((step, idx) => {
            const stepTarget = (targetAmount * step.percent) / 100;
            const isAchieved = currentAmount >= stepTarget;
            const prevTarget = idx > 0 ? (targetAmount * MILESTONE_STEPS[idx - 1].percent) / 100 : 0;
            const isCurrent = !isAchieved && currentAmount >= prevTarget;
            const remaining = Math.max(0, stepTarget - currentAmount);
            const isLast = idx === MILESTONE_STEPS.length - 1;

            // Compute relative progress towards this specific step
            const stepSpan = stepTarget - prevTarget;
            const stepProgress = isAchieved
              ? 100
              : isCurrent && stepSpan > 0
              ? Math.min(100, Math.max(0, ((currentAmount - prevTarget) / stepSpan) * 100))
              : 0;

            return (
              <div key={step.percent} className="relative flex items-start gap-3.5 pb-5 last:pb-0">
                {/* Vertical connecting line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-[15px] top-[30px] bottom-0 w-[2px] -ml-[1px] transition-colors',
                      isAchieved ? 'bg-emerald-500/80 dark:bg-emerald-500/60' : 'bg-border/60'
                    )}
                  />
                )}

                {/* Status Node Icon */}
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    isAchieved &&
                      'border-emerald-500 bg-emerald-500 text-white shadow-xs dark:border-emerald-400 dark:bg-emerald-600',
                    isCurrent &&
                      'border-primary bg-background text-primary shadow-xs ring-4 ring-primary/15',
                    !isAchieved && !isCurrent && 'border-border/80 bg-muted/30 text-muted-foreground'
                  )}
                >
                  {isAchieved ? (
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                    </span>
                  ) : (
                    <Lock className="h-3 w-3 stroke-[2] opacity-60" />
                  )}
                </div>

                {/* Milestone Details Card */}
                <div
                  className={cn(
                    'flex-1 min-w-0 rounded-xl p-2.5 border transition-all',
                    isAchieved && 'border-emerald-500/25 bg-emerald-500/[0.04]',
                    isCurrent && 'border-primary/40 bg-primary/[0.03] shadow-xs',
                    !isAchieved && !isCurrent && 'border-border/50 bg-card/40'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-bold font-mono tracking-tight shrink-0',
                          isAchieved && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                          isCurrent && 'bg-primary/15 text-primary',
                          !isAchieved && !isCurrent && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {step.badge}
                      </span>
                      <span className="font-semibold text-xs text-foreground truncate">
                        {step.label}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          isAchieved
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : isCurrent
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {formatCurrency(stepTarget, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Sub-detail: Progress bar when current, or status label */}
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    {isAchieved ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Milestone unlocked
                      </span>
                    ) : isCurrent ? (
                      <div className="w-full space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-primary font-medium flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Next goal target
                          </span>
                          <span className="text-muted-foreground">
                            {formatCurrency(remaining, currency)} remaining
                          </span>
                        </div>
                        <Progress value={stepProgress} className="h-1.5" indicatorColor={goalColor} />
                      </div>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3 opacity-60" />
                        Requires {formatCurrency(stepTarget, currency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
