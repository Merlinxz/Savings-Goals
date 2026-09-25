import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  Coins,
  Check,
  Sparkles,
  AlertCircle,
  HelpCircle,
  FolderPlus,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Goal, TransactionType, CurrencyCode } from '@/types';
import { useGoalsStore } from '@/store/useGoalsStore';
import { CURRENCIES, formatCurrency } from '@/lib/currencies';
import { calculateGoalMetrics } from '@/lib/calculations';
import { cn } from '@/lib/utils';

interface QuickTransactionFABProps {
  goals: Goal[];
  currency: CurrencyCode;
  onOpenCreateGoal?: () => void;
  className?: string;
}

export function QuickTransactionFAB({
  goals,
  currency,
  onOpenCreateGoal,
  className,
}: QuickTransactionFABProps) {
  const [open, setOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [type, setType] = useState<TransactionType>('deposit');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addTransaction, settings } = useGoalsStore();
  const currencySymbol = CURRENCIES[currency]?.symbol || '$';

  // Sort and partition goals: active targets first, completed targets second
  const activeGoals = useMemo(
    () => goals.filter((g) => g.currentAmount < g.targetAmount),
    [goals]
  );
  const completedGoals = useMemo(
    () => goals.filter((g) => g.currentAmount >= g.targetAmount),
    [goals]
  );

  // Initialize or maintain selected goal when dialog opens
  useEffect(() => {
    if (open) {
      if (!selectedGoalId || !goals.some((g) => g.id === selectedGoalId)) {
        // Default to the first active goal, or first goal if no active
        const defaultGoal = activeGoals[0] || goals[0];
        if (defaultGoal) {
          setSelectedGoalId(defaultGoal.id);
        }
      }
      setAmount('');
      setNote('');
      setError('');
      setIsSubmitting(false);
    }
  }, [open, goals, activeGoals, selectedGoalId]);

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) || null,
    [goals, selectedGoalId]
  );

  const numericAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numericAmount) && numericAmount > 0;

  // Compute live projections
  const projection = useMemo(() => {
    if (!selectedGoal) return null;

    const currentBal = selectedGoal.currentAmount;
    const target = selectedGoal.targetAmount;
    const currentPct = target > 0 ? Math.min(100, Math.round((currentBal / target) * 100)) : 0;

    let projectedBal = currentBal;
    if (isValidAmount) {
      projectedBal =
        type === 'deposit'
          ? currentBal + numericAmount
          : Math.max(0, currentBal - numericAmount);
    }

    const projectedPct =
      target > 0 ? Math.min(100, Math.round((projectedBal / target) * 100)) : 0;
    const isNowCompleted = currentBal < target && projectedBal >= target;

    return {
      currentBal,
      projectedBal,
      target,
      currentPct,
      projectedPct,
      isNowCompleted,
      remainingAfter: Math.max(0, target - projectedBal),
    };
  }, [selectedGoal, type, numericAmount, isValidAmount]);

  const handleOpenModal = (defaultTxType: TransactionType = 'deposit') => {
    setType(defaultTxType);
    setOpen(true);
  };

  const handleSelectPreset = (presetAmount: number) => {
    setAmount(String(presetAmount));
    setError('');
  };

  const handleMaxWithdrawal = () => {
    if (selectedGoal) {
      setAmount(String(selectedGoal.currentAmount));
      setError('');
    }
  };

  const handleFillRemaining = () => {
    if (selectedGoal) {
      const remaining = Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount);
      if (remaining > 0) {
        setAmount(String(remaining));
        setError('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedGoal) {
      setError('Please select a savings goal.');
      return;
    }

    if (!isValidAmount) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (type === 'withdrawal' && numericAmount > selectedGoal.currentAmount) {
      setError(
        `Cannot withdraw more than current balance (${formatCurrency(selectedGoal.currentAmount, currency)}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      addTransaction(selectedGoal.id, type, numericAmount, note);
      const isDeposit = type === 'deposit';
      const newBalance = isDeposit
        ? selectedGoal.currentAmount + numericAmount
        : selectedGoal.currentAmount - numericAmount;

      toast.success(
        isDeposit
          ? `Deposited ${formatCurrency(numericAmount, currency)} into "${selectedGoal.name}"`
          : `Withdrew ${formatCurrency(numericAmount, currency)} from "${selectedGoal.name}"`,
        {
          description: `New balance: ${formatCurrency(newBalance, currency)} • ${
            selectedGoal.targetAmount > 0
              ? Math.min(100, Math.round((newBalance / selectedGoal.targetAmount) * 100))
              : 0
          }% of target`,
        }
      );

      setOpen(false);
    } catch {
      toast.error('Failed to process transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={cn('fixed bottom-6 right-6 z-40', className)}
      >
        <Button
          id="fab-quick-transaction-button"
          onClick={() => handleOpenModal('deposit')}
          size="lg"
          className={cn(
            'group relative flex items-center gap-2.5 rounded-full px-4 py-3.5 sm:px-5 sm:py-3.5',
            'bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30',
            'hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.03] active:scale-[0.97]',
            'transition-all duration-200 border border-primary-foreground/15'
          )}
          aria-label="Quick Transaction: Add deposit or withdrawal"
        >
          {/* Dual Action Indicator Icon */}
          <div className="relative flex items-center justify-center h-6 w-6 rounded-full bg-primary-foreground/20 text-primary-foreground group-hover:bg-primary-foreground/30 transition-colors">
            <Plus className="h-4 w-4 stroke-[2.5]" />
          </div>

          {/* Button Text */}
          <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
            Quick Transaction
          </span>

          {/* Active goals count badge on desktop */}
          {activeGoals.length > 0 && (
            <span className="hidden md:inline-flex items-center text-[10px] font-medium bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded-full">
              {activeGoals.length}
            </span>
          )}
        </Button>
      </motion.div>

      {/* Quick Transaction Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden sm:rounded-2xl gap-0 border-border">
          <DialogHeader className="p-5 pb-4 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Quick Transaction
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Record a deposit or withdrawal for any active savings goal.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {goals.length === 0 ? (
            /* Empty State: No Goals Created Yet */
            <div className="p-8 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">No Savings Goals Found</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Create your first savings goal to start recording deposits and withdrawals.
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  if (onOpenCreateGoal) onOpenCreateGoal();
                }}
                className="gap-2 text-xs"
              >
                <FolderPlus className="h-4 w-4" />
                <span>Create a Savings Goal</span>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Type Toggle: Deposit vs Withdrawal */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/70 rounded-xl border border-border/60">
                <button
                  type="button"
                  id="tab-quick-deposit"
                  onClick={() => {
                    setType('deposit');
                    setError('');
                  }}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all',
                    type === 'deposit'
                      ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/20'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                  <span>Deposit Funds</span>
                </button>
                <button
                  type="button"
                  id="tab-quick-withdrawal"
                  onClick={() => {
                    setType('withdrawal');
                    setError('');
                  }}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all',
                    type === 'withdrawal'
                      ? 'bg-background text-rose-600 dark:text-rose-400 shadow-xs border border-rose-500/20'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ArrowUpRight className="h-4 w-4 text-rose-500" />
                  <span>Withdraw Funds</span>
                </button>
              </div>

              {/* Goal Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="select-target-goal"
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <Target className="h-3.5 w-3.5 text-primary" />
                    Target Savings Goal
                  </label>
                  {selectedGoal && (
                    <span className="text-[11px] text-muted-foreground">
                      Current: {formatCurrency(selectedGoal.currentAmount, currency)}
                    </span>
                  )}
                </div>

                <Select value={selectedGoalId} onValueChange={(val) => setSelectedGoalId(val)}>
                  <SelectTrigger
                    id="select-target-goal"
                    className="h-10 text-xs bg-background border-input font-medium"
                  >
                    <SelectValue placeholder="Choose a savings goal..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {activeGoals.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Active Targets ({activeGoals.length})
                        </SelectLabel>
                        {activeGoals.map((g) => {
                          const pct =
                            g.targetAmount > 0
                              ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
                              : 0;
                          return (
                            <SelectItem key={g.id} value={g.id} className="text-xs py-2">
                              <div className="flex items-center justify-between w-full gap-3">
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold text-foreground">{g.name}</span>
                                  <span className="text-[10px] text-muted-foreground ml-1.5 capitalize">
                                    ({g.category})
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono shrink-0 text-muted-foreground">
                                  {formatCurrency(g.currentAmount, currency)} /{' '}
                                  {formatCurrency(g.targetAmount, currency)} ({pct}%)
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    )}

                    {completedGoals.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Completed Goals ({completedGoals.length})
                        </SelectLabel>
                        {completedGoals.map((g) => (
                          <SelectItem key={g.id} value={g.id} className="text-xs py-2">
                            <div className="flex items-center justify-between w-full gap-3">
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-foreground">{g.name}</span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1.5">
                                  ✓ Completed
                                </span>
                              </div>
                              <div className="text-[11px] font-mono shrink-0 text-muted-foreground">
                                {formatCurrency(g.currentAmount, currency)}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="quick-tx-amount"
                    className="text-xs font-semibold text-foreground"
                  >
                    Amount ({currencySymbol})
                  </label>
                  {type === 'withdrawal' && selectedGoal && selectedGoal.currentAmount > 0 && (
                    <button
                      type="button"
                      onClick={handleMaxWithdrawal}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Withdraw Max ({formatCurrency(selectedGoal.currentAmount, currency)})
                    </button>
                  )}
                  {type === 'deposit' &&
                    selectedGoal &&
                    selectedGoal.targetAmount > selectedGoal.currentAmount && (
                      <button
                        type="button"
                        onClick={handleFillRemaining}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        Fill Remaining (
                        {formatCurrency(
                          selectedGoal.targetAmount - selectedGoal.currentAmount,
                          currency
                        )}
                        )
                      </button>
                    )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-muted-foreground font-semibold text-base select-none pointer-events-none">
                    {currencySymbol}
                  </span>
                  <Input
                    id="quick-tx-amount"
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError('');
                    }}
                    className="pl-9 pr-4 h-11 text-base font-semibold tracking-tight"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive font-medium pt-0.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Quick Amount Presets */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-muted-foreground">Quick Presets:</div>
                <div className="flex flex-wrap gap-1.5">
                  {[25, 50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-md border border-border/80 bg-background font-medium transition-colors',
                        'hover:bg-primary/10 hover:border-primary/40 hover:text-primary',
                        numericAmount === preset &&
                          'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground'
                      )}
                    >
                      +{currencySymbol}
                      {preset}
                    </button>
                  ))}

                  {/* Goal Recurring Plan Match (if configured) */}
                  {type === 'deposit' &&
                    selectedGoal?.recurringContribution?.enabled &&
                    selectedGoal.recurringContribution.amount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectPreset(selectedGoal.recurringContribution!.amount)
                        }
                        className="text-xs px-2.5 py-1 rounded-md border border-primary/30 bg-primary/5 text-primary font-medium hover:bg-primary/15 transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        Plan ({currencySymbol}
                        {selectedGoal.recurringContribution.amount})
                      </button>
                    )}
                </div>
              </div>

              {/* Live Impact & Balance Projection Preview */}
              {projection && isValidAmount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3.5 rounded-xl border border-border/80 bg-muted/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      Projected Balance
                    </span>
                    <span className="font-mono text-xs text-foreground font-semibold">
                      {formatCurrency(projection.currentBal, currency)} ➔{' '}
                      <span
                        className={
                          type === 'deposit'
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'text-rose-600 dark:text-rose-400 font-bold'
                        }
                      >
                        {formatCurrency(projection.projectedBal, currency)}
                      </span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Goal Progress</span>
                      <span>
                        {projection.currentPct}% ➔{' '}
                        <strong className="text-foreground">{projection.projectedPct}%</strong>
                      </span>
                    </div>
                    <Progress value={projection.projectedPct} className="h-2" />
                  </div>

                  {projection.isNowCompleted && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-500/20">
                      <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        Target reached! This transaction completes {selectedGoal?.name}.
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Optional Memo / Note */}
              <div className="space-y-1.5">
                <label
                  htmlFor="quick-tx-note"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Note / Memo (Optional)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    For your records
                  </span>
                </label>
                <Input
                  id="quick-tx-note"
                  type="text"
                  placeholder={
                    type === 'deposit'
                      ? 'e.g. Paycheck allocation, Birthday money, Bonus'
                      : 'e.g. Unplanned repair, Ticket purchase'
                  }
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Form Actions */}
              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  id="quick-tx-cancel-button"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="text-xs h-9"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  id="quick-tx-submit-button"
                  type="submit"
                  variant={type === 'deposit' ? 'default' : 'destructive'}
                  size="sm"
                  disabled={!isValidAmount || !selectedGoal || isSubmitting}
                  className="text-xs h-9 gap-1.5 font-semibold"
                >
                  {type === 'deposit' ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Saving...'
                      : isValidAmount && selectedGoal
                        ? `${type === 'deposit' ? 'Deposit' : 'Withdraw'} ${formatCurrency(
                            numericAmount,
                            currency
                          )}`
                        : `${type === 'deposit' ? 'Record Deposit' : 'Record Withdrawal'}`}
                  </span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
