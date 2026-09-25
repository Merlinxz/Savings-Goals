import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  animateInitial?: boolean;
  formatter?: (val: number) => string;
}

export function AnimatedNumber({ value, duration = 600, animateInitial = false, formatter }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(animateInitial ? 0 : value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const diff = value - startValue;

    if (diff === 0) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  if (formatter) {
    return <span>{formatter(displayValue)}</span>;
  }

  return <span>{Math.round(displayValue).toLocaleString()}</span>;
}
