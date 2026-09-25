import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionIcon?: LucideIcon;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionIcon: SecondaryActionIcon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 sm:p-12 text-center bg-card/40">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} className="gap-2">
            {ActionIcon && <ActionIcon className="h-4 w-4" />}
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction} className="gap-2">
            {SecondaryActionIcon && <SecondaryActionIcon className="h-4 w-4" />}
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
