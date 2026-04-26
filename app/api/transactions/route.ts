import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

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

    const { description, amount, category, type, date } = body;

    if (!description || !amount || !category || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const [transaction] = await db.insert(transactions).values({
      userId,
      description,
      amount: amount.toString(),
      category,
      type,
      date: date ? new Date(date) : new Date(),
    }).returning();

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
