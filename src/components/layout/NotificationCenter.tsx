import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  BellOff,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Sparkles,
  Calendar,
  Repeat,
  Trophy,
  Flame,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useGoalsStore } from '@/store/useGoalsStore';
import {
  getActiveNotifications,
  getEffectiveNotificationSettings,
  AppNotification,
  NotificationCategory,
} from '@/lib/notifications';
import { formatCurrency } from '@/lib/currencies';
import { GoalThumbnail } from '@/components/common/GoalThumbnail';
import { cn } from '@/lib/utils';
import { Goal } from '@/types';
import { PacingAlert } from '@/lib/pacingAlerts';

interface NotificationCenterProps {
  onAdjustPlan: (goal: Goal, alert: PacingAlert) => void;
  onOpenDeposit: (goalId: string, suggestedAmount?: number) => void;
  onSelectGoal?: (goalId: string) => void;
}

export function NotificationCenter({
  onAdjustPlan,
  onOpenDeposit,
  onSelectGoal,
}: NotificationCenterProps) {
  const navigate = useNavigate();
  const {
    goals,
    transactions,
    settings,
    dismissedAlertGoalIds,
    dismissAlert,
    resetDismissedAlerts,
  } = useGoalsStore();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | NotificationCategory>('all');

  const config = getEffectiveNotificationSettings(settings);

  // Gathers all active notifications according to user settings
  const allNotifications = useMemo(() => {
    return getActiveNotifications(goals, transactions, settings, dismissedAlertGoalIds);
  }, [goals, transactions, settings, dismissedAlertGoalIds]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return allNotifications;
    return allNotifications.filter((n) => n.category === activeTab);
  }, [allNotifications, activeTab]);

  const hasCritical = allNotifications.some((a) => a.severity === 'critical');
  const alertCount = allNotifications.length;
  const isMasterDisabled = !config.masterEnabled;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'relative h-9 w-9 text-muted-foreground hover:text-foreground transition-all',
            isMasterDisabled && 'opacity-60',
            !isMasterDisabled &&
              alertCount > 0 &&
              (hasCritical
                ? 'border-rose-500/50 text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10'
                : 'border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10')
          )}
          title={
            isMasterDisabled
              ? 'Notifications muted in Settings'
              : alertCount > 0
              ? `${alertCount} active notification${alertCount === 1 ? '' : 's'}`
              : 'Notifications Center'
          }
          aria-label="Savings notifications center"
        >
          {isMasterDisabled ? (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          ) : alertCount > 0 ? (
            <BellRing
              className={cn(
                'h-4 w-4',
                hasCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
              )}
            />
          ) : (
            <Bell className="h-4 w-4" />
          )}

          {/* Badge counter - shown only if showNavbarBadge is true and master is enabled */}
          {!isMasterDisabled && config.showNavbarBadge && alertCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-xs',
                hasCritical ? 'bg-rose-600 animate-pulse' : 'bg-amber-600'
              )}
            >
              {alertCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-84 sm:w-[420px] p-0 shadow-xl border-border/80"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-3.5 px-4 border-b border-border/80 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'p-1.5 rounded-md',
                  isMasterDisabled
                    ? 'bg-muted text-muted-foreground'
                    : alertCount > 0
                    ? hasCritical
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isMasterDisabled ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Notifications & Alerts</h4>
                <p className="text-[11px] text-muted-foreground">
                  {isMasterDisabled
                    ? 'Notifications are currently muted'
                    : alertCount > 0
                    ? `${alertCount} active item${alertCount === 1 ? '' : 's'} to review`
                    : 'All savings plans on schedule'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Manage Notification Settings"
                onClick={() => {
                  setOpen(false);
                  navigate('/settings');
                }}
              >
                <SettingsIcon className="h-3.5 w-3.5" />
              </Button>
              {!isMasterDisabled && alertCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-muted-foreground hover:text-foreground px-2"
                  onClick={() => {
                    allNotifications.forEach((n) => {
                      if (n.goalId) dismissAlert(n.goalId);
                    });
                  }}
                >
                  Dismiss All
                </Button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          {!isMasterDisabled && alertCount > 0 && (
            <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-border/40 overflow-x-auto no-scrollbar">
              {[
                { key: 'all', label: `All (${alertCount})` },
                {
                  key: 'pacing',
                  label: `Pacing (${allNotifications.filter((n) => n.category === 'pacing').length})`,
                },
                {
                  key: 'recurring',
                  label: `Schedules (${allNotifications.filter((n) => n.category === 'recurring').length})`,
                },
                {
                  key: 'milestone',
                  label: `Milestones (${allNotifications.filter((n) => n.category === 'milestone').length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap',
                    activeTab === tab.key
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
          {isMasterDisabled ? (
            <div className="py-8 px-6 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-2.5">
                <BellOff className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Notifications Muted</p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[260px] mx-auto">
                All notifications are currently turned off in your settings.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3.5 h-7 text-xs text-primary"
                onClick={() => {
                  setOpen(false);
                  navigate('/settings');
                }}
              >
                Open Notification Settings
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-8 px-6 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Everything Is On Track!</p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[260px] mx-auto">
                {activeTab === 'all'
                  ? 'Your current contributions and deposits are projected to hit all target milestones on or before deadlines.'
                  : `No active items in the ${activeTab} category.`}
              </p>
              {dismissedAlertGoalIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-7 text-[10px] text-primary"
                  onClick={resetDismissedAlerts}
                >
                  Restore {dismissedAlertGoalIds.length} Dismissed Alert
                  {dismissedAlertGoalIds.length === 1 ? '' : 's'}
                </Button>
              )}
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isCrit = notif.severity === 'critical';
              const isSuccess = notif.severity === 'success';

              return (
                <div
                  key={notif.id}
                  className={cn(
                    'p-3.5 hover:bg-muted/30 transition-colors',
                    isCrit
                      ? 'bg-rose-500/[0.03]'
                      : isSuccess
                      ? 'bg-emerald-500/[0.03]'
                      : 'bg-muted/[0.02]'
                  )}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    {/* Thumbnail / Category Icon */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {notif.goal ? (
                        <GoalThumbnail
                          icon={notif.goal.icon}
                          imageUrl={notif.goal.imageUrl}
                          color={notif.goal.color}
                          name={notif.goal.name}
                          size="sm"
                        />
                      ) : (
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                            notif.category === 'inactivity'
                              ? 'bg-rose-500/15 text-rose-600'
                              : 'bg-primary/15 text-primary'
                          )}
                        >
                          {notif.category === 'inactivity' ? (
                            <Flame className="h-4 w-4" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </div>
                      )}

                      <div className="min-w-0">
                        {notif.goal ? (
                          <button
                            type="button"
                            onClick={() => {
                              setOpen(false);
                              if (onSelectGoal && notif.goalId) onSelectGoal(notif.goalId);
                            }}
                            className="text-xs font-semibold text-foreground hover:text-primary transition-colors text-left truncate block max-w-[190px]"
                          >
                            {notif.goal.name}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-foreground truncate block">
                            {notif.title}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                          <span>{notif.categoryLabel}</span>
                          <span>•</span>
                          <span>{notif.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge & Dismiss button */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                          isCrit
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                            : isSuccess
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                        )}
                      >
                        {notif.category === 'pacing' && notif.pacingAlert
                          ? notif.pacingAlert.delayDescription
                          : notif.severity.toUpperCase()}
                      </span>
                      {notif.goalId && (
                        <button
                          type="button"
                          onClick={() => dismissAlert(notif.goalId!)}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                          title="Dismiss notification"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Message */}
                  <div className="mt-2 text-[11px] text-foreground/90 bg-muted/40 rounded-md p-2 border border-border/50">
                    <p className="font-medium text-foreground/90">{notif.message}</p>
                    {notif.detail && (
                      <p className="mt-1 text-[10px] text-muted-foreground font-mono">
                        {notif.detail}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-2.5 flex items-center gap-2">
                    {notif.actionType === 'adjust_plan' && notif.goal && notif.pacingAlert && (
                      <Button
                        size="sm"
                        className="h-7 text-[11px] px-2.5 gap-1.5 flex-1 font-semibold"
                        onClick={() => {
                          setOpen(false);
                          onAdjustPlan(notif.goal!, notif.pacingAlert!);
                        }}
                      >
                        <SlidersHorizontal className="h-3 w-3" />
                        Adjust Plan Proactively
                      </Button>
                    )}

                    {notif.goalId && (
                      <Button
                        variant={notif.actionType === 'deposit' ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-[11px] px-2.5"
                        onClick={() => {
                          setOpen(false);
                          onOpenDeposit(notif.goalId!, notif.suggestedAmount);
                        }}
                      >
                        {notif.actionType === 'deposit' ? 'Make Deposit' : 'Deposit'}
                      </Button>
                    )}

                    {notif.goalId && onSelectGoal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setOpen(false);
                          onSelectGoal(notif.goalId!);
                        }}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2 px-3 border-t border-border/80 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
          <button
            type="button"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            onClick={() => {
              setOpen(false);
              navigate('/settings');
            }}
          >
            <SettingsIcon className="h-3 w-3 text-primary" />
            <span>Manage Notification Settings</span>
          </button>
          <span>Real-time tracking</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
