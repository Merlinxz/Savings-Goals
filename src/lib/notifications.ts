import { Goal, Transaction, NotificationSettings, UserSettings } from '@/types';
import { getAllPacingAlerts, PacingAlert } from '@/lib/pacingAlerts';
import { calculateGoalMetrics } from '@/lib/calculations';
import { differenceInDays, parseISO, isValid, isPast, isToday, addDays, format } from 'date-fns';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  masterEnabled: true,
  pacingAlerts: true,
  recurringReminders: true,
  milestoneAlerts: true,
  inactivityReminders: true,
  weeklyDigest: true,
  showNavbarBadge: true,
  showDashboardBanner: true,
  soundEnabled: true,
  browserNotifications: false,
};

/**
 * Normalizes user settings into fully populated NotificationSettings,
 * honoring legacy pacingAlertsEnabled if present.
 */
export function getEffectiveNotificationSettings(
  settings?: UserSettings | null
): NotificationSettings {
  if (!settings) {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }

  const legacyPacing = settings.pacingAlertsEnabled;
  const raw = settings.notifications || {};

  return {
    masterEnabled: raw.masterEnabled ?? true,
    pacingAlerts: raw.pacingAlerts ?? (legacyPacing !== false),
    recurringReminders: raw.recurringReminders ?? true,
    milestoneAlerts: raw.milestoneAlerts ?? true,
    inactivityReminders: raw.inactivityReminders ?? true,
    weeklyDigest: raw.weeklyDigest ?? true,
    showNavbarBadge: raw.showNavbarBadge ?? true,
    showDashboardBanner: raw.showDashboardBanner ?? true,
    soundEnabled: raw.soundEnabled ?? true,
    browserNotifications: raw.browserNotifications ?? false,
  };
}

export type NotificationCategory =
  | 'pacing'
  | 'recurring'
  | 'milestone'
  | 'inactivity'
  | 'digest';

export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  categoryLabel: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  detail?: string;
  timestamp: string;
  goalId?: string;
  goal?: Goal;
  actionType?: 'adjust_plan' | 'deposit' | 'view_goal' | 'none';
  pacingAlert?: PacingAlert;
  suggestedAmount?: number;
}

/**
 * Gathers and formats all active in-app notifications according to user settings.
 */
export function getActiveNotifications(
  goals: Goal[],
  transactions: Transaction[],
  settings?: UserSettings | null,
  dismissedGoalIds: string[] = []
): AppNotification[] {
  const config = getEffectiveNotificationSettings(settings);

  // If master toggle is disabled, return empty list
  if (!config.masterEnabled) {
    return [];
  }

  const notifications: AppNotification[] = [];
  const now = new Date();

  // 1. Pacing & Deadline Alerts
  if (config.pacingAlerts) {
    const pacingAlerts = getAllPacingAlerts(goals, transactions, dismissedGoalIds);
    for (const alert of pacingAlerts) {
      notifications.push({
        id: `pacing-${alert.id}`,
        category: 'pacing',
        categoryLabel: 'Pacing & Deadline',
        severity: alert.severity === 'critical' ? 'critical' : 'warning',
        title: alert.title,
        message: alert.message,
        detail: `Current: ${alert.currentRateLabel} ➔ Needed: ${alert.requiredRateLabel}`,
        timestamp: 'Real-time velocity',
        goalId: alert.goalId,
        goal: alert.goal,
        actionType: 'adjust_plan',
        pacingAlert: alert,
        suggestedAmount: alert.catchUpDepositAmount,
      });
    }
  }

  // 2. Scheduled / Recurring Deposit Reminders
  if (config.recurringReminders) {
    for (const goal of goals) {
      if (dismissedGoalIds.includes(goal.id)) continue;
      if (goal.currentAmount >= goal.targetAmount) continue;

      const rec = goal.recurringContribution;
      if (!rec || !rec.enabled || rec.amount <= 0) continue;

      // Compute the next due date based on schedule
      let nextDate: Date;
      if (rec.frequency === 'weekly') {
        const targetDay = rec.dayOfWeek ?? 1; // Default Monday
        const currentDay = now.getDay();
        const daysUntil = (targetDay - currentDay + 7) % 7;
        nextDate = new Date(now);
        nextDate.setDate(now.getDate() + daysUntil);
      } else {
        const targetDayOfMonth = rec.dayOfMonth ?? 1;
        nextDate = new Date(now.getFullYear(), now.getMonth(), targetDayOfMonth);
        if (nextDate.getTime() < now.getTime() && !isToday(nextDate)) {
          nextDate = new Date(now.getFullYear(), now.getMonth() + 1, targetDayOfMonth);
        }
      }

      const daysDiff = differenceInDays(nextDate, now);
      const isDueToday = isToday(nextDate) || daysDiff === 0;
      const isUpcoming = daysDiff > 0 && daysDiff <= 3;

      if (isDueToday) {
        notifications.push({
          id: `rec-today-${goal.id}`,
          category: 'recurring',
          categoryLabel: 'Deposit Due Today',
          severity: 'info',
          title: `Scheduled Deposit Today: ${goal.name}`,
          message: `Scheduled ${rec.frequency} contribution of $${rec.amount} is due today.`,
          timestamp: 'Due today',
          goalId: goal.id,
          goal,
          actionType: 'deposit',
          suggestedAmount: rec.amount,
        });
      } else if (isUpcoming) {
        notifications.push({
          id: `rec-upcoming-${goal.id}`,
          category: 'recurring',
          categoryLabel: 'Upcoming Deposit',
          severity: 'info',
          title: `Upcoming Deposit: ${goal.name}`,
          message: `Scheduled ${rec.frequency} deposit of $${rec.amount} coming up in ${daysDiff} day${daysDiff === 1 ? '' : 's'}.`,
          timestamp: `Due in ${daysDiff}d`,
          goalId: goal.id,
          goal,
          actionType: 'deposit',
          suggestedAmount: rec.amount,
        });
      }
    }
  }

  // 3. Milestone & Goal Completion Celebrations
  if (config.milestoneAlerts) {
    for (const goal of goals) {
      if (dismissedGoalIds.includes(goal.id)) continue;
      const metrics = calculateGoalMetrics(goal);

      if (metrics.status === 'completed' || metrics.percentage >= 100) {
        notifications.push({
          id: `milestone-100-${goal.id}`,
          category: 'milestone',
          categoryLabel: 'Goal Completed',
          severity: 'success',
          title: `Goal Achieved! 🎉`,
          message: `Congratulations! You have reached 100% of your target for "${goal.name}".`,
          detail: `Saved ${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}`,
          timestamp: 'Achieved',
          goalId: goal.id,
          goal,
          actionType: 'view_goal',
        });
      } else if (metrics.percentage >= 75 && metrics.percentage < 100) {
        notifications.push({
          id: `milestone-75-${goal.id}`,
          category: 'milestone',
          categoryLabel: 'Major Milestone',
          severity: 'success',
          title: `75% Milestone Reached!`,
          message: `"${goal.name}" is on the home stretch with over 75% funded!`,
          timestamp: `${metrics.percentage}% funded`,
          goalId: goal.id,
          goal,
          actionType: 'deposit',
        });
      } else if (metrics.percentage >= 50 && metrics.percentage < 75) {
        notifications.push({
          id: `milestone-50-${goal.id}`,
          category: 'milestone',
          categoryLabel: 'Halfway Milestone',
          severity: 'info',
          title: `Halfway There (50%)!`,
          message: `You've passed the halfway mark for "${goal.name}". Keep the momentum going!`,
          timestamp: `${metrics.percentage}% funded`,
          goalId: goal.id,
          goal,
          actionType: 'deposit',
        });
      }
    }
  }

  // 4. Inactivity & Savings Momentum Reminders
  if (config.inactivityReminders && transactions.length > 0 && goals.length > 0) {
    const sortedTx = [...transactions].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return dateB - dateA;
    });

    const latestTx = sortedTx[0];
    if (latestTx) {
      const lastTxDate = new Date(latestTx.date || latestTx.createdAt);
      const daysSince = differenceInDays(now, lastTxDate);

      // If over 7 days since last deposit and there are unfinished goals
      const hasUnfinishedGoals = goals.some((g) => g.currentAmount < g.targetAmount);
      if (daysSince >= 7 && hasUnfinishedGoals) {
        notifications.push({
          id: 'inactivity-momentum-reminder',
          category: 'inactivity',
          categoryLabel: 'Savings Momentum',
          severity: 'info',
          title: 'Keep Your Savings Streak Alive',
          message: `It has been ${daysSince} days since your last recorded deposit. Even small contributions compound over time!`,
          timestamp: `${daysSince}d since deposit`,
          actionType: 'none',
        });
      }
    }
  }

  return notifications;
}

/**
 * Plays a pleasant synthesizer audio chime using the Web Audio API without needing external assets.
 */
export function playNotificationChime(type: 'alert' | 'success' | 'bell' = 'bell'): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Ascending chord: C5 -> E5 -> G5
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.46);
    } else if (type === 'alert') {
      // Two-tone warning beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.36);
    } else {
      // Soft gentle bell chime: F5 (698.46Hz) decaying smoothly
      osc.type = 'sine';
      osc.frequency.setValueAtTime(698.46, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.41);
    }

    // Close audio context after playback to free memory
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }, 600);
  } catch {
    // Audio playback not supported or user hasn't interacted with page
  }
}

/**
 * Checks browser notification permission status safely.
 */
export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests browser permission for web push/system notifications.
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

/**
 * Dispatches a native browser notification if granted.
 */
export function sendBrowserNotification(title: string, body: string): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
    return true;
  } catch {
    return false;
  }
}
