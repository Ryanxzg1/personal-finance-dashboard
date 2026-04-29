import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori tidak boleh kosong").max(100, "Nama kategori terlalu panjang"),
  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Tipe kategori harus 'income' atau 'expense'" }),
  }),
});

export type CategoryInput = z.infer<typeof categorySchema>;
