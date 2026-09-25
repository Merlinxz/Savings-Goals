import { Goal, Transaction } from '@/types';
import { format, parseISO, isValid } from 'date-fns';

export type AchievementTier = 'bronze' | 'silver' | 'gold';
export type AchievementCategory =
  | 'starter'
  | 'habit'
  | 'progress'
  | 'achievement'
  | 'expansion'
  | 'discipline'
  | 'mastery';

export interface AchievementTheme {
  id: string;
  borderUnlocked: string;
  bgUnlocked: string;
  hoverUnlocked: string;
  iconBgUnlocked: string;
  iconTextUnlocked: string;
  badgePillUnlocked: string;
  ringUnlocked: string;
  accentBar: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  condition: string;
  conditionDetail: string;
  category: AchievementCategory;
  categoryLabel: string;
  tier: AchievementTier;
  tierLabel: string;
  iconName:
    | 'Target'
    | 'Sprout'
    | 'Flame'
    | 'Rocket'
    | 'Trophy'
    | 'Briefcase'
    | 'Zap'
    | 'Award'
    | 'Coins';
  unlocked: boolean;
  unlockedAt?: string | null;
  progressText: string;
  progressPercent: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  actionLabel?: string;
  actionType?: 'create_goal' | 'deposit' | 'recurring' | 'goals';
  theme: AchievementTheme;
}

export const ACHIEVEMENT_THEMES: Record<string, AchievementTheme> = {
  emerald: {
    id: 'emerald',
    borderUnlocked: 'border-emerald-500/40 dark:border-emerald-400/40',
    bgUnlocked: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    hoverUnlocked: 'hover:border-emerald-500/60 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15',
    iconBgUnlocked: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    iconTextUnlocked: 'text-emerald-600 dark:text-emerald-400',
    badgePillUnlocked: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    ringUnlocked: 'ring-emerald-500/30',
    accentBar: 'bg-emerald-500',
  },
  sky: {
    id: 'sky',
    borderUnlocked: 'border-sky-500/40 dark:border-sky-400/40',
    bgUnlocked: 'bg-sky-500/5 dark:bg-sky-500/10',
    hoverUnlocked: 'hover:border-sky-500/60 hover:bg-sky-500/10 dark:hover:bg-sky-500/15',
    iconBgUnlocked: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
    iconTextUnlocked: 'text-sky-600 dark:text-sky-400',
    badgePillUnlocked: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20',
    ringUnlocked: 'ring-sky-500/30',
    accentBar: 'bg-sky-500',
  },
  amber: {
    id: 'amber',
    borderUnlocked: 'border-amber-500/40 dark:border-amber-400/40',
    bgUnlocked: 'bg-amber-500/5 dark:bg-amber-500/10',
    hoverUnlocked: 'hover:border-amber-500/60 hover:bg-amber-500/10 dark:hover:bg-amber-500/15',
    iconBgUnlocked: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    iconTextUnlocked: 'text-amber-600 dark:text-amber-400',
    badgePillUnlocked: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
    ringUnlocked: 'ring-amber-500/30',
    accentBar: 'bg-amber-500',
  },
  indigo: {
    id: 'indigo',
    borderUnlocked: 'border-indigo-500/40 dark:border-indigo-400/40',
    bgUnlocked: 'bg-indigo-500/5 dark:bg-indigo-500/10',
    hoverUnlocked: 'hover:border-indigo-500/60 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/15',
    iconBgUnlocked: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    iconTextUnlocked: 'text-indigo-600 dark:text-indigo-400',
    badgePillUnlocked: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    ringUnlocked: 'ring-indigo-500/30',
    accentBar: 'bg-indigo-500',
  },
  gold: {
    id: 'gold',
    borderUnlocked: 'border-yellow-500/50 dark:border-yellow-400/50',
    bgUnlocked: 'bg-yellow-500/8 dark:bg-yellow-500/12',
    hoverUnlocked: 'hover:border-yellow-500/70 hover:bg-yellow-500/15 dark:hover:bg-yellow-500/20',
    iconBgUnlocked: 'bg-yellow-500/25 text-yellow-600 dark:text-yellow-400',
    iconTextUnlocked: 'text-yellow-600 dark:text-yellow-400',
    badgePillUnlocked: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border-yellow-500/30',
    ringUnlocked: 'ring-yellow-500/40',
    accentBar: 'bg-yellow-500',
  },
  purple: {
    id: 'purple',
    borderUnlocked: 'border-purple-500/40 dark:border-purple-400/40',
    bgUnlocked: 'bg-purple-500/5 dark:bg-purple-500/10',
    hoverUnlocked: 'hover:border-purple-500/60 hover:bg-purple-500/10 dark:hover:bg-purple-500/15',
    iconBgUnlocked: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    iconTextUnlocked: 'text-purple-600 dark:text-purple-400',
    badgePillUnlocked: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20',
    ringUnlocked: 'ring-purple-500/30',
    accentBar: 'bg-purple-500',
  },
  cyan: {
    id: 'cyan',
    borderUnlocked: 'border-cyan-500/40 dark:border-cyan-400/40',
    bgUnlocked: 'bg-cyan-500/5 dark:bg-cyan-500/10',
    hoverUnlocked: 'hover:border-cyan-500/60 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/15',
    iconBgUnlocked: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    iconTextUnlocked: 'text-cyan-600 dark:text-cyan-400',
    badgePillUnlocked: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
    ringUnlocked: 'ring-cyan-500/30',
    accentBar: 'bg-cyan-500',
  },
  rose: {
    id: 'rose',
    borderUnlocked: 'border-rose-500/40 dark:border-rose-400/40',
    bgUnlocked: 'bg-rose-500/5 dark:bg-rose-500/10',
    hoverUnlocked: 'hover:border-rose-500/60 hover:bg-rose-500/10 dark:hover:bg-rose-500/15',
    iconBgUnlocked: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
    iconTextUnlocked: 'text-rose-600 dark:text-rose-400',
    badgePillUnlocked: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20',
    ringUnlocked: 'ring-rose-500/30',
    accentBar: 'bg-rose-500',
  },
};

function safeFormatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = parseISO(dateStr);
    if (isValid(d)) {
      return format(d, 'MMM d, yyyy');
    }
  } catch {
    // fallback
  }
  return null;
}

export function calculateAchievements(goals: Goal[], transactions: Transaction[]): Achievement[] {
  const depositTxs = transactions
    .filter((t) => t.type === 'deposit')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const depositCount = depositTxs.length;

  const sortedGoals = [...goals].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const highestPercent =
    goals.length > 0
      ? Math.max(
          0,
          ...goals.map((g) => (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0))
        )
      : 0;

  const completedGoals = goals.filter(
    (g) => g.targetAmount > 0 && g.currentAmount >= g.targetAmount
  );
  const completedGoalsCount = completedGoals.length;

  const goalWithRecurring = goals.find((g) => g.recurringContribution?.enabled);
  const hasRecurring = Boolean(goalWithRecurring);

  // 1. First Goal
  const firstGoalUnlocked = goals.length >= 1;
  const firstGoalDate = firstGoalUnlocked && sortedGoals[0]?.createdAt
    ? safeFormatDate(sortedGoals[0].createdAt)
    : null;

  // 2. First Deposit
  const firstDepositUnlocked = depositCount >= 1;
  const firstDepositDate = firstDepositUnlocked && depositTxs[0]?.date
    ? safeFormatDate(depositTxs[0].date)
    : null;

  // 3. Consistent Saver (3+ deposits)
  const consistentSaverUnlocked = depositCount >= 3;
  const consistentSaverDate = consistentSaverUnlocked && depositTxs[2]?.date
    ? safeFormatDate(depositTxs[2].date)
    : null;

  // 4. Halfway There (>= 50% on any goal)
  const halfwayUnlocked = highestPercent >= 50;
  const halfwayDate = halfwayUnlocked && depositTxs.length > 0
    ? safeFormatDate(depositTxs[depositTxs.length - 1].date)
    : null;

  // 5. Goal Crusher (100% completed goal)
  const goalCrusherUnlocked = completedGoalsCount >= 1;
  const goalCrusherDate = goalCrusherUnlocked && depositTxs.length > 0
    ? safeFormatDate(depositTxs[depositTxs.length - 1].date)
    : null;

  // 6. Portfolio Builder (3+ goals)
  const portfolioUnlocked = goals.length >= 3;
  const portfolioDate = portfolioUnlocked && sortedGoals[2]?.createdAt
    ? safeFormatDate(sortedGoals[2].createdAt)
    : null;

  // 7. Automator (Recurring contribution configured)
  const automatorUnlocked = hasRecurring;
  const automatorDate = automatorUnlocked && goalWithRecurring?.recurringContribution?.startDate
    ? safeFormatDate(goalWithRecurring.recurringContribution.startDate)
    : (automatorUnlocked && goalWithRecurring?.createdAt ? safeFormatDate(goalWithRecurring.createdAt) : null);

  // 8. Savings Dynamo (5+ deposits)
  const dynamoUnlocked = depositCount >= 5;
  const dynamoDate = dynamoUnlocked && depositTxs[4]?.date
    ? safeFormatDate(depositTxs[4].date)
    : null;

  return [
    {
      id: 'first_goal',
      title: 'First Goal',
      description: 'Established your very first savings target and roadmap.',
      condition: 'Create at least 1 savings goal',
      conditionDetail: 'Initialize any new savings goal with a target amount and deadline.',
      category: 'starter',
      categoryLabel: 'Starter Milestone',
      tier: 'bronze',
      tierLabel: 'Bronze Tier',
      iconName: 'Target',
      unlocked: firstGoalUnlocked,
      unlockedAt: firstGoalDate,
      progressText: firstGoalUnlocked ? 'Goal created' : '0 of 1 goal created',
      progressPercent: firstGoalUnlocked ? 100 : 0,
      currentValue: Math.min(1, goals.length),
      targetValue: 1,
      unit: 'goal',
      actionLabel: 'Create Goal',
      actionType: 'create_goal',
      theme: ACHIEVEMENT_THEMES.emerald,
    },
    {
      id: 'first_deposit',
      title: 'First Deposit',
      description: 'Took the first step by putting real money into a goal.',
      condition: 'Record your first savings deposit',
      conditionDetail: 'Make a deposit of any size toward one of your active goals.',
      category: 'starter',
      categoryLabel: 'Action Milestone',
      tier: 'bronze',
      tierLabel: 'Bronze Tier',
      iconName: 'Sprout',
      unlocked: firstDepositUnlocked,
      unlockedAt: firstDepositDate,
      progressText: firstDepositUnlocked ? 'First deposit made' : '0 of 1 deposit',
      progressPercent: firstDepositUnlocked ? 100 : 0,
      currentValue: Math.min(1, depositCount),
      targetValue: 1,
      unit: 'deposit',
      actionLabel: 'Make Deposit',
      actionType: 'deposit',
      theme: ACHIEVEMENT_THEMES.sky,
    },
    {
      id: 'consistent_saver',
      title: 'Consistent Saver',
      description: 'Building strong financial momentum through repeated contributions.',
      condition: 'Complete 3 or more savings deposits',
      conditionDetail: 'Demonstrate savings consistency by logging at least 3 deposit transactions.',
      category: 'habit',
      categoryLabel: 'Habit Milestone',
      tier: 'silver',
      tierLabel: 'Silver Tier',
      iconName: 'Flame',
      unlocked: consistentSaverUnlocked,
      unlockedAt: consistentSaverDate,
      progressText: consistentSaverUnlocked
        ? '3 deposits logged'
        : `${depositCount} of 3 deposits completed`,
      progressPercent: Math.min(100, Math.round((depositCount / 3) * 100)),
      currentValue: Math.min(3, depositCount),
      targetValue: 3,
      unit: 'deposits',
      actionLabel: 'Add Deposit',
      actionType: 'deposit',
      theme: ACHIEVEMENT_THEMES.amber,
    },
    {
      id: 'halfway_there',
      title: 'Halfway There',
      description: 'Hit the midpoint milestone of 50% progress on a target.',
      condition: 'Reach 50% progress on any goal',
      conditionDetail: 'Accumulate at least half of the total target amount on any single goal.',
      category: 'progress',
      categoryLabel: 'Pacing Milestone',
      tier: 'silver',
      tierLabel: 'Silver Tier',
      iconName: 'Rocket',
      unlocked: halfwayUnlocked,
      unlockedAt: halfwayDate,
      progressText: halfwayUnlocked
        ? 'Midpoint reached (50%+)'
        : `${Math.round(highestPercent)}% of 50% reached`,
      progressPercent: Math.min(100, Math.round((highestPercent / 50) * 100)),
      currentValue: Math.round(highestPercent),
      targetValue: 50,
      unit: '%',
      actionLabel: 'Boost Goal',
      actionType: 'deposit',
      theme: ACHIEVEMENT_THEMES.indigo,
    },
    {
      id: 'goal_crusher',
      title: 'Goal Crusher',
      description: 'Fully achieved 100% of a savings goal target. Outstanding discipline!',
      condition: 'Reach 100% of a goal target',
      conditionDetail: 'Successfully save the entire target amount for at least one goal.',
      category: 'achievement',
      categoryLabel: 'Mastery Milestone',
      tier: 'gold',
      tierLabel: 'Gold Tier',
      iconName: 'Trophy',
      unlocked: goalCrusherUnlocked,
      unlockedAt: goalCrusherDate,
      progressText: goalCrusherUnlocked
        ? `${completedGoalsCount} goal${completedGoalsCount === 1 ? '' : 's'} fully completed`
        : `${Math.round(highestPercent)}% / 100% on best goal`,
      progressPercent: goalCrusherUnlocked ? 100 : Math.min(100, Math.round(highestPercent)),
      currentValue: completedGoalsCount >= 1 ? 1 : Math.round(highestPercent),
      targetValue: 100,
      unit: completedGoalsCount >= 1 ? 'goal' : '%',
      actionLabel: 'View Goals',
      actionType: 'goals',
      theme: ACHIEVEMENT_THEMES.gold,
    },
    {
      id: 'portfolio_builder',
      title: 'Portfolio Builder',
      description: 'Diversified savings across multiple life objectives simultaneously.',
      condition: 'Manage 3 or more savings goals',
      conditionDetail: 'Create and maintain at least 3 distinct goals in your savings portfolio.',
      category: 'expansion',
      categoryLabel: 'Portfolio Milestone',
      tier: 'silver',
      tierLabel: 'Silver Tier',
      iconName: 'Briefcase',
      unlocked: portfolioUnlocked,
      unlockedAt: portfolioDate,
      progressText: portfolioUnlocked
        ? `${goals.length} goals in portfolio`
        : `${goals.length} of 3 goals created`,
      progressPercent: Math.min(100, Math.round((goals.length / 3) * 100)),
      currentValue: Math.min(3, goals.length),
      targetValue: 3,
      unit: 'goals',
      actionLabel: 'Add Another Goal',
      actionType: 'create_goal',
      theme: ACHIEVEMENT_THEMES.purple,
    },
    {
      id: 'automator',
      title: 'Automator',
      description: 'Put savings on autopilot by setting up a recurring deposit schedule.',
      condition: 'Configure a recurring deposit plan',
      conditionDetail: 'Set up an automated weekly or monthly recurring contribution schedule on any goal.',
      category: 'discipline',
      categoryLabel: 'Automation Milestone',
      tier: 'bronze',
      tierLabel: 'Bronze Tier',
      iconName: 'Zap',
      unlocked: automatorUnlocked,
      unlockedAt: automatorDate,
      progressText: automatorUnlocked ? 'Plan configured' : 'No recurring plan set',
      progressPercent: automatorUnlocked ? 100 : 0,
      currentValue: automatorUnlocked ? 1 : 0,
      targetValue: 1,
      unit: 'plan',
      actionLabel: 'Set Recurring Plan',
      actionType: 'recurring',
      theme: ACHIEVEMENT_THEMES.cyan,
    },
    {
      id: 'savings_dynamo',
      title: 'Savings Dynamo',
      description: 'Deep dedication with 5 or more total deposit contributions logged.',
      condition: 'Log 5 or more savings deposits',
      conditionDetail: 'Reach a milestone of 5 cumulative deposit transactions across all your goals.',
      category: 'mastery',
      categoryLabel: 'Streak Milestone',
      tier: 'gold',
      tierLabel: 'Gold Tier',
      iconName: 'Award',
      unlocked: dynamoUnlocked,
      unlockedAt: dynamoDate,
      progressText: dynamoUnlocked
        ? '5+ deposits recorded'
        : `${depositCount} of 5 deposits recorded`,
      progressPercent: Math.min(100, Math.round((depositCount / 5) * 100)),
      currentValue: Math.min(5, depositCount),
      targetValue: 5,
      unit: 'deposits',
      actionLabel: 'Make Deposit',
      actionType: 'deposit',
      theme: ACHIEVEMENT_THEMES.rose,
    },
  ];
}
