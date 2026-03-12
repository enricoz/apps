import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { and, eq, or, desc, gte, lte, sql, sum } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as schema from '../db/schema';
import type {
  User, InsertUser,
  Family, InsertFamily,
  FamilyMember, InsertFamilyMember,
  Category, InsertCategory,
  Budget, InsertBudget,
  FamilyBudget, InsertFamilyBudget,
  PersonalBudget, InsertPersonalBudget,
  Expense, InsertExpense,
  Invite, InsertInvite,
  Notification, InsertNotification,
  RevolutConnection, InsertRevolutConnection,
  OauthAccount, InsertOauthAccount,
} from '../db/schema';

export interface IStorage {
  // ========== USERS ==========
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  // ========== FAMILIES ==========
  getFamily(id: string): Promise<Family | undefined>;
  createFamily(family: Omit<InsertFamily, 'id'>): Promise<Family>;
  updateFamily(id: string, family: Partial<InsertFamily>): Promise<Family | undefined>;

  // ========== FAMILY MEMBERS ==========
  getFamilyMember(userId: string): Promise<FamilyMember | undefined>;
  getFamilyMembers(familyId: string): Promise<FamilyMember[]>;
  createFamilyMember(member: Omit<InsertFamilyMember, 'id'>): Promise<FamilyMember>;
  removeFamilyMember(familyId: string, userId: string): Promise<void>;
  isFamilyAdmin(familyId: string, userId: string): Promise<boolean>;

  // ========== CATEGORIES ==========
  // CRITICAL: Always filter by userId for private categories
  getCategories(familyId: string, userId: string): Promise<Category[]>;
  getCategory(id: string, userId: string): Promise<Category | undefined>;
  createCategory(category: Omit<InsertCategory, 'id'>): Promise<Category>;
  updateCategory(id: string, userId: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string, userId: string): Promise<void>;

  // ========== BUDGETS ==========
  getBudgets(familyId: string, month: number, year: number): Promise<Budget[]>;
  getBudget(categoryId: string, month: number, year: number): Promise<Budget | undefined>;
  upsertBudget(budget: Omit<InsertBudget, 'id'>): Promise<Budget>;

  // ========== FAMILY BUDGETS ==========
  getFamilyBudget(familyId: string, month: number, year: number): Promise<FamilyBudget | undefined>;
  upsertFamilyBudget(budget: Omit<InsertFamilyBudget, 'id'>): Promise<FamilyBudget>;

  // ========== PERSONAL BUDGETS ==========
  getPersonalBudget(userId: string, month: number, year: number): Promise<PersonalBudget | undefined>;
  upsertPersonalBudget(budget: Omit<InsertPersonalBudget, 'id'>): Promise<PersonalBudget>;

  // ========== EXPENSES ==========
  // CRITICAL: Filter by userId for private category expenses
  getExpenses(familyId: string, userId: string, filters?: {
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<(Expense & { category: Category })[]>;
  getExpense(id: string, userId: string): Promise<(Expense & { category: Category }) | undefined>;
  createExpense(expense: Omit<InsertExpense, 'id'>): Promise<Expense>;
  updateExpense(id: string, userId: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string, userId: string): Promise<void>;

  // ========== ANALYTICS ==========
  // CRITICAL: Filter aggregations by userId for personal analytics
  getFamilySpendingByCategory(familyId: string, userId: string, month: number, year: number): Promise<Array<{
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
    total: string;
  }>>;

  getTotalSpending(familyId: string, userId: string, month: number, year: number): Promise<string>;

  getPersonalSpending(userId: string, month: number, year: number): Promise<string>;

  // ========== INVITES ==========
  getInvite(token: string): Promise<Invite | undefined>;
  getInvitesByFamily(familyId: string): Promise<Invite[]>;
  createInvite(invite: Omit<InsertInvite, 'id'>): Promise<Invite>;
  updateInviteStatus(id: string, status: 'accepted' | 'expired'): Promise<void>;

  // ========== NOTIFICATIONS ==========
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: string): Promise<number>;
  createNotification(notification: Omit<InsertNotification, 'id'>): Promise<Notification>;
  markNotificationAsRead(id: string, userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<void>;

  // ========== OAUTH ACCOUNTS ==========
  getOauthAccount(provider: string, providerAccountId: string): Promise<OauthAccount | undefined>;
  getOauthAccountsByUser(userId: string): Promise<OauthAccount[]>;
  createOauthAccount(account: Omit<InsertOauthAccount, 'id'>): Promise<OauthAccount>;
  updateOauthAccount(id: string, account: Partial<InsertOauthAccount>): Promise<OauthAccount | undefined>;
  findOrCreateOauthUser(profile: {
    provider: 'google' | 'apple' | 'microsoft' | 'facebook';
    providerAccountId: string;
    email: string;
    fullName?: string;
    profilePicture?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  }): Promise<User>;

  // ========== REVOLUT ==========
  getRevolutConnection(userId: string): Promise<RevolutConnection | undefined>;
  upsertRevolutConnection(connection: Omit<InsertRevolutConnection, 'id'>): Promise<RevolutConnection>;
  deleteRevolutConnection(userId: string): Promise<void>;
}

export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor(connectionString: string) {
    const client = neon(connectionString);
    this.db = drizzle(client, { schema });
  }

  // ========== USERS ==========
  async getUser(id: string): Promise<User | undefined> {
    return await this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await this.db.insert(schema.users).values(user).returning();
    return created;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await this.db
      .update(schema.users)
      .set(user)
      .where(eq(schema.users.id, id))
      .returning();
    return updated;
  }

  // ========== FAMILIES ==========
  async getFamily(id: string): Promise<Family | undefined> {
    return await this.db.query.families.findFirst({
      where: eq(schema.families.id, id),
    });
  }

  async createFamily(family: Omit<InsertFamily, 'id'>): Promise<Family> {
    const id = nanoid();
    const [created] = await this.db
      .insert(schema.families)
      .values({ ...family, id })
      .returning();
    return created;
  }

  async updateFamily(id: string, family: Partial<InsertFamily>): Promise<Family | undefined> {
    const [updated] = await this.db
      .update(schema.families)
      .set(family)
      .where(eq(schema.families.id, id))
      .returning();
    return updated;
  }

  // ========== FAMILY MEMBERS ==========
  async getFamilyMember(userId: string): Promise<FamilyMember | undefined> {
    return await this.db.query.familyMembers.findFirst({
      where: eq(schema.familyMembers.userId, userId),
    });
  }

  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    return await this.db.query.familyMembers.findMany({
      where: eq(schema.familyMembers.familyId, familyId),
      with: {
        user: true,
      },
    });
  }

  async createFamilyMember(member: Omit<InsertFamilyMember, 'id'>): Promise<FamilyMember> {
    const id = nanoid();
    const [created] = await this.db
      .insert(schema.familyMembers)
      .values({ ...member, id })
      .returning();
    return created;
  }

  async removeFamilyMember(familyId: string, userId: string): Promise<void> {
    await this.db
      .delete(schema.familyMembers)
      .where(
        and(
          eq(schema.familyMembers.familyId, familyId),
          eq(schema.familyMembers.userId, userId)
        )
      );
  }

  async isFamilyAdmin(familyId: string, userId: string): Promise<boolean> {
    const member = await this.db.query.familyMembers.findFirst({
      where: and(
        eq(schema.familyMembers.familyId, familyId),
        eq(schema.familyMembers.userId, userId)
      ),
    });
    return member?.role === 'admin';
  }

  // ========== CATEGORIES ==========
  // CRITICAL: Always filter by userId for private categories
  async getCategories(familyId: string, userId: string): Promise<Category[]> {
    return await this.db.query.categories.findMany({
      where: and(
        eq(schema.categories.familyId, familyId),
        or(
          eq(schema.categories.isPrivate, false),
          eq(schema.categories.userId, userId)
        )
      ),
      orderBy: [schema.categories.name],
    });
  }

  async getCategory(id: string, userId: string): Promise<Category | undefined> {
    const category = await this.db.query.categories.findFirst({
      where: eq(schema.categories.id, id),
    });

    // Check if user has access to this category
    if (category && category.isPrivate && category.userId !== userId) {
      return undefined;
    }

    return category;
  }

  async createCategory(category: Omit<InsertCategory, 'id'>): Promise<Category> {
    const id = nanoid();
    const [created] = await this.db
      .insert(schema.categories)
      .values({ ...category, id })
      .returning();
    return created;
  }

  async updateCategory(id: string, userId: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    // First check if user owns this category (if private)
    const existing = await this.getCategory(id, userId);
    if (!existing) {
      return undefined;
    }

    const [updated] = await this.db
      .update(schema.categories)
      .set(category)
      .where(eq(schema.categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string, userId: string): Promise<void> {
    // First check if user owns this category (if private)
    const existing = await this.getCategory(id, userId);
    if (!existing) {
      return;
    }

    await this.db.delete(schema.categories).where(eq(schema.categories.id, id));
  }

  // ========== BUDGETS ==========
  async getBudgets(familyId: string, month: number, year: number): Promise<Budget[]> {
    return await this.db.query.budgets.findMany({
      where: and(
        eq(schema.budgets.familyId, familyId),
        eq(schema.budgets.month, month),
        eq(schema.budgets.year, year)
      ),
      with: {
        category: true,
      },
    });
  }

  async getBudget(categoryId: string, month: number, year: number): Promise<Budget | undefined> {
    return await this.db.query.budgets.findFirst({
      where: and(
        eq(schema.budgets.categoryId, categoryId),
        eq(schema.budgets.month, month),
        eq(schema.budgets.year, year)
      ),
    });
  }

  async upsertBudget(budget: Omit<InsertBudget, 'id'>): Promise<Budget> {
    const existing = await this.getBudget(budget.categoryId, budget.month, budget.year);

    if (existing) {
      const [updated] = await this.db
        .update(schema.budgets)
        .set({ amount: budget.amount })
        .where(eq(schema.budgets.id, existing.id))
        .returning();
      return updated;
    }

    const id = nanoid();
    const [created] = await this.db
      .insert(schema.budgets)
      .values({ ...budget, id })
      .returning();
    return created;
  }

  // ========== FAMILY BUDGETS ==========
  async getFamilyBudget(familyId: string, month: number, year: number): Promise<FamilyBudget | undefined> {
    return await this.db.query.familyBudgets.findFirst({
      where: and(
        eq(schema.familyBudgets.familyId, familyId),
        eq(schema.familyBudgets.month, month),
        eq(schema.familyBudgets.year, year)
      ),
    });
  }

  async upsertFamilyBudget(budget: Omit<InsertFamilyBudget, 'id'>): Promise<FamilyBudget> {
    const existing = await this.getFamilyBudget(budget.familyId, budget.month, budget.year);

    if (existing) {
      const [updated] = await this.db
        .update(schema.familyBudgets)
        .set({ totalAmount: budget.totalAmount })
        .where(eq(schema.familyBudgets.id, existing.id))
        .returning();
      return updated;
    }

    const id = nanoid();
    const [created] = await this.db
      .insert(schema.familyBudgets)
      .values({ ...budget, id })
      .returning();
    return created;
  }

  // ========== PERSONAL BUDGETS ==========
  async getPersonalBudget(userId: string, month: number, year: number): Promise<PersonalBudget | undefined> {
    return await this.db.query.personalBudgets.findFirst({
      where: and(
        eq(schema.personalBudgets.userId, userId),
        eq(schema.personalBudgets.month, month),
        eq(schema.personalBudgets.year, year)
      ),
    });
  }

  async upsertPersonalBudget(budget: Omit<InsertPersonalBudget, 'id'>): Promise<PersonalBudget> {
    const existing = await this.getPersonalBudget(budget.userId, budget.month, budget.year);

    if (existing) {
      const [updated] = await this.db
        .update(schema.personalBudgets)
        .set({ totalAmount: budget.totalAmount })
        .where(eq(schema.personalBudgets.id, existing.id))
        .returning();
      return updated;
    }

    const id = nanoid();
    const [created] = await this.db
      .insert(schema.personalBudgets)
      .values({ ...budget, id })
      .returning();
    return created;
  }

  // ========== EXPENSES ==========
  // CRITICAL: Filter by userId for private category expenses
  async getExpenses(
    familyId: string,
    userId: string,
    filters?: {
      categoryId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<(Expense & { category: Category })[]> {
    const conditions = [
      eq(schema.expenses.familyId, familyId),
    ];

    if (filters?.categoryId) {
      conditions.push(eq(schema.expenses.categoryId, filters.categoryId));
    }

    if (filters?.startDate) {
      conditions.push(gte(schema.expenses.date, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(schema.expenses.date, filters.endDate));
    }

    const expenses = await this.db.query.expenses.findMany({
      where: and(...conditions),
      with: {
        category: true,
      },
      orderBy: [desc(schema.expenses.date)],
    });

    // Filter out expenses from private categories that don't belong to the user
    return expenses.filter(expense =>
      !expense.category.isPrivate || expense.category.userId === userId
    );
  }

  async getExpense(id: string, userId: string): Promise<(Expense & { category: Category }) | undefined> {
    const expense = await this.db.query.expenses.findFirst({
      where: eq(schema.expenses.id, id),
      with: {
        category: true,
      },
    });

    if (!expense) {
      return undefined;
    }

    // Check if user has access to this expense
    if (expense.category.isPrivate && expense.category.userId !== userId) {
      return undefined;
    }

    return expense;
  }

  async createExpense(expense: Omit<InsertExpense, 'id'>): Promise<Expense> {
    const id = nanoid();
    const [created] = await this.db
      .insert(schema.expenses)
      .values({ ...expense, id })
      .returning();
    return created;
  }

  async updateExpense(id: string, userId: string, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    // First check if user has access to this expense
    const existing = await this.getExpense(id, userId);
    if (!existing) {
      return undefined;
    }

    const [updated] = await this.db
      .update(schema.expenses)
      .set(expense)
      .where(eq(schema.expenses.id, id))
      .returning();
    return updated;
  }

  async deleteExpense(id: string, userId: string): Promise<void> {
    // First check if user has access to this expense
    const existing = await this.getExpense(id, userId);
    if (!existing) {
      return;
    }

    await this.db.delete(schema.expenses).where(eq(schema.expenses.id, id));
  }

  // ========== ANALYTICS ==========
  // CRITICAL: Filter aggregations by userId for personal analytics
  async getFamilySpendingByCategory(
    familyId: string,
    userId: string,
    month: number,
    year: number
  ): Promise<Array<{
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
    total: string;
  }>> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await this.db
      .select({
        categoryId: schema.categories.id,
        categoryName: schema.categories.name,
        categoryColor: schema.categories.color,
        categoryIcon: schema.categories.icon,
        total: sql<string>`COALESCE(SUM(CAST(${schema.expenses.amount} AS NUMERIC)), 0)::text`,
      })
      .from(schema.expenses)
      .innerJoin(schema.categories, eq(schema.expenses.categoryId, schema.categories.id))
      .where(
        and(
          eq(schema.expenses.familyId, familyId),
          gte(schema.expenses.date, startDate),
          lte(schema.expenses.date, endDate),
          or(
            eq(schema.categories.isPrivate, false),
            eq(schema.categories.userId, userId)
          )
        )
      )
      .groupBy(
        schema.categories.id,
        schema.categories.name,
        schema.categories.color,
        schema.categories.icon
      );

    return result;
  }

  async getTotalSpending(familyId: string, userId: string, month: number, year: number): Promise<string> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${schema.expenses.amount} AS NUMERIC)), 0)::text`,
      })
      .from(schema.expenses)
      .innerJoin(schema.categories, eq(schema.expenses.categoryId, schema.categories.id))
      .where(
        and(
          eq(schema.expenses.familyId, familyId),
          gte(schema.expenses.date, startDate),
          lte(schema.expenses.date, endDate),
          or(
            eq(schema.categories.isPrivate, false),
            eq(schema.categories.userId, userId)
          )
        )
      );

    return result[0]?.total || '0';
  }

  async getPersonalSpending(userId: string, month: number, year: number): Promise<string> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${schema.expenses.amount} AS NUMERIC)), 0)::text`,
      })
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.userId, userId),
          gte(schema.expenses.date, startDate),
          lte(schema.expenses.date, endDate)
        )
      );

    return result[0]?.total || '0';
  }

  // ========== INVITES ==========
  async getInvite(token: string): Promise<Invite | undefined> {
    return await this.db.query.invites.findFirst({
      where: eq(schema.invites.token, token),
    });
  }

  async getInvitesByFamily(familyId: string): Promise<Invite[]> {
    return await this.db.query.invites.findMany({
      where: eq(schema.invites.familyId, familyId),
      orderBy: [desc(schema.invites.createdAt)],
    });
  }

  async createInvite(invite: Omit<InsertInvite, 'id'>): Promise<Invite> {
    const id = nanoid();
    const [created] = await this.db
      .insert(schema.invites)
      .values({ ...invite, id })
      .returning();
    return created;
  }

  async updateInviteStatus(id: string, status: 'accepted' | 'expired'): Promise<void> {
    await this.db
      .update(schema.invites)
      .set({ status })
      .where(eq(schema.invites.id, id));
  }

  // ========== NOTIFICATIONS ==========
  async getNotifications(userId: string): Promise<Notification[]> {
    return await this.db.query.notifications.findMany({
      where: eq(schema.notifications.userId, userId),
      orderBy: [desc(schema.notifications.createdAt)],
    });
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false)
        )
      );

    return result[0]?.count || 0;
  }

  async createNotification(notification: Omit<InsertNotification, 'id'>): Promise<Notification> {
    const id = nanoid();
    const [created] = await this.db
      .insert(schema.notifications)
      .values({ ...notification, id })
      .returning();
    return created;
  }

  async markNotificationAsRead(id: string, userId: string): Promise<void> {
    await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.notifications.id, id),
          eq(schema.notifications.userId, userId)
        )
      );
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await this.db
      .delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.id, id),
          eq(schema.notifications.userId, userId)
        )
      );
  }

  // ========== OAUTH ACCOUNTS ==========
  async getOauthAccount(provider: string, providerAccountId: string): Promise<OauthAccount | undefined> {
    return await this.db.query.oauthAccounts.findFirst({
      where: and(
        eq(schema.oauthAccounts.provider, provider),
        eq(schema.oauthAccounts.providerAccountId, providerAccountId)
      ),
    });
  }

  async getOauthAccountsByUser(userId: string): Promise<OauthAccount[]> {
    return await this.db.query.oauthAccounts.findMany({
      where: eq(schema.oauthAccounts.userId, userId),
    });
  }

  async createOauthAccount(account: Omit<InsertOauthAccount, 'id'>): Promise<OauthAccount> {
    const id = nanoid();
    const [created] = await this.db
      .insert(schema.oauthAccounts)
      .values({ ...account, id })
      .returning();
    return created;
  }

  async updateOauthAccount(id: string, account: Partial<InsertOauthAccount>): Promise<OauthAccount | undefined> {
    const [updated] = await this.db
      .update(schema.oauthAccounts)
      .set(account)
      .where(eq(schema.oauthAccounts.id, id))
      .returning();
    return updated;
  }

  async findOrCreateOauthUser(profile: {
    provider: 'google' | 'apple' | 'microsoft' | 'facebook';
    providerAccountId: string;
    email: string;
    fullName?: string;
    profilePicture?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  }): Promise<User> {
    // Check if OAuth account already exists
    const existingOauth = await this.getOauthAccount(profile.provider, profile.providerAccountId);

    if (existingOauth) {
      // Update tokens
      await this.updateOauthAccount(existingOauth.id, {
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        expiresAt: profile.expiresAt,
      });
      const user = await this.getUser(existingOauth.userId);
      return user!;
    }

    // Check if user with this email exists
    const existingUser = await this.getUserByEmail(profile.email);

    if (existingUser) {
      // Link OAuth account to existing user
      await this.createOauthAccount({
        userId: existingUser.id,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        expiresAt: profile.expiresAt,
      });

      // Update profile picture if not set
      if (!existingUser.profilePicture && profile.profilePicture) {
        await this.updateUser(existingUser.id, { profilePicture: profile.profilePicture });
      }

      return existingUser;
    }

    // Create new user + OAuth account
    const userId = nanoid();
    const user = await this.createUser({
      id: userId,
      email: profile.email,
      password: null,
      fullName: profile.fullName,
      profilePicture: profile.profilePicture,
      authProvider: profile.provider,
    });

    await this.createOauthAccount({
      userId: user.id,
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
      expiresAt: profile.expiresAt,
    });

    return user;
  }

  // ========== REVOLUT ==========
  async getRevolutConnection(userId: string): Promise<RevolutConnection | undefined> {
    return await this.db.query.revolutConnections.findFirst({
      where: eq(schema.revolutConnections.userId, userId),
    });
  }

  async upsertRevolutConnection(connection: Omit<InsertRevolutConnection, 'id'>): Promise<RevolutConnection> {
    const existing = await this.getRevolutConnection(connection.userId);

    if (existing) {
      const [updated] = await this.db
        .update(schema.revolutConnections)
        .set(connection)
        .where(eq(schema.revolutConnections.id, existing.id))
        .returning();
      return updated;
    }

    const id = nanoid();
    const [created] = await this.db
      .insert(schema.revolutConnections)
      .values({ ...connection, id })
      .returning();
    return created;
  }

  async deleteRevolutConnection(userId: string): Promise<void> {
    await this.db
      .delete(schema.revolutConnections)
      .where(eq(schema.revolutConnections.userId, userId));
  }
}
