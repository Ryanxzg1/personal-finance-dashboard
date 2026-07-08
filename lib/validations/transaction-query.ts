import { z } from "zod";
import { Transaction } from "@/lib/db/schema";

export const transactionListQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
  accountId: z.number().optional(),
  type: z.enum(["income", "expense"]).optional(),
  includeTechnical: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(15),
  after: z.string().optional(),
  before: z.string().optional(),
});

export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;

export type TransactionListItem = Transaction;

export type TransactionPage = {
  items: TransactionListItem[];
  pageInfo: {
    nextCursor: string | null;
    previousCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  totalCount?: number;
};
