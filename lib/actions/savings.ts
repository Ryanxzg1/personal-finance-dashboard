"use server"

import { db } from "@/lib/db"
import { savingsGoals } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { savingsGoalSchema } from "@/lib/validations/savings";

export async function getSavingsGoals() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const data = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId));

    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch savings goals:", error);
    return { success: false, error: "Gagal mengambil data tabungan" };
  }
}

export async function createSavingsGoal(data: z.infer<typeof savingsGoalSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validated = savingsGoalSchema.parse(data);

    // Bug fix: Pastikan targetAmount selalu lebih besar dari currentAmount
    const target = parseFloat(validated.targetAmount);
    const current = parseFloat(validated.currentAmount || "0");
    if (isNaN(target) || target <= 0) {
      return { success: false, error: "Target tabungan harus lebih dari nol" };
    }
    if (current < 0) {
      return { success: false, error: "Saldo saat ini tidak boleh negatif" };
    }

    await db.insert(savingsGoals).values({
      userId,
      name: validated.name,
      targetAmount: validated.targetAmount,
      currentAmount: validated.currentAmount || "0",
      monthlyTarget: validated.monthlyTarget || null,
      deadline: validated.deadline ? new Date(validated.deadline) : null,
    });

    revalidatePath("/tabungan");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Failed to create savings goal:", error);
    return { success: false, error: "Gagal membuat target baru" };
  }
}

export async function updateSavingsGoal(id: number, data: Partial<z.infer<typeof savingsGoalSchema>>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Verifikasi kepemilikan (security check)
    const [existing] = await db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));

    if (!existing) {
      return { success: false, error: "Target tabungan tidak ditemukan" };
    }

    // Bug fix: Pastikan currentAmount tidak melebihi targetAmount
    const newCurrent = data.currentAmount !== undefined
      ? parseFloat(data.currentAmount)
      : parseFloat(existing.currentAmount);
    const newTarget = data.targetAmount !== undefined
      ? parseFloat(data.targetAmount)
      : parseFloat(existing.targetAmount);

    if (!isNaN(newCurrent) && !isNaN(newTarget) && newCurrent > newTarget) {
      return { success: false, error: "Saldo saat ini tidak boleh melebihi target" };
    }

    await db
      .update(savingsGoals)
      .set({
        ...data,
        monthlyTarget: data.monthlyTarget || null,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      })
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));

    revalidatePath("/tabungan");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error("Failed to update savings goal:", error);
    return { success: false, error: "Gagal memperbarui target" };
  }
}

export async function deleteSavingsGoal(id: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Verifikasi kepemilikan dan hapus (security check via .returning())
    const result = await db
      .delete(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "Target tabungan tidak ditemukan" };
    }

    revalidatePath("/tabungan");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete savings goal:", error);
    return { success: false, error: "Gagal menghapus target" };
  }
}
