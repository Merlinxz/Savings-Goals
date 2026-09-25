import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface CustomProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  indicatorColor?: string;
  animate?: boolean;
  duration?: number;
  delay?: number;
  showShimmer?: boolean;
  showGlow?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  CustomProgressProps
>(
  (
    {
      className,
      value,
      indicatorClassName,
      indicatorColor,
      animate = true,
      duration = 0.6,
      delay = 0.05,
      showShimmer = true,
      showGlow = true,
      ...props
    },
    ref
  ) => {
    const percent = Math.min(100, Math.max(0, value || 0));

    // Track first render vs value updates
    const isFirstRender = React.useRef(true);
    const prevPercentRef = React.useRef(percent);
    const [isUpdating, setIsUpdating] = React.useState(false);

    React.useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        prevPercentRef.current = percent;
        return;
      }

      if (prevPercentRef.current !== percent) {
        prevPercentRef.current = percent;
        setIsUpdating(true);
        const timer = setTimeout(() => {
          setIsUpdating(false);
        }, 850);
        return () => clearTimeout(timer);
      }
    }, [percent]);

    return (
      <ProgressPrimitive.Root
        ref={ref}
        value={percent}
        className={cn(
          'relative h-2.5 w-full overflow-hidden rounded-full bg-secondary/80',
          className
        )}
        {...props}
      >
        {animate ? (
          <motion.div
            className={cn(
              'relative h-full rounded-full overflow-hidden',
              !indicatorColor && 'bg-primary',
              indicatorClassName
            )}
            style={{
              backgroundColor: indicatorColor || undefined,
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${percent}%` }}
            transition={
              isFirstRender.current
                ? {
                    duration,
                    delay,
                    ease: [0.16, 1, 0.3, 1],
                  }
                : {
                    duration: 0.55,
                    delay: 0,
                    ease: [0.16, 1, 0.3, 1],
                  }
            }
          >
            {/* Shimmer sweep effect on initial render or value update */}
            {showShimmer && (
              <AnimatePresence mode="wait">
                {isUpdating ? (
                  <motion.div
                    key={`shimmer-update-${percent}`}
                    className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-white/45 to-transparent pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                ) : (
                  <motion.div
                    key="shimmer-initial"
                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: '250%' }}
                    transition={{
                      delay: delay + duration * 0.4,
                      duration: 0.7,
                      ease: 'easeOut',
                    }}
                  />
                )}
              </AnimatePresence>
            )}

            {/* Subtle leading edge highlight */}
            {showGlow && percent > 2 && percent < 100 && (
              <motion.div
                className="absolute top-0 bottom-0 right-0 w-1.5 rounded-r-full bg-white/40 pointer-events-none blur-[0.5px]"
                animate={
                  isUpdating
                    ? { opacity: [0.3, 0.9, 0.3], scaleY: [1, 1.2, 1] }
                    : { opacity: 0.4 }
                }
                transition={{ duration: 0.6 }}
              />
            )}

            {/* 100% Celebration completed glow */}
            {percent >= 100 && (
              <motion.div
                className="absolute inset-0 bg-white/25 rounded-full pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 0.9, ease: 'easeOut', repeat: 1 }}
              />
            )}
          </motion.div>
        ) : (
          <ProgressPrimitive.Indicator
            className={cn(
              'h-full w-full flex-1 transition-all duration-500 ease-out',
              !indicatorColor && 'bg-primary',
              indicatorClassName
            )}
            style={{
              transform: `translateX(-${100 - percent}%)`,
              ...(indicatorColor ? { backgroundColor: indicatorColor } : {}),
            }}
          />
        )}
      </ProgressPrimitive.Root>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
