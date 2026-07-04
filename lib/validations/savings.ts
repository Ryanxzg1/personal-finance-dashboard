import { z } from "zod";

const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/

const isValidDateString = (value: string) =>
  ISO_DATETIME_PATTERN.test(value) && !Number.isNaN(new Date(value).getTime())

export const savingsGoalWriteSchema = z
  .object({
    name: z.string().trim().min(1, "Nama target tidak boleh kosong").max(255, "Nama target terlalu panjang"),
    targetAmount: z.string().trim().min(1, "Target harus lebih dari 0"),
    currentAmount: z.string().trim().min(1, "Saldo awal tidak boleh negatif"),
    monthlyTarget: z.string().trim().min(1, "Target bulanan tidak valid"),
    deadline: z.string().trim().min(1, "Tanggal target tidak valid"),
  })
  .strict()
  .superRefine((data, ctx) => {
    const targetAmount = Number(data.targetAmount)
    const currentAmount = Number(data.currentAmount)
    const monthlyTarget = Number(data.monthlyTarget)

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetAmount"],
        message: "Target harus lebih dari 0",
      })
    }

    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentAmount"],
        message: "Saldo awal tidak boleh negatif",
      })
    }

    if (!Number.isFinite(monthlyTarget) || monthlyTarget < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["monthlyTarget"],
        message: "Target bulanan tidak valid",
      })
    }

    if (!isValidDateString(data.deadline)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadline"],
        message: "Tanggal target tidak valid",
      })
    }

    if (Number.isFinite(targetAmount) && Number.isFinite(currentAmount) && currentAmount > targetAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentAmount"],
        message: "Saldo saat ini tidak boleh melebihi target",
      })
    }
  })

export const savingsGoalSchema = savingsGoalWriteSchema

export type SavingsGoalWriteInput = z.infer<typeof savingsGoalWriteSchema>
export type SavingsGoalInput = SavingsGoalWriteInput
