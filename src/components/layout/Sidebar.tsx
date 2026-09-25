import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  BarChart3,
  History,
  Trophy,
  Calculator,
  Settings,
  Plus,
  Sparkles,
  PiggyBank,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onNewGoal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ onNewGoal, isCollapsed, onToggleCollapse }: SidebarProps) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/goals', label: 'Goals', icon: Target, end: false },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, end: false },
    { to: '/activity', label: 'Activity', icon: History, end: false },
    { to: '/achievements', label: 'Achievements', icon: Trophy, end: false },
    { to: '/calculator', label: 'Financial Toolkit', icon: Calculator, end: false },
    { to: '/settings', label: 'Settings', icon: Settings, end: false },
  ];

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border bg-card shrink-0 select-none transition-all duration-200 ease-in-out shadow-xs',
        isCollapsed ? 'w-18 p-3' : 'w-64 p-5'
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'flex items-center mb-6',
          isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between px-1'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
            <PiggyBank className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight text-foreground leading-none truncate">
                Savings Goals
              </h1>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">
                Personal target tracker
              </p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Primary Action: New Goal */}
      <div className="mb-6">
        <Button
          onClick={onNewGoal}
          className={cn(
            'justify-center font-medium shadow-xs transition-all',
            isCollapsed ? 'w-full h-10 px-0' : 'w-full gap-2'
          )}
          title="Create Goal"
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Create Goal</span>}
        </Button>
      </div>

      {/* Navigation links */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg text-sm font-medium transition-colors',
                isCollapsed
                  ? 'justify-center h-10 w-full px-0'
                  : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer info: Local storage badge */}
      {!isCollapsed ? (
        <div className="p-3 rounded-xl border border-border/60 bg-background/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Local Storage</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            All savings records stay private on your device.
          </p>
        </div>
      ) : (
        <div
          className="flex justify-center p-2 rounded-lg border border-border/60 bg-background/60 text-muted-foreground"
          title="Local Private Storage - No cloud tracking"
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      )}
    </aside>
  );
}
