import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '@/lib/theme-provider';
import {
  RotateCcw,
  Trash2,
  Moon,
  Sun,
  Laptop,
  Shield,
  Coins,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';

import { useGoalsStore } from '@/store/useGoalsStore';
import {
  CURRENCIES,
  CURRENCY_REGIONS,
  GROUPED_CURRENCIES,
  formatCurrency,
  formatCompactCurrency,
} from '@/lib/currencies';
import { CurrencyCode } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotificationSettingsCard } from '@/features/settings/NotificationSettingsCard';
import { ExportDataCard } from '@/features/settings/ExportDataCard';
import { BankCsvImportDialog } from '@/features/activity/BankCsvImportDialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const outletCtx = useOutletContext<{ openWelcomeTour?: () => void }>() || {};
  const openWelcomeTour = outletCtx.openWelcomeTour;
  const {
    goals,
    transactions,
    settings,
    updateSettings,
    loadSampleData,
    clearAllData,
  } = useGoalsStore();

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleCurrencyChange = (newCurrency: string) => {
    updateSettings({ currency: newCurrency as CurrencyCode });
    const config = CURRENCIES[newCurrency];
    toast.success(`Currency changed to ${config?.label || newCurrency}`);
  };

  const confirmReset = () => {
    loadSampleData();
    toast.success('Loaded 12 comprehensive test goals & 34 transactions across all categories & scenarios!');
    setResetDialogOpen(false);
  };

  const confirmClear = () => {
    clearAllData();
    toast.success('All goals and transactions cleared.');
    setClearDialogOpen(false);
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Preferences & Data
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure currency formatting, theme appearance, and export or manage local storage.
        </p>
      </div>

      {/* Welcome Tour & Notification Guide Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Welcome & Notification Guide
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review the onboarding walkthrough, notification permissions guide, and default setup.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openWelcomeTour}
            className="text-xs gap-1.5 h-8 shrink-0 self-start sm:self-auto border-primary/40 hover:bg-primary/10"
          >
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            View Welcome Tour
          </Button>
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Preferences</CardTitle>
          <CardDescription className="text-xs">
            Personalize display standards and interface appearance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency Selector */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border/60">
            <div className="space-y-1">
              <h4 className="font-medium text-sm text-foreground">Display Currency</h4>
              <p className="text-xs text-muted-foreground">
                Formatting for targets, balances, recurring plans, and transaction logs
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Preview:</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-muted font-mono font-medium text-foreground">
                  {formatCurrency(25000, settings.currency)}
                </span>
                <span className="text-muted-foreground/60">|</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-muted font-mono text-muted-foreground">
                  {formatCompactCurrency(25000, settings.currency)}
                </span>
              </div>
            </div>
            <div className="w-full sm:w-72">
              <Select value={settings.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="max-h-80 w-72">
                  {CURRENCY_REGIONS.map((region) => {
                    const currenciesInRegion = GROUPED_CURRENCIES[region] || [];
                    if (currenciesInRegion.length === 0) return null;
                    return (
                      <SelectGroup key={region}>
                        <SelectLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5 bg-muted/40">
                          {region}
                        </SelectLabel>
                        {currenciesInRegion.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code} className="text-xs">
                            <span className="font-semibold mr-2 text-foreground">{curr.symbol}</span>
                            <span>{curr.label}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-sm text-foreground">Interface Theme</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Switch between light, dark, or system match
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full sm:w-64">
              {[
                { val: 'light', label: 'Light', icon: Sun },
                { val: 'dark', label: 'Dark', icon: Moon },
                { val: 'system', label: 'System', icon: Laptop },
              ].map(({ val, label, icon: Icon }) => (
                <Button
                  key={val}
                  type="button"
                  variant={theme === val ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5 h-9 text-xs"
                  onClick={() => setTheme(val)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Management */}
      <NotificationSettingsCard />

      {/* Export Data Card */}
      <ExportDataCard />

      {/* Data Management & Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Data Management</CardTitle>
          <CardDescription className="text-xs">
            Reset or purge records saved in this browser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm text-foreground">Import Bank / Excel CSV</h4>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  Auto-Mapping
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Upload bank statements or Excel spreadsheets (Bangkok Bank, KBank, SCB, Chase, or generic CSV).
                Intelligent header recognition maps dates, deposits, withdrawals, and notes directly into your goals.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9 text-xs shrink-0 border-primary/40 text-primary hover:bg-primary/10"
              onClick={() => setImportDialogOpen(true)}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import Statement CSV
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm text-foreground">Load Complete Test Dataset</h4>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  All Features & Statuses
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Populates 14 comprehensive goals across all 10 categories covering every test scenario: 
                <strong> On Track</strong>, <strong>Behind</strong>, <strong>Urgent</strong> (pacing deficit warning), 
                <strong> 100% Completed</strong> (celebration state), <strong>Overdue</strong> (past deadline alert), and 
                <strong> Unfunded (0%)</strong>, plus 40 transactions featuring both <strong>deposits and withdrawals</strong> with notes and timeline records.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9 text-xs shrink-0"
              onClick={() => setResetDialogOpen(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Load Test Data
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-sm text-destructive">Clear All Data</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently purge all goals and history from browser localStorage
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 h-9 text-xs"
              onClick={() => setClearDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Purge All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Architecture Notice */}
      <div className="p-4 rounded-xl border border-border/70 bg-card/40 flex items-start gap-3 text-xs text-muted-foreground">
        <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="font-semibold text-foreground text-xs">Device-Only Privacy Standard</h5>
          <p className="leading-relaxed">
            This application does not load third-party analytics, beacons, or marketing cookies. All target calculations, amounts, and logs remain strictly inside your device's browser memory and local storage.
          </p>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load comprehensive test sample data?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  This will populate 14 diverse test goals and 40 historical transactions designed to exercise all app capabilities:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-foreground/80">
                  <li><strong>Status Testing:</strong> On track, Behind schedule, Urgent pacing alert, 100% Completed, Overdue, and 0% Unfunded</li>
                  <li><strong>Transaction Testing:</strong> Deposits, withdrawals, notes, dates, and monthly/weekly timeline charts</li>
                  <li><strong>Category Coverage:</strong> All 10 categories including Emergency Fund, Travel, Vehicle, Tech, Housing, Education, Investments, Celebrations, Health, and Other</li>
                  <li><strong>Forecasting & Notifications:</strong> Recurring contributions, smart pacing calculations, velocity metrics, and sound alerts</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>
              Load Test Dataset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purge All Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Purge all data permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All active goals, completed milestones, and historical deposits and withdrawals will be removed from this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bank Statement CSV Import Modal */}
      <BankCsvImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
}
