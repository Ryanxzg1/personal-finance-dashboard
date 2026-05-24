"use server"

import { db } from "@/lib/db"
import { categories, budgets } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { eq, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

import { categorySchema } from "@/lib/validations/category"
import { z } from "zod"

function revalidateAll() {
  revalidatePath("/kategori")
  revalidatePath("/")
  revalidatePath("/riwayat")
}

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

    const validatedData = categorySchema.parse(data);

    // Bug fix: Cek duplikasi nama kategori milik user yang sama
    const existing = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          eq(categories.name, validatedData.name),
          eq(categories.type, validatedData.type)
        )
      );

    if (existing.length > 0) {
      return { success: false, error: `Kategori "${validatedData.name}" sudah ada` };
    }

    await db.insert(categories).values({
      ...validatedData,
      userId,
    });

    revalidateAll();
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to create category:", error);
    return { success: false, error: "Gagal membuat kategori" };
  }
}

/**
 * Menghapus kategori beserta budgetnya
 */
export async function deleteCategory(id: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Verifikasi kategori milik user (security check)
    const [categoryToDelete] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));

    if (!categoryToDelete) {
      return { success: false, error: "Kategori tidak ditemukan" };
    }

    // Hapus anggaran (budgets) terkait terlebih dahulu
    await db.delete(budgets).where(
      and(
        eq(budgets.categoryId, id),
        eq(budgets.userId, userId)
      )
    );

    // Hapus kategori
    await db.delete(categories).where(
      and(
        eq(categories.id, id),
        eq(categories.userId, userId)
      )
    );

    revalidateAll();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Gagal menghapus kategori" };
  }
}
