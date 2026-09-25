import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Check,
  Loader2,
  FileText,
  Database,
  Calendar,
  Layers,
  ArrowDownToLine,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useGoalsStore } from '@/store/useGoalsStore';
import { calculateGoalMetrics } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ExportDataCard() {
  const { goals, transactions, settings } = useGoalsStore();
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [lastExported, setLastExported] = useState<string | null>(null);

  // Helper to trigger browser file download with UTF-8 BOM
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    // \uFEFF is the UTF-8 Byte Order Mark (BOM) to ensure Microsoft Excel and other
    // spreadsheet applications properly detect UTF-8 encoding for accents and symbols.
    const blob = new Blob(['\uFEFF' + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sanitizeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // 1. Export Combined All-in-One CSV
  const handleExportCompleteCsv = async () => {
    if (goals.length === 0 && transactions.length === 0) {
      toast.error('No savings data available to export.');
      return;
    }

    setExportingType('complete');
    try {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const goalMap = new Map<string, string>();
      goals.forEach((g) => goalMap.set(g.id, g.name));

      const lines: string[] = [];

      // Metadata comments
      lines.push(`# Savings Goals & Financial History Export`);
      lines.push(`# Exported On: ${new Date().toISOString()}`);
      lines.push(`# Currency: ${settings.currency}`);
      lines.push(`# Total Goals: ${goals.length}`);
      lines.push(`# Total Transactions: ${transactions.length}`);
      lines.push('');

      // Section 1: Goals Progress Summary
      lines.push('# SECTION 1: SAVINGS GOALS PROGRESS SUMMARY');
      const goalHeaders = [
        'Goal Name',
        'Category',
        'Target Amount',
        'Current Amount',
        'Progress (%)',
        'Remaining Amount',
        'Tracking Status',
        'Target Deadline',
        'Monthly Target',
        'Recurring Contribution',
        'Created Date',
        'Goal ID',
      ];
      lines.push(goalHeaders.map(sanitizeCell).join(','));

      goals.forEach((g) => {
        const metrics = calculateGoalMetrics(g);
        const recurring = g.recurringContribution?.enabled
          ? `${g.recurringContribution.amount} (${g.recurringContribution.frequency})`
          : 'None';

        lines.push(
          [
            sanitizeCell(g.name),
            sanitizeCell(g.category),
            g.targetAmount.toFixed(2),
            g.currentAmount.toFixed(2),
            metrics.percentage.toString(),
            Math.max(0, g.targetAmount - g.currentAmount).toFixed(2),
            sanitizeCell(metrics.status),
            sanitizeCell(g.deadline || 'No deadline'),
            metrics.monthlyRequired.toFixed(2),
            sanitizeCell(recurring),
            sanitizeCell(g.createdAt),
            sanitizeCell(g.id),
          ].join(',')
        );
      });

      lines.push('');
      // Section 2: Transaction History Ledger
      lines.push('# SECTION 2: SAVINGS TRANSACTION HISTORY');
      const txHeaders = [
        'Date',
        'Goal Name',
        'Type',
        'Amount',
        'Currency',
        'Note / Memo',
        'Transaction ID',
        'Goal ID',
      ];
      lines.push(txHeaders.map(sanitizeCell).join(','));

      // Sort transactions chronologically ascending
      const sortedTxs = [...transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      sortedTxs.forEach((t) => {
        const goalName = goalMap.get(t.goalId) || 'Unknown Goal';
        lines.push(
          [
            sanitizeCell(t.date),
            sanitizeCell(goalName),
            sanitizeCell(t.type === 'deposit' ? 'Deposit' : 'Withdrawal'),
            t.amount.toFixed(2),
            sanitizeCell(settings.currency),
            sanitizeCell(t.note || ''),
            sanitizeCell(t.id),
            sanitizeCell(t.goalId),
          ].join(',')
        );
      });

      const filename = `savings-full-report-${dateStr}.csv`;
      triggerDownload(lines.join('\r\n'), filename, 'text/csv;charset=utf-8;');
      setLastExported('complete');
      toast.success('Complete savings report exported as CSV.', {
        description: `Downloaded ${filename} (${goals.length} goals, ${transactions.length} transactions)`,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV. Please try again.');
    } finally {
      setTimeout(() => setExportingType(null), 600);
    }
  };

  // 2. Export Goal Progress Only (Strict 2D Table CSV for Spreadsheets)
  const handleExportGoalsCsv = async () => {
    if (goals.length === 0) {
      toast.error('No savings goals available to export.');
      return;
    }

    setExportingType('goals');
    try {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const headers = [
        'Goal Name',
        'Category',
        'Target Amount',
        'Current Amount',
        'Progress (%)',
        'Remaining Amount',
        'Status',
        'Target Deadline',
        'Monthly Required',
        'Recurring Contribution',
        'Created Date',
        'Goal ID',
      ];

      const rows = goals.map((g) => {
        const metrics = calculateGoalMetrics(g);
        const recurring = g.recurringContribution?.enabled
          ? `${g.recurringContribution.amount} (${g.recurringContribution.frequency})`
          : 'None';

        return [
          sanitizeCell(g.name),
          sanitizeCell(g.category),
          g.targetAmount.toFixed(2),
          g.currentAmount.toFixed(2),
          metrics.percentage.toString(),
          Math.max(0, g.targetAmount - g.currentAmount).toFixed(2),
          sanitizeCell(metrics.status),
          sanitizeCell(g.deadline || 'No deadline'),
          metrics.monthlyRequired.toFixed(2),
          sanitizeCell(recurring),
          sanitizeCell(g.createdAt),
          sanitizeCell(g.id),
        ].join(',');
      });

      const csvContent = [headers.map(sanitizeCell).join(','), ...rows].join('\r\n');
      const filename = `savings-goal-progress-${dateStr}.csv`;
      triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
      setLastExported('goals');
      toast.success('Goal progress CSV downloaded successfully.', {
        description: `Exported ${goals.length} savings goal${goals.length === 1 ? '' : 's'}.`,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Goal Progress CSV.');
    } finally {
      setTimeout(() => setExportingType(null), 600);
    }
  };

  // 3. Export Transaction History Only (Strict 2D Table CSV for Spreadsheets)
  const handleExportTransactionsCsv = async () => {
    if (transactions.length === 0) {
      toast.error('No transactions available to export.');
      return;
    }

    setExportingType('transactions');
    try {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const goalMap = new Map<string, string>();
      goals.forEach((g) => goalMap.set(g.id, g.name));

      const headers = [
        'Date',
        'Goal Name',
        'Transaction Type',
        'Amount',
        'Currency',
        'Note / Description',
        'Transaction ID',
        'Goal ID',
      ];

      const sortedTxs = [...transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const rows = sortedTxs.map((t) => [
        sanitizeCell(t.date),
        sanitizeCell(goalMap.get(t.goalId) || 'Unknown Goal'),
        sanitizeCell(t.type === 'deposit' ? 'Deposit' : 'Withdrawal'),
        t.amount.toFixed(2),
        sanitizeCell(settings.currency),
        sanitizeCell(t.note || ''),
        sanitizeCell(t.id),
        sanitizeCell(t.goalId),
      ]);

      const csvContent = [
        headers.map(sanitizeCell).join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\r\n');

      const filename = `savings-transaction-history-${dateStr}.csv`;
      triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
      setLastExported('transactions');
      toast.success('Savings history CSV downloaded successfully.', {
        description: `Exported ${transactions.length} transaction record${transactions.length === 1 ? '' : 's'}.`,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Savings History CSV.');
    } finally {
      setTimeout(() => setExportingType(null), 600);
    }
  };

  // 4. Raw JSON System Backup
  const handleExportJson = () => {
    setExportingType('json');
    try {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        app: 'Savings Goals Tracker',
        settings,
        goals,
        transactions,
      };

      const filename = `savings-backup-${dateStr}.json`;
      triggerDownload(
        JSON.stringify(backupData, null, 2),
        filename,
        'application/json;charset=utf-8;'
      );
      setLastExported('json');
      toast.success('Full JSON backup downloaded.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export JSON backup.');
    } finally {
      setTimeout(() => setExportingType(null), 600);
    }
  };

  const hasData = goals.length > 0 || transactions.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                Export Data
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Download your complete savings history and goal progress as structured CSV spreadsheets or raw backups.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-muted-foreground text-xs shrink-0 self-start sm:self-auto">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>
              {goals.length} Goal{goals.length === 1 ? '' : 's'} • {transactions.length} Record
              {transactions.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Featured Primary Export: Complete CSV Report */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/25 bg-primary/5 hover:border-primary/40 transition-colors">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-foreground">
                Complete Savings & Goals Report (CSV)
              </h4>
              <span className="text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                Recommended
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Downloads a complete CSV spreadsheet containing both your savings goals progress summary and itemized chronological deposit/withdrawal history. Compatible with Microsoft Excel, Google Sheets, and Apple Numbers.
            </p>
          </div>

          <Button
            variant="default"
            size="sm"
            disabled={!hasData || exportingType === 'complete'}
            className="gap-2 h-9 text-xs font-semibold shrink-0 shadow-xs"
            onClick={handleExportCompleteCsv}
          >
            {exportingType === 'complete' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : lastExported === 'complete' ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span>Downloaded Full CSV</span>
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4" />
                <span>Export Full CSV</span>
              </>
            )}
          </Button>
        </div>

        {/* Granular CSV Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Goal Progress CSV */}
          <div className="flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-border transition-colors space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Goal Progress Summary (CSV)
                </h4>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {goals.length} items
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clean table containing target amounts, current balances, progress percentages, required monthly savings, and target deadlines.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={goals.length === 0 || exportingType === 'goals'}
              className="w-full gap-2 h-8 text-xs justify-center"
              onClick={handleExportGoalsCsv}
            >
              {exportingType === 'goals' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : lastExported === 'goals' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Downloaded Goals CSV</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Goals CSV</span>
                </>
              )}
            </Button>
          </div>

          {/* Transaction History CSV */}
          <div className="flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-border transition-colors space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Savings Transaction History (CSV)
                </h4>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {transactions.length} records
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Itemized transaction ledger with deposit/withdrawal amounts, linked goals, dates, and custom notes.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={transactions.length === 0 || exportingType === 'transactions'}
              className="w-full gap-2 h-8 text-xs justify-center"
              onClick={handleExportTransactionsCsv}
            >
              {exportingType === 'transactions' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : lastExported === 'transactions' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Downloaded History CSV</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Transactions CSV</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* JSON System Backup & Compatibility Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
          <div className="flex items-start sm:items-center gap-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-[11px] text-muted-foreground">
              Exported CSV files include UTF-8 BOM encoding and formatted quotes for direct import into Microsoft Excel, Google Sheets, or Apple Numbers.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={!hasData || exportingType === 'json'}
            className="h-8 text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1.5"
            onClick={handleExportJson}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Download JSON Backup</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
