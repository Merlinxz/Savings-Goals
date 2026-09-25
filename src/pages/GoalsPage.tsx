import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Plus,
  ArrowUpDown,
  X,
  Target,
  RotateCcw,
  Repeat,
  Tag as TagIcon,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

import { useGoalsStore } from '@/store/useGoalsStore';
import { Goal, FilterStatus, SortField, SortOrder, goalCategorySchema, ResolvedTimeHorizon } from '@/types';
import { calculateGoalMetrics } from '@/lib/calculations';
import { GoalCard } from '@/features/goals/GoalCard';
import { GoalListItem } from '@/features/goals/GoalListItem';
import { GoalBucketsView } from '@/features/goals/GoalBucketsView';
import { GoalFormDialog } from '@/features/goals/GoalFormDialog';
import { TagBadge } from '@/components/common/TagBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export function GoalsPage() {
  const outletCtx = useOutletContext<{ openCreateGoal?: () => void }>() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const openCreateGoal = outletCtx.openCreateGoal || (() => setCreateDialogOpen(true));

  const {
    goals,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filterTag,
    setFilterTag,
    sortBy,
    sortOrder,
    setSorting,
    loadSampleData,
  } = useGoalsStore();

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [createBucket, setCreateBucket] = useState<ResolvedTimeHorizon | undefined>(undefined);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync URL query ?tag=... with filterTag
  useEffect(() => {
    const urlTag = searchParams.get('tag');
    if (urlTag) {
      setFilterTag(urlTag);
    }
  }, [searchParams, setFilterTag]);

  // Keyboard shortcut: '/' or 'Cmd+K' to focus search, 'Escape' to clear/blur
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (searchQuery) {
          setSearchQuery('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, setSearchQuery]);

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditDialogOpen(true);
  };

  const categories = useMemo(() => {
    return ['all', ...goalCategorySchema.options];
  }, []);

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    goals.forEach((g) => {
      g.tags?.forEach((t) => {
        map.set(t, (map.get(t) || 0) + 1);
      });
    });
    return map;
  }, [goals]);

  const allTags = useMemo(() => {
    return Array.from(tagCounts.keys()).sort((a, b) => a.localeCompare(b));
  }, [tagCounts]);

  const recurringCount = useMemo(() => {
    return goals.filter(
      (g) => g.recurringContribution?.enabled && g.recurringContribution.amount > 0
    ).length;
  }, [goals]);

  // Compute live count of goals for each status filter
  const statusCounts = useMemo(() => {
    const counts: Record<FilterStatus, number> = {
      all: goals.length,
      on_track: 0,
      urgent: 0,
      behind: 0,
      completed: 0,
    };
    goals.forEach((g) => {
      const m = calculateGoalMetrics(g);
      if (m.status in counts) {
        counts[m.status]++;
      }
    });
    return counts;
  }, [goals]);

  // Filter and sort goals
  const filteredAndSortedGoals = useMemo(() => {
    return goals
      .filter((goal) => {
        // Search filter (name, category, notes, tags)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = goal.name.toLowerCase().includes(q);
          const matchCat = goal.category.toLowerCase().includes(q);
          const matchNote = goal.notes?.toLowerCase().includes(q);
          const matchTags = goal.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchCat && !matchNote && !matchTags) return false;
        }

        // Category filter
        if (filterCategory !== 'all' && goal.category !== filterCategory) {
          return false;
        }

        // Tag filter
        if (filterTag && filterTag !== 'all') {
          if (!goal.tags || !goal.tags.includes(filterTag)) {
            return false;
          }
        }

        // Recurring filter
        if (recurringOnly) {
          if (!goal.recurringContribution?.enabled || goal.recurringContribution.amount <= 0) {
            return false;
          }
        }

        // Status filter
        if (filterStatus !== 'all') {
          const metrics = calculateGoalMetrics(goal);
          if (metrics.status !== filterStatus) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Prioritize goal name matches when searching
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const aStarts = a.name.toLowerCase().startsWith(q);
          const bStarts = b.name.toLowerCase().startsWith(q);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;

          const aNameMatch = a.name.toLowerCase().includes(q);
          const bNameMatch = b.name.toLowerCase().includes(q);
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
        }

        let diff = 0;
        if (sortBy === 'deadline') {
          diff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        } else if (sortBy === 'progress') {
          const pa = a.currentAmount / Math.max(a.targetAmount, 1);
          const pb = b.currentAmount / Math.max(b.targetAmount, 1);
          diff = pa - pb;
        } else if (sortBy === 'amount') {
          diff = a.targetAmount - b.targetAmount;
        } else if (sortBy === 'name') {
          diff = a.name.localeCompare(b.name);
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [goals, searchQuery, filterCategory, filterTag, recurringOnly, filterStatus, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSorting(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterTag('all');
    setFilterStatus('all');
    setRecurringOnly(false);
    setSearchParams({});
    searchInputRef.current?.focus();
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            All Savings Goals
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize, track, and manage your targets with real-time search, filters, and sorting.
          </p>
        </div>
        <Button onClick={openCreateGoal} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Create Goal
        </Button>
      </div>

      {/* Dedicated Search Bar & Control Section */}
      <div className="space-y-3">
        {/* Prominent Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            id="goals-search-bar"
            type="text"
            placeholder="Search savings goals by name (e.g. Japan, Emergency, Down Payment)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 h-11 text-sm bg-card border-border shadow-xs focus-visible:ring-primary/20 rounded-xl transition-all"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-md"
                aria-label="Clear search query"
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted/70 border border-border/80 rounded-md select-none pointer-events-none" title="Press '/' or 'Cmd+K' to search">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Live Search Status Bar */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between px-1 py-0.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Found <strong className="text-foreground font-semibold">{filteredAndSortedGoals.length}</strong>{' '}
                {filteredAndSortedGoals.length === 1 ? 'goal' : 'goals'} matching &ldquo;
                <span className="text-foreground font-medium">{searchQuery.trim()}</span>&rdquo;
              </span>
              {filteredAndSortedGoals.length < goals.length && (
                <span className="text-muted-foreground/70">
                  (filtered from {goals.length} total)
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="text-primary hover:underline font-medium text-xs flex items-center gap-1 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear search
            </button>
          </div>
        )}

        {/* Controls Row: Category, Status, Recurring, Sort & View Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card shadow-xs">
          {/* Filter controls row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Tabs */}
            <Tabs
              value={filterStatus}
              onValueChange={(val) => setFilterStatus(val as FilterStatus)}
              className="h-9"
            >
              <TabsList className="h-9 p-0.5">
                <TabsTrigger value="all" className="text-xs px-2 h-8 gap-1.5">
                  All
                  <span className="text-[10px] text-muted-foreground bg-muted-foreground/10 px-1.5 py-0.2 rounded-full font-medium">
                    {statusCounts.all}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="on_track" className="text-xs px-2 h-8 gap-1.5">
                  On Track
                  <span className="text-[10px] text-sky-700 dark:text-sky-300 bg-sky-500/15 px-1.5 py-0.2 rounded-full font-medium">
                    {statusCounts.on_track}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="urgent" className="text-xs px-2 h-8 gap-1.5">
                  Urgent
                  <span className="text-[10px] text-rose-700 dark:text-rose-300 bg-rose-500/20 px-1.5 py-0.2 rounded-full font-medium">
                    {statusCounts.urgent}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="behind" className="text-xs px-2 h-8 gap-1.5">
                  Behind
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.2 rounded-full font-medium">
                    {statusCounts.behind}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs px-2 h-8 gap-1.5">
                  Done
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-1.5 py-0.2 rounded-full font-medium">
                    {statusCounts.completed}
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Recurring Filter Toggle */}
            <Button
              variant={recurringOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRecurringOnly(!recurringOnly)}
              className={cn(
                'h-9 text-xs gap-1.5 font-normal transition-all',
                recurringOnly
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Filter goals with automated recurring contributions"
            >
              <Repeat className="h-3.5 w-3.5" />
              Recurring
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-medium',
                  recurringOnly
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {recurringCount}
              </span>
            </Button>
          </div>

          {/* Sorting & Layout View Controls */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {/* Sort By Field */}
            <Select
              value={sortBy}
              onValueChange={(field) => setSorting(field as SortField, sortOrder)}
            >
              <SelectTrigger className="w-[125px] h-9 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline" className="text-xs">
                  Deadline
                </SelectItem>
                <SelectItem value="progress" className="text-xs">
                  Progress %
                </SelectItem>
                <SelectItem value="amount" className="text-xs">
                  Target Amount
                </SelectItem>
                <SelectItem value="name" className="text-xs">
                  Goal Name
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Direction Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortOrder}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title={`Sorting ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            {/* Grid / List / Buckets Toggle */}
            <div className="border-l border-border pl-2 flex items-center gap-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'buckets' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() => setViewMode('buckets')}
                title="Time Horizon Buckets View"
              >
                <Layers className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tag Quick-Filter Bar */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 text-xs no-scrollbar">
            <span className="text-xs font-medium text-muted-foreground shrink-0 flex items-center gap-1.5 mr-1">
              <TagIcon className="h-3.5 w-3.5 text-primary/70" />
              Tags:
            </span>
            <button
              type="button"
              onClick={() => {
                setFilterTag('all');
                setSearchParams({});
              }}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 border cursor-pointer',
                filterTag === 'all'
                  ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-semibold'
                  : 'bg-card text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted/60'
              )}
            >
              All Tags ({goals.length})
            </button>
            {allTags.map((tag) => {
              const isSelected = filterTag === tag;
              const count = tagCounts.get(tag) || 0;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setFilterTag('all');
                      setSearchParams({});
                    } else {
                      setFilterTag(tag);
                      setSearchParams({ tag });
                    }
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 border cursor-pointer inline-flex items-center gap-1.5',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-semibold'
                      : 'bg-card text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <span>#{tag}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-medium',
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Goals Results */}
      {filteredAndSortedGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={
            goals.length === 0
              ? 'No goals yet'
              : searchQuery.trim()
              ? `No goals matching "${searchQuery.trim()}"`
              : 'No matching goals found'
          }
          description={
            goals.length === 0
              ? 'Create a savings goal to start tracking target deadlines and progress, or populate the complete test dataset.'
              : searchQuery.trim()
              ? `We couldn't find any goals named or matching "${searchQuery.trim()}". Check for typos or clear your search to see all goals.`
              : 'Try clearing your search query or loosening your category and status filters.'
          }
          actionLabel={
            goals.length === 0
              ? 'Create Goal'
              : searchQuery.trim()
              ? 'Clear Search'
              : 'Reset Filters'
          }
          onAction={
            goals.length === 0
              ? openCreateGoal
              : clearAllFilters
          }
          actionIcon={goals.length === 0 ? Plus : SlidersHorizontal}
          secondaryActionLabel={goals.length === 0 ? 'Load Test Sample Data' : undefined}
          onSecondaryAction={
            goals.length === 0
              ? () => {
                  loadSampleData();
                  toast.success('Loaded 12 comprehensive test goals & 34 transactions!');
                }
              : undefined
          }
          secondaryActionIcon={RotateCcw}
        />
      ) : viewMode === 'buckets' ? (
        <GoalBucketsView
          goals={filteredAndSortedGoals}
          onEdit={handleEditGoal}
          onCreateGoal={(bucket) => {
            setCreateBucket(bucket);
            setCreateDialogOpen(true);
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {filteredAndSortedGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={handleEditGoal} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedGoals.map((goal) => (
            <GoalListItem key={goal.id} goal={goal} onEdit={handleEditGoal} />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <GoalFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        goalToEdit={editingGoal}
      />

      {/* Fallback Create Dialog if triggered locally */}
      <GoalFormDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setCreateBucket(undefined);
        }}
        initialValues={createBucket ? { timeHorizonBucket: createBucket } : undefined}
      />
    </div>
  );
}
