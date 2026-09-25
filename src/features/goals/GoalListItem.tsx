import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Repeat,
} from 'lucide-react';

import { Goal } from '@/types';
import { useGoalsStore } from '@/store/useGoalsStore';
import { calculateGoalMetrics } from '@/lib/calculations';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { convertCurrency, getEffectiveGoalCurrency } from '@/lib/exchangeRates';
import { getGoalHorizonConfig } from '@/lib/timeHorizons';
import { GoalIcon } from '@/lib/icons';
import { GoalThumbnail } from '@/components/common/GoalThumbnail';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TransactionDialog } from '@/features/goals/TransactionDialog';
import { DeleteGoalDialog } from '@/features/goals/DeleteGoalDialog';
import { RecurringScheduleDialog } from '@/features/goals/RecurringScheduleDialog';
import { GoalStatusBadge } from '@/features/goals/GoalStatusBadge';
import { TagBadge } from '@/components/common/TagBadge';
import { cn } from '@/lib/utils';

interface GoalListItemProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
}

export function GoalListItem({ goal, onEdit }: GoalListItemProps) {
  const navigate = useNavigate();
  const { settings, setFilterTag } = useGoalsStore();
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        onClick={() => navigate(`/goals/${goal.id}`)}
        className={cn(
          "group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-xs transition-all duration-150 hover:shadow-sm cursor-pointer",
          metrics.status === 'urgent'
            ? 'border-rose-500/40 hover:border-rose-500/60 ring-1 ring-rose-500/10'
            : 'border-border/80 hover:border-border'
        )}
      >
        {/* Left: Icon & Info */}
        <div className="flex items-center gap-3 min-w-0 md:w-1/3">
          <GoalThumbnail
            icon={goal.icon}
            imageUrl={goal.imageUrl}
            color={goal.color}
            name={goal.name}
            size="md"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {goal.name}
              </h4>
              <GoalStatusBadge
                status={metrics.status}
                isOverdue={metrics.isOverdue}
                size="xs"
                showDot
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs text-muted-foreground truncate">{goal.category}</p>
              <span
                className={cn(
                  'text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-full border',
                  horizonConfig.badgeClass
                )}
              >
                {horizonConfig.rangeLabel}
              </span>
              {isForeignCurrency && (
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/25">
                  {goalCurrency}
                </span>
              )}
              {goal.recurringContribution?.enabled && goal.recurringContribution.amount > 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRecurringDialogOpen(true);
                  }}
                  className="inline-flex items-center gap-0.5 text-[10px] text-primary bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded-full font-medium transition-colors"
                  title="Click to view or edit recurring deposit"
                >
                  <Repeat className="h-2.5 w-2.5" />
                  {formatCompactCurrency(goal.recurringContribution.amount, settings.currency)}/
                  {goal.recurringContribution.frequency === 'weekly' ? 'wk' : 'mo'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRecurringDialogOpen(true);
                  }}
                  className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary bg-muted/40 hover:bg-muted px-1.5 py-0.5 rounded-full font-normal transition-colors"
                  title="Define recurring deposits"
                >
                  <Repeat className="h-2.5 w-2.5" />
                  + Recurring
                </button>
              )}
              {goal.tags && goal.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap pl-1">
                  {goal.tags.slice(0, 3).map((tag) => (
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
                  {goal.tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      +{goal.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Progress bar & Target */}
        <div className="flex-1 min-w-[200px] px-0 md:px-4">
          <div className="flex items-baseline justify-between text-xs mb-1">
            <span className="font-medium text-foreground">
              {formatCurrency(goal.currentAmount, goalCurrency)}
              <span className="text-muted-foreground font-normal ml-1">
                / {formatCurrency(goal.targetAmount, goalCurrency)}
              </span>
              {isForeignCurrency && (
                <span className="text-[11px] text-muted-foreground ml-1.5 font-normal">
                  (≈ {formatCurrency(convertedCurrentBase, settings.currency)})
                </span>
              )}
            </span>
            <span className="font-semibold text-foreground">
              <AnimatedNumber value={metrics.percentage} animateInitial />%
            </span>
          </div>
          <Progress value={metrics.percentage} indicatorColor={goal.color} className="h-1.5" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3 opacity-60" />
              {metrics.formattedDeadline}
            </span>
            <span>
              {metrics.percentage >= 100
                ? 'Target achieved'
                : `${formatCurrency(metrics.monthlyRequired, goalCurrency)}/mo required`}
            </span>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div
          className="flex items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50 justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs font-normal gap-1"
            onClick={openDeposit}
            title="Deposit"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Add</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs font-normal gap-1"
            onClick={openWithdraw}
            disabled={goal.currentAmount <= 0}
            title="Withdraw"
          >
            <Minus className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Withdraw</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-8 w-8",
              goal.recurringContribution?.enabled && goal.recurringContribution.amount > 0
                ? "text-primary hover:text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setRecurringDialogOpen(true)}
            title={goal.recurringContribution?.enabled ? "Edit Recurring Contribution" : "Set Recurring Contribution"}
          >
            <Repeat className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(goal)}
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
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

      <DeleteGoalDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        goal={goal}
      />
    </>
  );
}
