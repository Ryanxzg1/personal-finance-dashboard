import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Nama akun tidak boleh kosong").max(100, "Nama akun terlalu panjang"),
  type: z.string().min(1, "Tipe akun harus dipilih"),
  initialBalance: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Saldo awal harus berupa angka",
  }),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type AccountInput = z.infer<typeof accountSchema>;
