import React from 'react';
import { Tag as TagIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagBadgeProps {
  tag: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'outline' | 'interactive' | 'active';
  showIcon?: boolean;
  onRemove?: () => void;
  onClick?: (e?: React.MouseEvent<HTMLSpanElement>) => void;
  className?: string;
}

export function TagBadge({
  tag,
  size = 'sm',
  variant = 'default',
  showIcon = false,
  onRemove,
  onClick,
  className,
}: TagBadgeProps) {
  const isInteractive = Boolean(onClick || onRemove);

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantClasses = {
    default:
      'bg-muted/70 text-muted-foreground border border-border/60 hover:border-border hover:text-foreground',
    outline:
      'bg-transparent text-muted-foreground border border-border/80 hover:bg-muted/50 hover:text-foreground',
    interactive:
      'bg-muted/60 text-foreground/80 hover:bg-muted hover:text-foreground border border-border/70 cursor-pointer select-none active:scale-95',
    active:
      'bg-primary/15 text-primary border border-primary/30 font-semibold cursor-pointer shadow-xs',
  };

  return (
    <span
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'inline-flex items-center font-medium rounded-md transition-all shrink-0',
        sizeClasses[size],
        variantClasses[variant],
        onClick && 'cursor-pointer hover:shadow-2xs',
        className
      )}
    >
      {showIcon && <TagIcon className={cn('opacity-60', size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />}
      <span className="truncate max-w-[140px]">{tag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 -mr-0.5 rounded-sm p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
          aria-label={`Remove tag ${tag}`}
        >
          <X className={size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        </button>
      )}
    </span>
  );
}
