import React from 'react';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import { GoalStatus } from '@/types';
import { cn } from '@/lib/utils';

export interface StatusStyleConfig {
  label: string;
  icon: LucideIcon;
  badgeClasses: string;
  dotClasses: string;
  tooltip: string;
}

export const STATUS_CONFIG: Record<GoalStatus, StatusStyleConfig> = {
  completed: {
    label: 'Done',
    icon: CheckCircle2,
    badgeClasses:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/15',
    dotClasses: 'bg-emerald-500',
    tooltip: 'Goal reached! 100% of target funded.',
  },
  urgent: {
    label: 'Urgent',
    icon: Flame,
    badgeClasses:
      'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/15 font-medium',
    dotClasses: 'bg-rose-500 animate-pulse',
    tooltip: 'Requires immediate attention due to approaching deadline or overdue target.',
  },
  behind: {
    label: 'Behind',
    icon: AlertCircle,
    badgeClasses:
      'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/15',
    dotClasses: 'bg-amber-500',
    tooltip: 'Currently pacing behind the planned savings trajectory.',
  },
  on_track: {
    label: 'On Track',
    icon: TrendingUp,
    badgeClasses:
      'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25 hover:bg-sky-500/15',
    dotClasses: 'bg-sky-500',
    tooltip: 'Savings pace is on or ahead of schedule.',
  },
};

export interface GoalStatusBadgeProps {
  status: GoalStatus;
  isOverdue?: boolean;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  showDot?: boolean;
  customLabel?: string;
  className?: string;
}

export function GoalStatusBadge({
  status,
  isOverdue = false,
  size = 'sm',
  showIcon = true,
  showDot = false,
  customLabel,
  className,
}: GoalStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.on_track;
  const Icon = config.icon;

  // If overdue and status is urgent, we can display "Urgent • Overdue" or "Urgent" with clear tooltip
  const displayLabel =
    customLabel ||
    (isOverdue && status === 'urgent' ? 'Urgent • Overdue' : config.label);

  const tooltipText = isOverdue
    ? 'Target deadline has passed! Requires immediate action or deadline adjustment.'
    : config.tooltip;

  const sizeClasses = {
    xs: 'px-2 py-0.2 text-[10px] gap-1',
    sm: 'px-2.5 py-0.5 text-xs gap-1.5',
    md: 'px-3 py-1 text-xs gap-1.5 font-medium',
  }[size];

  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  }[size];

  const dotSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
  }[size];

  return (
    <span
      title={tooltipText}
      className={cn(
        'inline-flex items-center rounded-full border transition-colors select-none font-medium shrink-0',
        config.badgeClasses,
        sizeClasses,
        className
      )}
    >
      {showDot && (
        <span
          className={cn('rounded-full shrink-0', config.dotClasses, dotSizes)}
          aria-hidden="true"
        />
      )}

      {showIcon && <Icon className={cn(iconSizes, 'shrink-0')} />}

      <span className="whitespace-nowrap leading-none">{displayLabel}</span>
    </span>
  );
}
