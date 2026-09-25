import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  PieChart,
  Target,
  ArrowRight,
  TrendingUp,
  FolderTree,
  Award,
  Sparkles,
} from 'lucide-react';
import { Goal, GoalCategory } from '@/types';
import { formatCurrency, formatCompactCurrency } from '@/lib/currencies';
import { CATEGORY_CONFIG } from '@/lib/categories';
import { useGoalsStore } from '@/store/useGoalsStore';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CategoryDistributionWidgetProps {
  goals: Goal[];
  className?: string;
  onOpenCreateGoal?: () => void;
}

interface CategoryStats {
  category: GoalCategory;
  label: string;
  color: string;
  iconName: string;
  totalSaved: number;
  totalTarget: number;
  goalCount: number;
  percentageOfTotal: number;
  progressRatio: number; // saved / target * 100
  tags: string[];
}

export function CategoryDistributionWidget({
  goals,
  className,
  onOpenCreateGoal,
}: CategoryDistributionWidgetProps) {
  const navigate = useNavigate();
  const { settings, setFilterCategory } = useGoalsStore();
  const [metricMode, setMetricMode] = useState<'saved' | 'target'>('saved');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Overall totals
  const overallSaved = useMemo(() => {
    return goals.reduce((acc, g) => acc + (g.currentAmount || 0), 0);
  }, [goals]);

  const overallTarget = useMemo(() => {
    return goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);
  }, [goals]);

  // Aggregate by category
  const categoryStatsList = useMemo<CategoryStats[]>(() => {
    if (goals.length === 0) return [];

    const map = new Map<
      GoalCategory,
      {
        totalSaved: number;
        totalTarget: number;
        goalCount: number;
        tags: Set<string>;
      }
    >();

    goals.forEach((goal) => {
      const existing = map.get(goal.category) || {
        totalSaved: 0,
        totalTarget: 0,
        goalCount: 0,
        tags: new Set<string>(),
      };

      existing.totalSaved += goal.currentAmount || 0;
      existing.totalTarget += goal.targetAmount || 0;
      existing.goalCount += 1;
      if (goal.tags) {
        goal.tags.forEach((t) => existing.tags.add(t));
      }

      map.set(goal.category, existing);
    });

    const baseSum = metricMode === 'saved' ? overallSaved : overallTarget;

    const list: CategoryStats[] = Array.from(map.entries()).map(
      ([cat, data]) => {
        const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Other'];
        const val = metricMode === 'saved' ? data.totalSaved : data.totalTarget;
        const percentage = baseSum > 0 ? (val / baseSum) * 100 : 0;
        const progressRatio =
          data.totalTarget > 0 ? Math.min((data.totalSaved / data.totalTarget) * 100, 100) : 0;

        return {
          category: cat,
          label: config.label,
          color: config.color,
          iconName: config.iconName,
          totalSaved: data.totalSaved,
          totalTarget: data.totalTarget,
          goalCount: data.goalCount,
          percentageOfTotal: percentage,
          progressRatio,
          tags: Array.from(data.tags).slice(0, 4),
        };
      }
    );

    // Sort descending by selected metric mode
    return list.sort((a, b) =>
      metricMode === 'saved'
        ? b.totalSaved - a.totalSaved
        : b.totalTarget - a.totalTarget
    );
  }, [goals, metricMode, overallSaved, overallTarget]);

  // Data formatted for Recharts Pie
  const chartData = useMemo(() => {
    return categoryStatsList
      .filter((item) => (metricMode === 'saved' ? item.totalSaved > 0 : item.totalTarget > 0))
      .map((item) => ({
        name: item.category,
        value: metricMode === 'saved' ? item.totalSaved : item.totalTarget,
        color: item.color,
        stats: item,
      }));
  }, [categoryStatsList, metricMode]);

  // Highlights
  const topCategory = categoryStatsList[0];
  const mostFundedCategory = useMemo(() => {
    if (categoryStatsList.length === 0) return null;
    return [...categoryStatsList].sort((a, b) => b.progressRatio - a.progressRatio)[0];
  }, [categoryStatsList]);

  // Currently active item for center text in donut chart
  const activeItem = useMemo(() => {
    if (hoveredCategory) {
      return categoryStatsList.find((c) => c.category === hoveredCategory) || null;
    }
    return null;
  }, [hoveredCategory, categoryStatsList]);

  const handleCategoryClick = (cat: GoalCategory) => {
    setFilterCategory(cat);
    navigate(`/goals?category=${encodeURIComponent(cat)}`);
  };

  if (goals.length === 0) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <div className="flex flex-col items-center justify-center py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <PieChart className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Category Distribution Summary
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Establish goals across categories such as Emergency, Travel, and Education to view portfolio distribution insights.
          </p>
          {onOpenCreateGoal && (
            <Button onClick={onOpenCreateGoal} size="sm" className="mt-4 gap-1.5 text-xs">
              <Target className="h-3.5 w-3.5" />
              Create First Goal
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('flex flex-col justify-between overflow-hidden', className)}>
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderTree className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">
                Savings Distribution by Category
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Portfolio allocation, accumulated balances, and completion pacing across categories
            </CardDescription>
          </div>

          {/* Metric Selector Toggle */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMetricMode('saved')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                metricMode === 'saved'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Current Saved ({formatCompactCurrency(overallSaved, settings.currency)})
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('target')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                metricMode === 'target'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Target Allocation ({formatCompactCurrency(overallTarget, settings.currency)})
            </button>
          </div>
        </div>

        {/* Quick Highlights Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
          <div className="rounded-lg bg-muted/30 border border-border/50 p-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Active Categories
            </span>
            <div className="text-base font-bold text-foreground mt-0.5">
              {categoryStatsList.length} Categories
            </div>
            <span className="text-[11px] text-muted-foreground">
              Across {goals.length} active goals
            </span>
          </div>

          <div className="rounded-lg bg-muted/30 border border-border/50 p-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Portfolio Total
            </span>
            <div className="text-base font-bold text-foreground mt-0.5">
              {formatCurrency(overallSaved, settings.currency)}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Of {formatCurrency(overallTarget, settings.currency)} target
            </span>
          </div>

          {topCategory && (
            <div className="rounded-lg bg-muted/30 border border-border/50 p-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Top Category
              </span>
              <div className="text-base font-bold text-foreground mt-0.5 truncate" title={topCategory.label}>
                {topCategory.label}
              </div>
              <span className="text-[11px] font-medium" style={{ color: topCategory.color }}>
                {topCategory.percentageOfTotal.toFixed(1)}% of total portfolio
              </span>
            </div>
          )}

          {mostFundedCategory && (
            <div className="rounded-lg bg-muted/30 border border-border/50 p-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Highest Funded
              </span>
              <div className="text-base font-bold text-foreground mt-0.5 truncate" title={mostFundedCategory.label}>
                {mostFundedCategory.label}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {mostFundedCategory.progressRatio.toFixed(1)}% goal target reached
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left / Donut Chart Column (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="h-60 w-full relative flex items-center justify-center">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={96}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => {
                        const item = chartData[index];
                        if (item) setHoveredCategory(item.name);
                      }}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={(data) => {
                        if (data && data.name) {
                          handleCategoryClick(data.name as GoalCategory);
                        }
                      }}
                      cursor="pointer"
                      animationDuration={600}
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={entry.color}
                          stroke="hsl(var(--card))"
                          strokeWidth={2}
                          className="transition-opacity duration-200 hover:opacity-85"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload.stats as CategoryStats;
                        const config = CATEGORY_CONFIG[data.category];
                        const IconComponent = config?.icon || FolderTree;

                        return (
                          <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-md backdrop-blur-xs text-xs space-y-1.5 min-w-[200px]">
                            <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                              <div
                                className="flex h-5 w-5 items-center justify-center rounded-md text-white shrink-0"
                                style={{ backgroundColor: data.color }}
                              >
                                <IconComponent className="h-3 w-3" />
                              </div>
                              <span className="font-semibold text-foreground text-xs truncate">
                                {data.label}
                              </span>
                              <span className="ml-auto text-[10px] text-muted-foreground font-medium">
                                {data.goalCount} {data.goalCount === 1 ? 'goal' : 'goals'}
                              </span>
                            </div>

                            <div className="flex justify-between items-center pt-0.5">
                              <span className="text-muted-foreground">
                                {metricMode === 'saved' ? 'Saved Balance:' : 'Target Amount:'}
                              </span>
                              <span className="font-bold text-foreground">
                                {formatCurrency(
                                  metricMode === 'saved' ? data.totalSaved : data.totalTarget,
                                  settings.currency
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Portfolio Share:</span>
                              <span className="font-semibold text-primary">
                                {data.percentageOfTotal.toFixed(1)}%
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Category Target:</span>
                              <span className="text-foreground">
                                {formatCurrency(data.totalTarget, settings.currency)}
                              </span>
                            </div>

                            <div className="pt-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                <span>Completion</span>
                                <span>{data.progressRatio.toFixed(1)}%</span>
                              </div>
                              <Progress value={data.progressRatio} className="h-1.5" />
                            </div>
                          </div>
                        );
                      }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground text-xs">
                  <span>No data in this view mode</span>
                </div>
              )}

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate max-w-[120px]">
                  {activeItem ? activeItem.label : metricMode === 'saved' ? 'Total Saved' : 'Total Target'}
                </span>
                <span className="text-lg font-bold text-foreground tracking-tight leading-tight mt-0.5">
                  {activeItem
                    ? formatCompactCurrency(
                        metricMode === 'saved' ? activeItem.totalSaved : activeItem.totalTarget,
                        settings.currency
                      )
                    : formatCompactCurrency(
                        metricMode === 'saved' ? overallSaved : overallTarget,
                        settings.currency
                      )}
                </span>
                <span className="text-[10px] font-medium text-primary mt-0.5">
                  {activeItem
                    ? `${activeItem.percentageOfTotal.toFixed(1)}% share`
                    : `${categoryStatsList.length} Categories`}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center mt-1">
              Hover over or tap any segment to view detailed category allocation
            </p>
          </div>

          {/* Right / Category Breakdown List (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Category Breakdown ({categoryStatsList.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/goals')}
                className="text-xs h-7 gap-1 text-primary hover:text-primary px-2"
              >
                <span>View All Goals</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {categoryStatsList.map((stat) => {
                const config = CATEGORY_CONFIG[stat.category] || CATEGORY_CONFIG['Other'];
                const IconComponent = config.icon;
                const isHovered = hoveredCategory === stat.category;

                return (
                  <div
                    key={stat.category}
                    onClick={() => handleCategoryClick(stat.category)}
                    onMouseEnter={() => setHoveredCategory(stat.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={cn(
                      'group flex flex-col p-3 rounded-xl border transition-all cursor-pointer',
                      isHovered
                        ? 'border-primary/50 bg-primary/5 shadow-xs'
                        : 'border-border/70 bg-card hover:border-border hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-white shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: stat.color }}
                        >
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                              {stat.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                              ({stat.goalCount} {stat.goalCount === 1 ? 'goal' : 'goals'})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Amounts & Percentage Badge */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs font-bold text-foreground">
                            {formatCurrency(stat.totalSaved, settings.currency)}
                          </span>
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              backgroundColor: `${stat.color}15`,
                              color: stat.color,
                            }}
                          >
                            {stat.percentageOfTotal.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          of {formatCurrency(stat.totalTarget, settings.currency)} target
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Funded Progress</span>
                        <span className="font-semibold text-foreground">
                          {stat.progressRatio.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={stat.progressRatio}
                        indicatorColor={stat.color}
                        className="h-1.5"
                        delay={0.05}
                      />
                    </div>

                    {/* Associated Tags row if any */}
                    {stat.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 pt-1 border-t border-border/40 overflow-hidden">
                        <span className="text-[10px] text-muted-foreground shrink-0 mr-1">Tags:</span>
                        <div className="flex items-center gap-1 overflow-hidden">
                          {stat.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground font-medium truncate max-w-[90px]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
