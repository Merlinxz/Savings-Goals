import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Calendar as CalendarIcon,
  MoreVertical,
  Plus,
  Minus,
  Edit2,
  Trash2,
  ArrowUpRight,
  Repeat,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';

import { Goal } from '@/types';
import { useGoalsStore } from '@/store/useGoalsStore';
import { calculateGoalMetrics } from '@/lib/calculations';
import { getGoalPacingAlert } from '@/lib/pacingAlerts';
import { getEffectiveNotificationSettings } from '@/lib/notifications';
import { formatCurrency } from '@/lib/currencies';
import { convertCurrency, getEffectiveGoalCurrency } from '@/lib/exchangeRates';
import { getGoalHorizonConfig } from '@/lib/timeHorizons';
import { GoalIcon } from '@/lib/icons';
import { GoalThumbnail } from '@/components/common/GoalThumbnail';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TransactionDialog } from '@/features/goals/TransactionDialog';
import { DeleteGoalDialog } from '@/features/goals/DeleteGoalDialog';
import { RecurringScheduleDialog } from '@/features/goals/RecurringScheduleDialog';
import { ProactivePlanAdjustmentDialog } from '@/features/goals/ProactivePlanAdjustmentDialog';
import { GoalStatusBadge } from '@/features/goals/GoalStatusBadge';
import { TagBadge } from '@/components/common/TagBadge';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
}

export function GoalCard({ goal, onEdit }: GoalCardProps) {
  const navigate = useNavigate();
  const { settings, transactions, dismissedAlertGoalIds, setFilterTag } = useGoalsStore();
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

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txDialogType, setTxDialogType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [adjustPlanOpen, setAdjustPlanOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const alert = React.useMemo(() => {
    return getGoalPacingAlert(goal, transactions);
  }, [goal, transactions]);

  const notifConfig = getEffectiveNotificationSettings(settings);
  const isAlertDismissed = dismissedAlertGoalIds.includes(goal.id);
  const showAlert =
    alert &&
    !isAlertDismissed &&
    notifConfig.masterEnabled &&
    notifConfig.pacingAlerts;

  const openDeposit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTxDialogType('deposit');
    setTxDialogOpen(true);
  };

  const openWithdraw = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTxDialogType('withdrawal');
    setTxDialogOpen(true);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onClick={() => navigate(`/goals/${goal.id}`)}
        className={cn(
          "group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-md cursor-pointer",
          metrics.status === 'urgent'
            ? 'border-rose-500/40 hover:border-rose-500/60 ring-1 ring-rose-500/10 dark:ring-rose-500/20'
            : 'border-border/80 hover:border-border'
        )}
      >
        {/* Top bar: Icon + Category + Menu */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <GoalThumbnail
                icon={goal.icon}
                imageUrl={goal.imageUrl}
                color={goal.color}
                name={goal.name}
                size="md"
                className="group-hover:scale-105"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block truncate">
                    {goal.category}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full border',
                      horizonConfig.badgeClass
                    )}
                  >
                    {horizonConfig.rangeLabel}
                  </span>
                  {isForeignCurrency && (
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">
                      {goalCurrency}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-base text-foreground leading-snug truncate">
                  {goal.name}
                </h3>
              </div>
            </div>

            {/* Status Badge + Menu options */}
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <GoalStatusBadge
                status={metrics.status}
                isOverdue={metrics.isOverdue}
                size="sm"
                showDot
              />

              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Goal options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-40 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setRecurringDialogOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Repeat className="h-3.5 w-3.5 text-primary" />
                    {goal.recurringContribution?.enabled ? 'Edit Recurring' : 'Set Recurring'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(goal);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Goal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteDialogOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tags */}
          {goal.tags && goal.tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1 items-center">
              {goal.tags.slice(0, 4).map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  size="xs"
                  onClick={(e) => {
                    e?.stopPropagation();
                    setFilterTag(tag);
                  }}
                />
              ))}
              {goal.tags.length > 4 && (
                <span className="text-[10px] text-muted-foreground font-medium px-1">
                  +{goal.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Amount and percentage */}
          <div className="mt-4 mb-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {formatCurrency(goal.currentAmount, goalCurrency)}
                </span>
                <span className="text-xs text-muted-foreground ml-1.5">
                  of {formatCurrency(goal.targetAmount, goalCurrency)}
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                <AnimatedNumber value={metrics.percentage} animateInitial />%
              </span>
            </div>

            {/* Foreign Currency conversion hint */}
            {isForeignCurrency && (
              <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>≈ {formatCurrency(convertedCurrentBase, settings.currency)}</span>
                <span className="opacity-60">of {formatCurrency(convertedTargetBase, settings.currency)}</span>
                <span className="text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.2 rounded-sm">
                  Rate: 1 {goalCurrency} ≈ {(convertedTargetBase / (goal.targetAmount || 1)).toFixed(goalCurrency === 'JPY' ? 3 : 2)} {settings.currency}
                </span>
              </div>
            )}

            {/* Animated Progress Bar */}
            <div className="mt-2.5">
              <Progress
                value={metrics.percentage}
                indicatorColor={goal.color}
                className="h-2"
              />
            </div>
          </div>

          {/* Pacing requirements & deadline */}
          <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 opacity-70" />
              <span className="truncate">{metrics.formattedDeadline}</span>
            </div>
            <div className="text-right">
              {metrics.percentage >= 100 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Goal Reached
                </span>
              ) : (
                <span>
                  <strong className="text-foreground font-semibold">
                    {formatCurrency(metrics.monthlyRequired, goalCurrency)}
                  </strong>
                  /mo
                </span>
              )}
            </div>
          </div>

          {/* Recurring Contribution Indicator & Quick Setup */}
          {goal.recurringContribution?.enabled && goal.recurringContribution.amount > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRecurringDialogOpen(true);
              }}
              className="mt-2.5 w-full flex items-center justify-between text-[11px] px-2.5 py-1 rounded-md bg-primary/5 hover:bg-primary/10 border border-primary/15 text-foreground transition-colors group/rec"
              title="Click to view or edit recurring deposit schedule"
            >
              <span className="flex items-center gap-1 font-medium text-primary">
                <Repeat className="h-3 w-3 shrink-0" />
                {formatCurrency(goal.recurringContribution.amount, settings.currency)}/
                {goal.recurringContribution.frequency === 'weekly' ? 'wk' : 'mo'}
              </span>
              <span className="text-[10px] text-muted-foreground group-hover/rec:text-foreground truncate font-medium">
                {metrics.recurringPlan?.formattedProjectedDate ? `Est: ${metrics.recurringPlan.formattedProjectedDate}` : 'Scheduled'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRecurringDialogOpen(true);
              }}
              className="mt-2.5 w-full flex items-center justify-between text-[11px] px-2.5 py-1 rounded-md bg-muted/20 hover:bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Define weekly or monthly recurring deposits"
            >
              <span className="flex items-center gap-1 text-[10px]">
                <Repeat className="h-3 w-3 opacity-60" />
                Recurring Deposit
              </span>
              <span className="text-[10px] text-primary font-medium hover:underline">
                Set Schedule +
              </span>
            </button>
          )}

          {/* Proactive Pacing Alert Pill */}
          {showAlert && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setAdjustPlanOpen(true);
              }}
              className={cn(
                'mt-2.5 w-full flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer',
                alert.severity === 'critical'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
              )}
              title={`${alert.message}. Click to adjust plan.`}
            >
              <span className="flex items-center gap-1.5 font-medium truncate">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{alert.delayDescription}</span>
              </span>
              <span className="font-semibold text-[10px] text-primary flex items-center gap-1 shrink-0">
                Adjust <SlidersHorizontal className="h-2.5 w-2.5" />
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className="mt-4 pt-3 flex items-center gap-2 border-t border-border/60"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs font-medium gap-1.5"
            onClick={openDeposit}
          >
            <Plus className="h-3.5 w-3.5 text-emerald-500" />
            Add
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs font-medium gap-1.5"
            onClick={openWithdraw}
            disabled={goal.currentAmount <= 0}
          >
            <Minus className="h-3.5 w-3.5 text-amber-500" />
            Withdraw
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(`/goals/${goal.id}`)}
            title="View Details"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <TransactionDialog
        open={txDialogOpen}
        onOpenChange={setTxDialogOpen}
        goal={goal}
        defaultType={txDialogType}
      />

      <RecurringScheduleDialog
        open={recurringDialogOpen}
        onOpenChange={setRecurringDialogOpen}
        goal={goal}
      />

      <ProactivePlanAdjustmentDialog
        open={adjustPlanOpen}
        onOpenChange={setAdjustPlanOpen}
        goal={goal}
        alert={alert}
        onOpenDeposit={() => {
          setTxDialogType('deposit');
          setTxDialogOpen(true);
        }}
      />

      <DeleteGoalDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        goal={goal}
      />
    </>
  );
}
