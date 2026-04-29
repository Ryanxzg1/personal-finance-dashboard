import { z } from "zod";

export const savingsGoalSchema = z.object({
  name: z.string().min(1, "Nama target tidak boleh kosong"),
  targetAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Target harus lebih dari 0",
  }),
  currentAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Saldo awal tidak boleh negatif",
  }),
  monthlyTarget: z.string().optional().nullable().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: "Target bulanan tidak valid",
  }),
  deadline: z.string().optional().nullable(),
});

export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;
