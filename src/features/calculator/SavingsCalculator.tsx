import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator,
  Calendar,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Percent,
  DollarSign,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Share2,
  Info,
  Sliders,
  PiggyBank,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { useGoalsStore } from '@/store/useGoalsStore';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { calculateSavingsTimeline, SavingsCalculatorResult } from '@/lib/savingsCalculator';
import { Goal } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SavingsCalculatorProps {
  initialTarget?: number;
  initialCurrent?: number;
  initialMonthly?: number;
  initialApy?: number;
  onApplyToGoal?: (data: { targetAmount: number; monthlyContribution: number; estimatedMonths: number }) => void;
  onCreateGoal?: (data: { targetAmount: number; currentAmount: number; monthlyContribution: number }) => void;
  className?: string;
}

export function SavingsCalculator({
  initialTarget = 10000,
  initialCurrent = 1500,
  initialMonthly = 400,
  initialApy = 0,
  onApplyToGoal,
  onCreateGoal,
  className,
}: SavingsCalculatorProps) {
  const { goals, settings, updateGoal } = useGoalsStore();
  const currency = settings.currency;

  // Form Inputs
  const [targetAmount, setTargetAmount] = useState<number>(initialTarget);
  const [currentSavings, setCurrentSavings] = useState<number>(initialCurrent);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(initialMonthly);
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(initialApy);
  const [includeInterest, setIncludeInterest] = useState<boolean>(initialApy > 0);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  // Active chart metric toggle
  const [chartView, setChartView] = useState<'total' | 'breakdown'>('total');

  // Perform calculation
  const result: SavingsCalculatorResult = useMemo(() => {
    return calculateSavingsTimeline({
      targetAmount: Number(targetAmount) || 0,
      currentSavings: Number(currentSavings) || 0,
      monthlyContribution: Number(monthlyContribution) || 0,
      annualInterestRate: includeInterest ? Number(annualInterestRate) || 0 : 0,
    });
  }, [targetAmount, currentSavings, monthlyContribution, annualInterestRate, includeInterest]);

  // Load from existing goal
  const handleSelectGoal = (goalId: string) => {
    setSelectedGoalId(goalId);
    if (!goalId) return;

    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setTargetAmount(goal.targetAmount);
      setCurrentSavings(goal.currentAmount);

      // If goal has a recurring schedule, estimate monthly amount
      if (goal.recurringContribution?.enabled && goal.recurringContribution.amount > 0) {
        const monthly =
          goal.recurringContribution.frequency === 'weekly'
            ? Math.round(goal.recurringContribution.amount * 4.333)
            : goal.recurringContribution.amount;
        setMonthlyContribution(monthly);
      } else {
        // Fallback default calculation based on remaining balance
        const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
        setMonthlyContribution(Math.max(50, Math.round(remaining / 12)));
      }
      toast.info(`Loaded data from "${goal.name}"`);
    }
  };

  // Reset to sample defaults
  const handleReset = () => {
    setTargetAmount(10000);
    setCurrentSavings(1500);
    setMonthlyContribution(400);
    setAnnualInterestRate(0);
    setIncludeInterest(false);
    setSelectedGoalId('');
    toast.success('Calculator reset to defaults');
  };

  // Copy summary to clipboard
  const handleCopySummary = () => {
    const text = `Savings Goal Estimation:
• Target: ${formatCurrency(result.targetAmount, currency)}
• Starting Savings: ${formatCurrency(result.currentSavings, currency)}
• Monthly Contribution: ${formatCurrency(result.monthlyContribution, currency)}
• Estimated Time: ${result.formattedDuration}
• Projected Completion: ${result.formattedTargetDate}
${result.totalInterestEarned > 0 ? `• Interest Earned: ${formatCurrency(result.totalInterestEarned, currency)}` : ''}`;

    navigator.clipboard.writeText(text);
    toast.success('Calculation summary copied to clipboard!');
  };

  // Handle Apply to Goal
  const handleApply = () => {
    if (!selectedGoalId) return;
    const goal = goals.find((g) => g.id === selectedGoalId);
    if (!goal) return;

    updateGoal(goal.id, {
      targetAmount: result.targetAmount,
      recurringContribution: {
        enabled: true,
        frequency: 'monthly',
        amount: result.monthlyContribution,
        dayOfMonth: 1,
        startDate: new Date().toISOString().split('T')[0],
      },
    });

    toast.success(`Updated plan for "${goal.name}"`);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Top Banner / Goal Selector */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Savings Calculator</h2>
                <p className="text-xs text-muted-foreground">
                  Estimate how long it will take to reach your target or test different savings amounts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {goals.length > 0 && (
                <div className="flex items-center gap-2 min-w-[200px]">
                  <select
                    id="savings-calc-load-goal"
                    aria-label="Load settings from an existing goal"
                    value={selectedGoalId}
                    onChange={(e) => handleSelectGoal(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Load from an existing goal...</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({formatCompactCurrency(g.targetAmount, currency)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-9 text-xs gap-1.5 shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calculator Inputs */}
        <div className="lg:col-span-5 space-y-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Calculator Inputs</span>
                <span className="text-xs font-normal text-muted-foreground">Adjust numbers in real-time</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Target Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="targetAmount" className="text-xs font-medium">
                    Target Goal Amount
                  </Label>
                  <span className="text-xs font-semibold text-primary">
                    {formatCurrency(targetAmount, currency)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <Input
                    id="targetAmount"
                    type="number"
                    min={100}
                    step={100}
                    value={targetAmount === 0 ? '' : targetAmount}
                    onChange={(e) => setTargetAmount(Math.max(0, Number(e.target.value)))}
                    className="pl-8 text-sm"
                    placeholder="10000"
                  />
                </div>
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[2500, 5000, 10000, 25000, 50000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTargetAmount(preset)}
                      className={cn(
                        'text-[11px] px-2 py-0.5 rounded-md border transition-colors',
                        targetAmount === preset
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {formatCompactCurrency(preset, currency)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Savings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="currentSavings" className="text-xs font-medium">
                    Current Savings (Starting Balance)
                  </Label>
                  <span className="text-xs font-medium text-foreground">
                    {formatCurrency(currentSavings, currency)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">
                    <PiggyBank className="h-4 w-4" />
                  </span>
                  <Input
                    id="currentSavings"
                    type="number"
                    min={0}
                    step={50}
                    value={currentSavings === 0 ? '0' : currentSavings}
                    onChange={(e) => setCurrentSavings(Math.max(0, Number(e.target.value)))}
                    className="pl-8 text-sm"
                    placeholder="0"
                  />
                </div>
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[0, 500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCurrentSavings(preset)}
                      className={cn(
                        'text-[11px] px-2 py-0.5 rounded-md border transition-colors',
                        currentSavings === preset
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {formatCompactCurrency(preset, currency)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected Monthly Contribution */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="monthlyContribution" className="text-xs font-medium">
                    Expected Monthly Contribution
                  </Label>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(monthlyContribution, currency)}/mo
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <Input
                    id="monthlyContribution"
                    type="number"
                    min={10}
                    step={25}
                    value={monthlyContribution === 0 ? '' : monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                    className="pl-8 text-sm"
                    placeholder="300"
                  />
                </div>
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[100, 250, 400, 750, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMonthlyContribution(preset)}
                      className={cn(
                        'text-[11px] px-2 py-0.5 rounded-md border transition-colors',
                        monthlyContribution === preset
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {formatCompactCurrency(preset, currency)}/mo
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Compound Interest / APY */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeInterest"
                      checked={includeInterest}
                      onChange={(e) => {
                        setIncludeInterest(e.target.checked);
                        if (e.target.checked && annualInterestRate === 0) {
                          setAnnualInterestRate(4.5); // Default popular HYSA rate
                        }
                      }}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    <Label htmlFor="includeInterest" className="text-xs font-medium cursor-pointer">
                      Include Annual Interest / HYSA APY
                    </Label>
                  </div>
                  {includeInterest && (
                    <span className="text-xs font-semibold text-primary">
                      {annualInterestRate}% APY
                    </span>
                  )}
                </div>

                {includeInterest && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pl-6"
                  >
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">
                        <Percent className="h-4 w-4" />
                      </span>
                      <Input
                        id="annualInterestRate"
                        type="number"
                        min={0.1}
                        max={30}
                        step={0.1}
                        value={annualInterestRate}
                        onChange={(e) => setAnnualInterestRate(Math.max(0, Number(e.target.value)))}
                        className="pl-8 text-sm"
                        placeholder="4.5"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      {[3.5, 4.25, 5.0, 7.0].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setAnnualInterestRate(rate)}
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded border transition-colors',
                            annualInterestRate === rate
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border/60 text-muted-foreground hover:bg-muted'
                          )}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
                {selectedGoalId ? (
                  <Button
                    onClick={handleApply}
                    className="w-full text-xs font-medium gap-1.5"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Apply This Plan to Loaded Goal
                  </Button>
                ) : (
                  onCreateGoal && (
                    <Button
                      onClick={() =>
                        onCreateGoal({
                          targetAmount: result.targetAmount,
                          currentAmount: result.currentSavings,
                          monthlyContribution: result.monthlyContribution,
                        })
                      }
                      className="w-full text-xs font-medium gap-1.5"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Create New Goal from This Calculation
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  onClick={handleCopySummary}
                  className="w-full text-xs gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Copy Calculation Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Dynamic Results, Projection Chart & Scenarios */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Result Card */}
          <Card className="border-primary/20 bg-linear-to-br from-card via-card to-primary/5 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <Clock className="h-3.5 w-3.5" />
                    Estimated Time Required
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground pt-1">
                    {result.formattedDuration}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Target reached by{' '}
                    <span className="font-semibold text-foreground">
                      {result.formattedTargetDate}
                    </span>
                    {result.monthsRequired > 0 && (
                      <span className="text-muted-foreground">
                        ({result.monthsRequired} {result.monthsRequired === 1 ? 'month' : 'months'})
                      </span>
                    )}
                  </p>
                </div>

                {/* Progress bar pill */}
                <div className="sm:text-right shrink-0">
                  <div className="text-xs text-muted-foreground">Starting Progress</div>
                  <div className="text-xl font-bold text-foreground">
                    {result.targetAmount > 0
                      ? Math.min(100, Math.round((result.currentSavings / result.targetAmount) * 100))
                      : 0}
                    %
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatCurrency(result.remainingAmount, currency)} remaining
                  </div>
                </div>
              </div>

              {/* Progress Bar with Entry Animation */}
              <div className="mt-4 pt-2">
                <Progress
                  value={
                    result.targetAmount > 0
                      ? Math.min(100, (result.currentSavings / result.targetAmount) * 100)
                      : 0
                  }
                  className="h-2"
                  delay={0.05}
                  duration={0.6}
                />
              </div>

              {/* Stat breakdown metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/60">
                <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
                  <div className="text-[11px] text-muted-foreground">You Contribute</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {formatCurrency(result.totalContributions, currency)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {result.monthsRequired} × {formatCompactCurrency(result.monthlyContribution, currency)}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
                  <div className="text-[11px] text-muted-foreground">Starting Balance</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {formatCurrency(result.currentSavings, currency)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Day 1 initial
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
                  <div className="text-[11px] text-muted-foreground">Interest Earned</div>
                  <div
                    className={cn(
                      'text-sm font-bold mt-0.5',
                      result.totalInterestEarned > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground'
                    )}
                  >
                    {formatCurrency(result.totalInterestEarned, currency)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {includeInterest ? `${annualInterestRate}% APY` : '0% (Standard)'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="text-[11px] font-medium text-primary">Total Target</div>
                  <div className="text-sm font-bold text-primary mt-0.5">
                    {formatCurrency(result.targetAmount, currency)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    100% funded
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Savings Growth Timeline Chart */}
          {result.chartData.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Savings Accumulation Trajectory
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Projected growth month by month until reaching target
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setChartView('total')}
                      className={cn(
                        'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors',
                        chartView === 'total'
                          ? 'bg-background text-foreground shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Total Balance
                    </button>
                    {result.totalInterestEarned > 0 && (
                      <button
                        type="button"
                        onClick={() => setChartView('breakdown')}
                        className={cn(
                          'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors',
                          chartView === 'breakdown'
                            ? 'bg-background text-foreground shadow-2xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        Principal vs Interest
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={result.chartData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="balanceColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="interestColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-15" />
                      <XAxis
                        dataKey="displayMonth"
                        tick={{ fontSize: 11 }}
                        stroke="currentColor"
                        className="opacity-60"
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="currentColor"
                        className="opacity-60"
                        tickFormatter={(v) => formatCompactCurrency(v, currency)}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border p-3 rounded-lg shadow-lg text-xs space-y-1.5">
                                <div className="font-semibold text-foreground">{data.displayMonth}</div>
                                <div className="flex justify-between gap-4 text-primary">
                                  <span>Total Balance:</span>
                                  <span className="font-bold">{formatCurrency(data.balance, currency)}</span>
                                </div>
                                <div className="flex justify-between gap-4 text-muted-foreground">
                                  <span>Contributions:</span>
                                  <span>{formatCurrency(data.principal, currency)}</span>
                                </div>
                                {data.interest > 0 && (
                                  <div className="flex justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                                    <span>Interest:</span>
                                    <span>+{formatCurrency(data.interest, currency)}</span>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {chartView === 'total' ? (
                        <Area
                          type="monotone"
                          dataKey="balance"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#balanceColor)"
                        />
                      ) : (
                        <>
                          <Area
                            type="monotone"
                            dataKey="principal"
                            stackId="1"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.3}
                          />
                          <Area
                            type="monotone"
                            dataKey="interest"
                            stackId="1"
                            stroke="#10b981"
                            fill="url(#interestColor)"
                          />
                        </>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Milestone arrival chips */}
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="text-[11px] font-medium text-muted-foreground mb-2">
                    Milestone Timeline Projections:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {result.milestones.map((m) => (
                      <div
                        key={m.percent}
                        className={cn(
                          'p-2 rounded-md border text-xs',
                          m.isCompletedInitially
                            ? 'bg-muted/40 border-border/40 text-muted-foreground'
                            : 'bg-card border-border/70 text-foreground'
                        )}
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span>{m.label}</span>
                          {m.isCompletedInitially && (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          )}
                        </div>
                        <div className="text-xs font-medium mt-1">
                          {formatCompactCurrency(m.amount, currency)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {m.isCompletedInitially
                            ? 'Already met'
                            : m.dateStr
                            ? `${m.dateStr} (M${m.month})`
                            : 'In planning'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* "What-If" Sensitivity Analysis */}
          {result.scenarios.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  What-If Sensitivity: Accelerate Your Goal
                </CardTitle>
                <CardDescription className="text-xs">
                  See how small changes in your monthly contribution speed up your timeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {result.scenarios
                    .filter((s) => s.difference > 0)
                    .slice(0, 3)
                    .map((scenario) => (
                      <div
                        key={scenario.monthlyAmount}
                        onClick={() => setMonthlyContribution(scenario.monthlyAmount)}
                        className="group p-3 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground">
                              {formatCurrency(scenario.monthlyAmount, currency)}/mo
                            </span>
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                              +{formatCurrency(scenario.difference, currency)}
                            </span>
                          </div>
                          <div className="mt-2 text-xs font-medium text-foreground">
                            {scenario.months} months ({scenario.targetDateStr})
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-border/40 text-[11px] text-primary flex items-center justify-between font-medium">
                          <span>Saves {scenario.monthsDifference} {scenario.monthsDifference === 1 ? 'month' : 'months'}!</span>
                          <ChevronRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Target Deadlines: If you want to finish in X months */}
          {result.paceOptions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Target Horizon Planner
                </CardTitle>
                <CardDescription className="text-xs">
                  How much you need to save each month to hit your target by a specific deadline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {result.paceOptions.map((opt) => (
                    <div
                      key={opt.months}
                      onClick={() => setMonthlyContribution(opt.requiredMonthly)}
                      className="group p-3 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <div className="text-xs text-muted-foreground font-medium">{opt.label}</div>
                      <div className="text-sm font-bold text-foreground mt-1">
                        {formatCurrency(opt.requiredMonthly, currency)}
                        <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Target: {opt.targetDateStr}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
