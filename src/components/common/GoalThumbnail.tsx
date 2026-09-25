import React, { useState } from 'react';
import { GoalIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export interface GoalThumbnailProps {
  icon: string;
  imageUrl?: string;
  color: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  imgClassName?: string;
  alt?: string;
}

export function GoalThumbnail({
  icon,
  imageUrl,
  color,
  name,
  size = 'md',
  className,
  imgClassName,
  alt,
}: GoalThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  // Size specifications
  const sizeMap = {
    xs: {
      container: 'h-7 w-7 rounded-lg text-xs',
      icon: 'h-3.5 w-3.5',
    },
    sm: {
      container: 'h-8 w-8 rounded-lg text-xs',
      icon: 'h-4 w-4',
    },
    md: {
      container: 'h-11 w-11 rounded-xl text-sm',
      icon: 'h-5 w-5',
    },
    lg: {
      container: 'h-14 w-14 rounded-xl text-base',
      icon: 'h-7 w-7',
    },
    xl: {
      container: 'h-16 w-16 rounded-2xl text-lg shadow-sm',
      icon: 'h-8 w-8',
    },
  }[size];

  const hasValidImage = Boolean(imageUrl && !imageError);

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden transition-transform',
        sizeMap.container,
        hasValidImage && 'border border-border/80 bg-muted/40 shadow-2xs',
        className
      )}
      style={{
        backgroundColor: hasValidImage ? undefined : `${color}20`,
        color: hasValidImage ? undefined : color,
      }}
    >
      {hasValidImage ? (
        <img
          src={imageUrl}
          alt={alt || name}
          className={cn('h-full w-full object-cover transition-opacity duration-200', imgClassName)}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <GoalIcon name={icon} className={sizeMap.icon} />
      )}
    </div>
  );
}
