import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  BarChart3,
  History,
  Trophy,
  Calculator,
  Settings,
  Plus,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onNewGoal: () => void;
}

export function BottomNav({ onNewGoal }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = [
    '/activity',
    '/achievements',
    '/calculator',
    '/settings',
  ].some((path) => location.pathname === path);

  const handleNavigate = (path: string) => {
    setMoreOpen(false);
    navigate(path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md px-2 py-1.5 select-none safe-area-pb">
      <nav className="flex items-center justify-around">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/goals"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          <Target className="h-5 w-5" />
          <span>Goals</span>
        </NavLink>

        {/* Center Quick Add Button */}
        <button
          type="button"
          onClick={onNewGoal}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md -mt-5 active:scale-95 transition-transform shrink-0"
          aria-label="Create new goal"
        >
          <Plus className="h-5 w-5" />
        </button>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          <BarChart3 className="h-5 w-5" />
          <span>Analytics</span>
        </NavLink>

        {/* More Popover Menu for Additional Pages */}
        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors',
                isMoreActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="top"
            className="w-56 p-1.5 mb-2 rounded-xl border-border bg-card shadow-lg"
          >
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNavigate('/activity')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors',
                  location.pathname === '/activity' ? 'bg-primary/10 text-primary' : 'text-foreground'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span>Activity History</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('/achievements')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors',
                  location.pathname === '/achievements' ? 'bg-primary/10 text-primary' : 'text-foreground'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span>Achievements</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('/calculator')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors',
                  location.pathname === '/calculator' ? 'bg-primary/10 text-primary' : 'text-foreground'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span>Financial Toolkit</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('/settings')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors',
                  location.pathname === '/settings' ? 'bg-primary/10 text-primary' : 'text-foreground'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </nav>
    </div>
  );
}
