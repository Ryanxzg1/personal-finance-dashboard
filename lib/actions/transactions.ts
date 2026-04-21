"use server"

import { db } from "@/lib/db"
import { transactions, NewTransaction } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { eq, desc, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

/**
 * Menambahkan transaksi baru ke database
 */
export async function createTransaction(data: Omit<NewTransaction, "userId">) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const result = await db.insert(transactions).values({
      ...data,
      userId,
      date: data.date ? new Date(data.date) : new Date(),
    }).returning();
    
    revalidatePath("/");
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return { success: false, error: "Gagal menambahkan transaksi" };
  }
}

/**
 * Mengambil semua transaksi dari database
 */
export async function getTransactions() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const items = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
      
    return { success: true, data: items as (typeof transactions.$inferSelect)[] };
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return { success: false, error: "Gagal mengambil data transaksi" };
  }
}

/**
 * Menghapus transaksi berdasarkan ID
 */
export async function deleteTransaction(id: string | number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const numericId = typeof id === "string" ? parseInt(id) : id;

    await db.delete(transactions).where(
      and(
        eq(transactions.id, numericId),
        eq(transactions.userId, userId)
      )
    );

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return { success: false, error: "Gagal menghapus transaksi" };
  }
}

/**
 * Memperbarui transaksi yang sudah ada
 */
export async function updateTransaction(id: string | number, data: Partial<NewTransaction>) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const numericId = typeof id === "string" ? parseInt(id) : id;

    await db.update(transactions)
      .set({
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      })
      .where(
        and(
          eq(transactions.id, numericId),
          eq(transactions.userId, userId)
        )
      );

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return { success: false, error: "Gagal memperbarui transaksi" };
  }
}
