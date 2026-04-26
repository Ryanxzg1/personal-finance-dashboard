import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await db
      .select({
        totalIncome: sql<number>`SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END)`,
        totalExpense: sql<number>`SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)`,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    const totalIncome = Number(stats[0]?.totalIncome || 0);
    const totalExpense = Number(stats[0]?.totalExpense || 0);
    const balance = totalIncome - totalExpense;

    return NextResponse.json({
      totalIncome,
      totalExpense,
      balance,
    });
  } catch (error) {
    console.error("[STATS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
