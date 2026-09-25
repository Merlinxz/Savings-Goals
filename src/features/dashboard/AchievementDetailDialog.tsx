import React from 'react';
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
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Achievement } from '@/lib/achievements';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AchievementDetailDialogProps {
  achievement: Achievement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction?: (actionType?: string) => void;
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

export function AchievementDetailDialog({
  achievement,
  open,
  onOpenChange,
  onAction,
}: AchievementDetailDialogProps) {
  if (!achievement) return null;

  const Icon = ICON_MAP[achievement.iconName] || Award;
  const { theme } = achievement;

  const handleActionClick = () => {
    onOpenChange(false);
    if (onAction && achievement.actionType) {
      onAction(achievement.actionType);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center pb-2">
          {/* Badge Medallion Banner */}
          <div className="mx-auto flex flex-col items-center justify-center pt-2">
            <div
              className={cn(
                'relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-all shadow-md',
                achievement.unlocked
                  ? cn(theme.borderUnlocked, theme.iconBgUnlocked, theme.ringUnlocked, 'ring-4')
                  : 'border-border bg-muted/50 text-muted-foreground opacity-80'
              )}
            >
              <Icon className="h-10 w-10" />

              {/* Status Badge overlay */}
              <div
                className={cn(
                  'absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background shadow-xs text-xs',
                  achievement.unlocked
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted-foreground/30 text-foreground'
                )}
              >
                {achievement.unlocked ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
              </div>
            </div>

            {/* Category & Tier Pills */}
            <div className="flex items-center gap-2 mt-4">
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                  achievement.unlocked
                    ? theme.badgePillUnlocked
                    : 'bg-muted text-muted-foreground border-border'
                )}
              >
                {achievement.categoryLabel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/60">
                {achievement.tierLabel}
              </span>
            </div>

            <DialogTitle className="text-xl font-bold mt-2 text-foreground">
              {achievement.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground max-w-xs text-center mt-1">
              {achievement.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Milestone Condition Card */}
        <div className="space-y-3 py-1">
          <div className="rounded-xl border border-border/80 bg-muted/25 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span>Milestone Condition</span>
            </div>
            <div className="text-sm font-medium text-foreground">
              {achievement.condition}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {achievement.conditionDetail}
            </p>
          </div>

          {/* Progress & Unlock Status */}
          <div
            className={cn(
              'rounded-xl border p-3.5 transition-all space-y-2.5',
              achievement.unlocked
                ? cn('border-emerald-500/30 bg-emerald-500/5')
                : 'border-border/70 bg-card'
            )}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                {achievement.unlocked ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Status: Unlocked</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Status: In Progress</span>
                  </>
                )}
              </span>
              <span className="font-mono font-medium text-foreground">
                {achievement.progressPercent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  achievement.unlocked ? theme.accentBar : 'bg-primary/70'
                )}
                style={{ width: `${achievement.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
              <span>{achievement.progressText}</span>
              {achievement.unlocked && achievement.unlockedAt && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <Calendar className="h-3 w-3" />
                  Unlocked {achievement.unlockedAt}
                </span>
              )}
              {!achievement.unlocked && (
                <span className="text-[11px] text-muted-foreground">
                  {achievement.targetValue - achievement.currentValue} {achievement.unit} needed
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
          <Button
            variant="outline"
            className="w-full sm:w-auto text-xs"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          {!achievement.unlocked && achievement.actionLabel && (
            <Button
              className="w-full sm:w-auto text-xs gap-1.5"
              onClick={handleActionClick}
            >
              <span>{achievement.actionLabel}</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}

          {achievement.unlocked && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium ml-auto">
              <ShieldCheck className="h-4 w-4" />
              <span>Milestone Achieved</span>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
