"use client"

import { cn } from "@/lib/utils"

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
  helperText?: string
  tone?: "income" | "expense"
}

export function AmountInput({ 
  value, 
  onChange, 
  label, 
  placeholder = "0", 
  className,
  helperText,
  tone = "income"
}: AmountInputProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "")
    onChange(rawValue)
  }

  const formattedValue = value ? Number(value).toLocaleString("id-ID") : ""

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input 
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          className={cn(
            "w-full rounded-sm border border-border bg-background px-3 py-2 font-mono text-base tracking-tight focus:outline-none transition-colors",
            tone === "income" ? "focus:border-[#5a6b3b]" : "focus:border-destructive"
          )}
          placeholder={placeholder}
        />
        {value && value !== "0" && (
          <p className={cn(
            "mt-1 font-mono text-xs font-bold",
            tone === "income" ? "text-[#5a6b3b]" : "text-destructive"
          )}>
            ≈ Rp {formattedValue}
          </p>
        )}
      </div>
      {helperText && (
        <p className="font-serif text-xs italic text-muted-foreground mt-1">
          {helperText}
        </p>
      )}
    </div>
  )
}
