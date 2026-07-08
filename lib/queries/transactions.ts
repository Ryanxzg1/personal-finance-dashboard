import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { and, desc, eq, lt, gte, notInArray, sql } from "drizzle-orm";
import { TransactionListQuery, TransactionPage } from "@/lib/validations/transaction-query";
import { TECHNICAL_CATEGORIES } from "@/lib/helpers/transaction";

export function encodeCursor(date: Date, id: number): string {
  const payload = JSON.stringify({ d: date.toISOString(), i: id });
  return Buffer.from(payload).toString("base64url");
}

export function decodeCursor(cursor: string): { date: Date; id: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof payload.d === "string" && typeof payload.i === "number") {
      const date = new Date(payload.d);
      if (!isNaN(date.getTime())) {
        return { date, id: payload.i };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function getTransactionsQuery(
  userId: string,
  query: TransactionListQuery,
  includeTotal: boolean = false
): Promise<TransactionPage> {
  const { limit, after, category, accountId, type, startDate, endDate, includeTechnical } = query;
  
  const conditions = [eq(transactions.userId, userId)];
  
  if (category) {
    conditions.push(eq(transactions.category, category));
  }
  if (accountId) {
    conditions.push(eq(transactions.accountId, accountId));
  }
  if (type) {
    conditions.push(eq(transactions.type, type));
  }
  
  if (startDate) {
    conditions.push(gte(transactions.date, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lt(transactions.date, new Date(endDate)));
  }
  
  if (includeTechnical === false) {
    conditions.push(notInArray(transactions.category, TECHNICAL_CATEGORIES));
  }

  // Handle cursor pagination
  if (after) {
    const parsedCursor = decodeCursor(after);
    if (parsedCursor) {
      conditions.push(
        sql`(${transactions.date} < ${parsedCursor.date.toISOString()} OR (${transactions.date} = ${parsedCursor.date.toISOString()} AND ${transactions.id} < ${parsedCursor.id}))`
      );
    }
  }
  
  const items = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(limit + 1);

  const hasNextPage = items.length > limit;
  const pageItems = items.slice(0, limit);
  
  let nextCursor: string | null = null;
  if (hasNextPage && pageItems.length > 0) {
    const lastItem = pageItems[pageItems.length - 1];
    nextCursor = encodeCursor(lastItem.date, lastItem.id);
  }

  let totalCount: number | undefined;
  if (includeTotal) {
    // Only count without the cursor condition to get the total matching the filters
    // We rebuild the filter without the cursor condition to get the total count
    
    const countQueryConditions = [eq(transactions.userId, userId)];
    if (category) countQueryConditions.push(eq(transactions.category, category));
    if (accountId) countQueryConditions.push(eq(transactions.accountId, accountId));
    if (type) countQueryConditions.push(eq(transactions.type, type));
    if (startDate) countQueryConditions.push(gte(transactions.date, new Date(startDate)));
    if (endDate) countQueryConditions.push(lt(transactions.date, new Date(endDate)));
    if (includeTechnical === false) countQueryConditions.push(notInArray(transactions.category, TECHNICAL_CATEGORIES));
    
    const countResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(transactions)
      .where(and(...countQueryConditions));
      
    totalCount = countResult[0].count;
  }

  return {
    items: pageItems,
    pageInfo: {
      nextCursor,
      previousCursor: null, // Simplification for v1 as per the plan
      hasNextPage,
      hasPreviousPage: !!after,
    },
    totalCount,
  };
}
