import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  BellRing,
  Sparkles,
  ShieldCheck,
  Target,
  TrendingUp,
  Calendar,
  Trophy,
  CheckCircle2,
  Volume2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  Coins,
  Sun,
  Moon,
  Laptop,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useTheme } from '@/lib/theme-provider';
import {
  getEffectiveNotificationSettings,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  playNotificationChime,
  sendBrowserNotification,
} from '@/lib/notifications';
import { CURRENCIES } from '@/lib/currencies';
import { CurrencyCode, NotificationSettings } from '@/types';
import { cn } from '@/lib/utils';

interface WelcomeModalProps {
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WelcomeModal({ forceOpen, onOpenChange }: WelcomeModalProps) {
  const { settings, updateSettings, updateNotificationSettings } = useGoalsStore();
  const { setTheme } = useTheme();

  // Determine whether the welcome modal should be open
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [isRequestingPerm, setIsRequestingPerm] = useState(false);

  // Local state for notification toggles during onboarding
  const effectiveNotifs = getEffectiveNotificationSettings(settings);
  const [notifState, setNotifState] = useState<NotificationSettings>(effectiveNotifs);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(settings.currency || 'USD');
  const [selectedTheme, setSelectedTheme] = useState<'system' | 'light' | 'dark'>(settings.theme || 'system');

  // Check first open on initial mount
  useEffect(() => {
    if (forceOpen !== undefined) {
      setIsOpen(forceOpen);
      if (forceOpen) {
        setCurrentStep(1);
      }
      return;
    }

    try {
      const storedCompleted = localStorage.getItem('savings-welcome-completed');
      if (!storedCompleted && settings.hasCompletedWelcome !== true) {
        setIsOpen(true);
      }
    } catch {
      if (settings.hasCompletedWelcome !== true) {
        setIsOpen(true);
      }
    }
  }, [forceOpen, settings.hasCompletedWelcome]);

  // Sync notification state when effectiveNotifs changes
  useEffect(() => {
    setNotifState(getEffectiveNotificationSettings(settings));
    setSelectedCurrency(settings.currency || 'USD');
    setSelectedTheme(settings.theme || 'system');
  }, [settings]);

  // Check browser notification permission
  useEffect(() => {
    setBrowserPerm(getBrowserNotificationPermission());
  }, [isOpen]);

  const handleClose = (markCompleted: boolean = true) => {
    if (markCompleted) {
      updateSettings({
        hasCompletedWelcome: true,
        currency: selectedCurrency,
        theme: selectedTheme,
      });
      updateNotificationSettings(notifState);
      try {
        localStorage.setItem('savings-welcome-completed', 'true');
      } catch {}
    }
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleRequestBrowserPermission = async () => {
    setIsRequestingPerm(true);
    try {
      const perm = await requestBrowserNotificationPermission();
      setBrowserPerm(perm);

      if (perm === 'granted') {
        setNotifState((prev) => ({ ...prev, browserNotifications: true }));
        updateNotificationSettings({ browserNotifications: true });
        toast.success('Notification permissions granted!', {
          description: 'You will receive timely deposit reminders and schedule alerts.',
        });
        playNotificationChime();
        sendBrowserNotification(
          'Savings Goals • Welcome',
          'Notifications enabled! Ready to guide your savings journey.'
        );
      } else if (perm === 'denied') {
        toast.error('Notifications blocked in browser', {
          description: 'You can enable permissions anytime in your browser site settings.',
        });
      }
    } finally {
      setIsRequestingPerm(false);
    }
  };

  const handleTestChimeAndNotification = () => {
    playNotificationChime();
    const sent = sendBrowserNotification(
      'Savings Goals • Notification Test',
      'Notifications are working seamlessly! Never miss a financial goal.'
    );
    if (sent) {
      toast.success('Test notification and audio chime sent successfully!');
    } else {
      toast.info('Audio chime played successfully (enable browser notifications for push alerts)');
    }
  };

  const handleToggleNotif = (key: keyof NotificationSettings, value: boolean) => {
    setNotifState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEnableAllNotifications = () => {
    const allEnabled: NotificationSettings = {
      masterEnabled: true,
      pacingAlerts: true,
      recurringReminders: true,
      milestoneAlerts: true,
      inactivityReminders: true,
      weeklyDigest: true,
      showNavbarBadge: true,
      showDashboardBanner: true,
      soundEnabled: true,
      browserNotifications: browserPerm === 'granted',
    };
    setNotifState(allEnabled);
    toast.success('All recommended notifications enabled');
  };

  const handleCurrencySelect = (code: CurrencyCode) => {
    setSelectedCurrency(code);
    updateSettings({ currency: code });
  };

  const handleThemeSelect = (newTheme: 'system' | 'light' | 'dark') => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose(true);
        } else {
          setIsOpen(true);
          onOpenChange?.(true);
        }
      }}
    >
      <DialogContent
        id="welcome-onboarding-modal"
        className="max-w-2xl w-full p-0 overflow-hidden sm:rounded-2xl border-border/80 shadow-2xl bg-card max-h-[92vh] flex flex-col gap-0"
      >
        {/* Top Gradient Accent Bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-emerald-500 via-primary to-amber-500 shrink-0" />

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase text-foreground">
              Getting Started • Welcome Guide
            </span>
          </div>

          {/* Step Bubbles */}
          <div className="flex items-center gap-1.5">
            {[
              { num: 1, label: 'Overview' },
              { num: 2, label: 'Notifications' },
              { num: 3, label: 'Preferences' },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isPassed = currentStep > step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setCurrentStep(step.num as 1 | 2 | 3)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                      : isPassed
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {isPassed ? (
                    <Check className="h-3 w-3 stroke-[3]" />
                  ) : (
                    <span>{step.num}</span>
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body Container with Transitions */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: WELCOME & APP HIGHLIGHTS */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2 pt-1">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs mb-3">
                    <Target className="h-7 w-7" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Welcome to Savings Goals
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    An intelligent personal finance and savings tracker. Monitor goal progress, forecast completion timelines, simulate debt acceleration, and build financial resilience.
                  </p>
                </div>

                {/* 3 Core Highlights Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/40 transition-colors space-y-2 text-center sm:text-left">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto sm:mx-0">
                      <Target className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-semibold text-foreground">
                      Clear Goal Tracking
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Set target amounts, deadlines, and log detailed deposit and withdrawal histories.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/40 transition-colors space-y-2 text-center sm:text-left">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto sm:mx-0">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-semibold text-foreground">
                      Pacing & Forecasting
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Analyze velocity in real-time. If you fall behind schedule, receive actionable catch-up adjustments.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/40 transition-colors space-y-2 text-center sm:text-left">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto sm:mx-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-semibold text-foreground">
                      Financial Toolkit
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Simulate compound growth, run Snowball vs. Avalanche debt payoff, and size emergency runways.
                    </p>
                  </div>
                </div>

                {/* Privacy & Offline Guarantee Banner */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      100% Private & Local
                    </span>
                    : All financial records stay encrypted on your device. No third-party servers, tracking, or cloud sharing.
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: NOTIFICATIONS DETAILS & PERMISSIONS */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <BellRing className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                      Notification Permissions & Settings
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Our notification engine is designed to sustain your saving cadence, guard target deadlines, and celebrate milestones.
                  </p>
                </div>

                {/* Browser Permission Request Card */}
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-foreground">
                            Browser Push Notifications
                          </h3>
                          {browserPerm === 'granted' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Permission Granted
                            </span>
                          )}
                          {browserPerm === 'denied' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                              <AlertCircle className="h-3 w-3" />
                              Blocked in Browser
                            </span>
                          )}
                          {browserPerm === 'default' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              Permission Pending
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          Enable push alerts so the app can alert you to deposit schedules and deadline risks even if this tab is closed.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {browserPerm !== 'granted' && (
                        <Button
                          size="sm"
                          onClick={handleRequestBrowserPermission}
                          disabled={isRequestingPerm || browserPerm === 'unsupported'}
                          className="text-xs h-8 gap-1.5 shadow-2xs"
                        >
                          <BellRing className="h-3.5 w-3.5" />
                          {browserPerm === 'denied' ? 'Blocked' : 'Enable Notifications'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestChimeAndNotification}
                        className="text-xs h-8 gap-1.5"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Test Sound
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 5 Notification Categories Breakdown */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Supported Notification Channels
                    </span>
                    <button
                      type="button"
                      onClick={handleEnableAllNotifications}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Enable all recommended
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {/* 1. Pacing & Deadline Alerts */}
                    <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-start justify-between gap-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <span>Pacing & Deadline Warnings</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Monitors savings velocity and sends immediate alerts if a goal is at risk of missing its deadline, along with recommended catch-up contributions.
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="notif-pacing-toggle"
                        aria-label="Toggle pacing alerts"
                        checked={notifState.pacingAlerts}
                        onCheckedChange={(checked) => handleToggleNotif('pacingAlerts', checked)}
                      />
                    </div>

                    {/* 2. Recurring Deposit Reminders */}
                    <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-start justify-between gap-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <span>Scheduled Contribution Reminders</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Reminds you on scheduled deposit days (e.g. weekly or monthly paydays) to reinforce consistent financial habits.
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="notif-recurring-toggle"
                        aria-label="Toggle recurring reminders"
                        checked={notifState.recurringReminders}
                        onCheckedChange={(checked) => handleToggleNotif('recurringReminders', checked)}
                      />
                    </div>

                    {/* 3. Milestone Celebrations */}
                    <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-start justify-between gap-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <span>Milestones & Achievement Celebrations</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Sends congratulatory milestone alerts when you reach 25%, 50%, 75%, and 100% of your savings targets.
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="notif-milestone-toggle"
                        aria-label="Toggle milestone alerts"
                        checked={notifState.milestoneAlerts}
                        onCheckedChange={(checked) => handleToggleNotif('milestoneAlerts', checked)}
                      />
                    </div>

                    {/* 4. Weekly Digest */}
                    <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-start justify-between gap-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <BarChart3 className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <span>Weekly Financial Digest</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Delivers an executive summary of net savings, weekly portfolio growth, and goals requiring your attention.
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="notif-digest-toggle"
                        aria-label="Toggle weekly digest"
                        checked={notifState.weeklyDigest}
                        onCheckedChange={(checked) => handleToggleNotif('weeklyDigest', checked)}
                      />
                    </div>

                    {/* 5. Sound & Chimes */}
                    <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-start justify-between gap-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Volume2 className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <span>Interactive Sound Chimes</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Plays pleasant harmonic chimes when saving deposits are completed or important notifications trigger.
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="notif-sound-toggle"
                        aria-label="Toggle sound chimes"
                        checked={notifState.soundEnabled}
                        onCheckedChange={(checked) => handleToggleNotif('soundEnabled', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Privacy & Anti-Spam Pledge */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-foreground">Privacy Guarantee:</strong> We never send advertising, third-party marketing, or spam. All alerts run locally on your device for your financial growth and can be configured anytime in Settings.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: QUICK PREFERENCES & FINISH */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1.5 pt-1">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    Initial Setup & Preferences
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Choose your primary display currency and preferred interface theme.
                  </p>
                </div>

                {/* Currency Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-primary" />
                    Default Display Currency
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
                      { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
                      { code: 'GBP', symbol: '£', name: 'Pound (GBP)' },
                      { code: 'JPY', symbol: '¥', name: 'Yen (JPY)' },
                      { code: 'THB', symbol: '฿', name: 'Thai Baht (THB)' },
                      { code: 'SGD', symbol: 'S$', name: 'SGD (Singapore)' },
                      { code: 'AUD', symbol: 'A$', name: 'AUD (Australia)' },
                      { code: 'CNY', symbol: '¥', name: 'Yuan (China)' },
                    ].map((cur) => {
                      const isSelected = selectedCurrency === cur.code;
                      return (
                        <button
                          key={cur.code}
                          type="button"
                          onClick={() => handleCurrencySelect(cur.code as CurrencyCode)}
                          className={cn(
                            'flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs ring-1 ring-primary'
                              : 'border-border/80 bg-card hover:bg-muted/40 text-foreground'
                          )}
                        >
                          <span className="text-base font-bold">{cur.symbol}</span>
                          <span className="text-[11px] truncate w-full mt-0.5">{cur.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Theme Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sun className="h-4 w-4 text-primary" />
                    Interface Appearance
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'system', label: 'System', icon: Laptop },
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = selectedTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleThemeSelect(t.id as 'system' | 'light' | 'dark')}
                          className={cn(
                            'flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all',
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-semibold shadow-2xs'
                              : 'border-border/80 bg-card hover:bg-muted/40 text-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Readiness Checklist */}
                <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-2">
                  <div className="text-xs font-semibold text-foreground">
                    Configuration Summary:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Currency: <strong className="text-foreground">{CURRENCIES[selectedCurrency]?.label || selectedCurrency}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Pacing & Deadlines: <strong className="text-foreground">{notifState.pacingAlerts ? 'Enabled' : 'Disabled'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Scheduled Reminders: <strong className="text-foreground">{notifState.recurringReminders ? 'Enabled' : 'Disabled'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Browser Push: <strong className="text-foreground">{browserPerm === 'granted' ? 'Active' : 'Standard'}</strong></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Footer Actions */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 shrink-0">
          <div>
            {currentStep > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClose(true)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <Button
                size="sm"
                onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
                className="gap-1.5 text-xs font-semibold px-4"
              >
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  handleClose(true);
                  toast.success('Welcome to Savings Goals!', {
                    description: 'Your setup is complete. Start logging and crushing your targets.',
                  });
                }}
                className="gap-1.5 text-xs font-semibold px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                <Check className="h-4 w-4" />
                <span>Get Started</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
