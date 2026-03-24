/**
 * Script to import budget structure from "Budget Barbie indipendente.xlsx"
 * Creates categories with groups and sets monthly budget limits.
 *
 * Usage: node --env-file=.env -e "require('tsx/cjs'); require('./scripts/import-budget-excel.ts')"
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { nanoid } from 'nanoid';
import * as XLSX from 'xlsx';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';

const GROUP_COLORS: Record<string, string> = {
  sopravvivenza: '#EF4444',    // red
  necessarie: '#F59E0B',       // amber
  necessarie_personali: '#3B82F6', // blue
  voluttarie: '#8B5CF6',       // violet
  investimenti: '#10B981',     // emerald
};

const GROUP_ICONS: Record<string, string> = {
  sopravvivenza: '🏠',
  necessarie: '🛒',
  necessarie_personali: '👤',
  voluttarie: '🎉',
  investimenti: '📈',
};

// Category -> icon mapping for common categories
const CATEGORY_ICONS: Record<string, string> = {
  'affitto': '🏠', 'bollette': '💡', 'wifi': '📶', 'tasse': '🏛️', 'pulizie': '🧹',
  'supermercato': '🛒', 'benzina giulia': '⛽', 'benzina enrico': '⛽',
  'bollo/revisione/gomme': '🚗', 'assicurazione auto': '🛡️',
  'pannolini': '👶', 'farmaci': '💊', 'visite mediche zeno': '🏥',
  'costi bancari': '🏦', 'netflix + amazon prime + spotify + disney plus': '📺',
  'gravidanza visite': '🤰', 'wellness gravidanza giulia': '🧘', 'test gravidanza': '🧪',
  'asilo': '🎒', 'aperitivi': '🍹', 'regali': '🎁',
  'cene/pranzi/aperitivi': '🍽️', 'cibo extra': '🍕',
  'colazioni (caffè + bott. acqua)': '☕', 'colazioni / aperitivi': '☕',
  'giochi + bicicletta zeno': '🧸', 'concerti': '🎵',
  'vestiti zeno': '👕', 'psicologo': '🧠', 'vacanze': '✈️', 'acquisti vari': '🛍️',
  'rata macchina': '🚗', 'dentista': '🦷', 'visite mediche': '🏥',
  'psicologa': '🧠', 'psicologa ': '🧠', 'palestra / yoga': '🏋️', 'palestra ': '🏋️',
  'ricarica telefono': '📱', 'ricarica telefono ': '📱',
  'rata telefono': '📱', 'farmaci/integratori': '💊',
  'cene / pranzi': '🍽️', 'vestiti / accessori': '👗',
  'estetista': '💅', 'estetista e barbieri': '💈', 'creme / skin care': '🧴',
  'fondo pensione': '🏦', 'piano di accumulo': '📊', 'piano di accumulo ': '📊',
  'abbonamento macro': '💻', 'multe': '🚨', 'extra': '➕',
};

function getIcon(name: string): string {
  return CATEGORY_ICONS[name.toLowerCase().trim()] || '📦';
}

interface BudgetRow {
  name: string;
  group: string;
  monthlyAmount: number;
}

function parseSheet(wb: XLSX.WorkBook, sheetName: string): { entries: BudgetRow[], incomes: { name: string, amount: number }[] } {
  const ws = wb.Sheets[sheetName];
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const entries: BudgetRow[] = [];
  const incomes: { name: string, amount: number }[] = [];
  let currentGroup = '';
  let inEntrate = false;

  for (let i = 0; i < Math.min(data.length, 60); i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();

    // March budget amount is at index 14 (column O = "marzo")
    const marchBudget = typeof row[14] === 'number' ? row[14] : (typeof row[2] === 'number' ? row[2] : 0);

    if (col0 === 'ENTRATE') {
      inEntrate = true;
      if (col1 && marchBudget > 0) {
        incomes.push({ name: col1, amount: marchBudget });
      }
      continue;
    }
    if (col0 === 'TOTALE ENTRATE' || col0 === 'TOT USCITE' || col0 === 'DIFFERENZA' || col0 === 'NOTE') {
      inEntrate = false;
      continue;
    }
    if (col0 === 'USCITE') {
      inEntrate = false;
      if (col1) currentGroup = col1;
      continue;
    }

    if (inEntrate && !col0 && col1 && marchBudget > 0) {
      incomes.push({ name: col1, amount: marchBudget });
      continue;
    }

    // Group headers
    if (!col0 && col1 && (
      col1 === 'SOPRAVVIVENZA' || col1 === 'NECESSARIE' || col1 === 'NECESSARIE PERSONALI' ||
      col1.startsWith('VOLUTTARIE') || col1.startsWith('INVESTIMENTI')
    )) {
      currentGroup = col1;
      continue;
    }

    // Category row: col0 empty, col1 = name, col2+ = amounts
    if (!col0 && col1 && currentGroup) {
      const groupKey = currentGroup.toLowerCase()
        .replace('voluttarie personali', 'voluttarie')
        .replace('investimenti personali', 'investimenti')
        .replace(/ /g, '_') as string;

      entries.push({
        name: col1.trim(),
        group: groupKey,
        monthlyAmount: marchBudget,
      });
    }
  }

  return { entries, incomes };
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL!;
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql, { schema });

  const filePath = '/Users/Enrico.Zoli/Downloads/Budget Barbie indipendente.xlsx';
  const wb = XLSX.readFile(filePath);

  // Find the family
  const families = await db.select().from(schema.families);
  if (families.length === 0) {
    console.error('No family found');
    return;
  }
  const family = families[0];
  console.log(`Family: ${family.name} (${family.id})`);

  // Get existing user
  const members = await db.select().from(schema.familyMembers).where(eq(schema.familyMembers.familyId, family.id));
  const adminMember = members.find(m => m.role === 'admin');
  if (!adminMember) {
    console.error('No admin found');
    return;
  }
  console.log(`Admin user: ${adminMember.userId}`);

  // Parse family budget sheet
  console.log('\n=== BUDGET FAMILIARE ===');
  const familyData = parseSheet(wb, 'Budget familiare 26');

  // Delete existing categories first
  console.log('Deleting existing categories...');
  await db.delete(schema.categories).where(eq(schema.categories.familyId, family.id));

  // Create family categories
  const categoryMap = new Map<string, string>(); // name -> id

  for (const entry of familyData.entries) {
    const id = nanoid();
    const groupKey = entry.group as any;
    const color = GROUP_COLORS[groupKey] || '#6B7280';

    await db.insert(schema.categories).values({
      id,
      familyId: family.id,
      name: entry.name,
      color,
      icon: getIcon(entry.name),
      isPrivate: false,
      categoryGroup: groupKey,
    });

    categoryMap.set(entry.name.toLowerCase(), id);
    console.log(`  [${groupKey}] ${entry.name}: €${entry.monthlyAmount}/mese`);
  }

  // Set family budget total (sum of all incomes)
  const totalFamilyIncome = familyData.incomes.reduce((s, i) => s + i.amount, 0);
  console.log(`\nTotale entrate famiglia: €${totalFamilyIncome}`);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Upsert family budget
  const fbId = nanoid();
  await db.insert(schema.familyBudgets).values({
    id: fbId,
    familyId: family.id,
    totalAmount: String(totalFamilyIncome),
    month,
    year,
  }).onConflictDoUpdate({
    target: [schema.familyBudgets.id],
    set: { totalAmount: String(totalFamilyIncome) },
  }).catch(async () => {
    // Try update if exists
    const existing = await db.select().from(schema.familyBudgets).where(
      and(eq(schema.familyBudgets.familyId, family.id))
    );
    if (existing.length > 0) {
      await db.update(schema.familyBudgets)
        .set({ totalAmount: String(totalFamilyIncome) })
        .where(eq(schema.familyBudgets.id, existing[0].id));
    }
  });

  // Set category budgets for family
  for (const entry of familyData.entries) {
    if (entry.monthlyAmount > 0) {
      const catId = categoryMap.get(entry.name.toLowerCase());
      if (!catId) continue;

      const budgetId = nanoid();
      try {
        await db.insert(schema.budgets).values({
          id: budgetId,
          familyId: family.id,
          categoryId: catId,
          amount: String(entry.monthlyAmount),
          month,
          year,
        });
      } catch {
        // Already exists, update
      }
    }
  }

  // Parse personal budget sheets and create personal categories
  for (const sheetName of ['Budget personale Giulia 26', 'Budget personale Enrico 26']) {
    const memberName = sheetName.includes('Giulia') ? 'Giulia' : 'Enrico';
    console.log(`\n=== BUDGET PERSONALE ${memberName.toUpperCase()} ===`);

    const personalData = parseSheet(wb, sheetName);

    // Find personal-only categories (not in family sheet)
    const familyCatNames = new Set(familyData.entries.map(e => e.name.toLowerCase()));

    for (const entry of personalData.entries) {
      const catNameLower = entry.name.toLowerCase();

      // Skip if already a family category (shared expenses)
      if (familyCatNames.has(catNameLower) && entry.group !== 'necessarie_personali' && entry.group !== 'voluttarie' && entry.group !== 'investimenti') {
        continue;
      }

      // Check if already created as personal
      if (categoryMap.has(catNameLower + '_' + memberName)) continue;

      // Only create personal categories for necessarie_personali, voluttarie (personal), investimenti
      if (entry.group === 'necessarie_personali' || entry.group === 'voluttarie' || entry.group === 'investimenti') {
        const id = nanoid();
        const groupKey = entry.group as any;
        const color = GROUP_COLORS[groupKey] || '#6B7280';

        // Create as personal category for the admin user (since we only have one user right now)
        await db.insert(schema.categories).values({
          id,
          familyId: family.id,
          name: `${entry.name} (${memberName})`,
          color,
          icon: getIcon(entry.name),
          isPrivate: true,
          userId: adminMember.userId,
          categoryGroup: groupKey,
        });

        categoryMap.set(catNameLower + '_' + memberName, id);
        console.log(`  [${groupKey}] ${entry.name}: €${entry.monthlyAmount}/mese`);
      }
    }
  }

  console.log(`\n✅ Importazione completata!`);
  console.log(`   Categorie create: ${categoryMap.size}`);
  console.log(`   Budget famiglia: €${totalFamilyIncome}/mese (Marzo ${year})`);
}

main().catch(console.error);
