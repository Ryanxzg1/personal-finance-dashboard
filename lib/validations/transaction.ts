import { z } from "zod";

export const transactionSchema = z.object({
  description: z.string().min(1, "Catatan tidak boleh kosong").max(255, "Catatan terlalu panjang"),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) !== 0, {
    message: "Jumlah harus berupa angka dan tidak boleh nol",
  }),
  category: z.string().min(1, "Kategori harus dipilih"),
  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Tipe transaksi harus 'Pemasukan' atau 'Pengeluaran'" }),
  }),
  date: z.date({
    required_error: "Tanggal harus diisi",
    invalid_type_error: "Format tanggal tidak valid",
  }),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
