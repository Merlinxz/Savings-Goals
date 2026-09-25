import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format, parseISO, subMonths, isAfter } from 'date-fns';
import { Calendar, ArrowDownLeft, ArrowUpRight, Target } from 'lucide-react';
import { Transaction } from '@/types';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { useGoalsStore } from '@/store/useGoalsStore';
import { cn } from '@/lib/utils';

interface SavingsGrowthChartProps {
  transactions: Transaction[];
  className?: string;
}

interface ChartPointTx {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  goalName: string;
  note?: string;
  date: string;
}

interface ChartDataPoint {
  dateKey: string;
  displayDate: string;
  fullDate: string;
  total: number;
  netDelta: number;
  transactions: ChartPointTx[];
  isStart?: boolean;
}

export function SavingsGrowthChart({ transactions, className }: SavingsGrowthChartProps) {
  const { settings, goals } = useGoalsStore();

  const goalMap = useMemo(() => {
    const map = new Map<string, string>();
    goals.forEach((g) => map.set(g.id, g.name));
    return map;
  }, [goals]);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!transactions.length) return [];

    // Sort transactions chronologically
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Filter to last 6 months or take all if shorter
    const sixMonthsAgo = subMonths(new Date(), 6);
    const recentTx = sorted.filter((t) => isAfter(parseISO(t.date), sixMonthsAgo));
    const dataPointsToUse = recentTx.length >= 3 ? recentTx : sorted;

    let runningTotal = 0;

    // If starting after initial transactions, compute initial balance prior
    if (dataPointsToUse.length < sorted.length) {
      const prior = sorted.filter((t) => !dataPointsToUse.includes(t));
      runningTotal = prior.reduce(
        (acc, t) => acc + (t.type === 'deposit' ? t.amount : -t.amount),
        0
      );
    }

    const dayMap = new Map<string, ChartDataPoint>();

    dataPointsToUse.forEach((t) => {
      const delta = t.type === 'deposit' ? t.amount : -t.amount;
      runningTotal = Math.max(0, runningTotal + delta);
      const parsedDate = parseISO(t.date);
      const dayKey = format(parsedDate, 'yyyy-MM-dd');
      const goalName = goalMap.get(t.goalId) || 'Savings Goal';

      const txItem: ChartPointTx = {
        id: t.id,
        type: t.type,
        amount: t.amount,
        goalName,
        note: t.note,
        date: t.date,
      };

      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, {
          dateKey: dayKey,
          displayDate: format(parsedDate, 'MMM d'),
          fullDate: format(parsedDate, 'EEEE, MMM d, yyyy'),
          total: runningTotal,
          netDelta: delta,
          transactions: [txItem],
        });
      } else {
        const existing = dayMap.get(dayKey)!;
        existing.total = runningTotal;
        existing.netDelta += delta;
        existing.transactions.push(txItem);
      }
    });

    const result = Array.from(dayMap.values());
    if (result.length === 1) {
      result.unshift({
        dateKey: 'start',
        displayDate: 'Start',
        fullDate: 'Initial Starting Point',
        total: 0,
        netDelta: 0,
        transactions: [],
        isStart: true,
      });
    }
    return result;
  }, [transactions, goalMap]);

  if (!chartData.length) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-muted-foreground">
        No transaction history recorded yet.
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="savingsAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
          <XAxis
            dataKey="displayDate"
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
            tickFormatter={(val) => formatCompactCurrency(val, settings.currency)}
            dx={-4}
          />
          <Tooltip
            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as ChartDataPoint;
                return (
                  <div className="rounded-xl border border-border bg-popover/95 p-3.5 shadow-xl text-xs backdrop-blur-md min-w-[250px] max-w-[340px] pointer-events-none transition-all space-y-2.5 z-50">
                    {/* Header: Date with calendar icon */}
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground truncate">{data.fullDate}</span>
                      </div>
                      {data.isStart && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium shrink-0">
                          Baseline
                        </span>
                      )}
                    </div>

                    {/* Running Portfolio Balance */}
                    <div>
                      <div className="text-[11px] font-medium text-muted-foreground">
                        Cumulative Portfolio Balance
                      </div>
                      <div className="text-base font-bold tracking-tight text-foreground mt-0.5">
                        {formatCurrency(data.total, settings.currency)}
                      </div>
                    </div>

                    {/* Activity at this point */}
                    {!data.isStart && data.transactions.length > 0 && (
                      <div className="pt-2 border-t border-border/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-muted-foreground">
                            {data.transactions.length === 1 ? 'Transaction details:' : `Activity (${data.transactions.length} entries):`}
                          </span>
                          <span
                            className={cn(
                              'font-semibold px-1.5 py-0.5 rounded text-[10px] inline-flex items-center gap-1 font-mono',
                              data.netDelta >= 0
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            )}
                          >
                            {data.netDelta >= 0 ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                            {data.netDelta >= 0 ? '+' : ''}
                            {formatCurrency(data.netDelta, settings.currency)}
                          </span>
                        </div>

                        {/* List of transactions on this point */}
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                          {data.transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-start justify-between gap-2 rounded-lg bg-muted/40 p-2 text-[11px] border border-border/40"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 font-medium text-foreground truncate">
                                  <Target className="h-3 w-3 text-primary shrink-0" />
                                  <span className="truncate">{tx.goalName}</span>
                                </div>
                                {tx.note && (
                                  <p className="text-[10px] text-muted-foreground truncate italic mt-0.5">
                                    &ldquo;{tx.note}&rdquo;
                                  </p>
                                )}
                              </div>
                              <span
                                className={cn(
                                  'font-bold font-mono text-xs shrink-0',
                                  tx.type === 'deposit'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                )}
                              >
                                {tx.type === 'deposit' ? '+' : '-'}
                                {formatCurrency(tx.amount, settings.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#savingsAreaGradient)"
            activeDot={{
              r: 5,
              strokeWidth: 2.5,
              stroke: 'hsl(var(--primary))',
              fill: 'hsl(var(--background))',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
