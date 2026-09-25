import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  TrendingDown,
  Sparkles,
  Zap,
  RotateCcw,
  Flame,
  Snowflake,
  PiggyBank,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGoalsStore } from '@/store/useGoalsStore';
import { formatCurrency } from '@/lib/currencies';
import {
  DebtItem,
  DebtStrategy,
  SAMPLE_DEBTS,
  calculateDebtComparison,
} from '@/lib/debtCalculator';
import { cn } from '@/lib/utils';

interface DebtPayoffCalculatorProps {
  onCreateGoalFromCashflow?: (freedMonthlyCashflow: number) => void;
}

export function DebtPayoffCalculator({
  onCreateGoalFromCashflow,
}: DebtPayoffCalculatorProps) {
  const { settings } = useGoalsStore();

  const [debts, setDebts] = useState<DebtItem[]>(SAMPLE_DEBTS);
  const [strategy, setStrategy] = useState<DebtStrategy>('snowball');
  const [extraPayment, setExtraPayment] = useState<number>(3000);

  // Form states for adding new debt
  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtBalance, setNewDebtBalance] = useState('');
  const [newDebtRate, setNewDebtRate] = useState('');
  const [newDebtMin, setNewDebtMin] = useState('');

  // Handle adding a new debt
  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(newDebtBalance);
    const rate = parseFloat(newDebtRate);
    const min = parseFloat(newDebtMin);

    if (!newDebtName.trim()) {
      toast.error('Please enter a debt or account name');
      return;
    }
    if (isNaN(balance) || balance <= 0) {
      toast.error('Please enter a valid remaining balance');
      return;
    }
    if (isNaN(rate) || rate < 0) {
      toast.error('Please enter an annual interest rate (% APR)');
      return;
    }
    if (isNaN(min) || min <= 0) {
      toast.error('Please enter a valid minimum monthly payment');
      return;
    }

    const newDebt: DebtItem = {
      id: `debt-${Date.now()}`,
      name: newDebtName.trim(),
      balance,
      interestRate: rate,
      minPayment: min,
    };

    setDebts((prev) => [...prev, newDebt]);
    setNewDebtName('');
    setNewDebtBalance('');
    setNewDebtRate('');
    setNewDebtMin('');
    toast.success(`Added "${newDebt.name}" to debt payoff plan`);
  };

  const handleDeleteDebt = (id: string, name: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    toast.info(`Removed "${name}"`);
  };

  const handleLoadSample = () => {
    setDebts(SAMPLE_DEBTS);
    setExtraPayment(3000);
    toast.success('Sample debts loaded successfully');
  };

  const handleClearAll = () => {
    setDebts([]);
    toast.info('All debts cleared');
  };

  // Calculations
  const comparison = useMemo(() => {
    return calculateDebtComparison(debts, extraPayment);
  }, [debts, extraPayment]);

  const activeResult = strategy === 'snowball' ? comparison.snowball : comparison.avalanche;
  const totalDebtBalance = useMemo(() => debts.reduce((sum, d) => sum + d.balance, 0), [debts]);
  const totalMinPayment = useMemo(() => debts.reduce((sum, d) => sum + d.minPayment, 0), [debts]);

  // Forecast savings from freed cashflow after debt-free in 1 year and 3 years
  const freedMonthly = comparison.freedMonthlyCashflow;
  const potentialSavings1Yr = freedMonthly * 12;
  const potentialSavings3Yr = freedMonthly * 36;

  return (
    <div className="space-y-6">
      {/* Intro Hero Banner */}
      <div className="p-5 rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 via-background to-emerald-500/5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Dual-Track Financial Strategy
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {debts.length} Debts Tracked
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Debt Payoff Simulator (Snowball vs. Avalanche)
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Simulate repayment acceleration strategies, eliminate debt systematically, and see how unlocked cash flow supercharges your savings goals once debt-free.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              className="text-xs h-8 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Load Sample
            </Button>
            {debts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-8 text-muted-foreground hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Debt Manager & Payment Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Strategy Selector Tabs */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Choose Repayment Strategy
                </CardTitle>
                <span className="text-[11px] text-muted-foreground">
                  Real-time calculation comparison
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              <Tabs
                value={strategy}
                onValueChange={(val) => setStrategy(val as DebtStrategy)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 h-11 w-full p-1">
                  <TabsTrigger value="snowball" className="text-xs gap-1.5 h-9 font-medium">
                    <Snowflake className="h-3.5 w-3.5 text-sky-500" />
                    Debt Snowball (Lowest Balance First)
                  </TabsTrigger>
                  <TabsTrigger value="avalanche" className="text-xs gap-1.5 h-9 font-medium">
                    <Flame className="h-3.5 w-3.5 text-rose-500" />
                    Debt Avalanche (Highest Interest First)
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Strategy Explanation Callout */}
              <div
                className={cn(
                  'p-3 rounded-xl border text-xs leading-relaxed transition-all',
                  strategy === 'snowball'
                    ? 'border-sky-500/30 bg-sky-500/5 text-sky-950 dark:text-sky-100'
                    : 'border-rose-500/30 bg-rose-500/5 text-rose-950 dark:text-rose-100'
                )}
              >
                {strategy === 'snowball' ? (
                  <div>
                    <strong className="font-semibold block mb-0.5 flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                      <Snowflake className="h-3.5 w-3.5" />
                      Snowball Strategy (Psychological Momentum):
                    </strong>
                    Pay minimums on all accounts, then direct all extra payments to the debt with the <strong>lowest balance</strong>. Eliminating small debts quickly boosts motivation and habit consistency.
                  </div>
                ) : (
                  <div>
                    <strong className="font-semibold block mb-0.5 flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                      <Flame className="h-3.5 w-3.5" />
                      Avalanche Strategy (Mathematical Efficiency):
                    </strong>
                    Pay minimums on all accounts, then direct all extra funds to the debt with the <strong>highest interest rate (% APR)</strong>. Mathematically saves the most total interest and accelerates debt freedom.
                  </div>
                )}
              </div>

              {/* Extra Payment Slider & Input */}
              <div className="pt-2 border-t border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="extra-payment" className="text-xs font-semibold text-foreground">
                    Extra Monthly Payment
                  </label>
                  <span className="text-xs font-mono font-bold text-primary">
                    +{formatCurrency(extraPayment, settings.currency)}/mo
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="extra-payment"
                    type="range"
                    min="0"
                    max={Math.max(20000, extraPayment * 2)}
                    step="500"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                    className="flex-1 accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                  />
                  <div className="relative w-28">
                    <Input
                      type="number"
                      step="500"
                      min="0"
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="h-8 text-xs font-mono text-right"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground mr-1">Presets:</span>
                  {[500, 1000, 2000, 3000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setExtraPayment(amt)}
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-md border transition-colors',
                        extraPayment === amt
                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border'
                      )}
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debts Table Card */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Your Debts ({debts.length})
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Total Balance: {formatCurrency(totalDebtBalance, settings.currency)} • Total Minimum: {formatCurrency(totalMinPayment, settings.currency)}/mo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-1 space-y-4">
              {debts.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-2 border border-dashed rounded-xl p-4">
                  <p>No debts currently recorded.</p>
                  <Button size="sm" variant="outline" onClick={handleLoadSample} className="text-xs">
                    Load Sample Debts
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 text-[11px] font-semibold text-muted-foreground px-3 py-1 bg-muted/40 rounded-lg">
                    <span className="col-span-5">Account / Debt Name</span>
                    <span className="col-span-3 text-right">Balance</span>
                    <span className="col-span-2 text-right">APR</span>
                    <span className="col-span-2 text-right">Min. Pay</span>
                  </div>

                  {debts.map((debt, idx) => (
                    <div
                      key={debt.id}
                      className="grid grid-cols-12 items-center p-3 rounded-xl border border-border bg-card hover:border-border/80 transition-colors text-xs gap-2"
                    >
                      <div className="col-span-5 min-w-0 pr-2">
                        <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-muted-foreground/80 w-4">
                            #{idx + 1}
                          </span>
                          {debt.name}
                        </div>
                      </div>
                      <div className="col-span-3 text-right font-mono font-medium text-foreground">
                        {formatCurrency(debt.balance, settings.currency)}
                      </div>
                      <div className="col-span-2 text-right font-mono text-rose-600 dark:text-rose-400 font-medium">
                        {debt.interestRate}%
                      </div>
                      <div className="col-span-2 text-right font-mono flex items-center justify-end gap-1">
                        <span>{formatCurrency(debt.minPayment, settings.currency)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDebt(debt.id, debt.name)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 ml-1"
                          title="Delete this debt"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Debt Form */}
              <form onSubmit={handleAddDebt} className="p-3.5 rounded-xl border border-dashed border-border bg-muted/20 space-y-3">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  Add New Debt
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Debt Name</label>
                    <Input
                      placeholder="e.g. Credit Card B"
                      value={newDebtName}
                      onChange={(e) => setNewDebtName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Remaining Balance</label>
                    <Input
                      type="number"
                      step="any"
                      min="1"
                      placeholder="25,000"
                      value={newDebtBalance}
                      onChange={(e) => setNewDebtBalance(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Annual Interest (% APR)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="16.0"
                      value={newDebtRate}
                      onChange={(e) => setNewDebtRate(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Min. Payment / Month</label>
                    <Input
                      type="number"
                      step="any"
                      min="1"
                      placeholder="1,200"
                      value={newDebtMin}
                      onChange={(e) => setNewDebtMin(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button type="submit" size="sm" className="h-8 text-xs gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add to Payoff Plan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Payoff Results, Synergy with Savings (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Key KPI Card */}
          <Card className="border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 bg-linear-to-b from-primary/5 to-transparent">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Strategy Results: {strategy === 'snowball' ? 'Snowball' : 'Avalanche'}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <div className="text-3xl font-extrabold tracking-tight text-foreground">
                    {activeResult.totalMonths} Months
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Debt-free by: <strong>{activeResult.payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
                  </p>
                </div>
                {comparison.fasterMonths > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    {comparison.fasterMonths} mo faster
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-3 space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Total Interest Paid</span>
                  <span className="font-bold text-foreground font-mono text-sm">
                    {formatCurrency(activeResult.totalInterestPaid, settings.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Total Repayment</span>
                  <span className="font-bold text-foreground font-mono text-sm">
                    {formatCurrency(activeResult.totalAmountPaid, settings.currency)}
                  </span>
                </div>
              </div>

              {/* Side-by-side Strategy Comparison Banner */}
              <div className="p-3.5 rounded-xl border border-border bg-card text-xs space-y-2">
                <span className="font-semibold text-foreground flex items-center justify-between">
                  <span>Snowball vs. Avalanche Comparison</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Diff: {formatCurrency(comparison.interestDifference, settings.currency)}
                  </span>
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div
                    className={cn(
                      'p-2 rounded-lg border',
                      strategy === 'snowball'
                        ? 'border-primary bg-primary/10'
                        : 'border-border/60 bg-muted/20'
                    )}
                  >
                    <div className="font-medium text-foreground">Snowball:</div>
                    <div className="text-muted-foreground">{comparison.snowball.totalMonths} months</div>
                    <div className="font-mono text-foreground font-semibold">
                      {formatCurrency(comparison.snowball.totalInterestPaid, settings.currency)}
                    </div>
                  </div>

                  <div
                    className={cn(
                      'p-2 rounded-lg border',
                      strategy === 'avalanche'
                        ? 'border-primary bg-primary/10'
                        : 'border-border/60 bg-muted/20'
                    )}
                  >
                    <div className="font-medium text-foreground">Avalanche:</div>
                    <div className="text-muted-foreground">{comparison.avalanche.totalMonths} months</div>
                    <div className="font-mono text-foreground font-semibold">
                      {formatCurrency(comparison.avalanche.totalInterestPaid, settings.currency)}
                    </div>
                  </div>
                </div>

                {comparison.interestDifference > 0 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    💡 Avalanche saves you an extra{' '}
                    <strong>{formatCurrency(comparison.interestDifference, settings.currency)}</strong> in interest vs. Snowball.
                  </p>
                )}
              </div>

              {/* Payoff Order Checklist */}
              {activeResult.debtPayoffOrder.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground block">
                    Debt Freedom Milestones:
                  </span>
                  <div className="space-y-1.5">
                    {activeResult.debtPayoffOrder.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50 text-xs"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{order.name}</span>
                        </span>
                        <span className="text-[11px] font-mono font-medium text-muted-foreground shrink-0">
                          Month {order.monthPaidOff}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Savings Synergy Card */}
          <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Savings Synergy (Post-Debt Accelerator)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3 text-xs leading-relaxed text-emerald-900/90 dark:text-emerald-200">
              <p>
                Once all {debts.length} debts are completely paid off, your minimum payments and extra debt budget immediately redirect into compounding wealth:
              </p>

              <div className="p-3 rounded-xl bg-card border border-emerald-500/20 text-foreground space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Freed Monthly Cash Flow:</span>
                  <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(freedMonthly, settings.currency)}/mo
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block">1-Year Savings Potential:</span>
                    <strong className="text-foreground font-mono">
                      {formatCurrency(potentialSavings1Yr, settings.currency)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">3-Year Savings Potential:</span>
                    <strong className="text-foreground font-mono">
                      {formatCurrency(potentialSavings3Yr, settings.currency)}
                    </strong>
                  </div>
                </div>
              </div>

              {onCreateGoalFromCashflow && freedMonthly > 0 && (
                <Button
                  size="sm"
                  onClick={() => onCreateGoalFromCashflow(freedMonthly)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 text-xs font-semibold shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Turn {formatCurrency(freedMonthly, settings.currency)}/mo into a Savings Goal
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
