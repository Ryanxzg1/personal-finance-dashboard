"use server"

import { db } from "@/lib/db";
import { blueprintPlans, blueprintItems } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const planSchema = z.object({
  name: z.string().min(1, "Nama rencana harus diisi"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const itemSchema = z.object({
  planId: z.number(),
  description: z.string().min(1, "Deskripsi harus diisi"),
  amount: z.string().min(1, "Nominal harus diisi"),
  isEssential: z.boolean().default(false),
});

export async function getMappingPlans() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const data = await db
      .select()
      .from(blueprintPlans)
      .where(eq(blueprintPlans.userId, userId))
      .orderBy(desc(blueprintPlans.createdAt));

    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch mapping plans:", error);
    return { success: false, error: "Gagal mengambil data rencana" };
  }
}

export async function getMappingPlanDetails(planId: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const plan = await db.query.blueprintPlans.findFirst({
      where: and(eq(blueprintPlans.id, planId), eq(blueprintPlans.userId, userId)),
      with: {
        items: true,
      },
    });

    // Bug fix: Return not found jika plan tidak ada atau bukan milik user
    if (!plan) {
      return { success: false, error: "Rencana tidak ditemukan" };
    }

    return { success: true, data: plan };
  } catch (error) {
    console.error("Failed to fetch mapping plan details:", error);
    return { success: false, error: "Gagal mengambil detail rencana" };
  }
}

export async function createMappingPlan(values: z.infer<typeof planSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validatedFields = planSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.issues[0].message };
    }

    await db.insert(blueprintPlans).values({
      ...validatedFields.data,
      userId,
    });

    revalidatePath("/pemetaan");
    return { success: true };
  } catch (error) {
    console.error("Failed to create mapping plan:", error);
    return { success: false, error: "Gagal membuat rencana" };
  }
}

export async function deleteMappingPlan(id: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Bug fix: Verifikasi kepemilikan sebelum hapus (security check)
    // Items akan terhapus otomatis karena onDelete: "cascade" di schema
    const result = await db.delete(blueprintPlans).where(
      and(eq(blueprintPlans.id, id), eq(blueprintPlans.userId, userId))
    ).returning();

    if (result.length === 0) {
      return { success: false, error: "Rencana tidak ditemukan" };
    }

    revalidatePath("/pemetaan");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete mapping plan:", error);
    return { success: false, error: "Gagal menghapus rencana" };
  }
}

export async function addMappingItem(values: z.infer<typeof itemSchema>) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validatedFields = itemSchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.issues[0].message };
    }

    // Bug fix: Verifikasi bahwa plan milik user yang sedang login
    const [plan] = await db
      .select()
      .from(blueprintPlans)
      .where(and(eq(blueprintPlans.id, validatedFields.data.planId), eq(blueprintPlans.userId, userId)));

    if (!plan) {
      return { success: false, error: "Rencana tidak ditemukan atau bukan milik Anda" };
    }

    // Bug fix: Validasi amount harus berupa angka positif
    const amountNum = parseFloat(validatedFields.data.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { success: false, error: "Nominal harus lebih dari nol" };
    }

    await db.insert(blueprintItems).values(validatedFields.data);

    revalidatePath("/pemetaan");
    return { success: true };
  } catch (error) {
    console.error("Failed to add mapping item:", error);
    return { success: false, error: "Gagal menambah item" };
  }
}

export async function deleteMappingItem(id: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // Bug fix: Verifikasi kepemilikan item via join ke plans (security check)
    const [item] = await db
      .select({ id: blueprintItems.id })
      .from(blueprintItems)
      .innerJoin(blueprintPlans, eq(blueprintItems.planId, blueprintPlans.id))
      .where(
        and(
          eq(blueprintItems.id, id),
          eq(blueprintPlans.userId, userId)
        )
      );

    if (!item) {
      return { success: false, error: "Item tidak ditemukan atau bukan milik Anda" };
    }

    await db.delete(blueprintItems).where(eq(blueprintItems.id, id));

    revalidatePath("/pemetaan");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete mapping item:", error);
    return { success: false, error: "Gagal menghapus item" };
  }
}
