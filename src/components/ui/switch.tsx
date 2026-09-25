import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out select-none',
          checked ? 'bg-primary' : 'bg-muted-foreground/30 dark:bg-muted',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-xs ring-0 transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-4 bg-primary-foreground' : 'translate-x-0.5'
          )}
        />
      </label>
    );
  }
);

Switch.displayName = 'Switch';
