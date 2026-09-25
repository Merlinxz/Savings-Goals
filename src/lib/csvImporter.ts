import { TransactionType, Goal } from '@/types';
import { parse, isValid, format } from 'date-fns';

export interface CsvColumnMapping {
  dateCol: string;
  amountCol: string;
  typeCol?: string;
  debitCol?: string;
  creditCol?: string;
  goalCol?: string;
  noteCol?: string;
}

export interface ParsedCsvRow {
  rowIndex: number;
  rawDate: string;
  parsedDate: string; // ISO yyyy-MM-dd
  amount: number;
  type: TransactionType;
  note: string;
  matchedGoalId?: string;
  matchedGoalName?: string;
  status: 'valid' | 'warning' | 'invalid';
  message?: string;
  rawRow: Record<string, string>;
}

export interface CsvParseResult {
  headers: string[];
  rawRows: Record<string, string>[];
  detectedMapping: CsvColumnMapping;
  delimiter: string;
}

/**
 * Detect delimiter (comma, semicolon, or tab)
 */
export function detectDelimiter(text: string): string {
  const firstLines = text.split(/\r?\n/).slice(0, 5).join('\n');
  const commaCount = (firstLines.match(/,/g) || []).length;
  const semiCount = (firstLines.match(/;/g) || []).length;
  const tabCount = (firstLines.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  if (semiCount > commaCount) return ';';
  return ',';
}

/**
 * Robust CSV line tokenizer respecting quotes
 */
export function tokenizeCsvLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse raw CSV text into headers and row objects
 */
export function parseCsvText(rawText: string): CsvParseResult {
  const cleanText = rawText.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM
  if (!cleanText) {
    return { headers: [], rawRows: [], detectedMapping: { dateCol: '', amountCol: '' }, delimiter: ',' };
  }

  const delimiter = detectDelimiter(cleanText);
  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.startsWith('#'));

  if (lines.length === 0) {
    return { headers: [], rawRows: [], detectedMapping: { dateCol: '', amountCol: '' }, delimiter };
  }

  const headers = tokenizeCsvLine(lines[0], delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rawRows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = tokenizeCsvLine(lines[i], delimiter).map((v) => v.replace(/^["']|["']$/g, '').trim());
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    // Skip empty lines
    if (Object.values(rowObj).some((v) => v.trim() !== '')) {
      rawRows.push(rowObj);
    }
  }

  const detectedMapping = autoDetectColumns(headers);

  return {
    headers,
    rawRows,
    detectedMapping,
    delimiter,
  };
}

/**
 * Auto-detect column roles based on header names (supports EN & TH)
 */
export function autoDetectColumns(headers: string[]): CsvColumnMapping {
  const mapping: CsvColumnMapping = {
    dateCol: '',
    amountCol: '',
  };

  const lowerHeaders = headers.map((h) => h.toLowerCase());

  // Date column patterns
  const datePatterns = ['date', 'txn date', 'tx date', 'value date', 'posting date', 'วันที่', 'วันเวลา', 'datetime', 'time'];
  for (const pat of datePatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pat));
    if (idx !== -1) {
      mapping.dateCol = headers[idx];
      break;
    }
  }
  if (!mapping.dateCol && headers.length > 0) {
    mapping.dateCol = headers[0];
  }

  // Check for separate Debit / Credit columns
  const debitPatterns = ['debit', 'withdrawal', 'withdraw', 'ถอน', 'จ่าย', 'เงินออก', 'outflow', 'dr'];
  const creditPatterns = ['credit', 'deposit', 'ฝาก', 'รับ', 'เงินเข้า', 'inflow', 'cr'];

  for (const pat of debitPatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pat));
    if (idx !== -1) {
      mapping.debitCol = headers[idx];
      break;
    }
  }

  for (const pat of creditPatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pat));
    if (idx !== -1) {
      mapping.creditCol = headers[idx];
      break;
    }
  }

  // General Amount column pattern
  const amountPatterns = ['amount', 'จำนวนเงิน', 'ยอดเงิน', 'ยอด', 'net amount', 'total', 'ยอดคงเหลือ'];
  for (const pat of amountPatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pat));
    if (idx !== -1 && headers[idx] !== mapping.debitCol && headers[idx] !== mapping.creditCol) {
      mapping.amountCol = headers[idx];
      break;
    }
  }
  if (!mapping.amountCol && headers.length > 1 && !mapping.debitCol && !mapping.creditCol) {
    mapping.amountCol = headers[1];
  }

  // Type column pattern
  const typePatterns = ['type', 'transaction type', 'txn type', 'ประเภท', 'activity', 'd/c'];
  for (const pat of typePatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pat));
    if (idx !== -1) {
      mapping.typeCol = headers[idx];
      break;
    }
  }

  // Goal column pattern
  const goalPatterns = ['goal', 'goal name', 'เป้าหมาย', 'savings goal', 'target', 'category'];
  for (const pat of goalPatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pat));
    if (idx !== -1) {
      mapping.goalCol = headers[idx];
      break;
    }
  }

  // Note / Description column pattern
  const notePatterns = ['description', 'memo', 'note', 'details', 'รายละเอียด', 'รายการ', 'merchant', 'payee', 'remark', 'หมายเหตุ'];
  for (const pat of notePatterns) {
    const idx = lowerHeaders.findIndex((h) => h.includes(pat));
    if (idx !== -1 && headers[idx] !== mapping.goalCol) {
      mapping.noteCol = headers[idx];
      break;
    }
  }

  return mapping;
}

/**
 * Clean & normalize numeric strings: remove currencies, commas, handle (100) as negative
 */
export function cleanAmount(rawVal: string | undefined): number {
  if (!rawVal) return 0;
  let str = rawVal.trim();
  const isNegative = str.startsWith('-') || (str.startsWith('(') && str.endsWith(')'));
  // Remove symbols: $, ฿, ¥, €, commas, parentheses, letters
  str = str.replace(/[^\d.]/g, '');
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -Math.abs(num) : num;
}

/**
 * Clean and parse various date formats (ISO, DD/MM/YYYY, MM/DD/YYYY, Thai BE years)
 */
export function cleanDate(rawVal: string | undefined): string | null {
  if (!rawVal) return null;
  let str = rawVal.trim().split(' ')[0]; // Strip time component if present

  // Check for Thai Buddhist year (e.g. 2567 -> 2024, 2568 -> 2025, 2569 -> 2026)
  const beYearMatch = str.match(/25[4-8]\d/);
  if (beYearMatch) {
    const beYear = parseInt(beYearMatch[0], 10);
    const ceYear = beYear - 543;
    str = str.replace(beYearMatch[0], ceYear.toString());
  }

  // Try standard ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const formatsToTry = [
    'yyyy-MM-dd',
    'dd/MM/yyyy',
    'dd-MM-yyyy',
    'MM/dd/yyyy',
    'MM-dd-yyyy',
    'yyyy/MM/dd',
    'd/M/yyyy',
    'd-M-yyyy',
  ];

  for (const fmt of formatsToTry) {
    try {
      const parsed = parse(str, fmt, new Date());
      if (isValid(parsed) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2100) {
        return format(parsed, 'yyyy-MM-dd');
      }
    } catch {
      // continue
    }
  }

  // Fallback to Date.parse
  const fallback = new Date(rawVal);
  if (isValid(fallback) && !isNaN(fallback.getTime())) {
    return format(fallback, 'yyyy-MM-dd');
  }

  return null;
}

/**
 * Process raw CSV rows with active column mapping and goal matching
 */
export function processCsvRows(
  rawRows: Record<string, string>[],
  mapping: CsvColumnMapping,
  defaultGoalId: string,
  goals: Goal[]
): ParsedCsvRow[] {
  const goalByNameOrId = new Map<string, Goal>();
  goals.forEach((g) => {
    goalByNameOrId.set(g.id.toLowerCase(), g);
    goalByNameOrId.set(g.name.toLowerCase().trim(), g);
  });

  const defaultGoal = goals.find((g) => g.id === defaultGoalId) || goals[0];

  return rawRows.map((row, idx) => {
    const rawDate = mapping.dateCol ? row[mapping.dateCol] : '';
    const parsedDate = cleanDate(rawDate) || format(new Date(), 'yyyy-MM-dd');
    const isDateFallback = !cleanDate(rawDate);

    let amount = 0;
    let type: TransactionType = 'deposit';

    if (mapping.debitCol && mapping.creditCol) {
      const debitVal = cleanAmount(row[mapping.debitCol]);
      const creditVal = cleanAmount(row[mapping.creditCol]);
      if (creditVal > 0) {
        amount = creditVal;
        type = 'deposit';
      } else if (debitVal > 0) {
        amount = debitVal;
        type = 'withdrawal';
      }
    } else if (mapping.amountCol) {
      const rawNum = cleanAmount(row[mapping.amountCol]);
      amount = Math.abs(rawNum);

      if (mapping.typeCol && row[mapping.typeCol]) {
        const typeStr = row[mapping.typeCol].toLowerCase();
        if (
          typeStr.includes('with') ||
          typeStr.includes('debit') ||
          typeStr.includes('ถอน') ||
          typeStr.includes('จ่าย') ||
          typeStr.includes('out') ||
          typeStr.includes('dr')
        ) {
          type = 'withdrawal';
        } else {
          type = 'deposit';
        }
      } else {
        // Infer from negative number or debit indicator
        if (rawNum < 0) {
          type = 'withdrawal';
        } else {
          type = 'deposit';
        }
      }
    }

    // Match Goal
    let matchedGoal = defaultGoal;
    if (mapping.goalCol && row[mapping.goalCol]) {
      const rawGoal = row[mapping.goalCol].toLowerCase().trim();
      const match = goalByNameOrId.get(rawGoal);
      if (match) {
        matchedGoal = match;
      }
    }

    // Extract Note
    let note = '';
    if (mapping.noteCol && row[mapping.noteCol]) {
      note = row[mapping.noteCol].trim();
    } else if (mapping.goalCol && row[mapping.goalCol] && (!matchedGoal || matchedGoal.id === defaultGoalId)) {
      note = `Bank Import: ${row[mapping.goalCol]}`;
    } else {
      note = `Bank Statement Import (${parsedDate})`;
    }

    // Determine Validation Status
    let status: 'valid' | 'warning' | 'invalid' = 'valid';
    let message: string | undefined;

    if (amount <= 0) {
      status = 'invalid';
      message = 'Amount is zero or unreadable.';
    } else if (isDateFallback) {
      status = 'warning';
      message = 'Date was unparsed; defaulted to today.';
    } else if (!matchedGoal) {
      status = 'invalid';
      message = 'No target savings goal available.';
    }

    return {
      rowIndex: idx + 1,
      rawDate,
      parsedDate,
      amount,
      type,
      note,
      matchedGoalId: matchedGoal?.id,
      matchedGoalName: matchedGoal?.name,
      status,
      message,
      rawRow: row,
    };
  });
}

/**
 * Generate a downloadable sample bank statement CSV
 */
export function generateSampleBankCsv(sampleGoalNames: string[] = ['Emergency Reserve', 'Japan Trip', 'Car Down Payment']): string {
  const g1 = sampleGoalNames[0] || 'Emergency Reserve';
  const g2 = sampleGoalNames[1] || 'Vacation Fund';
  const g3 = sampleGoalNames[2] || 'New Laptop';

  const lines = [
    'Date,Type,Amount,Goal,Description',
    `2026-09-01,Deposit,500.00,${g1},"Monthly salary automated savings"`,
    `2026-09-05,Deposit,250.00,${g2},"Freelance design project earnings"`,
    `2026-09-12,Withdrawal,65.00,${g1},"Emergency car tire puncture replacement"`,
    `2026-09-18,Deposit,150.00,${g3},"Cashback rewards contribution"`,
    `2026-09-22,Deposit,300.00,${g2},"Autumn travel savings transfer"`,
  ];

  return lines.join('\r\n');
}
