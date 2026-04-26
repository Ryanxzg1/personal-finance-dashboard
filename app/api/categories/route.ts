import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    return NextResponse.json(data);
  } catch (error) {
    console.error("[CATEGORIES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
