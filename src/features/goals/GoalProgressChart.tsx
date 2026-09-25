import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Calendar, ArrowDownLeft, ArrowUpRight, CheckCircle2, Target } from 'lucide-react';
import { Goal, Transaction } from '@/types';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { useGoalsStore } from '@/store/useGoalsStore';
import { cn } from '@/lib/utils';

interface GoalProgressChartProps {
  goal: Goal;
  transactions: Transaction[];
  className?: string;
}

interface GoalChartTx {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  note?: string;
  date: string;
}

interface GoalChartPoint {
  dateKey: string;
  displayDate: string;
  fullDate: string;
  balance: number;
  target: number;
  percentage: number;
  remaining: number;
  netDelta: number;
  transactions: GoalChartTx[];
  isStart?: boolean;
}

export function GoalProgressChart({ goal, transactions, className }: GoalProgressChartProps) {
  const { settings } = useGoalsStore();

  const chartData = useMemo<GoalChartPoint[]>(() => {
    const goalTx = transactions
      .filter((t) => t.goalId === goal.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let balance = 0;
    const dayMap = new Map<string, GoalChartPoint>();

    if (goal.createdAt) {
      const createdDate = parseISO(goal.createdAt);
      dayMap.set('start', {
        dateKey: 'start',
        displayDate: 'Start',
        fullDate: `Created on ${format(createdDate, 'EEEE, MMM d, yyyy')}`,
        balance: 0,
        target: goal.targetAmount,
        percentage: 0,
        remaining: goal.targetAmount,
        netDelta: 0,
        transactions: [],
        isStart: true,
      });
    }

    goalTx.forEach((t) => {
      const delta = t.type === 'deposit' ? t.amount : -t.amount;
      balance = Math.max(0, balance + delta);
      const parsed = parseISO(t.date);
      const key = format(parsed, 'yyyy-MM-dd');
      const percentage = Math.min(100, Math.round((balance / goal.targetAmount) * 100));
      const remaining = Math.max(0, goal.targetAmount - balance);

      const txItem: GoalChartTx = {
        id: t.id,
        type: t.type,
        amount: t.amount,
        note: t.note,
        date: t.date,
      };

      if (!dayMap.has(key)) {
        dayMap.set(key, {
          dateKey: key,
          displayDate: format(parsed, 'MMM d'),
          fullDate: format(parsed, 'EEEE, MMM d, yyyy'),
          balance,
          target: goal.targetAmount,
          percentage,
          remaining,
          netDelta: delta,
          transactions: [txItem],
        });
      } else {
        const existing = dayMap.get(key)!;
        existing.balance = balance;
        existing.percentage = percentage;
        existing.remaining = remaining;
        existing.netDelta += delta;
        existing.transactions.push(txItem);
      }
    });

    const points = Array.from(dayMap.values());

    if (points.length === 1 && !points[0].transactions.length) {
      points.push({
        dateKey: 'current',
        displayDate: 'Current',
        fullDate: `Today (${format(new Date(), 'EEEE, MMM d, yyyy')})`,
        balance: goal.currentAmount,
        target: goal.targetAmount,
        percentage: Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)),
        remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
        netDelta: 0,
        transactions: [],
      });
    }

    return points;
  }, [goal, transactions]);

  return (
    <div className={className} style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={goal.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={goal.color} stopOpacity={0.0} />
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
          <ReferenceLine
            y={goal.targetAmount}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            label={{
              value: `Target ${formatCompactCurrency(goal.targetAmount, settings.currency)}`,
              position: 'insideTopRight',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
            }}
          />
          <Tooltip
            cursor={{ stroke: goal.color, strokeWidth: 1.5, strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as GoalChartPoint;
                const isGoalDone = data.balance >= goal.targetAmount;

                return (
                  <div className="rounded-xl border border-border bg-popover/95 p-3.5 shadow-xl text-xs backdrop-blur-md min-w-[250px] max-w-[340px] pointer-events-none transition-all space-y-2.5 z-50">
                    {/* Header: Date with calendar */}
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground truncate">{data.fullDate}</span>
                      </div>
                      {isGoalDone ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold inline-flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="h-3 w-3" />
                          Done
                        </span>
                      ) : data.isStart ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium shrink-0">
                          Start
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold shrink-0">
                          {data.percentage}%
                        </span>
                      )}
                    </div>

                    {/* Balance & Target Progress */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Balance at this point</span>
                        <span>of {formatCurrency(goal.targetAmount, settings.currency)}</span>
                      </div>
                      <div
                        className="text-base font-bold tracking-tight mt-0.5 font-mono"
                        style={{ color: goal.color }}
                      >
                        {formatCurrency(data.balance, settings.currency)}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                        <span>{data.percentage}% completed</span>
                        <span>
                          {isGoalDone
                            ? 'Target reached! 🎉'
                            : `${formatCurrency(data.remaining, settings.currency)} to go`}
                        </span>
                      </div>
                    </div>

                    {/* Precise Transaction activity on this point */}
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
                                <div className="flex items-center gap-1 font-medium text-foreground">
                                  <Target className="h-3 w-3 text-primary shrink-0" />
                                  <span className="capitalize">{tx.type}</span>
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
            dataKey="balance"
            stroke={goal.color}
            strokeWidth={2.5}
            fill={`url(#gradient-${goal.id})`}
            activeDot={{
              r: 5,
              strokeWidth: 2.5,
              stroke: goal.color,
              fill: '#fff',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
