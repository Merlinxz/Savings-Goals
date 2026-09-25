import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, DollarSign, Repeat } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Goal, TransactionType } from '@/types';
import { useGoalsStore } from '@/store/useGoalsStore';
import { CURRENCIES, formatCurrency } from '@/lib/currencies';
import { convertCurrency, getEffectiveGoalCurrency } from '@/lib/exchangeRates';
import { cn } from '@/lib/utils';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  defaultType?: TransactionType;
  defaultAmount?: number;
}

export function TransactionDialog({
  open,
  onOpenChange,
  goal,
  defaultType = 'deposit',
  defaultAmount,
}: TransactionDialogProps) {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { addTransaction, settings } = useGoalsStore();

  React.useEffect(() => {
    if (open) {
      setType(defaultType);
      setAmount(defaultAmount && defaultAmount > 0 ? String(defaultAmount) : '');
      setNote('');
      setError('');
    }
  }, [open, defaultType, defaultAmount]);

  if (!goal) return null;

  const goalCurrency = getEffectiveGoalCurrency(goal.currency, settings.currency);
  const isForeignCurrency = goalCurrency !== settings.currency;
  const currencySymbol = CURRENCIES[goalCurrency]?.symbol || goalCurrency;

  const numericAmount = parseFloat(amount);
  const isLargeUnitCurrency = ['JPY', 'KRW', 'VND', 'IDR'].includes(goalCurrency);
  const presets = isLargeUnitCurrency ? [1000, 5000, 10000, 50000, 100000] : [25, 50, 100, 250, 500];

  const convertedInputBase =
    !isNaN(numericAmount) && numericAmount > 0 && isForeignCurrency
      ? convertCurrency(numericAmount, goalCurrency, settings.currency)
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (type === 'withdrawal' && numericAmount > goal.currentAmount) {
      setError(`Cannot withdraw more than current balance (${formatCurrency(goal.currentAmount, goalCurrency)}).`);
      return;
    }

    try {
      addTransaction(goal.id, type, numericAmount, note);
      const actionName = type === 'deposit' ? 'Added' : 'Withdrew';
      const preposition = type === 'deposit' ? 'to' : 'from';
      toast.success(`${actionName} ${formatCurrency(numericAmount, goalCurrency)} ${preposition} "${goal.name}"`);
      onOpenChange(false);
    } catch {
      toast.error('Could not process transaction.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'deposit' ? 'Deposit to Goal' : 'Withdraw from Goal'}
          </DialogTitle>
          <DialogDescription>
            {goal.name} (Current: {formatCurrency(goal.currentAmount, goalCurrency)})
            {isForeignCurrency && ` · Base: ≈ ${formatCurrency(convertCurrency(goal.currentAmount, goalCurrency, settings.currency), settings.currency)}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setType('deposit')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all',
                type === 'deposit'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
              Add Deposit
            </button>
            <button
              type="button"
              onClick={() => setType('withdrawal')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all',
                type === 'withdrawal'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ArrowUpRight className="h-4 w-4 text-amber-500" />
              Withdrawal
            </button>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="tx-amount" className="text-xs font-medium text-foreground">
                Amount ({goalCurrency})
              </label>
              {isForeignCurrency && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  Goal Currency: {goalCurrency}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold text-sm">
                {currencySymbol}
              </span>
              <Input
                id="tx-amount"
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className="pl-8 text-base font-semibold"
                autoFocus
              />
            </div>

            {/* Foreign currency equivalent pill */}
            {convertedInputBase !== null && (
              <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-md border border-border/50">
                ≈ <strong className="text-foreground">{formatCurrency(convertedInputBase, settings.currency)}</strong>{' '}
                in base currency ({settings.currency})
              </p>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {type === 'deposit' &&
              goal.recurringContribution?.enabled &&
              goal.recurringContribution.amount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2.5 font-medium border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 gap-1"
                  onClick={() => {
                    setAmount(goal.recurringContribution!.amount.toString());
                    setNote(`Scheduled ${goal.recurringContribution!.frequency} contribution`);
                  }}
                >
                  <Repeat className="h-3 w-3" />
                  Scheduled ({formatCurrency(goal.recurringContribution.amount, goalCurrency)})
                </Button>
              )}
            {presets.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 font-normal"
                onClick={() => setAmount(preset.toString())}
              >
                +{currencySymbol}{preset.toLocaleString()}
              </Button>
            ))}
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label htmlFor="tx-note" className="text-xs font-medium text-foreground">
              Note (Optional)
            </label>
            <Input
              id="tx-note"
              placeholder="e.g. Monthly transfer, freelance payment, adjustment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className={cn(
                type === 'deposit' ? 'bg-primary' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              )}
            >
              Confirm {type === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
