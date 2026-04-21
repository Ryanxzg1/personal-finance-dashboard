"use server"

import { db } from "@/lib/db"
import { budgets } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { eq, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

/**
 * Mengambil semua budget user untuk bulan/tahun tertentu
 */
export async function getBudgets(month: number, year: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const data = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.month, month),
          eq(budgets.year, year)
        )
      );
      
    return { success: true, data };
  } catch (error: any) {
    console.error("DEBUG - Full Budget Error:", error.message, error.stack);
    return { success: false, error: "Gagal mengambil anggaran" };
  }
}

/**
 * Membuat atau memperbarui budget
 */
export async function upsertBudget(data: { categoryId: number; amount: string; month: number; year: number }) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Cek apakah sudah ada budget untuk kategori + bulan ini
    const existing = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.categoryId, data.categoryId),
          eq(budgets.month, data.month),
          eq(budgets.year, data.year)
        )
      );

    if (existing.length > 0) {
      // Update
      await db
        .update(budgets)
        .set({ limitAmount: data.amount })
        .where(eq(budgets.id, existing[0].id));
    } else {
      // Insert
      await db.insert(budgets).values({
        userId,
        categoryId: data.categoryId,
        limitAmount: data.amount,
        month: data.month,
        year: data.year,
      });
    }

    revalidatePath("/kategori");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to upsert budget:", error);
    return { success: false, error: "Gagal menyimpan anggaran" };
  }
}
