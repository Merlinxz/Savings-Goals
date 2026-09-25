import { differenceInDays, parseISO, isValid } from 'date-fns';
import { Goal, CurrencyCode, ResolvedTimeHorizon, TimeHorizonBucket } from '@/types';
import { convertCurrency, getEffectiveGoalCurrency } from './exchangeRates';

export interface TimeHorizonConfig {
  bucket: ResolvedTimeHorizon;
  label: string;
  labelTh: string;
  rangeLabel: string;
  description: string;
  color: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  iconName: 'Zap' | 'Shield' | 'Rocket';
}

export const TIME_HORIZONS: Record<ResolvedTimeHorizon, TimeHorizonConfig> = {
  short: {
    bucket: 'short',
    label: 'Short-term',
    labelTh: 'Short-term (< 1 Year)',
    rangeLabel: '< 1 Year',
    description: 'Travel, shopping, gadgets, celebration, or general expenses',
    color: '#0ea5e9', // sky
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300/60 dark:border-sky-700/60',
    borderClass: 'border-sky-300 dark:border-sky-800/60',
    bgClass: 'bg-sky-50/50 dark:bg-sky-950/20',
    iconName: 'Zap',
  },
  medium: {
    bucket: 'medium',
    label: 'Medium-term',
    labelTh: 'Medium-term (1–3 Years)',
    rangeLabel: '1–3 Years',
    description: 'Home/car down payment, emergency fund, tuition, renovation',
    color: '#8b5cf6', // purple
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/60 dark:border-purple-700/60',
    borderClass: 'border-purple-300 dark:border-purple-800/60',
    bgClass: 'bg-purple-50/50 dark:bg-purple-950/20',
    iconName: 'Shield',
  },
  long: {
    bucket: 'long',
    label: 'Long-term',
    labelTh: 'Long-term (> 3 Years)',
    rangeLabel: '> 3 Years',
    description: 'Retirement fund, long-term investments, real estate, financial freedom',
    color: '#f59e0b', // amber
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/60 dark:border-amber-700/60',
    borderClass: 'border-amber-300 dark:border-amber-800/60',
    bgClass: 'bg-amber-50/50 dark:bg-amber-950/20',
    iconName: 'Rocket',
  },
};

/**
 * Determine the resolved time horizon bucket for a goal.
 * Checks for manual override; if 'auto' or unset, checks deadline duration.
 */
export function resolveGoalHorizon(goal: Goal): ResolvedTimeHorizon {
  if (goal.timeHorizonBucket && goal.timeHorizonBucket !== 'auto') {
    return goal.timeHorizonBucket;
  }

  const today = new Date();
  const deadline = parseISO(goal.deadline);
  const validDeadline = isValid(deadline) ? deadline : new Date(today.getTime() + 90 * 86400000);
  
  // Calculate days remaining from today
  const daysDiff = differenceInDays(validDeadline, today);

  if (daysDiff <= 365) {
    return 'short';
  } else if (daysDiff <= 1095) {
    // 365 to 3 years (~1095 days)
    return 'medium';
  } else {
    return 'long';
  }
}

export function getGoalHorizonConfig(goal: Goal): TimeHorizonConfig {
  const bucket = resolveGoalHorizon(goal);
  return TIME_HORIZONS[bucket];
}

export interface HorizonBucketSummary {
  bucket: ResolvedTimeHorizon;
  config: TimeHorizonConfig;
  goals: Goal[];
  totalSavedBase: number;
  totalTargetBase: number;
  progressPct: number;
  percentageOfTotalWealth: number;
}

/**
 * Aggregates all goals into their 3 Time Horizon buckets with currency converted to base currency.
 */
export function aggregateGoalsByHorizon(
  goals: Goal[],
  baseCurrency: CurrencyCode = 'USD'
): {
  buckets: Record<ResolvedTimeHorizon, HorizonBucketSummary>;
  totalPortfolioSaved: number;
  totalPortfolioTarget: number;
} {
  const shortGoals: Goal[] = [];
  const mediumGoals: Goal[] = [];
  const longGoals: Goal[] = [];

  goals.forEach((g) => {
    const horizon = resolveGoalHorizon(g);
    if (horizon === 'short') shortGoals.push(g);
    else if (horizon === 'medium') mediumGoals.push(g);
    else longGoals.push(g);
  });

  const sumGoalAmounts = (list: Goal[]) => {
    let saved = 0;
    let target = 0;
    list.forEach((g) => {
      const goalCurrency = getEffectiveGoalCurrency(g.currency, baseCurrency);
      saved += convertCurrency(g.currentAmount, goalCurrency, baseCurrency);
      target += convertCurrency(g.targetAmount, goalCurrency, baseCurrency);
    });
    return { saved, target };
  };

  const shortSums = sumGoalAmounts(shortGoals);
  const mediumSums = sumGoalAmounts(mediumGoals);
  const longSums = sumGoalAmounts(longGoals);

  const totalPortfolioSaved = shortSums.saved + mediumSums.saved + longSums.saved;
  const totalPortfolioTarget = shortSums.target + mediumSums.target + longSums.target;

  const createSummary = (
    bucket: ResolvedTimeHorizon,
    bucketGoals: Goal[],
    saved: number,
    target: number
  ): HorizonBucketSummary => {
    const progressPct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
    const percentageOfTotalWealth =
      totalPortfolioSaved > 0 ? Math.round((saved / totalPortfolioSaved) * 100) : 0;

    return {
      bucket,
      config: TIME_HORIZONS[bucket],
      goals: bucketGoals,
      totalSavedBase: saved,
      totalTargetBase: target,
      progressPct,
      percentageOfTotalWealth,
    };
  };

  return {
    buckets: {
      short: createSummary('short', shortGoals, shortSums.saved, shortSums.target),
      medium: createSummary('medium', mediumGoals, mediumSums.saved, mediumSums.target),
      long: createSummary('long', longGoals, longSums.saved, longSums.target),
    },
    totalPortfolioSaved,
    totalPortfolioTarget,
  };
}
