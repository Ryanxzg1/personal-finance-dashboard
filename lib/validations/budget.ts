import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.number({
    required_error: "Kategori harus dipilih",
    invalid_type_error: "ID Kategori harus berupa angka",
  }),
  limitAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Batas anggaran harus berupa angka positif atau nol",
  }),
  month: z.number().min(0).max(11),
  year: z.number().min(2000).max(2100),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
