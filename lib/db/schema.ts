import { pgTable, serial, text, numeric, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
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

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
