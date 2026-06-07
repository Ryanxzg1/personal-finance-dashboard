import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { transactionSchema } from "@/lib/validations/transaction";
import { z } from "zod";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));

    return NextResponse.json(data);
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const body = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validatedData = transactionSchema.parse({
      ...body,
      date: body.date ? new Date(body.date) : new Date(),
    });

    if (validatedData.accountId) {
      const userAccount = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.id, validatedData.accountId), eq(accounts.userId, userId)))
        .limit(1);

      if (userAccount.length === 0) {
        return NextResponse.json({ error: "Akun tidak ditemukan atau bukan milik Anda" }, { status: 400 });
      }
    }

    const [transaction] = await db.insert(transactions).values({
      ...validatedData,
      userId,
      amount: Math.abs(parseFloat(validatedData.amount)).toString(),
    }).returning();

    return NextResponse.json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
