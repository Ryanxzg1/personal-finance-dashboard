"use server"

import { db } from "@/lib/db"
import { accounts } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { eq, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { accountSchema } from "@/lib/validations/account"
import { z } from "zod"

/**
 * Mengambil semua akun milik user
 */
export async function getAccounts() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const data = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));
      
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return { success: false, error: "Gagal mengambil data akun" };
  }
}

/**
 * Menambah akun baru
 */
export async function createAccount(data: z.infer<typeof accountSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Validasi dengan Zod
    const validatedData = accountSchema.parse(data);

    await db.insert(accounts).values({
      ...validatedData,
      userId,
    });

    revalidatePath("/kategori");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Failed to create account:", error);
    return { success: false, error: "Gagal membuat akun" };
  }
}

/**
 * Menghapus akun
 */
export async function deleteAccount(id: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await db.delete(accounts).where(
      and(
        eq(accounts.id, id),
        eq(accounts.userId, userId)
      )
    );

    revalidatePath("/kategori");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete account:", error);
    return { success: false, error: "Gagal menghapus akun" };
  }
}

/**
 * Memperbarui akun
 */
export async function updateAccount(id: number, data: z.infer<typeof accountSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validatedData = accountSchema.parse(data);

    await db.update(accounts)
      .set({
        ...validatedData,
      })
      .where(
        and(
          eq(accounts.id, id),
          eq(accounts.userId, userId)
        )
      );

    revalidatePath("/kategori");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Failed to update account:", error);
    return { success: false, error: "Gagal memperbarui akun" };
  }
}
