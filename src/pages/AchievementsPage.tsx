import React, { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Trophy,
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  Lock,
  Target,
  Sprout,
  Rocket,
  Briefcase,
  Zap,
  Coins,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useGoalsStore } from '@/store/useGoalsStore';
import { calculateAchievements, Achievement } from '@/lib/achievements';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AchievementDetailDialog } from '@/features/dashboard/AchievementDetailDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Goal } from '@/types';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  Target,
  Sprout,
  Flame,
  Rocket,
  Trophy,
  Briefcase,
  Zap,
  Award,
  Coins,
};

type StatusFilter = 'all' | 'unlocked' | 'locked';
type CategoryFilter = 'all' | 'starter' | 'habit' | 'progress' | 'achievement' | 'expansion' | 'discipline' | 'mastery';

export function AchievementsPage() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext<{
    openCreateGoal?: () => void;
    onOpenDeposit?: (goalId: string, amount?: number) => void;
  }>() || {};
  const openCreateGoal = outletCtx.openCreateGoal || (() => {});

  const { goals, transactions } = useGoalsStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const achievements = useMemo(() => {
    return calculateAchievements(goals, transactions);
  }, [goals, transactions]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Level determination
  const level = useMemo(() => {
    if (unlockedCount >= 9) return { rank: 'Grandmaster Saver', lvl: 5, color: 'text-amber-500' };
    if (unlockedCount >= 7) return { rank: 'Wealth Strategist', lvl: 4, color: 'text-purple-500' };
    if (unlockedCount >= 4) return { rank: 'Discipline Builder', lvl: 3, color: 'text-blue-500' };
    if (unlockedCount >= 2) return { rank: 'Habit Starter', lvl: 2, color: 'text-emerald-500' };
    return { rank: 'Novice Saver', lvl: 1, color: 'text-muted-foreground' };
  }, [unlockedCount]);

  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      if (statusFilter === 'unlocked' && !a.unlocked) return false;
      if (statusFilter === 'locked' && a.unlocked) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      return true;
    });
  }, [achievements, statusFilter, categoryFilter]);

  const handleCardClick = (ach: Achievement) => {
    setSelectedAchievement(ach);
    setDialogOpen(true);
  };

  const handleAction = (type?: string) => {
    setDialogOpen(false);
    if (type === 'create_goal') {
      openCreateGoal();
    } else if (type === 'deposit') {
      navigate('/activity');
    } else if (type === 'goals') {
      navigate('/goals');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Trophy className="h-6 w-6 text-amber-500" />
            Achievements & Milestones
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Level up your savings journey, complete milestone challenges, and earn prestige badges.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/goals')} className="gap-2">
            <Target className="h-4 w-4" />
            View Goals
          </Button>
          <Button size="sm" onClick={openCreateGoal} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Create New Goal
          </Button>
        </div>
      </div>

      {/* Gamification Level & Progression Banner */}
      <Card className="border-border bg-card shadow-xs overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
                <Trophy className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    Level {level.lvl}
                  </span>
                  <h2 className="text-xl font-bold text-foreground">{level.rank}</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Unlocked {unlockedCount} of {totalCount} total achievements ({progressPercent}%)
                </p>
              </div>
            </div>

            <div className="w-full md:w-72 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Next Tier Progress</span>
                <span className="text-foreground">{unlockedCount} / {totalCount} Badges</span>
              </div>
              <Progress value={progressPercent} className="h-2.5" />
              <p className="text-[11px] text-muted-foreground text-right">
                {totalCount - unlockedCount} more challenge{totalCount - unlockedCount === 1 ? '' : 's'} to unlock
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              statusFilter === 'all'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unlocked')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              statusFilter === 'unlocked'
                ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Unlocked ({unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('locked')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              statusFilter === 'locked'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            In Progress ({totalCount - unlockedCount})
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'starter', label: 'Starter' },
            { id: 'habit', label: 'Habits' },
            { id: 'progress', label: 'Progress' },
            { id: 'achievement', label: 'Milestones' },
            { id: 'discipline', label: 'Discipline' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id as CategoryFilter)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-full border transition-colors shrink-0',
                categoryFilter === cat.id
                  ? 'bg-primary text-primary-foreground border-primary font-medium'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Cards Grid */}
      {filteredAchievements.length === 0 ? (
        <Card className="border-border bg-card shadow-xs py-12">
          <EmptyState
            icon={Trophy}
            title="No achievements in this filter"
            description="Try changing your filters or continue saving to unlock more badges."
            actionLabel="Reset Filters"
            onAction={() => {
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((ach) => {
            const Icon = ICON_MAP[ach.iconName] || Trophy;
            const isUnlocked = ach.unlocked;

            return (
              <div
                key={ach.id}
                onClick={() => handleCardClick(ach)}
                className={cn(
                  'group relative p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between',
                  isUnlocked
                    ? 'border-border bg-card hover:border-primary/50 shadow-xs hover:shadow-sm'
                    : 'border-border/70 bg-card/60 opacity-80 hover:opacity-100 hover:border-border'
                )}
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105 shrink-0',
                        isUnlocked
                          ? 'bg-primary/10 text-primary shadow-xs'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border',
                          ach.tier === 'gold' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
                          ach.tier === 'silver' && 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
                          ach.tier === 'bronze' && 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30'
                        )}
                      >
                        {ach.tierLabel}
                      </span>
                      {isUnlocked ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Lock className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {ach.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                {/* Progress Bar & Footer */}
                <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px] truncate">
                      {isUnlocked ? 'Unlocked' : ach.condition}
                    </span>
                    <span className="font-semibold text-foreground shrink-0 text-[11px]">
                      {ach.progressText}
                    </span>
                  </div>
                  <Progress
                    value={ach.progressPercent}
                    className="h-1.5"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Achievement Detail Dialog */}
      <AchievementDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        achievement={selectedAchievement}
        onAction={handleAction}
      />
    </div>
  );
}
