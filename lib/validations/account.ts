import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Nama akun tidak boleh kosong").max(100, "Nama akun terlalu panjang"),
  type: z.string().min(1, "Tipe akun harus dipilih"),
  initialBalance: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Saldo awal harus berupa angka valid",
  }),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1, "Nama akun tidak boleh kosong").max(100, "Nama akun terlalu panjang"),
  type: z.string().min(1, "Tipe akun harus dipilih"),
});

export const adjustBalanceSchema = z.object({
  accountId: z.number(),
  direction: z.enum(["increase", "decrease"]),
  amount: z.number(),
  note: z.string().max(255, "Catatan terlalu panjang").optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;
