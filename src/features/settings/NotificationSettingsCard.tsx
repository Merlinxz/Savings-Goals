import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  AlertTriangle,
  Repeat,
  Trophy,
  Flame,
  BarChart3,
  ShieldAlert,
  Volume2,
  VolumeX,
  Globe,
  CheckCircle2,
  RotateCcw,
  Volume,
  Sparkles,
  Check,
  X,
  Sliders,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useGoalsStore } from '@/store/useGoalsStore';
import {
  getEffectiveNotificationSettings,
  playNotificationChime,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
} from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { NotificationSettings } from '@/types';

export function NotificationSettingsCard() {
  const {
    settings,
    updateNotificationSettings,
    dismissedAlertGoalIds,
    resetDismissedAlerts,
  } = useGoalsStore();

  const config = getEffectiveNotificationSettings(settings);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setBrowserPerm(getBrowserNotificationPermission());
  }, []);

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    updateNotificationSettings({ [key]: value });

    if (config.soundEnabled && key !== 'soundEnabled') {
      playNotificationChime('bell');
    }

    if (key === 'masterEnabled') {
      toast.success(
        value
          ? 'Enabled all notifications'
          : 'Muted all notifications'
      );
    }
  };

  const handleEnableAll = () => {
    updateNotificationSettings({
      masterEnabled: true,
      pacingAlerts: true,
      recurringReminders: true,
      milestoneAlerts: true,
      inactivityReminders: true,
      weeklyDigest: true,
      showNavbarBadge: true,
      showDashboardBanner: true,
      soundEnabled: true,
    });
    if (config.soundEnabled) {
      playNotificationChime('success');
    }
    toast.success('All notification categories enabled');
  };

  const handleDisableAll = () => {
    updateNotificationSettings({
      masterEnabled: false,
    });
    toast.info('All notifications disabled');
  };

  const handleTestChime = () => {
    playNotificationChime('success');
    toast.success('Playing test notification sound 🔔');
  };

  const handleRequestBrowserPerm = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserPerm(res);
    if (res === 'granted') {
      updateNotificationSettings({ browserNotifications: true });
      sendBrowserNotification('Savings Goals Tracker', 'Browser notifications enabled successfully!');
      toast.success('Browser notification permission granted!');
    } else if (res === 'denied') {
      updateNotificationSettings({ browserNotifications: false });
      toast.error('Browser notifications blocked in your browser permissions.');
    }
  };

  const handleSendTestNotification = () => {
    if (config.soundEnabled) {
      playNotificationChime('bell');
    }

    toast.info('🔔 Test Notification', {
      description: 'Your notification rules are working perfectly with custom sounds and alerts.',
      action: {
        label: 'OK',
        onClick: () => {},
      },
    });

    if (config.browserNotifications && browserPerm === 'granted') {
      sendBrowserNotification(
        'Savings Goals Tracker: Test Alert',
        'Your goal notification settings are active and functioning correctly!'
      );
    }
  };

  return (
    <Card className="border-border/80 shadow-xs overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              {config.masterEnabled ? (
                <BellRing className="h-5 w-5" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  Notification Management
                </CardTitle>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                    config.masterEnabled
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-muted text-muted-foreground border border-border'
                  )}
                >
                  {config.masterEnabled ? 'Active' : 'Muted'}
                </span>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Customize, enable, or mute deadline warnings, contribution reminders, milestone
                celebrations, and audio chimes.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleEnableAll}
            >
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Enable All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleDisableAll}
            >
              <X className="h-3.5 w-3.5" />
              Disable All
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6 divide-y divide-border/60">
        {/* Master Switch */}
        <div className="flex items-center justify-between gap-4 pb-2">
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Master Notification Switch
            </h4>
            <p className="text-xs text-muted-foreground">
              Master control toggle. When turned off, all in-app banners, navbar bell alerts, and
              reminders will be muted.
            </p>
          </div>
          <Switch
            id="notif-master-switch"
            checked={config.masterEnabled}
            onCheckedChange={(checked) => handleToggle('masterEnabled', checked)}
          />
        </div>

        {/* SECTION 1: Notification Categories */}
        <div
          className={cn(
            'pt-5 space-y-4 transition-opacity',
            !config.masterEnabled && 'opacity-40 pointer-events-none'
          )}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Notification Types
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Configure which events trigger alerts
            </span>
          </div>

          {/* 1. Goal Pacing & Deadline Alerts */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-medium text-foreground">
                    Goal Pacing & Deadline Alerts
                  </h5>
                  <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/20">
                    Smart Pacing
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                  Alerts you when current contribution velocity indicates a goal may miss its
                  scheduled target deadline, providing proactive 1-click plan adjustments.
                </p>
                {dismissedAlertGoalIds.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[11px] text-primary px-2 gap-1"
                      onClick={() => {
                        resetDismissedAlerts();
                        toast.success(
                          `Restored ${dismissedAlertGoalIds.length} previously dismissed alert${dismissedAlertGoalIds.length === 1 ? '' : 's'}.`
                        );
                      }}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore {dismissedAlertGoalIds.length} Dismissed Alert
                      {dismissedAlertGoalIds.length === 1 ? '' : 's'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <Switch
              id="notif-pacing-switch"
              checked={config.pacingAlerts}
              onCheckedChange={(checked) => handleToggle('pacingAlerts', checked)}
            />
          </div>

          {/* 2. Scheduled / Recurring Deposit Reminders */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                <Repeat className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-medium text-foreground">
                    Recurring Deposit Reminders
                  </h5>
                  <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 px-1.5 py-0.2 rounded border border-blue-500/20">
                    Schedule
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                  Notifies you when a regular weekly or monthly contribution is due today or
                  upcoming within 3 days.
                </p>
              </div>
            </div>
            <Switch
              id="notif-recurring-switch"
              checked={config.recurringReminders}
              onCheckedChange={(checked) => handleToggle('recurringReminders', checked)}
            />
          </div>

          {/* 3. Milestone Celebrations */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-medium text-foreground">
                    Milestone & Goal Celebrations
                  </h5>
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    Progress
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                  Celebrates and alerts you when your goals reach 25%, 50%, 75% milestones or cross
                  100% completion.
                </p>
              </div>
            </div>
            <Switch
              id="notif-milestone-switch"
              checked={config.milestoneAlerts}
              onCheckedChange={(checked) => handleToggle('milestoneAlerts', checked)}
            />
          </div>

          {/* 4. Savings Momentum & Inactivity */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-medium text-foreground">
                    Savings Momentum & Inactivity Prompts
                  </h5>
                  <span className="text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 px-1.5 py-0.2 rounded border border-rose-500/20">
                    Habit
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                  Provides a gentle reminder when no savings deposits have been recorded for over 7
                  days to help maintain savings habits.
                </p>
              </div>
            </div>
            <Switch
              id="notif-inactivity-switch"
              checked={config.inactivityReminders}
              onCheckedChange={(checked) => handleToggle('inactivityReminders', checked)}
            />
          </div>

          {/* 5. Weekly Digest */}
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-muted/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-medium text-foreground">
                    Weekly Progress Summary
                  </h5>
                  <span className="text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 px-1.5 py-0.2 rounded border border-purple-500/20">
                    Insights
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                  Includes weekly savings velocity, total deposits, and weekly goal progress
                  summaries in your notifications feed.
                </p>
              </div>
            </div>
            <Switch
              id="notif-digest-switch"
              checked={config.weeklyDigest}
              onCheckedChange={(checked) => handleToggle('weeklyDigest', checked)}
            />
          </div>
        </div>

        {/* SECTION 2: Channels & Display Styles */}
        <div
          className={cn(
            'pt-5 space-y-4 transition-opacity',
            !config.masterEnabled && 'opacity-40 pointer-events-none'
          )}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Display Channels & Sound
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Where and how notifications appear
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Top Navbar Bell Badge */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 bg-muted/10">
              <div>
                <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                  Navbar Bell Badge
                </h5>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Display an active unread count badge on the top navbar bell icon.
                </p>
              </div>
              <Switch
                id="notif-navbar-badge-switch"
                checked={config.showNavbarBadge}
                onCheckedChange={(checked) => handleToggle('showNavbarBadge', checked)}
              />
            </div>

            {/* Dashboard Alert Banner */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 bg-muted/10">
              <div>
                <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                  Dashboard Risk Banner
                </h5>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Display top-of-page warning banners on the dashboard for at-risk goals.
                </p>
              </div>
              <Switch
                id="notif-dashboard-banner-switch"
                checked={config.showDashboardBanner}
                onCheckedChange={(checked) => handleToggle('showDashboardBanner', checked)}
              />
            </div>

            {/* Sound Effects */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 bg-muted/10">
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {config.soundEnabled ? (
                      <Volume2 className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    Audio Chime
                  </h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] px-1.5 text-primary hover:bg-primary/10"
                    onClick={handleTestChime}
                  >
                    Test Sound
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Play gentle synthesized chimes upon milestone achievements and alerts.
                </p>
              </div>
              <Switch
                id="notif-sound-switch"
                checked={config.soundEnabled}
                onCheckedChange={(checked) => handleToggle('soundEnabled', checked)}
              />
            </div>

            {/* Browser Web Push */}
            <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 bg-muted/10">
              <div>
                <div className="flex items-center gap-1.5">
                  <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-blue-500" />
                    Browser Notifications
                  </h5>
                  <span
                    className={cn(
                      'text-[9px] font-semibold px-1.5 py-0.2 rounded border',
                      browserPerm === 'granted'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                        : browserPerm === 'denied'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                        : 'bg-muted border-border text-muted-foreground'
                    )}
                  >
                    {browserPerm}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Native browser desktop notifications when app tab is in background.
                </p>
                {browserPerm !== 'granted' && browserPerm !== 'unsupported' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] mt-1.5 px-2 text-primary"
                    onClick={handleRequestBrowserPerm}
                  >
                    Request Browser Permission
                  </Button>
                )}
              </div>
              <Switch
                id="notif-browser-switch"
                disabled={browserPerm === 'denied' || browserPerm === 'unsupported'}
                checked={config.browserNotifications && browserPerm === 'granted'}
                onCheckedChange={(checked) => {
                  if (checked && browserPerm !== 'granted') {
                    handleRequestBrowserPerm();
                  } else {
                    handleToggle('browserNotifications', checked);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Live Verification / Test Trigger */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20 -mx-5 -mb-5 p-4 border-t border-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>
              Verify your notification settings live by sending a test alert.
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 shrink-0 shadow-2xs"
            onClick={handleSendTestNotification}
          >
            <Send className="h-3.5 w-3.5 text-primary" />
            Send Test Notification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
