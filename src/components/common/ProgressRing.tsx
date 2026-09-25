import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  showText?: boolean;
}

export function ProgressRing({
  percentage,
  size = 72,
  strokeWidth = 6,
  color = 'currentColor',
  className,
  showText = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/40"
        />
        {/* Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <span className="text-xs font-semibold tracking-tight text-foreground">
            {clampedPercentage}%
          </span>
        </div>
      )}
    </div>
  );
}
