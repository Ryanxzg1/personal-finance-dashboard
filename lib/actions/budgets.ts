"use server"

import { db } from "@/lib/db"
import { budgets, categories } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { eq, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

import { budgetSchema } from "@/lib/validations/budget"
import { z } from "zod"

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
  } catch (error: unknown) {
    console.error("Failed to fetch budgets:", error);
    return { success: false, error: "Gagal mengambil anggaran" };
  }
}

/**
 * Membuat atau memperbarui budget
 */
export async function upsertBudget(data: z.infer<typeof budgetSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Validasi dengan Zod
    const validatedData = budgetSchema.parse(data);

    // Security check: Pastikan categoryId milik userId yang login (cegah IDOR)
    const userCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, validatedData.categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (userCategory.length === 0) {
      return { success: false, error: "Kategori tidak ditemukan atau bukan milik Anda" };
    }

    // Cek apakah sudah ada budget untuk kategori + bulan ini
    const existing = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.categoryId, validatedData.categoryId),
          eq(budgets.month, validatedData.month),
          eq(budgets.year, validatedData.year)
        )
      );

    if (existing.length > 0) {
      // Update
      await db
        .update(budgets)
        .set({ limitAmount: validatedData.limitAmount })
        .where(eq(budgets.id, existing[0].id));
    } else {
      // Insert
      await db.insert(budgets).values({
        userId,
        categoryId: validatedData.categoryId,
        limitAmount: validatedData.limitAmount,
        month: validatedData.month,
        year: validatedData.year,
      });
    }

    revalidatePath("/kategori");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to upsert budget:", error);
    return { success: false, error: "Gagal menyimpan anggaran" };
  }
}
