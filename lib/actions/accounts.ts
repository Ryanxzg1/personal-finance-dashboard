"use server"

import { db } from "@/lib/db"
import { accounts, transactions } from "@/lib/db/schema"
import { revalidatePath } from "next/cache"
import { eq, and } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import { accountSchema } from "@/lib/validations/account"
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
export async function createAccount(data: z.infer<typeof accountSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validatedData = accountSchema.parse(data);

    const [newAccount] = await db.insert(accounts).values({
      ...validatedData,
      initialBalance: "0", // Selalu 0 di tabel agar tidak double counting
      userId,
    }).returning();
    
    const initialBalanceNum = parseFloat(validatedData.initialBalance);
    if (!isNaN(initialBalanceNum) && initialBalanceNum > 0) {
      await db.insert(transactions).values({
        userId,
        accountId: newAccount.id,
        amount: initialBalanceNum.toString(),
        category: "Saldo Awal",
        description: `Saldo awal dompet ${validatedData.name}`,
        type: "income",
        date: new Date(),
      });
    }

    revalidateAll();
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
 * Menghapus akun beserta seluruh transaksinya
 */
export async function deleteAccount(id: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Verifikasi akun milik user sebelum menghapus (security check)
    const [accountToDelete] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    
    if (!accountToDelete) {
      return { success: false, error: "Akun tidak ditemukan" };
    }

    // Hapus semua transaksi terkait terlebih dahulu (foreign key constraint)
    await db.delete(transactions).where(
      and(
        eq(transactions.accountId, id),
        eq(transactions.userId, userId)
      )
    );

    // Hapus akun
    await db.delete(accounts).where(
      and(
        eq(accounts.id, id),
        eq(accounts.userId, userId)
      )
    );

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
export async function updateAccount(id: number, data: z.infer<typeof accountSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validatedData = accountSchema.parse(data);

    // Verifikasi akun milik user (security check)
    const [oldAccount] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    
    if (!oldAccount) {
      return { success: false, error: "Akun tidak ditemukan" };
    }

    // Karena kita sekarang menggunakan transaksi 100% untuk saldo,
    // Kita tidak perlu menghitung diff terhadap initialBalance tabel (karena tabel selalu 0).
    // Kita biarkan user mengedit nama/tipe saja di sini.
    // Jika mereka ingin koreksi saldo, mereka harus buat transaksi penyesuaian manual
    // atau kita bisa hapus logika diff ini untuk sementara agar tidak bingung.

    await db.update(accounts)
      .set({ 
        name: validatedData.name,
        type: validatedData.type,
        initialBalance: "0" // Pastikan tetap 0
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
      return { success: false, error: error.errors[0].message };
    }
    console.error("Failed to update account:", error);
    return { success: false, error: "Gagal memperbarui akun" };
  }
}

/**
 * HARD RESET: Menghapus SEMUA data user dari database
 */
export async function hardResetDatabase() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Hapus dari semua tabel terkait secara berurutan
    // Import tabel lain jika perlu (budgets, categories, dll)
    // Untuk amannya, kita import dinamis atau pastikan sudah ada di schema yang diimport
    const { budgets, categories, savingsGoals, blueprintPlans, blueprintItems } = await import("@/lib/db/schema");

    await db.delete(transactions).where(eq(transactions.userId, userId));
    await db.delete(budgets).where(eq(budgets.userId, userId));
    await db.delete(savingsGoals).where(eq(savingsGoals.userId, userId));
    await db.delete(blueprintItems).where(eq(blueprintItems.planId, -1)); // Logika item sedikit beda tapi userId dipake di plan
    // Sebenarnya cascading delete harusnya handle blueprintItems jika plan dihapus
    await db.delete(blueprintPlans).where(eq(blueprintPlans.userId, userId));
    await db.delete(accounts).where(eq(accounts.userId, userId));
    await db.delete(categories).where(eq(categories.userId, userId));

    revalidatePath("/");
    revalidatePath("/kategori");
    revalidatePath("/riwayat");
    revalidatePath("/tabungan");
    revalidatePath("/pemetaan");

    return { success: true };
  } catch (error) {
    console.error("Failed to hard reset database:", error);
    return { success: false, error: "Gagal mereset total database" };
  }
}

