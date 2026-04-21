"use server"

import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { eq, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

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
export async function createCategory(data: { name: string; type: "income" | "expense"; icon?: string }) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.insert(categories).values({
      ...data,
      userId,
    });

    revalidatePath("/kategori");
    return { success: true };
  } catch (error) {
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
