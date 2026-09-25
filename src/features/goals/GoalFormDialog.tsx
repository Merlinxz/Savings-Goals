import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { CalendarIcon, Plus, Check, Image as ImageIcon, Sparkles } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Goal, GoalFormData, goalFormSchema, goalCategorySchema, CurrencyCode, TimeHorizonBucket } from '@/types';
import { useGoalsStore } from '@/store/useGoalsStore';
import { GOAL_ICONS, GOAL_COLORS, GoalIcon } from '@/lib/icons';
import { CURRENCIES, CURRENCY_REGIONS, GROUPED_CURRENCIES, formatCurrency } from '@/lib/currencies';
import { convertCurrency, formatExchangeRateString } from '@/lib/exchangeRates';
import { TIME_HORIZONS, resolveGoalHorizon } from '@/lib/timeHorizons';
import { cn } from '@/lib/utils';
import { SuggestedDateBanner } from './SuggestedDateBanner';
import { GoalImageUpload } from './GoalImageUpload';
import { RecurringContributionFields } from './RecurringContributionFields';
import { GoalThumbnail } from '@/components/common/GoalThumbnail';
import { TagInput } from './TagInput';

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalToEdit?: Goal | null;
  initialValues?: Partial<GoalFormData> | null;
}

const CATEGORIES = goalCategorySchema.options;

export function GoalFormDialog({ open, onOpenChange, goalToEdit, initialValues }: GoalFormDialogProps) {
  const isEditing = Boolean(goalToEdit);
  const { addGoal, updateGoal, settings, transactions } = useGoalsStore();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const currencySymbol = CURRENCIES[settings.currency]?.symbol || '$';

  const defaultValues: GoalFormData = {
    name: '',
    targetAmount: 1000,
    currentAmount: 0,
    deadline: format(new Date(Date.now() + 90 * 86400000), 'yyyy-MM-dd'),
    category: 'Emergency Fund',
    icon: 'Target',
    color: '#3b82f6',
    notes: '',
    imageUrl: undefined,
    currency: settings.currency,
    timeHorizonBucket: 'auto',
    recurringContribution: {
      enabled: false,
      frequency: 'monthly',
      amount: 0,
      dayOfWeek: 1,
      dayOfMonth: 1,
    },
    tags: [],
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues,
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');
  const selectedDeadline = watch('deadline');
  const selectedCategory = watch('category');
  const targetAmount = watch('targetAmount');
  const currentAmount = watch('currentAmount');
  const currentImageUrl = watch('imageUrl');
  const goalName = watch('name');
  const selectedCurrency = (watch('currency') as CurrencyCode) || settings.currency;
  const selectedBucket = watch('timeHorizonBucket') || 'auto';

  const [visualTab, setVisualTab] = useState<'preset' | 'upload'>('preset');

  useEffect(() => {
    if (open) {
      if (goalToEdit) {
        reset({
          name: goalToEdit.name,
          targetAmount: goalToEdit.targetAmount,
          currentAmount: goalToEdit.currentAmount,
          deadline: goalToEdit.deadline,
          category: goalToEdit.category,
          icon: goalToEdit.icon,
          color: goalToEdit.color,
          notes: goalToEdit.notes || '',
          imageUrl: goalToEdit.imageUrl || undefined,
          currency: goalToEdit.currency || settings.currency,
          timeHorizonBucket: goalToEdit.timeHorizonBucket || 'auto',
          recurringContribution: goalToEdit.recurringContribution || {
            enabled: false,
            frequency: 'monthly',
            amount: 0,
            dayOfWeek: 1,
            dayOfMonth: 1,
          },
          tags: goalToEdit.tags || [],
        });
        setVisualTab(goalToEdit.imageUrl ? 'upload' : 'preset');
      } else if (initialValues) {
        reset({
          name: initialValues.name || '',
          targetAmount: initialValues.targetAmount ?? 1000,
          currentAmount: initialValues.currentAmount ?? 0,
          deadline: initialValues.deadline || format(new Date(Date.now() + 90 * 86400000), 'yyyy-MM-dd'),
          category: initialValues.category || 'Emergency Fund',
          icon: initialValues.icon || 'Target',
          color: initialValues.color || '#3b82f6',
          notes: initialValues.notes || '',
          imageUrl: initialValues.imageUrl || undefined,
          currency: (initialValues.currency as CurrencyCode) || settings.currency,
          timeHorizonBucket: initialValues.timeHorizonBucket || 'auto',
          recurringContribution: initialValues.recurringContribution
            ? {
                enabled: initialValues.recurringContribution.enabled ?? true,
                frequency: initialValues.recurringContribution.frequency || 'monthly',
                amount: initialValues.recurringContribution.amount || 0,
                dayOfWeek: initialValues.recurringContribution.dayOfWeek ?? 1,
                dayOfMonth: initialValues.recurringContribution.dayOfMonth ?? 1,
              }
            : {
                enabled: false,
                frequency: 'monthly',
                amount: 0,
                dayOfWeek: 1,
                dayOfMonth: 1,
              },
          tags: initialValues.tags || [],
        });
        setVisualTab('preset');
      } else {
        reset({
          name: '',
          targetAmount: 1000,
          currentAmount: 0,
          deadline: format(new Date(Date.now() + 90 * 86400000), 'yyyy-MM-dd'),
          category: 'Travel & Vacation',
          icon: 'Plane',
          color: '#3b82f6',
          notes: '',
          imageUrl: undefined,
          currency: settings.currency,
          timeHorizonBucket: 'auto',
          recurringContribution: {
            enabled: false,
            frequency: 'monthly',
            amount: 0,
            dayOfWeek: 1,
            dayOfMonth: 1,
          },
          tags: [],
        });
        setVisualTab('preset');
      }
    }
  }, [open, goalToEdit, initialValues, reset, settings.currency]);

  const onSubmit = (data: GoalFormData) => {
    try {
      if (isEditing && goalToEdit) {
        updateGoal(goalToEdit.id, data);
        toast.success(`Updated "${data.name}"`);
      } else {
        addGoal(data);
        toast.success(`Created goal "${data.name}"`);
      }
      onOpenChange(false);
    } catch {
      toast.error('Failed to save goal. Please review your input.');
    }
  };

  const formattedDateDisplay = React.useMemo(() => {
    if (!selectedDeadline) return 'Select target date';
    const parsed = parseISO(selectedDeadline);
    return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : selectedDeadline;
  }, [selectedDeadline]);

  const resolvedHorizon = React.useMemo(() => {
    if (selectedBucket && selectedBucket !== 'auto') {
      return selectedBucket as 'short' | 'medium' | 'long';
    }
    const today = new Date();
    const d = parseISO(selectedDeadline);
    const valid = isValid(d) ? d : new Date(today.getTime() + 90 * 86400000);
    const diff = differenceInDays(valid, today);
    if (diff <= 365) return 'short';
    if (diff <= 1095) return 'medium';
    return 'long';
  }, [selectedBucket, selectedDeadline]);

  const horizonCfg = TIME_HORIZONS[resolvedHorizon];

  const goalCurrencySymbol = CURRENCIES[selectedCurrency]?.symbol || selectedCurrency;
  const isForeignCurrency = selectedCurrency !== settings.currency;
  const convertedTargetBase = isForeignCurrency
    ? convertCurrency(targetAmount || 0, selectedCurrency, settings.currency)
    : targetAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your savings target, deadline, or visual identity.'
              : 'Define a specific target and timeline to begin tracking your progress.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1">
          <input type="hidden" {...register('imageUrl')} />
          {/* Goal Name */}
          <div className="space-y-1.5">
            <label htmlFor="goal-name" className="text-xs font-medium text-foreground">
              Goal Name
            </label>
            <Input
              id="goal-name"
              placeholder="e.g. New Laptop, Emergency Buffer"
              {...register('name')}
              className={cn(errors.name && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Amounts & Goal Currency Grid */}
          <div className="p-3 rounded-xl border border-border/70 bg-muted/15 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
              <div>
                <label className="text-xs font-semibold text-foreground block">
                  Goal Currency
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Choose specific currency (e.g. JPY for Japan trip, USD for overseas study).
                </p>
              </div>
              <div className="w-full sm:w-48">
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value || settings.currency} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs font-medium">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value="THB" className="text-xs font-medium">
                          ฿ Thai Baht (THB)
                        </SelectItem>
                        <SelectItem value="USD" className="text-xs font-medium">
                          $ US Dollar (USD)
                        </SelectItem>
                        <SelectItem value="JPY" className="text-xs font-medium">
                          ¥ Japanese Yen (JPY)
                        </SelectItem>
                        <SelectItem value="EUR" className="text-xs font-medium">
                          € Euro (EUR)
                        </SelectItem>
                        <SelectItem value="GBP" className="text-xs font-medium">
                          £ British Pound (GBP)
                        </SelectItem>
                        <SelectItem value="SGD" className="text-xs font-medium">
                          S$ Singapore Dollar (SGD)
                        </SelectItem>
                        <SelectItem value="CNY" className="text-xs font-medium">
                          ¥ Chinese Yuan (CNY)
                        </SelectItem>
                        <SelectItem value="KRW" className="text-xs font-medium">
                          ₩ South Korean Won (KRW)
                        </SelectItem>
                        <SelectItem value="AUD" className="text-xs font-medium">
                          A$ Australian Dollar (AUD)
                        </SelectItem>
                        <SelectItem value="CAD" className="text-xs font-medium">
                          C$ Canadian Dollar (CAD)
                        </SelectItem>
                        <SelectItem value="CHF" className="text-xs font-medium">
                          CHF Swiss Franc (CHF)
                        </SelectItem>
                        <SelectItem value="HKD" className="text-xs font-medium">
                          HK$ Hong Kong Dollar (HKD)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="target-amount" className="text-xs font-medium text-foreground">
                  Target Amount ({goalCurrencySymbol})
                </label>
                <Input
                  id="target-amount"
                  type="number"
                  step="any"
                  min="1"
                  placeholder="5000"
                  {...register('targetAmount', { valueAsNumber: true })}
                  className={cn(errors.targetAmount && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.targetAmount && (
                  <p className="text-xs text-destructive">{errors.targetAmount.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="current-amount" className="text-xs font-medium text-foreground">
                  {isEditing ? 'Current Saved Amount' : 'Initial Deposit'} ({goalCurrencySymbol})
                </label>
                <Input
                  id="current-amount"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  {...register('currentAmount', { valueAsNumber: true })}
                  className={cn(errors.currentAmount && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.currentAmount && (
                  <p className="text-xs text-destructive">{errors.currentAmount.message}</p>
                )}
              </div>
            </div>

            {/* Live Foreign Currency Conversion Preview */}
            {isForeignCurrency && (
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-muted-foreground block text-[11px]">
                    Base Equivalent ({settings.currency}):
                  </span>
                  <span className="font-semibold text-foreground text-xs">
                    {formatCurrency(targetAmount || 0, selectedCurrency)} ≈{' '}
                    <strong className="text-primary font-bold">
                      {formatCurrency(convertedTargetBase || 0, settings.currency)}
                    </strong>
                  </span>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md border border-border/60 shrink-0">
                  {formatExchangeRateString(selectedCurrency, settings.currency)}
                </div>
              </div>
            )}
          </div>

          {/* Category, Deadline & Time Horizon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Category</label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Target Deadline</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal h-9',
                      !selectedDeadline && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                    {formattedDateDisplay}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    selected={selectedDeadline}
                    onSelect={(date) => {
                      setValue('deadline', format(date, 'yyyy-MM-dd'), { shouldValidate: true });
                      setCalendarOpen(false);
                    }}
                    minDate={new Date()}
                  />
                </PopoverContent>
              </Popover>
              {errors.deadline && (
                <p className="text-xs text-destructive">{errors.deadline.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Time Horizon</label>
              <Controller
                control={control}
                name="timeHorizonBucket"
                render={({ field }) => (
                  <Select value={field.value || 'auto'} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Time Horizon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto" className="text-xs">
                        Auto (Calculated from deadline)
                      </SelectItem>
                      <SelectItem value="short" className="text-xs">
                        Short-term (&lt; 1 Year)
                      </SelectItem>
                      <SelectItem value="medium" className="text-xs">
                        Medium-term (1–3 Years)
                      </SelectItem>
                      <SelectItem value="long" className="text-xs">
                        Long-term (&gt; 3 Years)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Time Horizon Info Badge */}
          <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: horizonCfg.color }}
              />
              <span className="text-muted-foreground text-[11px]">
                Active Horizon: <strong className="text-foreground">{horizonCfg.label} ({horizonCfg.rangeLabel})</strong>
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              {horizonCfg.description}
            </span>
          </div>

          {/* Suggested Realistic End Date based on savings velocity and target amount */}
          <SuggestedDateBanner
            targetAmount={targetAmount}
            currentAmount={currentAmount}
            selectedDeadline={selectedDeadline}
            onApplyDate={(formattedDate) => {
              setValue('deadline', formattedDate, { shouldValidate: true });
            }}
            transactions={transactions}
            currencySymbol={currencySymbol}
          />

          {/* Recurring Contribution Schedule & Plan Auto-Calculator */}
          <RecurringContributionFields
            control={control}
            watch={watch}
            setValue={setValue}
          />

          {/* Visual Style: Upload Photo or Preset Icon */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-muted/15 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GoalThumbnail
                  icon={selectedIcon}
                  imageUrl={currentImageUrl}
                  color={selectedColor}
                  name={goalName || 'Preview'}
                  size="md"
                />
                <div>
                  <label className="text-xs font-semibold text-foreground">Goal Visual & Icon</label>
                  <p className="text-[11px] text-muted-foreground">
                    {currentImageUrl
                      ? 'Custom photo active'
                      : `Using preset icon "${selectedIcon}"`}
                  </p>
                </div>
              </div>
            </div>

            <Tabs
              value={visualTab}
              onValueChange={(val) => setVisualTab(val as 'preset' | 'upload')}
              className="w-full pt-1"
            >
              <TabsList className="grid grid-cols-2 h-8 p-0.5 w-full bg-muted/60">
                <TabsTrigger value="upload" className="text-xs h-7 gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Upload Photo (PNG, JPG, WebP)
                </TabsTrigger>
                <TabsTrigger value="preset" className="text-xs h-7 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Preset Icons
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="pt-2">
                <GoalImageUpload
                  currentImageUrl={currentImageUrl}
                  onImageChange={(img) => {
                    setValue('imageUrl', img, { shouldValidate: true });
                  }}
                  color={selectedColor}
                  goalName={goalName}
                />
              </TabsContent>

              <TabsContent value="preset" className="pt-2 space-y-2">
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-32 overflow-y-auto p-2 border border-border rounded-lg bg-background">
                  {GOAL_ICONS.map(({ name, label }) => {
                    const isCurrent = selectedIcon === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        title={label}
                        onClick={() => setValue('icon', name, { shouldValidate: true })}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                          isCurrent
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <GoalIcon name={name} className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Accent Color Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Accent Color</label>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {GOAL_COLORS.map(({ hex, label }) => {
                const isSelected = selectedColor.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    title={label}
                    onClick={() => setValue('color', hex, { shouldValidate: true })}
                    className={cn(
                      'relative h-7 w-7 rounded-full transition-transform active:scale-95 flex items-center justify-center',
                      isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: hex }}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white drop-shadow-xs" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tagging System */}
          <div className="space-y-1.5 pt-1">
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  category={selectedCategory}
                />
              )}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="goal-notes" className="text-xs font-medium text-foreground">
              Description / Notes (Optional)
            </label>
            <Input
              id="goal-notes"
              placeholder="Why this goal matters, account details, or milestone strategy"
              {...register('notes')}
            />
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {!isEditing && <Plus className="h-4 w-4" />}
              {isEditing ? 'Save Changes' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
