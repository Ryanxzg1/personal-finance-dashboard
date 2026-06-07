import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import { PwaRegistrar } from '@/components/pwa-registrar'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Buku Keuangan — Catatan Keuangan Pribadi',
    template: '%s | Buku Keuangan'
  },
  description: 'Catat pemasukan dan pengeluaran harian dengan rapi dan terstruktur.',
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Buku Keuangan",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: "#5a6b3b",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="id">
        <head>
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className="font-serif antialiased bg-background text-foreground">
          {children}
          <PwaRegistrar />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
