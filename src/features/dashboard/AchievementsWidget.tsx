import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Sprout,
  Flame,
  Rocket,
  Trophy,
  Briefcase,
  Zap,
  Award,
  Coins,
  CheckCircle2,
  Lock,
  Sparkles,
  Info,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Goal, Transaction } from '@/types';
import { calculateAchievements, Achievement } from '@/lib/achievements';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AchievementDetailDialog } from '@/features/dashboard/AchievementDetailDialog';
import { cn } from '@/lib/utils';

interface AchievementsWidgetProps {
  goals: Goal[];
  transactions: Transaction[];
  onOpenDeposit?: (goal?: Goal, amount?: number) => void;
  onOpenCreateGoal?: () => void;
  className?: string;
}

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

type FilterTab = 'all' | 'unlocked' | 'locked';

export function AchievementsWidget({
  goals,
  transactions,
  onOpenDeposit,
  onOpenCreateGoal,
  className,
}: AchievementsWidgetProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const achievements = useMemo(
    () => calculateAchievements(goals, transactions),
    [goals, transactions]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const overallPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const filteredAchievements = useMemo(() => {
    if (filter === 'unlocked') {
      return achievements.filter((a) => a.unlocked);
    }
    if (filter === 'locked') {
      return achievements.filter((a) => !a.unlocked);
    }
    return achievements;
  }, [achievements, filter]);

  const handleCardClick = (item: Achievement) => {
    setSelectedAchievement(item);
    setDialogOpen(true);
  };

  const handleAchievementAction = (actionType?: string) => {
    if (actionType === 'create_goal' && onOpenCreateGoal) {
      onOpenCreateGoal();
    } else if (actionType === 'deposit' && onOpenDeposit) {
      onOpenDeposit();
    } else if (actionType === 'recurring' || actionType === 'goals') {
      navigate('/goals');
    }
  };

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Trophy className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Savings Milestones & Badges
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Earn visually distinct milestone badges by hitting savings targets and establishing healthy habits.
              </CardDescription>
            </div>

            {/* Unlocked Summary Badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted/60 border border-border">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-foreground">
                  {unlockedCount} of {totalCount} Badges Unlocked
                </span>
                <span className="font-mono text-muted-foreground font-normal">
                  ({overallPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Filter Tabs & Quick Instructions */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 flex-wrap">
            <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-muted/50 border border-border/50 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded-md font-medium transition-all',
                  filter === 'all'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All Badges ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unlocked')}
                className={cn(
                  'px-2.5 py-1 rounded-md font-medium transition-all',
                  filter === 'unlocked'
                    ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Unlocked ({unlockedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('locked')}
                className={cn(
                  'px-2.5 py-1 rounded-md font-medium transition-all',
                  filter === 'locked'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                In Progress ({totalCount - unlockedCount})
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1">
              <Info className="h-3 w-3" />
              Click any badge to view milestone requirements
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-1">
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No badges found under this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredAchievements.map((item, index) => {
                const Icon = ICON_MAP[item.iconName] || Award;
                const { theme } = item;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                    whileHover={{ y: -2 }}
                    onClick={() => handleCardClick(item)}
                    className={cn(
                      'relative group p-3.5 rounded-xl border transition-all flex flex-col justify-between text-left cursor-pointer select-none',
                      item.unlocked
                        ? cn(
                            'shadow-2xs',
                            theme.borderUnlocked,
                            theme.bgUnlocked,
                            theme.hoverUnlocked
                          )
                        : 'border-border/70 bg-card hover:border-border hover:bg-muted/30 opacity-85'
                    )}
                  >
                    {/* Top Row: Themed Icon Medallion & Status Pill */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105 shadow-2xs',
                          item.unlocked
                            ? cn(
                                theme.iconBgUnlocked,
                                theme.borderUnlocked,
                                theme.ringUnlocked,
                                'ring-2 ring-offset-1 ring-offset-background'
                              )
                            : 'bg-muted/70 text-muted-foreground border-border/80'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {item.unlocked ? (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border',
                              theme.badgePillUnlocked
                            )}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border/60 px-2 py-0.5 rounded-full">
                            <Lock className="h-2.5 w-2.5 opacity-70" />
                            <span>Locked</span>
                          </span>
                        )}

                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                          {item.tierLabel}
                        </span>
                      </div>
                    </div>

                    {/* Badge Title & Short Description */}
                    <div className="space-y-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        {item.unlocked && (
                          <Sparkles className="h-3 w-3 text-amber-500 shrink-0 opacity-80" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Clear Milestone Condition Box */}
                    <div
                      className={cn(
                        'text-[11px] rounded-lg p-2 mb-2.5 transition-colors border',
                        item.unlocked
                          ? 'bg-background/60 border-border/50 text-foreground'
                          : 'bg-muted/40 border-border/60 text-muted-foreground'
                      )}
                    >
                      <div className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
                        <Target className="h-2.5 w-2.5 text-primary" />
                        Milestone Requirement:
                      </div>
                      <div className="font-medium text-foreground truncate">
                        {item.condition}
                      </div>
                    </div>

                    {/* Bottom Progress Bar or Completion Status */}
                    <div className="pt-2 border-t border-border/40 mt-auto">
                      {item.unlocked ? (
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className={cn('text-xs font-semibold', theme.iconTextUnlocked)}>
                            Achieved
                          </span>
                          {item.unlockedAt ? (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {item.unlockedAt}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              100%
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="truncate">{item.progressText}</span>
                            <span className="font-mono font-semibold text-foreground">
                              {item.progressPercent}%
                            </span>
                          </div>
                          <Progress
                            value={item.progressPercent}
                            className="h-1.5"
                            delay={0.04}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievement Detail Dialog */}
      <AchievementDetailDialog
        achievement={selectedAchievement}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAction={handleAchievementAction}
      />
    </>
  );
}
