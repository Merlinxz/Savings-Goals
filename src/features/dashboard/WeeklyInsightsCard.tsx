import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Target,
  ArrowUpRight,
  Plus,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import { format, parseISO, subDays, isSameDay, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Goal, Transaction, CurrencyCode } from '@/types';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { GoalThumbnail } from '@/components/common/GoalThumbnail';
import { cn } from '@/lib/utils';

interface WeeklyInsightsCardProps {
  transactions: Transaction[];
  goals: Goal[];
  currency: CurrencyCode;
  onOpenDeposit?: () => void;
  className?: string;
}

export function WeeklyInsightsCard({
  transactions,
  goals,
  currency,
  onOpenDeposit,
  className,
}: WeeklyInsightsCardProps) {
  const goalMap = useMemo(() => {
    const map = new Map<string, Goal>();
    goals.forEach((g) => map.set(g.id, g));
    return map;
  }, [goals]);

  // Compute 7-day window metrics
  const insights = useMemo(() => {
    const now = new Date();
    // Beginning of 7 days ago (inclusive of current day = 7 full calendar days)
    const sevenDaysAgo = startOfDay(subDays(now, 6));
    const fourteenDaysAgo = startOfDay(subDays(now, 13));

    // Filter deposits in the last 7 days
    const weeklyDeposits = transactions.filter((t) => {
      if (t.type !== 'deposit') return false;
      const tDate = parseISO(t.date);
      return tDate >= sevenDaysAgo && tDate <= now;
    });

    // Filter withdrawals in the last 7 days
    const weeklyWithdrawals = transactions.filter((t) => {
      if (t.type !== 'withdrawal') return false;
      const tDate = parseISO(t.date);
      return tDate >= sevenDaysAgo && tDate <= now;
    });

    // Prior 7-day period for trend comparison
    const priorPeriodDeposits = transactions.filter((t) => {
      if (t.type !== 'deposit') return false;
      const tDate = parseISO(t.date);
      return tDate >= fourteenDaysAgo && tDate < sevenDaysAgo;
    });

    const totalContributed = weeklyDeposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawn = weeklyWithdrawals.reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalContributed - totalWithdrawn;

    const priorTotalContributed = priorPeriodDeposits.reduce((sum, t) => sum + t.amount, 0);

    // Percentage change vs previous 7-day cycle
    let trendPercent: number | null = null;
    if (priorTotalContributed > 0) {
      trendPercent = Math.round(
        ((totalContributed - priorTotalContributed) / priorTotalContributed) * 100
      );
    }

    // Breakdown contributions per goal
    const goalContributions = new Map<string, number>();
    weeklyDeposits.forEach((t) => {
      const current = goalContributions.get(t.goalId) || 0;
      goalContributions.set(t.goalId, current + t.amount);
    });

    // Find top-funded goal this week
    let topGoalId: string | null = null;
    let topGoalAmount = 0;
    goalContributions.forEach((amt, gId) => {
      if (amt > topGoalAmount) {
        topGoalAmount = amt;
        topGoalId = gId;
      }
    });
    const topGoal = topGoalId ? goalMap.get(topGoalId) : null;

    // Daily contribution timeline for the 7 individual days
    const dailyBreakdown = Array.from({ length: 7 }).map((_, index) => {
      const dayDate = subDays(now, 6 - index);
      const dayDeposits = weeklyDeposits.filter((t) =>
        isSameDay(parseISO(t.date), dayDate)
      );
      const dayAmount = dayDeposits.reduce((acc, t) => acc + t.amount, 0);
      const isToday = isSameDay(dayDate, now);

      return {
        date: dayDate,
        dayLabel: format(dayDate, 'EEE'),
        dayNumber: format(dayDate, 'd'),
        fullDate: format(dayDate, 'EEEE, MMM d, yyyy'),
        amount: dayAmount,
        count: dayDeposits.length,
        isToday,
      };
    });

    const maxDailyAmount = Math.max(1, ...dailyBreakdown.map((d) => d.amount));
    const dailyAverage = totalContributed / 7;
    const fundedGoalsCount = goalContributions.size;

    return {
      sevenDaysAgo,
      now,
      totalContributed,
      totalWithdrawn,
      netSavings,
      contributionCount: weeklyDeposits.length,
      priorTotalContributed,
      trendPercent,
      topGoal,
      topGoalAmount,
      dailyBreakdown,
      maxDailyAmount,
      dailyAverage,
      fundedGoalsCount,
    };
  }, [transactions, goalMap]);

  const dateRangeLabel = `${format(insights.sevenDaysAgo, 'MMM d')} – ${format(
    insights.now,
    'MMM d, yyyy'
  )}`;

  return (
    <Card className={cn('overflow-hidden border-border/80 bg-card', className)}>
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CalendarDays className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                Weekly Insights
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Savings contributions made within the last 7 days
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/60">
              {dateRangeLabel}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* Main Highlight Metric & Trend */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-muted/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                7-Day Contributions
              </span>
              {insights.contributionCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  {insights.contributionCount} deposit{insights.contributionCount === 1 ? '' : 's'}
                </span>
              )}
            </div>

            <div className="text-3xl font-bold tracking-tight text-foreground">
              {formatCurrency(insights.totalContributed, currency)}
            </div>

            <p className="text-xs text-muted-foreground">
              {insights.contributionCount > 0 ? (
                <>
                  Allocated across{' '}
                  <strong className="text-foreground">
                    {insights.fundedGoalsCount} goal{insights.fundedGoalsCount === 1 ? '' : 's'}
                  </strong>
                  {' • '}
                  Avg. {formatCurrency(insights.dailyAverage, currency)} / day
                </>
              ) : (
                'No contributions recorded in this 7-day period.'
              )}
            </p>
          </div>

          {/* Trend Indicator */}
          <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
            {insights.trendPercent !== null ? (
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                  insights.trendPercent >= 0
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                )}
              >
                {insights.trendPercent >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>
                  {insights.trendPercent >= 0 ? '+' : ''}
                  {insights.trendPercent}% vs prev 7 days
                </span>
              </div>
            ) : insights.totalContributed > 0 ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>New weekly momentum</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                Prev 7 days: {formatCurrency(insights.priorTotalContributed, currency)}
              </span>
            )}

            {insights.totalContributed > 0 && insights.totalWithdrawn > 0 && (
              <span className="text-[11px] text-muted-foreground">
                Net: {formatCurrency(insights.netSavings, currency)}
              </span>
            )}
          </div>
        </div>

        {/* 7-Day Activity Spark-bars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Daily Contribution Rhythm</span>
            <span className="text-muted-foreground text-[11px]">Last 7 calendar days</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-2">
            {insights.dailyBreakdown.map((day, index) => {
              const heightPercent =
                insights.maxDailyAmount > 0
                  ? Math.max(12, Math.round((day.amount / insights.maxDailyAmount) * 100))
                  : 12;

              const hasContribution = day.amount > 0;

              return (
                <div
                  key={day.dayLabel + day.dayNumber}
                  className="relative flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  {/* Interactive Hover Tooltip */}
                  <div className="opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 pointer-events-none absolute bottom-[calc(100%+8px)] z-40 whitespace-nowrap rounded-lg border border-border bg-popover/95 px-2.5 py-1.5 shadow-xl text-center backdrop-blur-md">
                    <p className="text-[10px] text-muted-foreground font-medium">{day.fullDate}</p>
                    <p className="text-xs font-bold text-foreground font-mono mt-0.5">
                      {formatCurrency(day.amount, currency)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {hasContribution
                        ? `${day.count} contribution${day.count === 1 ? '' : 's'}`
                        : 'No contributions'}
                    </p>
                  </div>

                  {/* Amount label above bar */}
                  <div className="h-4 flex items-center justify-center">
                    {hasContribution ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity">
                        {formatCompactCurrency(day.amount, currency)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">-</span>
                    )}
                  </div>

                  {/* Vertical bar container */}
                  <div className="relative w-full h-20 rounded-lg bg-muted/30 border border-border/50 flex flex-col justify-end p-1 overflow-hidden transition-all group-hover:border-primary/40 group-hover:bg-muted/50">
                    <motion.div
                      className={cn(
                        'w-full rounded-md',
                        hasContribution
                          ? 'bg-emerald-500 group-hover:bg-emerald-400 shadow-2xs'
                          : 'bg-muted-foreground/15'
                      )}
                      initial={{ height: 0 }}
                      animate={{ height: hasContribution ? `${heightPercent}%` : '6px' }}
                      transition={{
                        duration: 0.5,
                        delay: 0.08 + index * 0.04,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  </div>

                  {/* Day label */}
                  <div className="text-center">
                    <span
                      className={cn(
                        'text-xs font-semibold block leading-tight',
                        day.isToday ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {day.dayLabel}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] block leading-tight',
                        day.isToday ? 'text-primary font-bold' : 'text-muted-foreground'
                      )}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Sub-row: Top Funded Goal or Action Prompt */}
        <div className="pt-1 border-t border-border/40">
          {insights.topGoal && insights.topGoalAmount > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <GoalThumbnail
                  icon={insights.topGoal.icon}
                  imageUrl={insights.topGoal.imageUrl}
                  color={insights.topGoal.color}
                  name={insights.topGoal.name}
                  size="sm"
                />
                <div className="min-w-0">
                  <span className="text-[11px] text-muted-foreground block">
                    Top Funded Goal this week:
                  </span>
                  <p className="font-semibold text-foreground truncate">
                    {insights.topGoal.name}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(insights.topGoalAmount, currency)}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {Math.round(
                    (insights.topGoalAmount / insights.totalContributed) * 100
                  )}
                  % of weekly total
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-1 text-xs text-muted-foreground">
              <span>Ready to boost this week's progress?</span>
              {onOpenDeposit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenDeposit}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Log Contribution
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
