import React, { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Calendar,
  Wallet,
  ArrowUpDown,
  Tag,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import { useGoalsStore } from '@/store/useGoalsStore';
import { formatCurrency } from '@/lib/currencies';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GoalThumbnail } from '@/components/common/GoalThumbnail';
import { TransactionDialog } from '@/features/goals/TransactionDialog';
import { BankCsvImportDialog } from '@/features/activity/BankCsvImportDialog';
import { Goal, TransactionType, Transaction } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type FilterType = 'all' | 'deposit' | 'withdrawal';
type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest';

export function ActivityPage() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext<{
    openCreateGoal?: () => void;
  }>() || {};
  const openCreateGoal = outletCtx.openCreateGoal || (() => {});

  const { goals, transactions, settings, deleteTransaction } = useGoalsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Quick dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<TransactionType>('deposit');
  const [targetGoal, setTargetGoal] = useState<Goal | null>(null);

  const goalMap = useMemo(() => {
    const map = new Map<string, Goal>();
    goals.forEach((g) => map.set(g.id, g));
    return map;
  }, [goals]);

  // Aggregate metrics
  const totalDeposits = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalWithdrawals = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const netBalance = totalDeposits - totalWithdrawals;

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Filter by type
        if (filterType !== 'all' && tx.type !== filterType) {
          return false;
        }
        // Filter by goal
        if (selectedGoalId !== 'all' && tx.goalId !== selectedGoalId) {
          return false;
        }
        // Search by query (goal name or note)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const goalName = goalMap.get(tx.goalId)?.name.toLowerCase() || '';
          const noteText = (tx.note || '').toLowerCase();
          if (!goalName.includes(q) && !noteText.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortOrder === 'oldest') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortOrder === 'highest') {
          return b.amount - a.amount;
        }
        if (sortOrder === 'lowest') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [transactions, filterType, selectedGoalId, searchQuery, sortOrder, goalMap]);

  const handleOpenTransaction = (type: TransactionType) => {
    if (goals.length === 0) {
      toast.info('Please create a savings goal first before logging transactions.');
      openCreateGoal();
      return;
    }
    const defaultG = goals.find((g) => g.id === selectedGoalId) || goals[0];
    setTargetGoal(defaultG);
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleDelete = (tx: Transaction) => {
    deleteTransaction(tx.id);
    toast.success('Transaction deleted');
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.info('No transactions to export.');
      return;
    }

    try {
      const headers = ['ID', 'Date', 'Type', 'Amount', 'Currency', 'Goal Name', 'Goal ID', 'Note'];
      const rows = transactions.map((t) => {
        const goal = goalMap.get(t.goalId);
        return [
          t.id,
          t.date,
          t.type,
          t.amount,
          settings.currency,
          `"${(goal?.name || 'Unknown').replace(/"/g, '""')}"`,
          t.goalId,
          `"${(t.note || '').replace(/"/g, '""')}"`,
        ].join(',');
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `savings-transactions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV export generated successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <History className="h-6 w-6 text-primary" />
            Activity & Transactions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full audit log of all deposits, withdrawals, and balance updates across your goals.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            title="Import bank statement or Excel CSV"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import Bank CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenTransaction('withdrawal')}
            className="gap-1.5 text-amber-600 dark:text-amber-400"
          >
            <ArrowUpRight className="h-4 w-4" />
            Withdrawal
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenTransaction('deposit')}
            className="gap-1.5"
          >
            <ArrowDownLeft className="h-4 w-4" />
            Record Deposit
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Deposits
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              +{formatCurrency(totalDeposits, settings.currency)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {transactions.filter((t) => t.type === 'deposit').length} deposit entries
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Withdrawals
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              -{formatCurrency(totalWithdrawals, settings.currency)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {transactions.filter((t) => t.type === 'withdrawal').length} withdrawal entries
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Net Balance Flow
              </span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(netBalance, settings.currency)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Across all target funds
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Records
              </span>
              <div className="h-8 w-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
                <History className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {transactions.length}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {filteredTransactions.length} matching current filter
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions by note or goal name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filter by Type */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  filterType === 'all'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('deposit')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  filterType === 'deposit'
                    ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Deposits
              </button>
              <button
                type="button"
                onClick={() => setFilterType('withdrawal')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  filterType === 'withdrawal'
                    ? 'bg-background text-amber-600 dark:text-amber-400 shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Withdrawals
              </button>
            </div>

            {/* Filter by Goal */}
            <div className="w-full md:w-52 shrink-0">
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Goals" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">All Goals ({goals.length})</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="w-full md:w-44 shrink-0">
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                <SelectTrigger className="h-9 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest">Highest Amount</SelectItem>
                  <SelectItem value="lowest">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Transaction Records</CardTitle>
            <CardDescription className="text-xs">
              Showing {filteredTransactions.length} of {transactions.length} total entries
            </CardDescription>
          </div>
          {filteredTransactions.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Sorted by {sortOrder}
            </span>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {filteredTransactions.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={History}
                title={transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
                description={
                  transactions.length === 0
                    ? 'Start building your savings by recording deposits into your goals.'
                    : 'Try adjusting your search query or filters to find what you are looking for.'
                }
                actionLabel={transactions.length === 0 ? 'Record First Deposit' : 'Clear Filters'}
                onAction={
                  transactions.length === 0
                    ? () => handleOpenTransaction('deposit')
                    : () => {
                        setSearchQuery('');
                        setFilterType('all');
                        setSelectedGoalId('all');
                      }
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTransactions.map((tx) => {
                const isDeposit = tx.type === 'deposit';
                const goal = goalMap.get(tx.goalId);

                return (
                  <div
                    key={tx.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 -mx-4 px-4 transition-colors rounded-lg"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          isDeposit
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        )}
                      >
                        {isDeposit ? (
                          <ArrowDownLeft className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {goal ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/goals/${goal.id}`)}
                              className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate max-w-xs text-left"
                            >
                              {goal.name}
                            </button>
                          ) : (
                            <span className="font-semibold text-sm text-muted-foreground">
                              (Deleted Goal)
                            </span>
                          )}

                          <span
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-medium',
                              isDeposit
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
                            )}
                          >
                            {isDeposit ? 'Deposit' : 'Withdrawal'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 opacity-70" />
                            {format(parseISO(tx.date), 'EEEE, MMMM d, yyyy')}
                          </span>
                          {tx.note && (
                            <span className="flex items-center gap-1 text-foreground/80 italic">
                              <Tag className="h-3 w-3 opacity-60" />
                              &ldquo;{tx.note}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t border-border/50 sm:border-0">
                      <div className="text-left sm:text-right">
                        <div
                          className={cn(
                            'text-base font-bold tracking-tight',
                            isDeposit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-foreground'
                          )}
                        >
                          {isDeposit ? '+' : '-'}
                          {formatCurrency(tx.amount, settings.currency)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {isDeposit ? 'Added to fund' : 'Withdrawn'}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tx)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete transaction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={targetGoal}
        defaultType={dialogType}
      />

      {/* Bank Statement CSV Import Modal */}
      <BankCsvImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
}
