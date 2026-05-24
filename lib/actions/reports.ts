"use server"

import { db } from "@/lib/db"
import { transactions } from "@/lib/db/schema"
import { auth, currentUser } from "@clerk/nextjs/server"
import { gte, lte, and, eq } from "drizzle-orm"
import { Resend } from "resend"
import { WeeklyReportEmail } from "@/emails/weekly-report"
import { generatePDFBuffer } from "@/lib/export-utils"

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendWeeklyReport() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };
    
    if (!resend) {
      return { success: false, error: "Resend API Key is not configured" };
    }

    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    const userName = user?.fullName || user?.firstName || "Pengguna";

    if (!userEmail) {
       return { success: false, error: "User email not found" };
    }

    // Hitung tanggal 1 minggu ke belakang
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    // Set ke awal dan akhir hari
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Ambil data transaksi minggu ini
    const weeklyTxs = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    if (weeklyTxs.length === 0) {
      return { success: false, error: "Tidak ada transaksi minggu ini" };
    }

    // Hitung statistik
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryMap: Record<string, number> = {};

    const cleanTxs = weeklyTxs.filter(t => !t.category.startsWith("Transfer") && t.category !== "Saldo Awal");

    cleanTxs.forEach(t => {
       const amount = parseFloat(t.amount);
       if (t.type === 'income') {
           totalIncome += amount;
       } else {
           totalExpense += amount;
           if (!categoryMap[t.category]) categoryMap[t.category] = 0;
           categoryMap[t.category] += amount;
       }
    });

    // Cari top kategori pengeluaran
    let topCategory = "";
    let topCategoryAmount = 0;
    for (const [cat, amt] of Object.entries(categoryMap)) {
        if (amt > topCategoryAmount) {
            topCategoryAmount = amt;
            topCategory = cat;
        }
    }

    // Format tanggal untuk UI
    const startStr = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const title = `Laporan Keuangan Mingguan (${startStr} - ${endStr})`;

    // Generate PDF Buffer
    const pdfData = cleanTxs.map(t => ({
      date: new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      type: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      category: t.category,
      note: t.description,
      amount: t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount)
    }));
    
    const pdfBuffer = await generatePDFBuffer(pdfData, title);

    // Kirim Email
    const { data, error } = await resend.emails.send({
      // Dalam versi gratis Resend, Anda hanya bisa mengirim DARI domain yang sudah diverifikasi 
      // atau 'onboarding@resend.dev' KE email Anda sendiri (yang terdaftar di Resend).
      // Pastikan email penerima sama dengan email akun Resend Anda untuk testing.
      from: 'Buku Kas <onboarding@resend.dev>', 
      to: process.env.NODE_ENV === 'development' ? 'husyenrafi@gmail.com' : userEmail,
      subject: `Laporan Mingguan Buku Kas: ${startStr} - ${endStr}`,
      react: WeeklyReportEmail({
        userName,
        startDate: startStr,
        endDate: endStr,
        totalIncome,
        totalExpense,
        topCategory,
        topCategoryAmount
      }),
      attachments: [
        {
          filename: `Laporan_Mingguan_${startStr.replace(' ', '_')}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Failed to send weekly report:", error);
    return { success: false, error: "Gagal mengirim laporan" };
  }
}
