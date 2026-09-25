import React from 'react';
import { Zap, Shield, Rocket, Plus, ChevronRight, PieChart, Layers } from 'lucide-react';
import { Goal, ResolvedTimeHorizon } from '@/types';
import { useGoalsStore } from '@/store/useGoalsStore';
import { aggregateGoalsByHorizon, TIME_HORIZONS } from '@/lib/timeHorizons';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { GoalCard } from '@/features/goals/GoalCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GoalBucketsViewProps {
  goals: Goal[];
  onEdit: (goal: Goal) => void;
  onCreateGoal?: (defaultBucket?: ResolvedTimeHorizon) => void;
}

export function GoalBucketsView({ goals, onEdit, onCreateGoal }: GoalBucketsViewProps) {
  const { settings } = useGoalsStore();
  const { buckets, totalPortfolioSaved, totalPortfolioTarget } = React.useMemo(() => {
    return aggregateGoalsByHorizon(goals, settings.currency);
  }, [goals, settings.currency]);

  const bucketKeys: ResolvedTimeHorizon[] = ['short', 'medium', 'long'];

  return (
    <div className="space-y-6">
      {/* Wealth Distribution Overview Banner */}
      <Card className="border-border/80 bg-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold text-foreground">
                  Time Horizon Wealth Buckets
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Overview of your wealth distribution across Short-term (&lt; 1 yr), Mid-term (1–3 yrs), and Long-term (&gt; 3 yrs) horizons.
              </CardDescription>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-muted-foreground block">Total Portfolio Allocation</span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(totalPortfolioSaved, settings.currency)}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  / {formatCurrency(totalPortfolioTarget, settings.currency)}
                </span>
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Multi-segment Wealth Allocation Bar */}
          <div className="space-y-1.5">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
              {bucketKeys.map((key) => {
                const b = buckets[key];
                if (b.percentageOfTotalWealth <= 0) return null;
                return (
                  <div
                    key={key}
                    style={{
                      width: `${b.percentageOfTotalWealth}%`,
                      backgroundColor: b.config.color,
                    }}
                    className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                    title={`${b.config.label}: ${b.percentageOfTotalWealth}%`}
                  />
                );
              })}
            </div>

            {/* Legend & quick percentages */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              {bucketKeys.map((key) => {
                const b = buckets[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: b.config.color }}
                      />
                      <div>
                        <span className="font-semibold text-foreground block text-xs">
                          {b.config.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {b.config.rangeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground block text-xs">
                        {b.percentageOfTotalWealth}%
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatCompactCurrency(b.totalSavedBase, settings.currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3 Horizon Buckets Grid */}
      <div className="space-y-8">
        {bucketKeys.map((key) => {
          const b = buckets[key];
          const Icon =
            b.config.iconName === 'Zap' ? Zap : b.config.iconName === 'Shield' ? Shield : Rocket;

          return (
            <div key={key} className="space-y-3.5">
              {/* Bucket Header Card */}
              <div
                className={cn(
                  'p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all',
                  b.config.bgClass,
                  b.config.borderClass
                )}
              >
                <div className="flex items-start md:items-center gap-3.5">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: `${b.config.color}25`, color: b.config.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-foreground">{b.config.label}</h3>
                      <span className="text-xs text-muted-foreground">({b.config.rangeLabel})</span>
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border',
                          b.config.badgeClass
                        )}
                      >
                        {b.config.rangeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.config.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-muted-foreground block">
                      {b.goals.length} goal{b.goals.length === 1 ? '' : 's'} · {b.progressPct}% achieved
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(b.totalSavedBase, settings.currency)}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        / {formatCurrency(b.totalTargetBase, settings.currency)}
                      </span>
                    </span>
                  </div>

                  {onCreateGoal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCreateGoal(key)}
                      className="h-8 text-xs gap-1.5 shrink-0 bg-background/80 hover:bg-background"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Goal
                    </Button>
                  )}
                </div>
              </div>

              {/* Bucket Goals List / Grid */}
              {b.goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {b.goals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} onEdit={onEdit} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-8 text-center bg-card/40 flex flex-col items-center justify-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    No savings goals currently assigned to this {b.config.label} bucket.
                  </p>
                  {onCreateGoal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCreateGoal(key)}
                      className="text-xs h-8 gap-1.5 mt-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create {b.config.label} Goal
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
