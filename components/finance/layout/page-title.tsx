"use client"

import { usePathname } from "next/navigation"

export function PageTitle({ userName }: { userName: string }) {
  const pathname = usePathname()

  const getTitle = () => {
    switch (pathname) {
      case "/":
        return `Halo, ${userName}!`
      case "/riwayat":
        return "Riwayat Transaksi"
      case "/kategori":
        return "Kategori & Dompet"
      case "/tabungan":
        return "Target Tabungan"
      case "/pemetaan":
        return "Pemetaan Transaksi"
      default:
        // Handle nested paths if any
        if (pathname.startsWith("/pemetaan/")) return "Detail Pemetaan"
        return "Buku Kas"
    }
  }

  const getSubTitle = () => {
    switch (pathname) {
      case "/":
        return "Berikut adalah ringkasan keuangan Anda hari ini."
      case "/riwayat":
        return "Daftar seluruh catatan pemasukan dan pengeluaran."
      case "/kategori":
        return "Atur sumber dana dan klasifikasi transaksi Anda."
      case "/tabungan":
        return "Rencanakan dan pantau progres impian masa depan."
      case "/pemetaan":
        return "Hubungkan deskripsi transaksi dengan kategori yang sesuai."
      default:
        return "Kelola keuangan pribadi dengan lebih bijak."
    }
  }

  return (
    <div className="flex flex-col">
      <h1 className="font-sans text-xl font-bold tracking-tight text-foreground lg:text-3xl text-pretty">
        {getTitle()}
      </h1>
      <p className="hidden lg:block font-serif text-xs italic text-muted-foreground mt-0.5">
        {getSubTitle()}
      </p>
    </div>
  )
}
