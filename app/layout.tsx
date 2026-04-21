import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Libre_Baskerville, IBM_Plex_Mono, Lora } from 'next/font/google'

const _libreBaskerville = Libre_Baskerville({ subsets: ['latin'], weight: ["400","700"] })

export const metadata: Metadata = {
  title: 'Buku Kas — Catatan Keuangan Pribadi',
  description: 'Catat pemasukan dan pengeluaran harian dengan rapi dan terstruktur.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="id">
        <body className="font-serif antialiased bg-background text-foreground">
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
