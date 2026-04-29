"use server"

import { db } from "@/lib/db"
import { accounts, transactions } from "@/lib/db/schema"
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

    const [newAccount] = await db.insert(accounts).values({
      ...validatedData,
      userId,
    }).returning();
    
    // AUDIT LOG: Catat saldo awal sebagai transaksi pemasukan
    if (parseFloat(validatedData.initialBalance) > 0) {
      await db.insert(transactions).values({
        userId,
        accountId: newAccount.id,
        amount: validatedData.initialBalance,
        category: "Saldo Awal",
        description: `Saldo awal dompet ${validatedData.name}`,
        type: "income",
        date: new Date(),
      });
    }

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

    // AUDIT LOG: Hitung selisih saldo untuk pencatatan transaksi penyesuaian
    const [oldAccount] = await db.select().from(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    
    if (oldAccount) {
      // Kita asumsikan initialBalance yang dikirim adalah saldo baru yang diinginkan
      // Namun di sistem ini, saldo dihitung dari initialBalance + total transaksi.
      // Jadi jika user mengedit 'Saldo Awal', kita catat selisihnya.
      const oldInitial = parseFloat(oldAccount.initialBalance);
      const newInitial = parseFloat(validatedData.initialBalance);
      const diff = newInitial - oldInitial;

      if (diff !== 0) {
        await db.insert(transactions).values({
          userId,
          accountId: id,
          amount: Math.abs(diff).toString(),
          category: "Penyesuaian Saldo",
          description: `Penyesuaian saldo dompet ${validatedData.name}`,
          type: diff > 0 ? "income" : "expense",
          date: new Date(),
        });
      }
    }

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
