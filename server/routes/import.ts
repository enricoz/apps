import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Formato file non supportato. Usa CSV o Excel (.xlsx)'));
    }
  },
});

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  originalRow: Record<string, string>;
}

// Common column name patterns for auto-detection
const DATE_PATTERNS = ['date', 'data', 'datetime', 'completed date', 'started date', 'value date', 'booking date'];
const DESC_PATTERNS = ['description', 'descrizione', 'merchant', 'beneficiary', 'reference', 'details', 'note', 'payee', 'narrative'];
const AMOUNT_PATTERNS = ['amount', 'importo', 'value', 'sum', 'total', 'money'];
const TYPE_PATTERNS = ['type', 'tipo', 'direction', 'debit/credit'];

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s/]/g, '');
}

function findColumn(headers: string[], patterns: string[]): string | null {
  for (const header of headers) {
    const normalized = normalizeColumnName(header);
    for (const pattern of patterns) {
      if (normalized === pattern || normalized.includes(pattern)) {
        return header;
      }
    }
  }
  return null;
}

function detectColumnMapping(headers: string[]): {
  dateCol: string | null;
  descCol: string | null;
  amountCol: string | null;
  typeCol: string | null;
} {
  return {
    dateCol: findColumn(headers, DATE_PATTERNS),
    descCol: findColumn(headers, DESC_PATTERNS),
    amountCol: findColumn(headers, AMOUNT_PATTERNS),
    typeCol: findColumn(headers, TYPE_PATTERNS),
  };
}

function parseAmount(value: string): number {
  if (!value) return 0;
  // Remove currency symbols, spaces, and handle European format (1.234,56 -> 1234.56)
  let cleaned = value.replace(/[€$£¥\s]/g, '').trim();

  // Detect European format: if comma is after last dot, it's the decimal separator
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma > lastDot) {
    // European format: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    // US format with thousands: 1,234.56
    cleaned = cleaned.replace(/,/g, '');
  } else if (lastComma !== -1 && lastDot === -1) {
    // Only comma, assume decimal: 123,45
    cleaned = cleaned.replace(',', '.');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDate(value: string): string | null {
  if (!value) return null;

  // Try ISO format first
  let d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString();

  // Try DD/MM/YYYY or DD-MM-YYYY
  const euMatch = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (euMatch) {
    const year = euMatch[3].length === 2 ? '20' + euMatch[3] : euMatch[3];
    d = new Date(`${year}-${euMatch[2].padStart(2, '0')}-${euMatch[1].padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return null;
}

function parseFileToRows(buffer: Buffer, filename: string): Record<string, string>[] {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'csv' || ext === 'txt') {
    const content = buffer.toString('utf-8');
    // Auto-detect delimiter
    const firstLine = content.split('\n')[0];
    const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter,
      relax_column_count: true,
    });
    return records;
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  throw new Error('Formato file non supportato');
}

export function createImportRoutes(storage: IStorage) {
  const router = Router();
  router.use(isAuthenticated);

  // Parse uploaded file and return preview
  router.post('/preview', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato' });
      }

      const rows = parseFileToRows(req.file.buffer, req.file.originalname);
      if (rows.length === 0) {
        return res.status(400).json({ error: 'Il file è vuoto' });
      }

      const headers = Object.keys(rows[0]);
      const mapping = detectColumnMapping(headers);

      // Parse rows with detected mapping
      const parsed: ParsedRow[] = [];
      for (const row of rows.slice(0, 200)) { // Limit preview to 200 rows
        const rawAmount = mapping.amountCol ? String(row[mapping.amountCol]) : '';
        const amount = parseAmount(rawAmount);
        if (amount === 0) continue; // Skip zero-amount rows

        const rawDate = mapping.dateCol ? String(row[mapping.dateCol]) : '';
        const date = parseDate(rawDate);
        if (!date) continue; // Skip rows without valid date

        const description = mapping.descCol ? String(row[mapping.descCol]).trim() : '';
        if (!description) continue; // Skip rows without description

        // Determine if expense or income
        let type: 'expense' | 'income' = 'expense';
        if (mapping.typeCol) {
          const typeVal = normalizeColumnName(String(row[mapping.typeCol]));
          if (typeVal.includes('credit') || typeVal.includes('entrata') || typeVal.includes('income') || typeVal.includes('topup')) {
            type = 'income';
          }
        }
        // Negative amounts are expenses, positive can be income
        if (amount > 0 && !mapping.typeCol) {
          // Without type column, we can't determine — assume expense
          type = 'expense';
        } else if (amount < 0) {
          type = 'expense';
        } else if (amount > 0 && mapping.typeCol) {
          // Keep the type from column detection
        }

        parsed.push({
          date,
          description,
          amount: Math.abs(amount),
          type,
          originalRow: row,
        });
      }

      // Get user's categories for mapping
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const categories = await storage.getCategories(member.familyId, userId);

      res.json({
        filename: req.file.originalname,
        totalRows: rows.length,
        parsedRows: parsed.length,
        headers,
        mapping,
        transactions: parsed,
        categories: categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color })),
      });
    } catch (error: any) {
      console.error('Import preview error:', error);
      res.status(400).json({ error: error.message || 'Errore durante l\'analisi del file' });
    }
  });

  // Confirm import — create expenses/incomes from parsed data
  router.post('/confirm', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const { transactions, categoryId } = req.body as {
        transactions: ParsedRow[];
        categoryId: string;
      };

      if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ error: 'Nessuna transazione da importare' });
      }

      if (!categoryId) {
        return res.status(400).json({ error: 'Seleziona una categoria' });
      }

      // Verify category access
      const category = await storage.getCategory(categoryId, userId);
      if (!category) {
        return res.status(400).json({ error: 'Categoria non trovata' });
      }

      let importedExpenses = 0;
      let importedIncomes = 0;

      for (const tx of transactions) {
        const amount = Math.abs(tx.amount).toFixed(2);
        const date = new Date(tx.date);

        if (tx.type === 'expense') {
          await storage.createExpense({
            familyId: member.familyId,
            categoryId,
            userId,
            amount,
            description: tx.description,
            date,
            notes: 'Importato da file',
          });
          importedExpenses++;
        } else {
          await storage.createIncome({
            familyId: member.familyId,
            userId,
            amount,
            description: tx.description,
            source: 'manual',
            date,
            notes: 'Importato da file',
            isRecurring: false,
          });
          importedIncomes++;
        }
      }

      res.json({
        imported: importedExpenses + importedIncomes,
        expenses: importedExpenses,
        incomes: importedIncomes,
      });
    } catch (error: any) {
      console.error('Import confirm error:', error);
      res.status(500).json({ error: error.message || 'Errore durante l\'importazione' });
    }
  });

  return router;
}
