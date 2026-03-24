import { Router } from 'express';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { IStorage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const exportQuerySchema = z.object({
  month: z.string().transform(Number),
  year: z.string().transform(Number),
  view: z.enum(['family', 'personal']).default('family'),
});

export function createExportRoutes(storage: IStorage) {
  const router = Router();
  router.use(isAuthenticated);

  router.get('/budget', async (req, res) => {
    try {
      const userId = req.session.userId!;
      const member = await storage.getFamilyMember(userId);
      if (!member) {
        return res.status(400).json({ error: 'Non fai parte di una famiglia' });
      }

      const query = exportQuerySchema.parse(req.query);
      const { month, year, view } = query;

      const categories = await storage.getCategories(member.familyId, userId);
      const monthName = format(new Date(year, month - 1), 'MMMM yyyy', { locale: it });

      if (view === 'family') {
        // --- FAMILY VIEW ---
        const [familyBudget, categoryBudgets, yearlyBudgets] = await Promise.all([
          storage.getFamilyBudget(member.familyId, month, year),
          storage.getBudgets(member.familyId, month, year),
          storage.getYearlyBudgets(member.familyId, year),
        ]);

        // Build monthly category data
        const monthlyRows = await Promise.all(
          categoryBudgets.map(async (cb) => {
            const spent = await storage.getCategorySpending(member.familyId, cb.categoryId, month, year);
            const cat = categories.find(c => c.id === cb.categoryId);
            const budgetNum = parseFloat(cb.amount);
            const spentNum = parseFloat(spent);
            const groupLabels: Record<string, string> = {
              sopravvivenza: 'Sopravvivenza', necessarie: 'Necessarie',
              necessarie_personali: 'Necessarie Personali', voluttarie: 'Voluttarie',
              investimenti: 'Investimenti',
            };
            return {
              'Gruppo': groupLabels[(cat as any)?.categoryGroup] || '',
              'Categoria': cat?.name || cb.categoryId,
              'Tipo': cat?.isPrivate ? 'Personale' : 'Famiglia',
              'Budget (€)': budgetNum,
              'Speso (€)': spentNum,
              'Rimanente (€)': budgetNum - spentNum,
              '% Utilizzato': budgetNum > 0 ? Math.round((spentNum / budgetNum) * 1000) / 10 : 0,
            };
          })
        );

        // Build yearly data
        const yearlyRows = await Promise.all(
          yearlyBudgets.map(async (yb) => {
            const spent = await storage.getYearlyCategorySpending(member.familyId, yb.categoryId, year);
            const cat = categories.find(c => c.id === yb.categoryId);
            const budgetNum = parseFloat(yb.yearlyAmount);
            const spentNum = parseFloat(spent);
            return {
              'Categoria': cat?.name || yb.categoryId,
              'Budget Annuale (€)': budgetNum,
              'Speso YTD (€)': spentNum,
              'Rimanente (€)': budgetNum - spentNum,
              '% Utilizzato': budgetNum > 0 ? Math.round((spentNum / budgetNum) * 1000) / 10 : 0,
              'Soglia Allarme (%)': yb.alertThreshold,
            };
          })
        );

        // Get expenses for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const expenses = await storage.getExpenses(member.familyId, userId, {
          startDate,
          endDate,
        });

        const expenseRows = expenses.map((e: any) => ({
          'Data': format(new Date(e.date), 'dd/MM/yyyy'),
          'Descrizione': e.description,
          'Categoria': categories.find(c => c.id === e.categoryId)?.name || '',
          'Importo (€)': parseFloat(e.amount),
          'Note': e.notes || '',
        }));

        // Summary sheet
        const totalBudget = parseFloat(familyBudget?.totalAmount || '0');
        const totalSpent = expenseRows.reduce((sum: number, r: any) => sum + r['Importo (€)'], 0);
        const summaryRows = [
          { 'Voce': 'Mese', 'Valore': monthName },
          { 'Voce': 'Budget Totale', 'Valore': `€${totalBudget.toFixed(2)}` },
          { 'Voce': 'Totale Speso', 'Valore': `€${totalSpent.toFixed(2)}` },
          { 'Voce': 'Rimanente', 'Valore': `€${(totalBudget - totalSpent).toFixed(2)}` },
          { 'Voce': '% Utilizzato', 'Valore': totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 1000) / 10}%` : '0%' },
          { 'Voce': 'N. Spese', 'Valore': String(expenseRows.length) },
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();

        const ws1 = XLSX.utils.json_to_sheet(summaryRows);
        ws1['!cols'] = [{ wch: 20 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Riepilogo');

        if (monthlyRows.length > 0) {
          const ws2 = XLSX.utils.json_to_sheet(monthlyRows);
          ws2['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
          XLSX.utils.book_append_sheet(wb, ws2, 'Budget Mensile');
        }

        if (yearlyRows.length > 0) {
          const ws3 = XLSX.utils.json_to_sheet(yearlyRows);
          ws3['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
          XLSX.utils.book_append_sheet(wb, ws3, 'Budget Annuale');
        }

        if (expenseRows.length > 0) {
          const ws4 = XLSX.utils.json_to_sheet(expenseRows);
          ws4['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 25 }];
          XLSX.utils.book_append_sheet(wb, ws4, 'Spese');
        }

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const filename = `budget_famiglia_${monthName.replace(' ', '_')}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(Buffer.from(buf));

      } else {
        // --- PERSONAL VIEW ---
        const [personalBudget, personalCategoryBudgets] = await Promise.all([
          storage.getPersonalBudget(userId, month, year),
          storage.getPersonalCategoryBudgets(userId, month, year),
        ]);

        const monthlyRows = await Promise.all(
          personalCategoryBudgets.map(async (pcb) => {
            const spent = await storage.getPersonalCategorySpending(userId, pcb.categoryId, month, year);
            const cat = categories.find(c => c.id === pcb.categoryId);
            const budgetNum = parseFloat(pcb.amount);
            const spentNum = parseFloat(spent);
            return {
              'Categoria': cat?.name || pcb.categoryId,
              'Budget (€)': budgetNum,
              'Speso (€)': spentNum,
              'Rimanente (€)': budgetNum - spentNum,
              '% Utilizzato': budgetNum > 0 ? Math.round((spentNum / budgetNum) * 1000) / 10 : 0,
            };
          })
        );

        // Get personal expenses
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const allExpenses = await storage.getExpenses(member.familyId, userId, {
          startDate,
          endDate,
        });
        // Filter to only this user's expenses
        const myExpenses = allExpenses.filter((e: any) => e.userId === userId);

        const expenseRows = myExpenses.map((e: any) => ({
          'Data': format(new Date(e.date), 'dd/MM/yyyy'),
          'Descrizione': e.description,
          'Categoria': categories.find(c => c.id === e.categoryId)?.name || '',
          'Importo (€)': parseFloat(e.amount),
          'Note': e.notes || '',
        }));

        const totalBudget = parseFloat(personalBudget?.totalAmount || '0');
        const totalSpent = expenseRows.reduce((sum: number, r: any) => sum + r['Importo (€)'], 0);
        const summaryRows = [
          { 'Voce': 'Mese', 'Valore': monthName },
          { 'Voce': 'Budget Personale', 'Valore': `€${totalBudget.toFixed(2)}` },
          { 'Voce': 'Totale Speso', 'Valore': `€${totalSpent.toFixed(2)}` },
          { 'Voce': 'Rimanente', 'Valore': `€${(totalBudget - totalSpent).toFixed(2)}` },
          { 'Voce': '% Utilizzato', 'Valore': totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 1000) / 10}%` : '0%' },
          { 'Voce': 'N. Spese', 'Valore': String(expenseRows.length) },
        ];

        const wb = XLSX.utils.book_new();

        const ws1 = XLSX.utils.json_to_sheet(summaryRows);
        ws1['!cols'] = [{ wch: 20 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Riepilogo');

        if (monthlyRows.length > 0) {
          const ws2 = XLSX.utils.json_to_sheet(monthlyRows);
          ws2['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
          XLSX.utils.book_append_sheet(wb, ws2, 'Budget Categorie');
        }

        if (expenseRows.length > 0) {
          const ws3 = XLSX.utils.json_to_sheet(expenseRows);
          ws3['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 25 }];
          XLSX.utils.book_append_sheet(wb, ws3, 'Spese');
        }

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const filename = `budget_personale_${monthName.replace(' ', '_')}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(Buffer.from(buf));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('Export error:', error);
      res.status(500).json({ error: 'Errore durante l\'esportazione' });
    }
  });

  return router;
}
