import { pgTable, serial, text, numeric, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  accountId: integer("account_id").references(() => accounts.id), // Optional for backward compatibility or global tracking
  type: varchar("type", { length: 20 }).notNull(), // 'income' or 'expense'
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'income' or 'expense'
  icon: varchar("icon", { length: 50 }),
});

export const budgets = pgTable("personal_budgets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  limitAmount: numeric("limit_amount").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'bank', 'cash', 'e-wallet', etc.
  initialBalance: numeric("initial_balance", { precision: 12, scale: 2 }).default("0").notNull(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  monthlyTarget: numeric("monthly_target", { precision: 12, scale: 2 }),
  icon: varchar("icon", { length: 50 }),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type NewSavingsGoal = typeof savingsGoals.$inferInsert;
