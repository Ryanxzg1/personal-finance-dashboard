"use server"

import { db } from "@/lib/db"
import { accounts } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { eq, and, sql } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { createAccountSchema, updateAccountSchema, adjustBalanceSchema } from "@/lib/validations/account"
import { z } from "zod"

const REVALIDATE_PATHS = ["/", "/kategori", "/riwayat"]

function revalidateAll() {
  REVALIDATE_PATHS.forEach((path) => revalidatePath(path))
}

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
export async function createAccount(data: z.infer<typeof createAccountSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validatedData = createAccountSchema.parse(data);
    const initialBalanceNum = parseFloat(validatedData.initialBalance);

    // Satu statement SQL atomik: buat akun lalu, jika ada saldo awal, buat transaksi saldo awal.
    await db.execute(sql`
      WITH new_account AS (
        INSERT INTO accounts (user_id, name, type, initial_balance)
        VALUES (${userId}, ${validatedData.name}, ${validatedData.type}, 0)
        RETURNING id, name
      )
      INSERT INTO transactions (user_id, account_id, description, amount, category, type, date)
      SELECT
        ${userId},
        new_account.id,
        ${sql`'Saldo awal dompet ' || new_account.name`},
        ${initialBalanceNum.toString()},
        'Saldo Awal',
        'income',
        NOW()
      FROM new_account
      WHERE ${initialBalanceNum} > 0
    `);

    revalidateAll();
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to create account:", error);
    return { success: false, error: "Gagal membuat akun" };
  }
}

/**
 * Menghapus akun beserta seluruh transaksinya
 */
export async function deleteAccount(id: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Satu delete cascade: transaksi terkait ikut terhapus lewat FK onDelete cascade.
    const deleted = await db.delete(accounts).where(
      and(
        eq(accounts.id, id),
        eq(accounts.userId, userId)
      )
    ).returning({ id: accounts.id });

    if (deleted.length === 0) {
      return { success: false, error: "Akun tidak ditemukan" };
    }

    revalidateAll();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete account:", error);
    return { success: false, error: "Gagal menghapus akun" };
  }
}

/**
 * Memperbarui akun
 */
export async function updateAccount(id: number, data: z.infer<typeof updateAccountSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validatedData = updateAccountSchema.parse(data);

    // Verifikasi akun milik user (security check)
    const [oldAccount] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    
    if (!oldAccount) {
      return { success: false, error: "Akun tidak ditemukan" };
    }

    await db.update(accounts)
      .set({ 
        name: validatedData.name,
        type: validatedData.type
      })
      .where(
        and(
          eq(accounts.id, id),
          eq(accounts.userId, userId)
        )
      );

    revalidateAll();
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to update account:", error);
    return { success: false, error: "Gagal memperbarui akun" };
  }
}

/**
 * Menyesuaikan saldo akun (dengan mutasi transaksi Ledger)
 */
export async function adjustAccountBalance(data: z.infer<typeof adjustBalanceSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validatedData = adjustBalanceSchema.parse(data);

    // Pastikan akun itu milik user
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, validatedData.accountId), eq(accounts.userId, userId)));
    
    if (!account) return { success: false, error: "Akun tidak ditemukan" };

    // Bikin transaksi teknis penyesuaian saldo
    const txType = validatedData.direction === "increase" ? "income" : "expense";
    
    await db.execute(sql`
      INSERT INTO transactions (user_id, account_id, description, amount, category, type, date)
      VALUES (
        ${userId}, 
        ${validatedData.accountId}, 
        ${validatedData.note || 'Penyesuaian Saldo'}, 
        ${validatedData.amount.toString()}, 
        'Penyesuaian Sistem', 
        ${txType}, 
        NOW()
      )
    `);

    revalidateAll();
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message };
    console.error("Failed to adjust balance:", error);
    return { success: false, error: "Gagal menyesuaikan saldo" };
  }
}
