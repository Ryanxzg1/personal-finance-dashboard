"use client"

import { useEffect } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="font-sans text-xl font-bold tracking-tight text-foreground mb-2">
        Aduh, terjadi kesalahan sistem
      </h2>
      <p className="max-w-md font-serif text-sm text-muted-foreground mb-6">
        Jangan khawatir, data Anda tetap aman. Silakan coba muat ulang halaman ini atau hubungi tim teknis jika masalah berlanjut.
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-sans text-sm font-bold text-white shadow-xs hover:bg-primary/90 transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
        Segarkan Halaman
      </button>
    </div>
  )
}
