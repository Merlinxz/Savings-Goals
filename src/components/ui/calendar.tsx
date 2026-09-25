import * as React from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export interface CalendarProps {
  selected?: Date | string;
  onSelect?: (date: Date) => void;
  className?: string;
  minDate?: Date;
}

export function Calendar({ selected, onSelect, className, minDate }: CalendarProps) {
  const selectedDate: Date | undefined = React.useMemo(() => {
    if (!selected) return undefined;
    if (selected instanceof Date) return selected;
    if (typeof selected === 'string') {
      const parsed = parseISO(selected);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  }, [selected]);

  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => selectedDate ?? new Date());

  React.useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const normalizedMinDate = minDate ? startOfDay(minDate) : undefined;

  return (
    <div className={cn('p-3 select-none', className)}>
      <div className="flex items-center justify-between space-x-2 pt-1 pb-3">
        <button
          type="button"
          onClick={prevMonth}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100')}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100')}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentToday = isToday(day);
          const dayStart = startOfDay(day);
          const isDisabled = normalizedMinDate ? dayStart < normalizedMinDate : false;

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect?.(day)}
              className={cn(
                'h-8 w-8 mx-auto flex items-center justify-center rounded-lg text-sm transition-colors',
                !isCurrentMonth && 'text-muted-foreground/40',
                isCurrentMonth && !isSelected && 'text-foreground hover:bg-muted',
                isCurrentToday && !isSelected && 'border border-primary/40 font-semibold text-primary',
                isSelected && 'bg-primary text-primary-foreground font-semibold shadow-xs',
                isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent'
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
