import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { transactionSchema } from "@/lib/validations/transaction";
import { z } from "zod";

import { transactionListQuerySchema } from "@/lib/validations/transaction-query";
import { getTransactionsQuery } from "@/lib/queries/transactions";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const query = {
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      category: url.searchParams.get("category") || undefined,
      accountId: url.searchParams.get("accountId") ? parseInt(url.searchParams.get("accountId")!) : undefined,
      type: url.searchParams.get("type") || undefined,
      includeTechnical: url.searchParams.has("includeTechnical") ? url.searchParams.get("includeTechnical") === "true" : undefined,
      limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : undefined,
      after: url.searchParams.get("after") || undefined,
      before: url.searchParams.get("before") || undefined,
    };

    const validatedQuery = transactionListQuerySchema.parse(query);
    const includeTotal = url.searchParams.get("includeTotal") === "true";

    const data = await getTransactionsQuery(userId, validatedQuery, includeTotal);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
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
