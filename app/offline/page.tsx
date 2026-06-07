import Link from "next/link"
import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10 text-center text-foreground">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-sm border border-border bg-card shadow-xs">
        <WifiOff className="h-7 w-7 text-primary" aria-hidden="true" />
      </div>
      <h1 className="font-sans text-2xl font-bold tracking-tight">Anda sedang offline</h1>
      <p className="mt-3 max-w-sm font-serif text-sm leading-relaxed text-muted-foreground">
        Data keuangan tidak ditampilkan dari cache demi keamanan. Sambungkan internet untuk membuka dashboard terbaru.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary px-5 font-sans text-sm font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
      >
        Coba Lagi
      </Link>
    </main>
  )
}
