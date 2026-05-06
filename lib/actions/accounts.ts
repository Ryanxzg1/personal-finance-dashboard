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
      userId,
    }).returning();
    
    // AUDIT LOG: Catat saldo awal sebagai transaksi pemasukan
    // Bug fix: gunakan Math.abs untuk memastikan saldo awal selalu positif
    const initialBalanceNum = parseFloat(validatedData.initialBalance);
    if (!isNaN(initialBalanceNum) && initialBalanceNum > 0) {
      await db.insert(transactions).values({
        userId,
        accountId: newAccount.id,
        amount: initialBalanceNum.toString(), // Pastikan selalu positif
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

    // Bug fix: Gunakan Math.abs untuk mencegah nilai negatif pada saldo
    const oldInitial = parseFloat(oldAccount.initialBalance);
    const newInitial = parseFloat(validatedData.initialBalance);
    
    if (isNaN(newInitial)) {
      return { success: false, error: "Saldo tidak valid" };
    }

    const diff = newInitial - oldInitial;

    // Catat transaksi penyesuaian jika ada perubahan saldo
    if (diff !== 0) {
      await db.insert(transactions).values({
        userId,
        accountId: id,
        // Bug fix: simpan nilai absolut, tipe menentukan +/-
        amount: Math.abs(diff).toString(),
        category: "Penyesuaian Saldo",
        description: `Penyesuaian saldo dompet ${validatedData.name}`,
        type: diff > 0 ? "income" : "expense",
        date: new Date(),
      });
    }

    await db.update(accounts)
      .set({ ...validatedData })
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
