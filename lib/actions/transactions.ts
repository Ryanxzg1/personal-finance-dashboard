"use server"

import { db } from "@/lib/db"
import { transactions, NewTransaction } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { eq, desc, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { transactionSchema } from "@/lib/validations/transaction"
import { z } from "zod"

/**
 * Menambahkan transaksi baru ke database
 */
export async function createTransaction(data: Omit<NewTransaction, "userId">) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Validasi dengan Zod
    const validatedData = transactionSchema.parse({
      ...data,
      date: data.date ? new Date(data.date) : new Date(),
    });

    const result = await db.insert(transactions).values({
      ...validatedData,
      userId,
      // Drizzle numeric handle string, so validatedData.amount (string) is fine
      amount: validatedData.amount,
      accountId: validatedData.accountId,
    }).returning();
    
    revalidatePath("/");
    return { success: true, data: result[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
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
    if (!userId) return { success: false, error: "Unauthorized" };

    const numericId = typeof id === "string" ? parseInt(id) : id;

    // Pastikan data yang diperbarui valid (mengambil data yang ada jika hanya sebagian yang dikirim)
    // Untuk mempermudah, kita validasi per field atau asumsi data parsial valid jika lolos schema opsional
    // Namun karena transactionSchema mewajibkan semua, kita gunakan .partial()
    const validatedData = transactionSchema.partial().parse({
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    });

    await db.update(transactions)
      .set({
        ...validatedData,
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
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Failed to update transaction:", error);
    return { success: false, error: "Gagal memperbarui transaksi" };
  }
}

/**
 * Transfer dana antar dompet (Sumber Dana)
 */
export async function transferFunds(data: {
  fromAccountId: number;
  toAccountId: number;
  fromAccountName: string;
  toAccountName: string;
  amount: string;
  date: Date;
}) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Validasi nominal
    const amountNum = parseFloat(data.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { success: false, error: "Nominal transfer tidak valid" };
    }

    // 1. Transaksi Keluar dari Dompet Asal
    await db.insert(transactions).values({
      userId,
      accountId: data.fromAccountId,
      amount: (-amountNum).toString(), // Harus negatif untuk pengeluaran
      category: "Transfer Keluar",
      description: `Transfer ke ${data.toAccountName}`,
      type: "expense",
      date: data.date,
    });

    // 2. Transaksi Masuk ke Dompet Tujuan
    await db.insert(transactions).values({
      userId,
      accountId: data.toAccountId,
      amount: amountNum.toString(), // Positif untuk pemasukan
      category: "Transfer Masuk",
      description: `Terima transfer dari ${data.fromAccountName}`,
      type: "income",
      date: data.date,
    });

    revalidatePath("/");
    revalidatePath("/kategori");
    revalidatePath("/riwayat");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to transfer funds:", error);
    return { success: false, error: "Gagal melakukan transfer" };
  }
}
