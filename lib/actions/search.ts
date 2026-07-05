"use server"

import { db } from "@/lib/db";
import { transactions, categories, accounts } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, ilike, or, and, sql } from "drizzle-orm";

export async function searchEverything(query: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!query || query.length < 2) return { success: true, data: { transactions: [], categories: [], accounts: [] } };

    const [txResults, catResults, accResults] = await Promise.all([
      db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            or(
              ilike(transactions.description, `%${query}%`),
              ilike(transactions.category, `%${query}%`),
              ilike(sql<string>`cast(${transactions.amount} as text)`, `%${query}%`)
            )
          )
        )
        .limit(10),
      db
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.userId, userId),
            ilike(categories.name, `%${query}%`)
          )
        )
        .limit(5),
      db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, userId),
            ilike(accounts.name, `%${query}%`)
          )
        )
        .limit(5),
    ]);

    return {
      success: true,
      data: {
        transactions: txResults,
        categories: catResults,
        accounts: accResults,
      },
    };
  } catch (error) {
    console.error("Search failed:", error);
    return { success: false, error: "Gagal melakukan pencarian" };
  }
}
