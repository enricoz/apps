import { pgTable, text, timestamp, boolean, integer, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============ USERS TABLE ============
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'), // bcrypt hashed, nullable for OAuth-only users
  fullName: text('full_name'),
  profilePicture: text('profile_picture'),
  authProvider: text('auth_provider').$type<'email' | 'google' | 'apple' | 'microsoft' | 'facebook'>().default('email'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  familyMember: one(familyMembers),
  oauthAccounts: many(oauthAccounts),
  categories: many(categories),
  expenses: many(expenses),
  incomes: many(incomes),
  personalBudgets: many(personalBudgets),
  sentInvites: many(invites),
  notifications: many(notifications),
  revolutConnection: one(revolutConnections),
}));

// ============ OAUTH ACCOUNTS TABLE ============
export const oauthAccounts = pgTable('oauth_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull().$type<'google' | 'apple' | 'microsoft' | 'facebook'>(),
  providerAccountId: text('provider_account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueProviderAccount: unique().on(table.provider, table.providerAccountId),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

export const insertOauthAccountSchema = createInsertSchema(oauthAccounts);
export const selectOauthAccountSchema = createSelectSchema(oauthAccounts);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// ============ FAMILIES TABLE ============
export const families = pgTable('families', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: text('created_by').notNull().references(() => users.id),
});

export const familiesRelations = relations(families, ({ one, many }) => ({
  creator: one(users, {
    fields: [families.createdBy],
    references: [users.id],
  }),
  members: many(familyMembers),
  categories: many(categories),
  budgets: many(budgets),
  familyBudgets: many(familyBudgets),
  expenses: many(expenses),
  incomes: many(incomes),
  invites: many(invites),
  account: one(familyAccounts),
}));

export const insertFamilySchema = createInsertSchema(families);
export const selectFamilySchema = createSelectSchema(families);

// ============ FAMILY MEMBERS TABLE ============
export const familyMembers = pgTable('family_members', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().$type<'admin' | 'member'>(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
}, (table) => ({
  uniqueFamilyUser: unique().on(table.familyId, table.userId),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  family: one(families, {
    fields: [familyMembers.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
}));

export const insertFamilyMemberSchema = createInsertSchema(familyMembers);
export const selectFamilyMemberSchema = createSelectSchema(familyMembers);

// ============ CATEGORIES TABLE ============
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(), // hex color
  icon: text('icon').notNull(), // emoji
  isPrivate: boolean('is_private').notNull().default(false),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // required if isPrivate=true
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  family: one(families, {
    fields: [categories.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  budgets: many(budgets),
  expenses: many(expenses),
}));

export const insertCategorySchema = createInsertSchema(categories, {
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  icon: z.string().min(1, 'Icon is required'),
}).refine(
  (data) => {
    if (data.isPrivate && !data.userId) {
      return false;
    }
    return true;
  },
  {
    message: 'userId is required when isPrivate is true',
  }
);

export const selectCategorySchema = createSelectSchema(categories);

// ============ BUDGETS TABLE (per categoria) ============
export const budgets = pgTable('budgets', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  amount: text('amount').notNull(), // numeric string for precision
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const budgetsRelations = relations(budgets, ({ one }) => ({
  family: one(families, {
    fields: [budgets.familyId],
    references: [families.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const insertBudgetSchema = createInsertSchema(budgets, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
});

export const selectBudgetSchema = createSelectSchema(budgets);

// ============ FAMILY BUDGETS TABLE (totale famiglia mensile) ============
export const familyBudgets = pgTable('family_budgets', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  totalAmount: text('total_amount').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const familyBudgetsRelations = relations(familyBudgets, ({ one }) => ({
  family: one(families, {
    fields: [familyBudgets.familyId],
    references: [families.id],
  }),
}));

export const insertFamilyBudgetSchema = createInsertSchema(familyBudgets, {
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
});

export const selectFamilyBudgetSchema = createSelectSchema(familyBudgets);

// ============ PERSONAL BUDGETS TABLE (budget personale mensile) ============
export const personalBudgets = pgTable('personal_budgets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalAmount: text('total_amount').notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const personalBudgetsRelations = relations(personalBudgets, ({ one }) => ({
  user: one(users, {
    fields: [personalBudgets.userId],
    references: [users.id],
  }),
}));

export const insertPersonalBudgetSchema = createInsertSchema(personalBudgets, {
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
});

export const selectPersonalBudgetSchema = createSelectSchema(personalBudgets);

// ============ YEARLY BUDGETS TABLE (cap annuale per categoria) ============
export const yearlyBudgets = pgTable('yearly_budgets', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  yearlyAmount: text('yearly_amount').notNull(), // max annual spend
  year: integer('year').notNull(),
  alertThreshold: integer('alert_threshold').notNull().default(80), // percentage to trigger warning
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueCategoryYear: unique().on(table.categoryId, table.year),
}));

export const yearlyBudgetsRelations = relations(yearlyBudgets, ({ one }) => ({
  family: one(families, {
    fields: [yearlyBudgets.familyId],
    references: [families.id],
  }),
  category: one(categories, {
    fields: [yearlyBudgets.categoryId],
    references: [categories.id],
  }),
}));

export const insertYearlyBudgetSchema = createInsertSchema(yearlyBudgets, {
  yearlyAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Importo non valido'),
  year: z.number().int().min(2020),
  alertThreshold: z.number().int().min(1).max(100).default(80),
});

export const selectYearlyBudgetSchema = createSelectSchema(yearlyBudgets);

// ============ EXPENSES TABLE ============
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: text('amount').notNull(),
  description: text('description').notNull(),
  date: timestamp('date').notNull().defaultNow(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const expensesRelations = relations(expenses, ({ one }) => ({
  family: one(families, {
    fields: [expenses.familyId],
    references: [families.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

export const insertExpenseSchema = createInsertSchema(expenses, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount'),
  description: z.string().min(1, 'Description is required'),
  date: z.date().or(z.string()),
});

export const selectExpenseSchema = createSelectSchema(expenses);

// ============ INVITES TABLE ============
export const invites = pgTable('invites', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  status: text('status').notNull().$type<'pending' | 'accepted' | 'expired'>().default('pending'),
  invitedBy: text('invited_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const invitesRelations = relations(invites, ({ one }) => ({
  family: one(families, {
    fields: [invites.familyId],
    references: [families.id],
  }),
  inviter: one(users, {
    fields: [invites.invitedBy],
    references: [users.id],
  }),
}));

export const insertInviteSchema = createInsertSchema(invites);
export const selectInviteSchema = createSelectSchema(invites);

// ============ NOTIFICATIONS TABLE ============
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull().$type<'budget_warning' | 'budget_exceeded' | 'invite' | 'member_joined'>(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  relatedId: text('related_id'), // nullable, id della risorsa correlata
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);

// ============ INCOMES TABLE ============
export const incomes = pgTable('incomes', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: text('amount').notNull(), // numeric string for precision
  description: text('description').notNull(),
  source: text('source').notNull().$type<'manual' | 'revolut'>().default('manual'),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringDay: integer('recurring_day'), // 1-31, day of month for recurring incomes
  date: timestamp('date').notNull().defaultNow(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const incomesRelations = relations(incomes, ({ one }) => ({
  family: one(families, {
    fields: [incomes.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [incomes.userId],
    references: [users.id],
  }),
}));

export const insertIncomeSchema = createInsertSchema(incomes, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Importo non valido'),
  description: z.string().min(1, 'Descrizione richiesta'),
  date: z.date().or(z.string()),
  recurringDay: z.number().int().min(1).max(31).optional(),
});

export const selectIncomeSchema = createSelectSchema(incomes);

// ============ FAMILY ACCOUNTS TABLE ============
export const familyAccounts = pgTable('family_accounts', {
  id: text('id').primaryKey(),
  familyId: text('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }).unique(),
  accountType: text('account_type').notNull().$type<'shared' | 'separate' | 'mixed'>().default('shared'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const familyAccountsRelations = relations(familyAccounts, ({ one }) => ({
  family: one(families, {
    fields: [familyAccounts.familyId],
    references: [families.id],
  }),
}));

export const insertFamilyAccountSchema = createInsertSchema(familyAccounts);
export const selectFamilyAccountSchema = createSelectSchema(familyAccounts);

// ============ REVOLUT CONNECTIONS TABLE ============
export const revolutConnections = pgTable('revolut_connections', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  accessToken: text('access_token').notNull(), // should be encrypted
  refreshToken: text('refresh_token').notNull(), // should be encrypted
  accountId: text('account_id').notNull(),
  lastSync: timestamp('last_sync'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const revolutConnectionsRelations = relations(revolutConnections, ({ one }) => ({
  user: one(users, {
    fields: [revolutConnections.userId],
    references: [users.id],
  }),
}));

export const insertRevolutConnectionSchema = createInsertSchema(revolutConnections);
export const selectRevolutConnectionSchema = createSelectSchema(revolutConnections);

// ============ TYPES ============
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Family = typeof families.$inferSelect;
export type InsertFamily = typeof families.$inferInsert;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = typeof familyMembers.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

export type FamilyBudget = typeof familyBudgets.$inferSelect;
export type InsertFamilyBudget = typeof familyBudgets.$inferInsert;

export type PersonalBudget = typeof personalBudgets.$inferSelect;
export type InsertPersonalBudget = typeof personalBudgets.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = typeof invites.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type RevolutConnection = typeof revolutConnections.$inferSelect;
export type InsertRevolutConnection = typeof revolutConnections.$inferInsert;

export type OauthAccount = typeof oauthAccounts.$inferSelect;
export type InsertOauthAccount = typeof oauthAccounts.$inferInsert;

export type Income = typeof incomes.$inferSelect;
export type InsertIncome = typeof incomes.$inferInsert;

export type FamilyAccount = typeof familyAccounts.$inferSelect;
export type InsertFamilyAccount = typeof familyAccounts.$inferInsert;

export type YearlyBudget = typeof yearlyBudgets.$inferSelect;
export type InsertYearlyBudget = typeof yearlyBudgets.$inferInsert;
