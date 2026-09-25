import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Target,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { useGoalsStore } from '@/store/useGoalsStore';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SavingsGrowthChart } from '@/features/dashboard/SavingsGrowthChart';
import { WeeklyInsightsCard } from '@/features/dashboard/WeeklyInsightsCard';
import { MonthlyOverviewWidget } from '@/features/dashboard/MonthlyOverviewWidget';
import { CategoryDistributionWidget } from '@/features/dashboard/CategoryDistributionWidget';
import { RecurringContributionsWidget } from '@/features/dashboard/RecurringContributionsWidget';
import { Goal, TransactionType } from '@/types';
import { PacingAlert } from '@/lib/pacingAlerts';
import { calculateGoalMetrics } from '@/lib/calculations';
import { TransactionDialog } from '@/features/goals/TransactionDialog';
import { toast } from 'sonner';

export function AnalyticsPage() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext<{
    openCreateGoal?: () => void;
    onAdjustPlan?: (goal: Goal, alert?: PacingAlert) => void;
    onOpenDeposit?: (goalId: string, amount?: number) => void;
  }>() || {};
  const openCreateGoal = outletCtx.openCreateGoal || (() => {});
  const onOpenDepositFromCtx = outletCtx.onOpenDeposit;

  const { goals, transactions, settings } = useGoalsStore();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState<Goal | null>(null);
  const [dialogAmount, setDialogAmount] = React.useState<number | undefined>(undefined);

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  // Total deposits vs withdrawals
  const totalDeposits = transactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  // Active goals required monthly pace
  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount);
  const totalMonthlyPace = activeGoals.reduce((acc, g) => {
    const m = calculateGoalMetrics(g);
    return acc + m.monthlyRequired;
  }, 0);

  const handleOpenDeposit = (goal?: Goal, amount?: number) => {
    if (goals.length === 0) {
      openCreateGoal();
      return;
    }
    const target = goal || activeGoals[0] || goals[0];
    setSelectedGoal(target);
    setDialogAmount(amount);
    setDialogOpen(true);
  };

  const handleExportSummary = () => {
    try {
      const summary = {
        exportedAt: new Date().toISOString(),
        currency: settings.currency,
        totalSaved,
        totalTarget,
        progressPercent: overallPercentage,
        totalDeposits,
        totalWithdrawals,
        goalsCount: goals.length,
        transactionsCount: transactions.length,
        goals: goals.map((g) => ({
          name: g.name,
          category: g.category,
          current: g.currentAmount,
          target: g.targetAmount,
          deadline: g.deadline,
        })),
      };

      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(summary, null, 2));
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `savings-analytics-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Analytics summary exported successfully');
    } catch {
      toast.error('Failed to export analytics');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics & Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deep dive into savings velocity, monthly cash flow balances, and portfolio category allocation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportSummary} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button size="sm" onClick={() => navigate('/calculator')} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Simulate APY
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Net Cumulative Saved
              </span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalSaved, settings.currency)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {overallPercentage}% of total target {formatCompactCurrency(totalTarget, settings.currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Deposits Inflow
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              +{formatCurrency(totalDeposits, settings.currency)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Across {transactions.filter((t) => t.type === 'deposit').length} deposit records
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Withdrawals
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalWithdrawals, settings.currency)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {transactions.filter((t) => t.type === 'withdrawal').length} withdrawal events
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Target Monthly Pace
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalMonthlyPace, settings.currency)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Required monthly across {activeGoals.length} active goals
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Growth Chart & Weekly Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card className="h-full flex flex-col justify-between border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Savings Over Time</CardTitle>
                <CardDescription className="text-xs">
                  Historical balance progression and trajectory
                </CardDescription>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Current Net: <strong className="text-foreground">{formatCurrency(totalSaved, settings.currency)}</strong>
              </div>
            </CardHeader>
            <CardContent className="pt-2 flex-1">
              <SavingsGrowthChart transactions={transactions} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <WeeklyInsightsCard
            transactions={transactions}
            goals={goals}
            currency={settings.currency}
            onOpenDeposit={() => handleOpenDeposit()}
            className="h-full"
          />
        </div>
      </div>

      {/* Monthly Deposits vs Withdrawals Comparison */}
      <MonthlyOverviewWidget
        transactions={transactions}
        goals={goals}
        currency={settings.currency}
        onOpenDeposit={() => handleOpenDeposit()}
      />

      {/* Category Savings Distribution */}
      <CategoryDistributionWidget
        goals={goals}
        onOpenCreateGoal={openCreateGoal}
      />

      {/* Automated Recurring Contribution Schedule */}
      <RecurringContributionsWidget
        goals={goals}
        currency={settings.currency}
        onOpenDeposit={handleOpenDeposit}
      />

      {/* Quick Deposit Modal */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={selectedGoal}
        defaultType="deposit"
        defaultAmount={dialogAmount}
      />
    </div>
  );
}
