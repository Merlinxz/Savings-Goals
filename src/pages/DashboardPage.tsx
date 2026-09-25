import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Wallet,
  Target,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Plus,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  BarChart3,
  History,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { Goal } from '@/types';
import { useGoalsStore } from '@/store/useGoalsStore';
import { calculateGoalMetrics } from '@/lib/calculations';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { convertCurrency, getEffectiveGoalCurrency } from '@/lib/exchangeRates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SavingsGrowthChart } from '@/features/dashboard/SavingsGrowthChart';
import { PacingAlertBanner } from '@/features/dashboard/PacingAlertBanner';
import { QuickTransactionFAB } from '@/features/dashboard/QuickTransactionFAB';
import { TransactionDialog } from '@/features/goals/TransactionDialog';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { GoalThumbnail } from '@/components/common/GoalThumbnail';
import { GoalStatusBadge } from '@/features/goals/GoalStatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { PacingAlert } from '@/lib/pacingAlerts';
import { calculateAchievements } from '@/lib/achievements';
import { cn } from '@/lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext<{
    openCreateGoal?: () => void;
    onAdjustPlan?: (goal: Goal, alert?: PacingAlert) => void;
    onOpenDeposit?: (goalId: string, amount?: number) => void;
  }>() || {};
  const openCreateGoal = outletCtx.openCreateGoal || (() => {});
  const onAdjustPlan = outletCtx.onAdjustPlan || (() => {});
  const onOpenDepositFromCtx = outletCtx.onOpenDeposit;
  const { goals, transactions, settings } = useGoalsStore();

  const totalSaved = goals.reduce((acc, g) => {
    const gCurr = getEffectiveGoalCurrency(g.currency, settings.currency);
    return acc + convertCurrency(g.currentAmount, gCurr, settings.currency);
  }, 0);

  const totalTarget = goals.reduce((acc, g) => {
    const gCurr = getEffectiveGoalCurrency(g.currency, settings.currency);
    return acc + convertCurrency(g.targetAmount, gCurr, settings.currency);
  }, 0);

  const overallPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const completedGoals = goals.filter((g) => g.currentAmount >= g.targetAmount);
  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount);

  // Total monthly required savings across all active goals (converted to base currency)
  const totalMonthlyRequired = activeGoals.reduce((acc, g) => {
    const m = calculateGoalMetrics(g);
    const gCurr = getEffectiveGoalCurrency(g.currency, settings.currency);
    return acc + convertCurrency(m.monthlyRequired, gCurr, settings.currency);
  }, 0);

  // Upcoming deadlines (sort active goals by deadline ascending)
  const upcomingGoals = [...activeGoals]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  // Recent transactions (last 4)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  // Achievements summary
  const achievements = React.useMemo(() => {
    return calculateAchievements(goals, transactions);
  }, [goals, transactions]);
  const unlockedBadges = achievements.filter((a) => a.unlocked);

  const [selectedGoalForTx, setSelectedGoalForTx] = React.useState<Goal | null>(null);
  const [txDialogOpen, setTxDialogOpen] = React.useState(false);
  const [txAmount, setTxAmount] = React.useState<number | undefined>(undefined);

  const handleOpenDeposit = React.useCallback((goal?: Goal, amount?: number) => {
    if (goals.length === 0) {
      openCreateGoal();
      return;
    }
    setSelectedGoalForTx(goal || activeGoals[0] || goals[0]);
    setTxAmount(amount);
    setTxDialogOpen(true);
  }, [goals, activeGoals, openCreateGoal]);

  const goalNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    goals.forEach((g) => map.set(g.id, g.name));
    return map;
  }, [goals]);

  return (
    <div className="space-y-6">
      {/* Executive Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Financial Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {goals.length > 0 ? (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(totalSaved, settings.currency)}
                </span>{' '}
                saved across {goals.length} target funds ({overallPercentage}% funded)
              </>
            ) : (
              'Monitor savings momentum, upcoming deadlines, and target progression.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDeposit()}
            className="gap-1.5"
          >
            <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Deposit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/calculator')}
            className="gap-1.5 hidden sm:inline-flex"
          >
            <Calculator className="h-4 w-4 text-primary" />
            <span>Calculator</span>
          </Button>
          <Button size="sm" onClick={openCreateGoal} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>New Goal</span>
          </Button>
        </div>
      </div>

      {/* Proactive Pacing & Deadline Alert Banner */}
      <PacingAlertBanner
        onAdjustPlan={onAdjustPlan}
        onOpenDeposit={(goalId, amt) => {
          if (onOpenDepositFromCtx) {
            onOpenDepositFromCtx(goalId, amt);
          } else {
            const g = goals.find((item) => item.id === goalId);
            handleOpenDeposit(g, amt);
          }
        }}
      />

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saved */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Saved
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              <AnimatedNumber
                value={totalSaved}
                formatter={(v) => formatCurrency(v, settings.currency)}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall Progress</span>
              <span className="font-semibold text-foreground">
                <AnimatedNumber value={overallPercentage} animateInitial />%
              </span>
            </div>
            <Progress
              value={overallPercentage}
              className="mt-1.5 h-1.5"
              delay={0.08}
              duration={0.6}
            />
          </CardContent>
        </Card>

        {/* Total Target */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Target
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(totalTarget, settings.currency)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatCurrency(Math.max(0, totalTarget - totalSaved), settings.currency)} remaining to save
            </p>
          </CardContent>
        </Card>

        {/* Active Goals */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Targets
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {activeGoals.length}{' '}
              <span className="text-sm font-normal text-muted-foreground">in progress</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {completedGoals.length} completed milestone{completedGoals.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>

        {/* Monthly Target Pace */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Monthly Target Pace
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(totalMonthlyRequired, settings.currency)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Required monthly to hit deadlines
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Savings Growth Snapshot & Active Goals Spotlight (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Savings Over Time Chart */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Savings Over Time</CardTitle>
                <CardDescription className="text-xs">
                  Historical progression and balance accumulation
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/analytics')}
                className="h-8 text-xs text-primary gap-1"
              >
                <span>Full Analytics</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="pt-2">
              <SavingsGrowthChart transactions={transactions} />
            </CardContent>
          </Card>

          {/* Active Goals Spotlight */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-base text-foreground">
                  Active Goals In Focus
                </h2>
                <p className="text-xs text-muted-foreground">
                  Quick access to in-progress target funds
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/goals')}
                className="text-xs h-8 gap-1"
              >
                <span>View All ({goals.length})</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            {goals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No goals established"
                description="Start saving with clear targets and target deadlines."
                actionLabel="Create Your First Goal"
                onAction={openCreateGoal}
                actionIcon={Plus}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeGoals.slice(0, 4).map((goal, idx) => {
                  const metrics = calculateGoalMetrics(goal);
                  return (
                    <div
                      key={goal.id}
                      onClick={() => navigate(`/goals/${goal.id}`)}
                      className={cn(
                        'p-4 rounded-xl border bg-card hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-3',
                        metrics.status === 'urgent'
                          ? 'border-rose-500/40 hover:border-rose-500/60'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <GoalThumbnail
                              icon={goal.icon}
                              imageUrl={goal.imageUrl}
                              color={goal.color}
                              name={goal.name}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {goal.name}
                              </h3>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {metrics.daysRemaining > 0
                                  ? `${metrics.daysRemaining} days left`
                                  : 'Due soon'}
                              </p>
                            </div>
                          </div>

                          <GoalStatusBadge
                            status={metrics.status}
                            isOverdue={metrics.isOverdue}
                            size="xs"
                            showDot
                          />
                        </div>

                        <Progress
                          value={metrics.percentage}
                          indicatorColor={goal.color}
                          className="h-1.5 my-3"
                          delay={0.08 + idx * 0.04}
                          duration={0.5}
                        />

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {formatCurrency(goal.currentAmount, settings.currency)}
                          </span>
                          <span>Target {formatCompactCurrency(goal.targetAmount, settings.currency)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-foreground">
                          <AnimatedNumber value={metrics.percentage} animateInitial />% Funded
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeposit(goal);
                          }}
                          className="h-7 text-xs px-2 text-primary hover:bg-primary/10 gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Deposit</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Upcoming Deadlines, Recent Activity, & Achievements (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Upcoming Deadlines */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Upcoming Deadlines</CardTitle>
                <CardDescription className="text-xs">
                  Prioritized targets by target date
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2 gap-1 text-primary"
                onClick={() => navigate('/goals')}
              >
                <span>All Goals</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="pt-2 space-y-2.5">
              {upcomingGoals.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No upcoming deadlines pending.
                </div>
              ) : (
                upcomingGoals.map((goal, idx) => {
                  const metrics = calculateGoalMetrics(goal);
                  return (
                    <div
                      key={goal.id}
                      onClick={() => navigate(`/goals/${goal.id}`)}
                      className="p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/20 transition-all cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GoalThumbnail
                            icon={goal.icon}
                            imageUrl={goal.imageUrl}
                            color={goal.color}
                            name={goal.name}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                              {goal.name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 opacity-60" />
                              {metrics.daysRemaining > 0
                                ? `${metrics.daysRemaining} days left`
                                : 'Due soon'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-foreground">
                            <AnimatedNumber value={metrics.percentage} animateInitial />%
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {formatCompactCurrency(goal.currentAmount, settings.currency)}
                          </div>
                        </div>
                      </div>

                      <Progress
                        value={metrics.percentage}
                        indicatorColor={goal.color}
                        className="h-1"
                        delay={0.12 + idx * 0.04}
                        duration={0.45}
                      />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Mini-Feed */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <CardDescription className="text-xs">
                  Latest cash inflows & withdrawals
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2 gap-1 text-primary"
                onClick={() => navigate('/activity')}
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="pt-1 space-y-2">
              {recentTransactions.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No transactions recorded yet.
                </div>
              ) : (
                recentTransactions.map((tx) => {
                  const isDeposit = tx.type === 'deposit';
                  const goalName = goalNameMap.get(tx.goalId) || 'Savings Goal';
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                            isDeposit
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          )}
                        >
                          {isDeposit ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{goalName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {format(parseISO(tx.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={cn(
                            'font-semibold',
                            isDeposit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-foreground'
                          )}
                        >
                          {isDeposit ? '+' : '-'}
                          {formatCurrency(tx.amount, settings.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Gamification Badges Snapshot */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">Achievements</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2 gap-1 text-primary"
                onClick={() => navigate('/achievements')}
              >
                <span>{unlockedBadges.length} / {achievements.length} Badges</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {unlockedBadges.length > 0 ? (
                  <>
                    You have unlocked <strong className="text-foreground">{unlockedBadges.length} badges</strong>! Keep depositing to hit your next savings milestone.
                  </>
                ) : (
                  'Start saving and recording deposits to unlock milestone badges and level up.'
                )}
              </p>
              <div className="mt-3">
                <Progress
                  value={achievements.length > 0 ? Math.round((unlockedBadges.length / achievements.length) * 100) : 0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Deposit Transaction Dialog */}
      <TransactionDialog
        open={txDialogOpen}
        onOpenChange={setTxDialogOpen}
        goal={selectedGoalForTx}
        defaultType="deposit"
        defaultAmount={txAmount}
      />

      {/* Floating Action Button (FAB) for Quick Transactions */}
      <QuickTransactionFAB
        goals={goals}
        currency={settings.currency}
        onOpenCreateGoal={openCreateGoal}
      />
    </div>
  );
}
