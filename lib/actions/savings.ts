"use server"

import { db } from "@/lib/db";
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

    await db.insert(savingsGoals).values({
      userId,
      name: validated.name,
      targetAmount: validated.targetAmount,
      currentAmount: validated.currentAmount,
      monthlyTarget: validated.monthlyTarget || null,
      deadline: validated.deadline ? new Date(validated.deadline) : null,
    });

    revalidatePath("/tabungan");
    return { success: true };
  } catch (error) {
    console.error("Failed to create savings goal:", error);
    return { success: false, error: "Gagal membuat target baru" };
  }
}

export async function updateSavingsGoal(id: number, data: Partial<z.infer<typeof savingsGoalSchema>>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Update only the provided fields
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
    console.error("Failed to update savings goal:", error);
    return { success: false, error: "Gagal memperbarui target" };
  }
}

export async function deleteSavingsGoal(id: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await db
      .delete(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));

    revalidatePath("/tabungan");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete savings goal:", error);
    return { success: false, error: "Gagal menghapus target" };
  }
}
