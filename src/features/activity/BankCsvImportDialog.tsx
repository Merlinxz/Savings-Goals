import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  FileText,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useGoalsStore } from '@/store/useGoalsStore';
import { formatCurrency } from '@/lib/currencies';
import {
  parseCsvText,
  processCsvRows,
  generateSampleBankCsv,
  CsvColumnMapping,
  ParsedCsvRow,
} from '@/lib/csvImporter';
import { cn } from '@/lib/utils';

interface BankCsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BankCsvImportDialog({ open, onOpenChange }: BankCsvImportDialogProps) {
  const { goals, importTransactions, settings } = useGoalsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>({ dateCol: '', amountCol: '' });
  const [defaultGoalId, setDefaultGoalId] = useState<string>(goals[0]?.id || '');
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState<string>('');

  // Reset on close or initial open
  React.useEffect(() => {
    if (open) {
      setStep('upload');
      setCsvContent('');
      setFileName('');
      setHeaders([]);
      setRawRows([]);
      setPastedText('');
      if (goals.length > 0 && !defaultGoalId) {
        setDefaultGoalId(goals[0].id);
      }
    }
  }, [open, goals, defaultGoalId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      handleRawCsvLoaded(content, file.name);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      toast.error('Please paste CSV text first.');
      return;
    }
    handleRawCsvLoaded(pastedText, 'Pasted_Data.csv');
  };

  const handleRawCsvLoaded = (text: string, name: string) => {
    const parsed = parseCsvText(text);
    if (parsed.headers.length === 0 || parsed.rawRows.length === 0) {
      toast.error('Could not detect any valid data rows or headers in this CSV.');
      return;
    }

    setCsvContent(text);
    setFileName(name);
    setHeaders(parsed.headers);
    setRawRows(parsed.rawRows);
    setMapping(parsed.detectedMapping);
    setStep('map');
    toast.success(`Loaded ${parsed.rawRows.length} rows with ${parsed.headers.length} columns.`);
  };

  const parsedRows: ParsedCsvRow[] = React.useMemo(() => {
    if (rawRows.length === 0) return [];
    return processCsvRows(rawRows, mapping, defaultGoalId, goals);
  }, [rawRows, mapping, defaultGoalId, goals]);

  const validRows = parsedRows.filter((r) => r.status !== 'invalid');
  const totalDeposits = validRows
    .filter((r) => r.type === 'deposit')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalWithdrawals = validRows
    .filter((r) => r.type === 'withdrawal')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleExecuteImport = () => {
    if (validRows.length === 0) {
      toast.error('No valid transactions to import.');
      return;
    }

    const itemsToImport = validRows.map((r) => ({
      goalId: r.matchedGoalId || defaultGoalId,
      type: r.type,
      amount: r.amount,
      note: r.note,
      date: r.parsedDate,
    }));

    const res = importTransactions(itemsToImport);
    toast.success(
      `Successfully imported ${res.importedCount} transactions across ${res.updatedGoalsCount} goal${res.updatedGoalsCount === 1 ? '' : 's'}!`
    );
    onOpenChange(false);
  };

  const handleDownloadSample = () => {
    const sample = generateSampleBankCsv(goals.map((g) => g.name));
    const blob = new Blob(['\uFEFF' + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_bank_statement.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded sample bank statement CSV template.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Import Bank & Excel CSV Statements
              </DialogTitle>
              <DialogDescription className="text-xs">
                Upload your bank statement or Excel export to automatically generate savings deposits and withdrawals.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between border-y border-border/70 py-2.5 my-1 text-xs">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                'flex items-center gap-1.5 font-medium transition-colors',
                step === 'upload' ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                1
              </span>
              Upload File
            </span>
            <span className="text-muted-foreground/40">/</span>
            <span
              className={cn(
                'flex items-center gap-1.5 font-medium transition-colors',
                step === 'map' ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                2
              </span>
              Map Columns
            </span>
            <span className="text-muted-foreground/40">/</span>
            <span
              className={cn(
                'flex items-center gap-1.5 font-medium transition-colors',
                step === 'preview' ? 'text-primary font-semibold' : 'text-muted-foreground'
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                3
              </span>
              Preview & Import
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDownloadSample}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            Sample CSV Template
          </Button>
        </div>

        {/* Modal Body Container with Scroll */}
        <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-4">
          {/* STEP 1: UPLOAD OR PASTE */}
          {step === 'upload' && (
            <div className="space-y-4">
              <Tabs
                value={inputMode}
                onValueChange={(v) => setInputMode(v as 'file' | 'paste')}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 h-9">
                  <TabsTrigger value="file" className="text-xs">
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Upload CSV File (.csv, .txt)
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="text-xs">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Paste CSV Data
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="pt-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-card hover:bg-muted/30 flex flex-col items-center justify-center gap-3"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .txt, text/csv, text/plain"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Click to select bank statement CSV file
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports Thai Banks (KBank, SCB, KKP, BBL), Global Banks, and Excel spreadsheets
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="paste" className="pt-3 space-y-2">
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Date,Type,Amount,Goal,Description&#10;2026-09-15,Deposit,500,Emergency Reserve,Monthly paycheck transfer&#10;2026-09-18,Withdrawal,45,Japan Trip,Ticket advance"
                    className="w-full h-40 p-3 text-xs font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    type="button"
                    onClick={handlePasteSubmit}
                    disabled={!pastedText.trim()}
                    className="w-full gap-2 h-9 text-xs"
                  >
                    Parse Pasted CSV
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Helpful Format Info */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Smart Bank Format Compatibility:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-[11px]">
                  <li>
                    <strong>Dates:</strong> Supports ISO (2026-09-15), Thai Buddhist calendar years (2569), DD/MM/YYYY, or MM/DD/YYYY.
                  </li>
                  <li>
                    <strong>Amounts:</strong> Handles clean numbers or formatted currency symbols (฿, $, €, commas).
                  </li>
                  <li>
                    <strong>Types:</strong> Automatically maps Debit/Credit, Outflow/Inflow, or positive/negative amounts to deposits & withdrawals.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: MAP COLUMNS */}
          {step === 'map' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border border-border/60 text-xs">
                <div>
                  <span className="font-semibold text-foreground">{fileName}</span>
                  <span className="text-muted-foreground ml-2">
                    ({rawRows.length} rows found)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('upload')}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Pick Another File
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirm Column Mapping
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Date Column */}
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Date Column *</label>
                    <Select
                      value={mapping.dateCol}
                      onValueChange={(v) => setMapping((m) => ({ ...m, dateCol: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Date column" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h} className="text-xs">
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount Column */}
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Amount Column *</label>
                    <Select
                      value={mapping.amountCol}
                      onValueChange={(v) => setMapping((m) => ({ ...m, amountCol: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Amount column" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h} className="text-xs">
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type Column (Optional) */}
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">
                      Type / Activity Column (Optional)
                    </label>
                    <Select
                      value={mapping.typeCol || 'none'}
                      onValueChange={(v) =>
                        setMapping((m) => ({ ...m, typeCol: v === 'none' ? undefined : v }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Infer from amount (+ / -)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">
                          None (Infer: Positive = Deposit, Negative = Withdrawal)
                        </SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h} className="text-xs">
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Goal Column (Optional) */}
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">
                      Goal Target Column (Optional)
                    </label>
                    <Select
                      value={mapping.goalCol || 'none'}
                      onValueChange={(v) =>
                        setMapping((m) => ({ ...m, goalCol: v === 'none' ? undefined : v }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Match by name or use default goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">
                          None (Assign to default goal below)
                        </SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h} className="text-xs">
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Note / Description Column (Optional) */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-medium text-foreground">
                      Description / Memo Column (Optional)
                    </label>
                    <Select
                      value={mapping.noteCol || 'none'}
                      onValueChange={(v) =>
                        setMapping((m) => ({ ...m, noteCol: v === 'none' ? undefined : v }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select description column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">
                          None
                        </SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h} className="text-xs">
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Default Goal Selector */}
                <div className="pt-2 border-t border-border/60">
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Default Savings Goal Target (for unassigned or unmatched rows)
                  </label>
                  <Select value={defaultGoalId} onValueChange={setDefaultGoalId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select default goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {goals.map((g) => (
                        <SelectItem key={g.id} value={g.id} className="text-xs">
                          {g.name} ({formatCurrency(g.currentAmount, settings.currency)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & CONFIRM */}
          {step === 'preview' && (
            <div className="space-y-3.5">
              {/* Aggregate preview banner */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl border border-border/80 bg-muted/25 text-center text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Valid Entries</span>
                  <span className="text-base font-bold text-foreground">
                    {validRows.length}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      / {parsedRows.length}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-emerald-700 dark:text-emerald-400 block text-[11px] font-medium">
                    Total Deposits
                  </span>
                  <span className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                    +{formatCurrency(totalDeposits, settings.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-rose-700 dark:text-rose-400 block text-[11px] font-medium">
                    Total Withdrawals
                  </span>
                  <span className="text-base font-bold text-rose-800 dark:text-rose-300">
                    -{formatCurrency(totalWithdrawals, settings.currency)}
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-border/80 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/70 text-muted-foreground uppercase text-[10px] tracking-wider sticky top-0 backdrop-blur-xs">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Target Goal</th>
                      <th className="p-2.5">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={cn(
                          'hover:bg-muted/30 transition-colors',
                          row.status === 'invalid' && 'bg-destructive/5 text-muted-foreground'
                        )}
                      >
                        <td className="p-2.5 whitespace-nowrap">
                          {row.status === 'valid' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Ready
                            </span>
                          ) : row.status === 'warning' ? (
                            <span
                              className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-[11px]"
                              title={row.message}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Adjusted
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-destructive font-medium text-[11px]"
                              title={row.message}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Skipped
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono whitespace-nowrap">{row.parsedDate}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                              row.type === 'deposit'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            )}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-semibold whitespace-nowrap">
                          {row.type === 'deposit' ? '+' : '-'}
                          {formatCurrency(row.amount, settings.currency)}
                        </td>
                        <td className="p-2.5 font-medium max-w-[140px] truncate">
                          {row.matchedGoalName || 'None'}
                        </td>
                        <td className="p-2.5 text-muted-foreground max-w-[180px] truncate">
                          {row.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <DialogFooter className="pt-3 border-t border-border/70 flex items-center justify-between sm:justify-between">
          <div>
            {step !== 'upload' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(step === 'preview' ? 'map' : 'upload')}
                className="h-9 text-xs"
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>

            {step === 'map' && (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep('preview')}
                disabled={!mapping.dateCol || (!mapping.amountCol && !mapping.creditCol)}
                className="h-9 text-xs gap-1.5"
              >
                Continue to Preview
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {step === 'preview' && (
              <Button
                type="button"
                size="sm"
                onClick={handleExecuteImport}
                disabled={validRows.length === 0}
                className="h-9 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
              >
                <CheckCircle2 className="h-4 w-4" />
                Import {validRows.length} Transactions
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
