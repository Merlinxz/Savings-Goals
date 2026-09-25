import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@/lib/theme-provider';
import {
  Sun,
  Moon,
  Plus,
  PanelLeft,
  Maximize2,
  Minimize2,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoalsStore } from '@/store/useGoalsStore';
import { CURRENCIES, GROUPED_CURRENCIES, CURRENCY_REGIONS } from '@/lib/currencies';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { Goal } from '@/types';
import { PacingAlert } from '@/lib/pacingAlerts';

interface NavbarProps {
  onNewGoal: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onAdjustPlan?: (goal: Goal, alert: PacingAlert) => void;
  onOpenDeposit?: (goalId: string, suggestedAmount?: number) => void;
  onSelectGoal?: (goalId: string) => void;
}

export function Navbar({
  onNewGoal,
  isSidebarCollapsed,
  onToggleSidebar,
  onAdjustPlan,
  onOpenDeposit,
  onSelectGoal,
}: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useGoalsStore();
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // If browser/iframe restricts fullscreen, open in new tab instead
      window.open(window.location.href, '_blank');
    }
  };

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname === '/goals') return 'Savings Goals';
    if (location.pathname.startsWith('/goals/')) return 'Goal Overview';
    if (location.pathname === '/analytics') return 'Analytics & Insights';
    if (location.pathname === '/activity') return 'Activity & Transactions';
    if (location.pathname === '/achievements') return 'Achievements & Milestones';
    if (location.pathname === '/calculator') return 'Savings Calculator';
    if (location.pathname === '/settings') return 'Settings';
    return 'Savings Goals';
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const currentCurrency = CURRENCIES[settings.currency] || CURRENCIES.USD;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Button for Desktop/Tablet */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hidden md:flex h-9 w-9 text-muted-foreground hover:text-foreground"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle Sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Currency Selector */}
        <div className="hidden sm:block">
          <Select
            value={settings.currency}
            onValueChange={(newCode) => {
              updateSettings({ currency: newCode });
              const config = CURRENCIES[newCode];
              toast.success(`Display currency switched to ${config?.label || newCode}`);
            }}
          >
            <SelectTrigger
              className="h-9 px-2.5 gap-1.5 text-xs font-medium border-border/80 bg-muted/40 hover:bg-muted/70 transition-colors w-auto"
              title="Change display currency"
            >
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold text-foreground">{currentCurrency.code}</span>
              <span className="text-muted-foreground">({currentCurrency.symbol})</span>
            </SelectTrigger>
            <SelectContent className="max-h-80 w-64" align="end">
              {CURRENCY_REGIONS.map((region) => {
                const currenciesInRegion = GROUPED_CURRENCIES[region] || [];
                if (currenciesInRegion.length === 0) return null;
                return (
                  <SelectGroup key={region}>
                    <SelectLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5 bg-muted/30">
                      {region}
                    </SelectLabel>
                    {currenciesInRegion.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-xs">
                        <span className="font-semibold mr-1.5 text-foreground">{c.symbol}</span>
                        <span>{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Fullscreen Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4 text-primary" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>

        {/* Open in New Window / Tab (useful when previewing inside iframe) */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.open(window.location.href, '_blank')}
          className="hidden sm:inline-flex h-9 w-9 text-muted-foreground hover:text-foreground"
          title="Open in new window / full tab"
          aria-label="Open in new window"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        {/* Notification Center Popover */}
        <NotificationCenter
          onAdjustPlan={onAdjustPlan || (() => {})}
          onOpenDeposit={onOpenDeposit || (() => {})}
          onSelectGoal={onSelectGoal}
        />

        {/* Theme Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Create Goal action on tablet/desktop */}
        <Button
          onClick={onNewGoal}
          size="sm"
          className="hidden sm:inline-flex items-center gap-1.5 h-9 font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>New Goal</span>
        </Button>
      </div>
    </header>
  );
}
