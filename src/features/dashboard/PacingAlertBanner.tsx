import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoalsStore } from '@/store/useGoalsStore';
import { getAllPacingAlerts, PacingAlert } from '@/lib/pacingAlerts';
import { getEffectiveNotificationSettings } from '@/lib/notifications';
import { formatCurrency } from '@/lib/currencies';
import { GoalThumbnail } from '@/components/common/GoalThumbnail';
import { Goal } from '@/types';
import { cn } from '@/lib/utils';

interface PacingAlertBannerProps {
  onAdjustPlan: (goal: Goal, alert: PacingAlert) => void;
  onOpenDeposit: (goalId: string, suggestedAmount?: number) => void;
}

export function PacingAlertBanner({ onAdjustPlan, onOpenDeposit }: PacingAlertBannerProps) {
  const { goals, transactions, settings, dismissedAlertGoalIds, dismissAlert } = useGoalsStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isBannerHidden, setIsBannerHidden] = useState(false);

  const notifConfig = getEffectiveNotificationSettings(settings);
  const bannerVisible =
    notifConfig.masterEnabled &&
    notifConfig.pacingAlerts &&
    notifConfig.showDashboardBanner;

  const alerts = useMemo(() => {
    if (!bannerVisible) return [];
    return getAllPacingAlerts(goals, transactions, dismissedAlertGoalIds);
  }, [goals, transactions, dismissedAlertGoalIds, bannerVisible]);

  if (alerts.length === 0 || isBannerHidden) {
    return null;
  }

  const hasCritical = alerts.some((a) => a.severity === 'critical');
  const count = alerts.length;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 shadow-xs transition-all relative overflow-hidden',
        hasCritical
          ? 'border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-background text-foreground'
          : 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-background text-foreground'
      )}
    >
      {/* Header bar of alert */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'p-2 rounded-lg shrink-0',
              hasCritical
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
            )}
          >
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Proactive Deadline Risk Alert
              </h3>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                  hasCritical
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-600 text-white'
                )}
              >
                {count} {count === 1 ? 'Goal At Risk' : 'Goals At Risk'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current contribution rates indicate {count === 1 ? 'a goal' : 'some goals'} will miss
              scheduled target dates unless plans are adjusted.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand alert' : 'Collapse alert'}
          >
            {isCollapsed ? (
              <span className="flex items-center gap-1">
                Details <ChevronDown className="h-3.5 w-3.5" />
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Hide <ChevronUp className="h-3.5 w-3.5" />
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsBannerHidden(true)}
            title="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded item cards */}
      {!isCollapsed && (
        <div className="mt-3.5 pt-3 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map((alert) => {
            const isCrit = alert.severity === 'critical';
            return (
              <div
                key={alert.id}
                className={cn(
                  'p-3 rounded-lg border bg-background/80 backdrop-blur-xs flex flex-col justify-between gap-2.5',
                  isCrit ? 'border-rose-500/30' : 'border-amber-500/30'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GoalThumbnail
                      icon={alert.goal.icon}
                      imageUrl={alert.goal.imageUrl}
                      color={alert.goal.color}
                      name={alert.goal.name}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-foreground truncate">
                        {alert.goal.name}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span>Due {alert.goal.deadline}</span>
                        <span>•</span>
                        <span>
                          Target: {formatCurrency(alert.goal.targetAmount, settings.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                      isCrit
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {alert.delayDescription}
                  </span>
                </div>

                <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border border-border/40">
                  <p className="font-medium text-foreground/90">{alert.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground font-mono">
                    Current:{' '}
                    <span className="font-semibold text-foreground">{alert.currentRateLabel}</span>
                    {' · '}Required:{' '}
                    <span className="font-semibold text-primary">{alert.requiredRateLabel}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    className="h-7 text-[11px] px-2.5 gap-1.5 flex-1 font-semibold"
                    onClick={() => onAdjustPlan(alert.goal, alert)}
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    Adjust Plan Proactively
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => onOpenDeposit(alert.goalId, alert.catchUpDepositAmount)}
                  >
                    Deposit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => dismissAlert(alert.goalId)}
                    title="Dismiss alert for this goal"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
