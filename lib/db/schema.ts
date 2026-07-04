import { pgTable, serial, text, numeric, timestamp, varchar, integer, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }), // Optional for backward compatibility or global tracking
  type: varchar("type", { length: 20 }).notNull(), // 'income' or 'expense'
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("transactions_user_id_idx").on(table.userId),
  index("transactions_date_idx").on(table.date),
  index("transactions_account_id_idx").on(table.accountId),
  index("transactions_category_idx").on(table.category),
]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'income' or 'expense'
}, (table) => [
  index("categories_user_id_idx").on(table.userId),
]);

export const budgets = pgTable("personal_budgets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
  limitAmount: numeric("limit_amount", { precision: 12, scale: 2 }).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
}, (table) => [
  index("personal_budgets_user_id_idx").on(table.userId),
  index("personal_budgets_category_id_idx").on(table.categoryId),
]);

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'bank', 'cash', 'e-wallet', etc.
  initialBalance: numeric("initial_balance", { precision: 12, scale: 2 }).default("0").notNull(),
  color: varchar("color", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("accounts_user_id_idx").on(table.userId),
]);

export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  monthlyTarget: numeric("monthly_target", { precision: 12, scale: 2 }),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("savings_goals_user_id_idx").on(table.userId),
]);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type NewSavingsGoal = typeof savingsGoals.$inferInsert;

export const weeklyReportDeliveries = pgTable("weekly_report_deliveries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  attemptCount: integer("attempt_count").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  lastError: text("last_error"),
  resendEmailId: varchar("resend_email_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("weekly_report_deliveries_user_id_idx").on(table.userId),
  index("weekly_report_deliveries_status_idx").on(table.status),
  index("weekly_report_deliveries_period_start_idx").on(table.periodStart),
  uniqueIndex("weekly_report_deliveries_user_period_uidx").on(table.userId, table.periodStart, table.periodEnd),
]);

export type WeeklyReportDelivery = typeof weeklyReportDeliveries.$inferSelect;
export type NewWeeklyReportDelivery = typeof weeklyReportDeliveries.$inferInsert;

// --- THE BLUEPRINT (EXPENSE PLANNING) ---
export const blueprintPlans = pgTable("blueprint_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("blueprint_plans_user_id_idx").on(table.userId),
]);

export const blueprintItems = pgTable("blueprint_items", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => blueprintPlans.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  isEssential: boolean("is_essential").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("blueprint_items_plan_id_idx").on(table.planId),
]);

export const blueprintPlansRelations = relations(blueprintPlans, ({ many }) => ({
  items: many(blueprintItems),
}));

export const blueprintItemsRelations = relations(blueprintItems, ({ one }) => ({
  plan: one(blueprintPlans, {
    fields: [blueprintItems.planId],
    references: [blueprintPlans.id],
  }),
}));

export type BlueprintPlan = typeof blueprintPlans.$inferSelect;
export type NewBlueprintPlan = typeof blueprintPlans.$inferInsert;
export type BlueprintItem = typeof blueprintItems.$inferSelect;
export type NewBlueprintItem = typeof blueprintItems.$inferInsert;
