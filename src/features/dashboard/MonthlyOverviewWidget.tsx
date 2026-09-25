import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  addMonths,
  subMonths,
  isWithinInterval,
  getDate,
  getDaysInMonth,
} from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  BarChart3,
  Coins,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Goal, Transaction, CurrencyCode } from '@/types';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { cn } from '@/lib/utils';

interface MonthlyOverviewWidgetProps {
  transactions: Transaction[];
  goals: Goal[];
  currency: CurrencyCode;
  onOpenDeposit?: () => void;
  className?: string;
}

type ChartViewMode = 'weekly' | 'goals' | 'total';

interface PeriodDataPoint {
  label: string;
  shortLabel: string;
  deposits: number;
  withdrawals: number;
  net: number;
  depositCount: number;
  withdrawalCount: number;
  details?: { name: string; amount: number; type: 'deposit' | 'withdrawal' }[];
}

export function MonthlyOverviewWidget({
  transactions,
  goals,
  currency,
  onOpenDeposit,
  className,
}: MonthlyOverviewWidgetProps) {
  // Current active viewing month (defaults to now: current month)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ChartViewMode>('weekly');

  const isCurrentMonth = isSameMonth(selectedDate, new Date());

  const goalMap = useMemo(() => {
    const map = new Map<string, Goal>();
    goals.forEach((g) => map.set(g.id, g));
    return map;
  }, [goals]);

  // Compute stats for selected month & previous month comparison
  const monthData = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const prevMonthStart = startOfMonth(subMonths(selectedDate, 1));
    const prevMonthEnd = endOfMonth(subMonths(selectedDate, 1));

    // Filter transactions for this month
    const thisMonthTxs = transactions.filter((t) => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    // Filter transactions for previous month for trend analysis
    const prevMonthTxs = transactions.filter((t) => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start: prevMonthStart, end: prevMonthEnd });
    });

    const deposits = thisMonthTxs.filter((t) => t.type === 'deposit');
    const withdrawals = thisMonthTxs.filter((t) => t.type === 'withdrawal');

    const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalDeposits - totalWithdrawals;

    const prevDeposits = prevMonthTxs
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    // Retention rate: how much of deposits remained after withdrawals
    const retentionRate =
      totalDeposits > 0
        ? Math.max(0, Math.round(((totalDeposits - totalWithdrawals) / totalDeposits) * 100))
        : 0;

    // Monthly deposit growth trend
    const depositDeltaPct =
      prevDeposits > 0
        ? Math.round(((totalDeposits - prevDeposits) / prevDeposits) * 100)
        : totalDeposits > 0
          ? 100
          : 0;

    // Goals contributed to this month
    const goalContributions = new Map<string, { deposits: number; withdrawals: number }>();
    thisMonthTxs.forEach((t) => {
      const current = goalContributions.get(t.goalId) || { deposits: 0, withdrawals: 0 };
      if (t.type === 'deposit') {
        current.deposits += t.amount;
      } else {
        current.withdrawals += t.amount;
      }
      goalContributions.set(t.goalId, current);
    });

    const activeGoalsThisMonth = Array.from(goalContributions.entries())
      .map(([goalId, data]) => ({
        goal: goalMap.get(goalId),
        goalId,
        ...data,
      }))
      .filter((item) => item.goal !== undefined)
      .sort((a, b) => b.deposits - a.deposits);

    return {
      monthLabel: format(selectedDate, 'MMMM yyyy'),
      monthShort: format(selectedDate, 'MMM yyyy'),
      thisMonthTxs,
      depositsCount: deposits.length,
      withdrawalsCount: withdrawals.length,
      totalDeposits,
      totalWithdrawals,
      netSavings,
      retentionRate,
      depositDeltaPct,
      hasActivity: thisMonthTxs.length > 0,
      activeGoalsThisMonth,
    };
  }, [selectedDate, transactions, goalMap]);

  // Chart data based on view mode (Weekly Periods, By Goal, or Total Month)
  const chartData = useMemo<PeriodDataPoint[]>(() => {
    if (!monthData.hasActivity) return [];

    if (viewMode === 'total') {
      // Direct comparison of Total Deposits vs Total Withdrawals
      return [
        {
          label: `${monthData.monthShort} Overview`,
          shortLabel: 'This Month',
          deposits: monthData.totalDeposits,
          withdrawals: monthData.totalWithdrawals,
          net: monthData.netSavings,
          depositCount: monthData.depositsCount,
          withdrawalCount: monthData.withdrawalsCount,
        },
      ];
    }

    if (viewMode === 'goals') {
      // Group by Goal for this month
      return monthData.activeGoalsThisMonth.slice(0, 6).map((item) => ({
        label: item.goal?.name || 'Goal',
        shortLabel: (item.goal?.name || 'Goal').slice(0, 10),
        deposits: item.deposits,
        withdrawals: item.withdrawals,
        net: item.deposits - item.withdrawals,
        depositCount: 0,
        withdrawalCount: 0,
      }));
    }

    // Default: 'weekly' periods in the current month
    const totalDays = getDaysInMonth(selectedDate);
    const periods = [
      { start: 1, end: 7, label: 'Days 1–7', shortLabel: 'Wk 1 (1–7)' },
      { start: 8, end: 14, label: 'Days 8–14', shortLabel: 'Wk 2 (8–14)' },
      { start: 15, end: 21, label: 'Days 15–21', shortLabel: 'Wk 3 (15–21)' },
      {
        start: 22,
        end: totalDays,
        label: `Days 22–${totalDays}`,
        shortLabel: `Wk 4 (22–${totalDays})`,
      },
    ];

    return periods.map((p) => {
      let depSum = 0;
      let wthSum = 0;
      let depCount = 0;
      let wthCount = 0;
      const details: { name: string; amount: number; type: 'deposit' | 'withdrawal' }[] = [];

      monthData.thisMonthTxs.forEach((t) => {
        const dayOfMonth = getDate(parseISO(t.date));
        if (dayOfMonth >= p.start && dayOfMonth <= p.end) {
          const gName = goalMap.get(t.goalId)?.name || 'Savings Goal';
          if (t.type === 'deposit') {
            depSum += t.amount;
            depCount += 1;
            details.push({ name: gName, amount: t.amount, type: 'deposit' });
          } else {
            wthSum += t.amount;
            wthCount += 1;
            details.push({ name: gName, amount: t.amount, type: 'withdrawal' });
          }
        }
      });

      return {
        label: p.label,
        shortLabel: p.shortLabel,
        deposits: depSum,
        withdrawals: wthSum,
        net: depSum - wthSum,
        depositCount: depCount,
        withdrawalCount: wthCount,
        details,
      };
    });
  }, [monthData, viewMode, selectedDate, goalMap]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">
                Monthly Overview
              </CardTitle>
              {isCurrentMonth && (
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Current Month
                </span>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Total deposits and withdrawals summarized for {monthData.monthLabel}
            </CardDescription>
          </div>

          {/* Month Selector Navigation Controls */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/60 p-1 rounded-lg border border-border/60">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedDate((prev) => subMonths(prev, 1))}
              title="Previous Month"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="text-xs font-semibold px-2 min-w-[105px] text-center text-foreground select-none">
              {monthData.monthLabel}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedDate((prev) => addMonths(prev, 1))}
              title="Next Month"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>

            {!isCurrentMonth && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-2 ml-1 text-primary border-primary/30"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* Top KPI Metrics Row: Deposits, Withdrawals, Net Savings */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Deposits Card */}
          <div className="p-3.5 rounded-xl border-2 border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 shadow-xs space-y-1.5 transition-all">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                </span>
                Total Deposits
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                {monthData.depositsCount} txn{monthData.depositsCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-950 dark:text-emerald-100 tracking-tight">
              {formatCurrency(monthData.totalDeposits, currency)}
            </div>
            <div className="text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              {monthData.depositDeltaPct >= 0 ? (
                <>
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">+{monthData.depositDeltaPct}%</span>
                  <span className="text-emerald-700/90 dark:text-emerald-400/90">vs last mo</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">{monthData.depositDeltaPct}%</span>
                  <span className="text-emerald-700/90 dark:text-emerald-400/90">vs last mo</span>
                </>
              )}
            </div>
          </div>

          {/* Total Withdrawals Card */}
          <div className="p-3.5 rounded-xl border-2 border-rose-300 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-950/30 shadow-xs space-y-1.5 transition-all">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-900 dark:text-rose-200">
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
                Total Withdrawals
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                {monthData.withdrawalsCount} txn{monthData.withdrawalsCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-950 dark:text-rose-100 tracking-tight">
              {formatCurrency(monthData.totalWithdrawals, currency)}
            </div>
            <div className="text-xs font-medium text-rose-800 dark:text-rose-300">
              {monthData.totalWithdrawals === 0
                ? 'Zero withdrawals this month'
                : `${monthData.withdrawalsCount} disbursement record${monthData.withdrawalsCount === 1 ? '' : 's'}`}
            </div>
          </div>

          {/* Net Cash Flow Card */}
          <div className="p-3.5 rounded-xl border border-border/90 bg-card dark:bg-muted/40 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                  <Coins className="h-3.5 w-3.5" />
                </span>
                Net Cash Flow
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded-md border',
                  monthData.netSavings >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                )}
              >
                {monthData.netSavings >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <div
              className={cn(
                'text-xl sm:text-2xl font-bold tracking-tight',
                monthData.netSavings >= 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-rose-700 dark:text-rose-300'
              )}
            >
              {monthData.netSavings >= 0 ? '+' : ''}
              {formatCurrency(monthData.netSavings, currency)}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Net balance added in {monthData.monthShort}
            </div>
          </div>

          {/* Savings Retention Rate Card */}
          <div className="p-3.5 rounded-xl border border-border/90 bg-card dark:bg-muted/40 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                Savings Retention
              </span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/60">
                {monthData.activeGoalsThisMonth.length} target{monthData.activeGoalsThisMonth.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {monthData.totalDeposits > 0 ? `${monthData.retentionRate}%` : '0%'}
            </div>
            <div className="text-xs text-muted-foreground font-medium truncate">
              {monthData.totalDeposits > 0
                ? `${monthData.retentionRate}% of deposits retained`
                : 'No deposits logged'}
            </div>
          </div>
        </div>

        {/* Chart View Mode Controls & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-medium">
              <div className="h-3 w-3 rounded-xs bg-emerald-500 shadow-xs" />
              <span className="text-foreground">Deposits ({formatCurrency(monthData.totalDeposits, currency)})</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <div className="h-3 w-3 rounded-xs bg-rose-500 shadow-xs" />
              <span className="text-foreground">Withdrawals ({formatCurrency(monthData.totalWithdrawals, currency)})</span>
            </div>
          </div>

          {/* View Mode Toggle: Weekly Periods | By Goal | Month Total */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 self-end sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium text-xs',
                viewMode === 'weekly'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setViewMode('goals')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium text-xs',
                viewMode === 'goals'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              By Goal
            </button>
            <button
              type="button"
              onClick={() => setViewMode('total')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium text-xs',
                viewMode === 'total'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Total Bar
            </button>
          </div>
        </div>

        {/* Bar Chart Container */}
        {monthData.hasActivity ? (
          <div className="w-full h-[240px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                barGap={6}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                  opacity={0.6}
                />
                <XAxis
                  dataKey="shortLabel"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={5}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatCompactCurrency(val, currency)}
                  dx={-4}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as PeriodDataPoint;
                      return (
                        <div className="rounded-xl border border-border bg-popover/95 p-3.5 shadow-xl text-xs backdrop-blur-md min-w-[220px] max-w-[300px] pointer-events-none z-50 space-y-2">
                          <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                            <span className="font-semibold text-foreground">{data.label}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {monthData.monthShort}
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-0.5">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                Deposits
                              </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(data.deposits, currency)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                                <div className="h-2 w-2 rounded-full bg-rose-500" />
                                Withdrawals
                              </span>
                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                {formatCurrency(data.withdrawals, currency)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-border/60">
                              <span className="text-muted-foreground font-medium">Net Flow</span>
                              <span
                                className={cn(
                                  'font-bold',
                                  data.net >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                )}
                              >
                                {data.net >= 0 ? '+' : ''}
                                {formatCurrency(data.net, currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="deposits"
                  name="Deposits"
                  fill="#10b981"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  dataKey="withdrawals"
                  name="Withdrawals"
                  fill="#f43f5e"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                No savings activity in {monthData.monthLabel}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                There were no deposits or withdrawals recorded during this month. Add a deposit to start tracking progress.
              </p>
            </div>
            {onOpenDeposit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenDeposit}
                className="gap-1.5 text-xs h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Record Deposit</span>
              </Button>
            )}
          </div>
        )}

        {/* Active Goals Contributed to This Month (if available) */}
        {monthData.activeGoalsThisMonth.length > 0 && (
          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">
                Goals Contributed to in {monthData.monthShort}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {monthData.activeGoalsThisMonth.length} active goal{monthData.activeGoalsThisMonth.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {monthData.activeGoalsThisMonth.slice(0, 3).map((item) => {
                const goal = item.goal!;
                return (
                  <div
                    key={item.goalId}
                    className="p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground truncate">
                        {goal.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground capitalize">
                        {goal.category}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(item.deposits, currency)}
                      </div>
                      {item.withdrawals > 0 && (
                        <div className="text-[10px] font-semibold text-rose-500">
                          -{formatCurrency(item.withdrawals, currency)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
