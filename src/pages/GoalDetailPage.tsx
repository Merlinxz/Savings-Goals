import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Plus,
  Minus,
  Edit2,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Info,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { useGoalsStore } from '@/store/useGoalsStore';
import { calculateGoalMetrics } from '@/lib/calculations';
import { formatCurrency } from '@/lib/currencies';
import { convertCurrency, getEffectiveGoalCurrency, formatExchangeRateString } from '@/lib/exchangeRates';
import { getGoalHorizonConfig } from '@/lib/timeHorizons';
import { GoalIcon } from '@/lib/icons';
import { GoalThumbnail } from '@/components/common/GoalThumbnail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProgressRing } from '@/components/common/ProgressRing';
import { Progress } from '@/components/ui/progress';
import { GoalProgressChart } from '@/features/goals/GoalProgressChart';
import { MilestoneTracker } from '@/features/goals/MilestoneTracker';
import { GoalStatusBadge } from '@/features/goals/GoalStatusBadge';
import { TagBadge } from '@/components/common/TagBadge';
import { RecurringPlanCard } from '@/features/goals/RecurringPlanCard';
import { TransactionDialog } from '@/features/goals/TransactionDialog';
import { DeleteGoalDialog } from '@/features/goals/DeleteGoalDialog';
import { GoalFormDialog } from '@/features/goals/GoalFormDialog';
import { ProactivePlanAdjustmentDialog } from '@/features/goals/ProactivePlanAdjustmentDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { getGoalPacingAlert } from '@/lib/pacingAlerts';
import { getEffectiveNotificationSettings } from '@/lib/notifications';
import { cn } from '@/lib/utils';

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goals, transactions, deleteTransaction, settings } = useGoalsStore();

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txType, setTxType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [txAmount, setTxAmount] = useState<number | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);

  const goal = goals.find((g) => g.id === id);

  const notifConfig = getEffectiveNotificationSettings(settings);
  const goalAlert = React.useMemo(() => {
    if (!goal || !notifConfig.masterEnabled || !notifConfig.pacingAlerts) return null;
    return getGoalPacingAlert(goal, transactions);
  }, [goal, transactions, notifConfig.masterEnabled, notifConfig.pacingAlerts]);

  if (!goal) {
    return (
      <div className="py-12">
        <EmptyState
          icon={AlertCircle}
          title="Goal not found"
          description="The savings goal you are looking for may have been deleted or does not exist."
          actionLabel="Return to Goals"
          onAction={() => navigate('/goals')}
          actionIcon={ArrowLeft}
        />
      </div>
    );
  }

  const metrics = calculateGoalMetrics(goal);
  const goalCurrency = getEffectiveGoalCurrency(goal.currency, settings.currency);
  const isForeignCurrency = goalCurrency !== settings.currency;
  const horizonConfig = getGoalHorizonConfig(goal);

  const convertedCurrentBase = isForeignCurrency
    ? convertCurrency(goal.currentAmount, goalCurrency, settings.currency)
    : goal.currentAmount;
  const convertedTargetBase = isForeignCurrency
    ? convertCurrency(goal.targetAmount, goalCurrency, settings.currency)
    : goal.targetAmount;
  const convertedRemainingBase = isForeignCurrency
    ? convertCurrency(metrics.remainingAmount, goalCurrency, settings.currency)
    : metrics.remainingAmount;

  const goalTransactions = transactions
    .filter((t) => t.goalId === goal.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenTx = (type: 'deposit' | 'withdrawal', amount?: number) => {
    setTxType(type);
    setTxAmount(amount);
    setTxDialogOpen(true);
  };

  const handleDeleteTx = (txId: string, amount: number, type: string) => {
    deleteTransaction(txId);
    toast.success(`Removed ${type} of ${formatCurrency(amount, goalCurrency)}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/goals')}
            className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
            title="Back to goals"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <GoalThumbnail
            icon={goal.icon}
            imageUrl={goal.imageUrl}
            color={goal.color}
            name={goal.name}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {goal.category}
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border',
                  horizonConfig.badgeClass
                )}
              >
                {horizonConfig.label} ({horizonConfig.rangeLabel})
              </span>
              {isForeignCurrency && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">
                  {goalCurrency}
                </span>
              )}
              <GoalStatusBadge
                status={metrics.status}
                isOverdue={metrics.isOverdue}
                size="sm"
                showDot
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
              {goal.name}
            </h1>
            {goal.tags && goal.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {goal.tags.map((tag) => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    size="sm"
                    onClick={() => {
                      navigate(`/goals?tag=${encodeURIComponent(tag)}`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            className="gap-1.5 h-9 text-xs"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Goal
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-1.5 h-9 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Pacing Alert / Deadline Warning Notification */}
      {goalAlert && (
        <div
          className={cn(
            'p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs',
            goalAlert.severity === 'critical'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-100'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100'
          )}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                'p-2 rounded-lg shrink-0 mt-0.5',
                goalAlert.severity === 'critical'
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              )}
            >
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {goalAlert.title}: Pacing Adjustment Recommended
                </h3>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                    goalAlert.severity === 'critical'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-600 text-white'
                  )}
                >
                  {goalAlert.delayDescription}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                {goalAlert.detail}
              </p>
              <p className="text-[11px] font-mono mt-1 text-foreground/80">
                Current:{' '}
                <span className="font-semibold text-foreground">{goalAlert.currentRateLabel}</span>
                {' · '}Required to finish on time:{' '}
                <span className="font-semibold text-primary">{goalAlert.requiredRateLabel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5"
              onClick={() => setAdjustDialogOpen(true)}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Adjust Plan Proactively
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => handleOpenTx('deposit', goalAlert.catchUpDepositAmount)}
            >
              Catch-up Deposit
            </Button>
          </div>
        </div>
      )}

      {/* Hero Highlight Card: Big Progress Ring & High-level Metrics */}
      <Card className="border-border/80 bg-card overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Progress ring + amounts */}
            <div className="flex items-center gap-6">
              <ProgressRing
                percentage={metrics.percentage}
                size={88}
                strokeWidth={7}
                color={goal.color}
              />
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Current Balance
                </span>
                <div className="text-3xl font-extrabold tracking-tight text-foreground">
                  {formatCurrency(goal.currentAmount, goalCurrency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target of {formatCurrency(goal.targetAmount, goalCurrency)} ({formatCurrency(metrics.remainingAmount, goalCurrency)} left)
                </p>
                {isForeignCurrency && (
                  <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span>≈ {formatCurrency(convertedCurrentBase, settings.currency)}</span>
                    <span className="opacity-60">of {formatCurrency(convertedTargetBase, settings.currency)}</span>
                    <span className="text-[10px] text-primary font-mono bg-primary/10 px-1.5 py-0.2 rounded-sm">
                      {formatExchangeRateString(goalCurrency, settings.currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Required pace breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-y lg:border-y-0 lg:border-l border-border/80 py-4 lg:py-0 lg:pl-6">
              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  Target Deadline
                </span>
                <span className="text-sm font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <CalendarIcon className="h-3.5 w-3.5 opacity-60" />
                  {metrics.formattedDeadline}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {metrics.daysRemaining} days remaining
                </span>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  Monthly Needed
                </span>
                <span className="text-sm font-semibold text-foreground mt-0.5 block">
                  {metrics.percentage >= 100
                    ? 'Target reached'
                    : `${formatCurrency(metrics.monthlyRequired, goalCurrency)}/mo`}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {metrics.percentage >= 100 ? 'Goal completed' : 'Suggested monthly'}
                </span>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  Weekly Needed
                </span>
                <span className="text-sm font-semibold text-foreground mt-0.5 block">
                  {metrics.percentage >= 100
                    ? 'Complete'
                    : `${formatCurrency(metrics.weeklyRequired, goalCurrency)}/wk`}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {metrics.percentage >= 100 ? 'All done' : 'Suggested weekly'}
                </span>
              </div>
            </div>

            {/* Right: Quick Deposit / Withdraw buttons */}
            <div className="flex flex-row lg:flex-col gap-2 shrink-0">
              <Button
                onClick={() => handleOpenTx('deposit')}
                className="flex-1 lg:flex-none gap-2 h-9 font-medium"
              >
                <Plus className="h-4 w-4 text-emerald-300" />
                Add Money
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenTx('withdrawal')}
                disabled={goal.currentAmount <= 0}
                className="flex-1 lg:flex-none gap-2 h-9 font-medium"
              >
                <Minus className="h-4 w-4 text-amber-500" />
                Withdraw
              </Button>
            </div>
          </div>

          {/* Goal Notes / Description */}
          {goal.notes && (
            <div className="mt-5 pt-4 border-t border-border/60 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <p className="leading-relaxed">{goal.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring Contribution Plan & Auto-Calculated Progress */}
      <RecurringPlanCard
        goal={goal}
        currency={settings.currency}
        onOpenDeposit={(amt) => handleOpenTx('deposit', amt)}
      />

      {/* Analytics Chart & Transaction History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Goal Progress Chart (2-3 cols) */}
        <Card className="lg:col-span-2 xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Goal Progress Trajectory</CardTitle>
            <CardDescription className="text-xs">
              Cumulative balance over time toward the {formatCurrency(goal.targetAmount, settings.currency)} target
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <GoalProgressChart goal={goal} transactions={transactions} />
          </CardContent>
        </Card>

        {/* Milestone Tracker Timeline */}
        <MilestoneTracker
          currentAmount={goal.currentAmount}
          targetAmount={goal.targetAmount}
          currency={settings.currency}
          goalColor={goal.color}
        />
      </div>

      {/* Transaction History Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Transaction History
            </CardTitle>
            <CardDescription className="text-xs">
              All contributions and withdrawals for this target ({goalTransactions.length} total)
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 gap-1.5"
            onClick={() => handleOpenTx('deposit')}
          >
            <Plus className="h-3.5 w-3.5 text-emerald-500" />
            Add Record
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {goalTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No transactions recorded for this goal yet. Add your first deposit above.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {goalTransactions.map((tx) => {
                const isDeposit = tx.type === 'deposit';
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 px-1 text-xs hover:bg-muted/20 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          isDeposit
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        )}
                      >
                        {isDeposit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground capitalize">
                            {tx.type}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {format(parseISO(tx.date), 'MMM d, yyyy, h:mm a')}
                          </span>
                        </div>
                        {tx.note && (
                          <p className="text-muted-foreground text-[11px] truncate mt-0.5">
                            {tx.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={cn(
                          'font-bold text-sm',
                          isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                        )}
                      >
                        {isDeposit ? '+' : '-'}
                        {formatCurrency(tx.amount, settings.currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTx(tx.id, tx.amount, tx.type)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-70 hover:opacity-100"
                        title="Delete transaction record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={txDialogOpen}
        onOpenChange={setTxDialogOpen}
        goal={goal}
        defaultType={txType}
        defaultAmount={txAmount}
      />

      {/* Edit Goal Dialog */}
      <GoalFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        goalToEdit={goal}
      />

      {/* Proactive Plan Adjustment Dialog */}
      <ProactivePlanAdjustmentDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        goal={goal}
        alert={goalAlert}
        onOpenDeposit={(goalId, amt) => handleOpenTx('deposit', amt)}
      />

      {/* Delete Goal Dialog */}
      <DeleteGoalDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        goal={goal}
        onDeleted={() => navigate('/goals')}
      />
    </div>
  );
}
