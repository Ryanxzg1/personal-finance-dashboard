"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { AmountInput } from "@/components/ui/amount-input"

export type InputMode = "Pemasukan" | "Pengeluaran"

interface Category {
  id: number
  name: string
  type: "income" | "expense"
  icon: string | null
}

interface Account {
  id: number
  name: string
  type: string
}

interface InputDialogProps {
  open: boolean
  mode: InputMode
  categories: Category[]
  accounts: Account[]
  initialData?: { amount: number; category: string; note: string; date: string; accountId?: number | null }
  onClose: () => void
  onSubmit: (data: { amount: number; category: string; note: string; date: string; accountId?: number | null }) => void
}

export function InputDialog({ open, mode, categories, accounts, initialData, onClose, onSubmit }: InputDialogProps) {
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [accountId, setAccountId] = useState<number | null | undefined>(undefined)
  const [note, setNote] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)

  // Filter kategori berdasarkan tipe (pemasukan/pengeluaran)
  const filteredCategories = categories.filter(c => 
    mode === "Pemasukan" ? c.type === "income" : c.type === "expense"
  )

  useEffect(() => {
    if (open) {
      if (initialData) {
        setAmount(Math.abs(initialData.amount).toString())
        setCategory(initialData.category)
        setAccountId(initialData.accountId)
        setNote(initialData.note)
        try {
           const d = new Date((initialData as any).rawDate || initialData.date);
           if (!isNaN(d.getTime())) {
             setDate(d.toISOString().slice(0, 10))
           } else {
             setDate(new Date().toISOString().slice(0, 10))
           }
        } catch {
           setDate(new Date().toISOString().slice(0, 10))
        }
      } else {
        setAmount("")
        setCategory("")
        setAccountId(accounts.length > 0 ? accounts[0].id : undefined)
        setNote("")
        setDate(new Date().toISOString().slice(0, 10))
      }
      setError(null)
    }
  }, [open, initialData, accounts])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const tone = mode === "Pemasukan" ? "income" : "expense"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(amount.replace(/[^\d]/g, ""))
    if (!num) {
      setError("Jumlah harus diisi dan lebih dari nol.")
      return
    }
    if (!category) {
      setError("Pilih kategori untuk menjaga data tetap terstruktur.")
      return
    }
    onSubmit({
      amount: mode === "Pemasukan" ? num : -num,
      category,
      note: note.trim() || category,
      date,
      accountId,
    })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="input-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Tutup dialog"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-sm border border-border bg-card p-6 shadow-lg overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-border pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {initialData ? "Sunting Entri" : "Entri Baru"}
            </p>
            <h2 id="input-dialog-title" className="mt-1 font-sans text-xl font-bold tracking-tight">
              {initialData ? "Edit" : "Input"} {mode}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-5">
          <Field label="Tanggal" htmlFor="tx-date">
            <input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-sm focus:border-primary focus:outline-none"
              required
            />
          </Field>

          <AmountInput 
            label="Jumlah (Rp)"
            value={amount}
            onChange={setAmount}
            tone={tone}
          />

          <Field label={mode === "Pemasukan" ? "Masuk Ke Akun" : "Bayar Pakai Akun"} htmlFor="tx-account">
            <select
              id="tx-account"
              value={accountId || ""}
              onChange={(e) => setAccountId(Number(e.target.value))}
              className="w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-sm focus:border-primary focus:outline-none"
              required
            >
              <option value="" disabled>Pilih Akun...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type.replace("_", " ")})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Kategori" htmlFor="tx-category">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="tx-category">
              {filteredCategories.length === 0 && (
                <p className="font-serif text-[11px] text-muted-foreground italic">
                  Belum ada kategori {mode.toLowerCase()}. Silakan buat di menu Kategori.
                </p>
              )}
              {filteredCategories.map((c) => {
                const active = category === c.name
                return (
                  <button
                    type="button"
                    key={c.id}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCategory(c.name)}
                    className={cn(
                      "rounded-sm border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                      active
                        ? tone === "income"
                          ? "border-[#5a6b3b] bg-[#5a6b3b] text-white"
                          : "border-destructive bg-destructive text-destructive-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    {c.icon && <span className="mr-1">{c.icon}</span>}
                    {c.name}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Catatan (opsional)" htmlFor="tx-note">
            <input
              id="tx-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mis. Gaji bulanan, Belanja mingguan…"
              className="w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-sm focus:border-primary focus:outline-none"
            />
          </Field>

          {error && (
            <div
              role="alert"
              className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 font-serif text-xs text-destructive"
            >
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-dashed border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-4 py-2 font-serif text-sm text-muted-foreground hover:text-foreground"
          >
            Batal
          </button>
          <button
            type="submit"
            className={cn(
              "rounded-sm px-4 py-2 font-sans text-sm font-bold text-white shadow-xs transition-colors",
              tone === "income"
                ? "bg-[#5a6b3b] hover:bg-[#4d5c32]"
                : "bg-destructive hover:bg-destructive/90",
            )}
          >
            {initialData ? "Simpan Perubahan" : `Simpan ${mode}`}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  )
}
