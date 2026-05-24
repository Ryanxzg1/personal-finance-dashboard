"use server"

import { db } from "@/lib/db"
import { transactions, accounts, NewTransaction } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { eq, desc, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { transactionSchema } from "@/lib/validations/transaction"
import { z } from "zod"

function revalidateAll() {
  revalidatePath("/")
  revalidatePath("/riwayat")
  revalidatePath("/kategori")
}

/**
 * Menambahkan transaksi baru ke database
 */
export async function createTransaction(data: Omit<NewTransaction, "userId">) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validatedData = transactionSchema.parse({
      ...data,
      date: data.date ? new Date(data.date) : new Date(),
    });

    // Security check: Pastikan accountId milik userId yang login (cegah IDOR)
    if (validatedData.accountId) {
      const userAccount = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.id, validatedData.accountId), eq(accounts.userId, userId)))
        .limit(1);

      if (userAccount.length === 0) {
        return { success: false, error: "Akun tidak ditemukan atau bukan milik Anda" };
      }
    }

    // Bug fix: Pastikan amount selalu tersimpan sebagai angka absolut (positif).
    // Tipe "income"/"expense" yang menentukan apakah itu +/-, bukan tanda pada amount.
    const absAmount = Math.abs(parseFloat(validatedData.amount)).toString();

    const result = await db.insert(transactions).values({
      ...validatedData,
      userId,
      amount: absAmount,
      accountId: validatedData.accountId,
    }).returning();
    
    revalidateAll();
    return { success: true, data: result[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
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

    // Bug fix: Verifikasi transaksi milik user sebelum menghapus (security check)
    const result = await db.delete(transactions).where(
      and(
        eq(transactions.id, numericId),
        eq(transactions.userId, userId)
      )
    ).returning();

    if (result.length === 0) {
      return { success: false, error: "Transaksi tidak ditemukan" };
    }

    revalidateAll();
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

    const validatedData = transactionSchema.partial().parse({
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    });

    // Security check: Pastikan accountId yang baru (jika diubah) adalah milik userId yang login (cegah IDOR)
    if (validatedData.accountId) {
      const userAccount = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.id, validatedData.accountId), eq(accounts.userId, userId)))
        .limit(1);

      if (userAccount.length === 0) {
        return { success: false, error: "Akun tidak ditemukan atau bukan milik Anda" };
      }
    }

    // Bug fix: Pastikan amount selalu absolut jika ada perubahan
    const updatePayload: Partial<NewTransaction> = { ...validatedData };
    if (updatePayload.amount !== undefined) {
      updatePayload.amount = Math.abs(parseFloat(updatePayload.amount)).toString();
    }

    // Bug fix: Verifikasi transaksi milik user sebelum mengupdate (security check)
    const result = await db.update(transactions)
      .set(updatePayload)
      .where(
        and(
          eq(transactions.id, numericId),
          eq(transactions.userId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return { success: false, error: "Transaksi tidak ditemukan" };
    }

    revalidateAll();
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to update transaction:", error);
    return { success: false, error: "Gagal memperbarui transaksi" };
  }
}

/**
 * Transfer dana antar dompet
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

    const amountNum = parseFloat(data.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { success: false, error: "Nominal transfer tidak valid" };
    }

    // Bug fix: Validasi tidak boleh transfer ke dompet yang sama
    if (data.fromAccountId === data.toAccountId) {
      return { success: false, error: "Tidak dapat transfer ke dompet yang sama" };
    }

    // Security check: Verifikasi kepemilikan kedua akun (asal dan tujuan) oleh user yang login (cegah IDOR)
    const fromAccount = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, data.fromAccountId), eq(accounts.userId, userId)))
      .limit(1);

    const toAccount = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, data.toAccountId), eq(accounts.userId, userId)))
      .limit(1);

    if (fromAccount.length === 0 || toAccount.length === 0) {
      return { success: false, error: "Satu atau kedua akun tidak ditemukan atau bukan milik Anda" };
    }

    // 1. Transaksi Keluar dari Dompet Asal (amount selalu absolut, type="expense" menentukan pengurangan)
    await db.insert(transactions).values({
      userId,
      accountId: data.fromAccountId,
      amount: amountNum.toString(),
      category: "Transfer Keluar",
      description: `Transfer ke ${data.toAccountName}`,
      type: "expense",
      date: data.date,
    });

    // 2. Transaksi Masuk ke Dompet Tujuan
    await db.insert(transactions).values({
      userId,
      accountId: data.toAccountId,
      amount: amountNum.toString(),
      category: "Transfer Masuk",
      description: `Terima transfer dari ${data.fromAccountName}`,
      type: "income",
      date: data.date,
    });

    revalidateAll();
    return { success: true };
  } catch (error) {
    console.error("Failed to transfer funds:", error);
    return { success: false, error: "Gagal melakukan transfer" };
  }
}
