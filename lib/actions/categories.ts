"use server"

import { db } from "@/lib/db"
import { categories, budgets } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { eq, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

import { categorySchema } from "@/lib/validations/category"
import { z } from "zod"

/**
 * Mengambil semua kategori milik user
 */
export async function getCategories() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const data = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));
      
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return { success: false, error: "Gagal mengambil kategori" };
  }
}

/**
 * Menambah kategori baru
 */
export async function createCategory(data: z.infer<typeof categorySchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Validasi dengan Zod
    const validatedData = categorySchema.parse(data);

    await db.insert(categories).values({
      ...validatedData,
      userId,
    });

    revalidatePath("/kategori");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Failed to create category:", error);
    return { success: false, error: "Gagal membuat kategori" };
  }
}

/**
 * Menghapus kategori
 */
export async function deleteCategory(id: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Hapus anggaran (budgets) yang terkait dengan kategori ini terlebih dahulu
    await db.delete(budgets).where(
      and(
        eq(budgets.categoryId, id),
        eq(budgets.userId, userId)
      )
    );

    await db.delete(categories).where(
      and(
        eq(categories.id, id),
        eq(categories.userId, userId)
      )
    );

    revalidatePath("/kategori");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Gagal menghapus kategori" };
  }
}
