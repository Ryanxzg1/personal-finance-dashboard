"use server"

import { db } from "@/lib/db"
import { savingsGoals } from "@/lib/db/schema"
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { savingsGoalWriteSchema } from "@/lib/validations/savings"

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

export async function createSavingsGoal(data: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validated = savingsGoalWriteSchema.parse(data)

    const [created] = await db.insert(savingsGoals).values({
      userId,
      name: validated.name,
      targetAmount: validated.targetAmount,
      currentAmount: validated.currentAmount,
      monthlyTarget: validated.monthlyTarget,
      deadline: new Date(validated.deadline),
    }).returning({ id: savingsGoals.id })

    if (!created) {
      return { success: false, error: "Gagal membuat target baru" }
    }

    revalidatePath("/tabungan");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to create savings goal:", error)
    return { success: false, error: "Gagal membuat target baru" };
  }
}

export async function updateSavingsGoal(id: number, data: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validated = savingsGoalWriteSchema.parse(data)

    const updated = await db
      .update(savingsGoals)
      .set({
        name: validated.name,
        targetAmount: validated.targetAmount,
        currentAmount: validated.currentAmount,
        monthlyTarget: validated.monthlyTarget,
        deadline: new Date(validated.deadline),
      })
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
      .returning({ id: savingsGoals.id })

    if (updated.length === 0) {
      return { success: false, error: "Target tabungan tidak ditemukan" };
    }

    revalidatePath("/tabungan");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
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
