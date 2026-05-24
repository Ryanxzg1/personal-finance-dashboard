import { NextResponse } from "next/server";
import { sendWeeklyReport } from "@/lib/actions/reports";

// Ini adalah endpoint untuk dipanggil oleh Vercel Cron atau scheduler lainnya
export async function GET(req: Request) {
  try {
    // Basic security check (idealnya menggunakan Authorization Bearer token khusus cron)
    const authHeader = req.headers.get("Authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
    }

    // Catatan: Endpoint ini saat ini dirancang untuk dijalankan oleh user yang sedang login (mengandalkan auth() Clerk di sendWeeklyReport).
    // Untuk CRON Job yang sebenarnya, Anda harus melakukan perulangan (loop) melalui SEMUA user di database
    // dan mengirimkan email ke masing-masing user.
    // Kode di bawah ini hanya untuk demo/testing jika dipanggil secara manual dari browser yang sedang login.
    
    // Implementasi skalabel untuk CRON:
    // 1. Ambil daftar user IDs dari Clerk API / Database Anda.
    // 2. Loop & passing userId ke sendWeeklyReport(userId)
    
    // Untuk MVP ini, kita akan asumsikan endpoint ini dipanggil secara manual dari dashboard (oleh user)
    // Atau jika dipanggil via cron, kita panggil dummy response karena auth() Clerk butuh session.

    const result = await sendWeeklyReport();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Weekly report sent successfully" });
  } catch (error) {
    console.error("[CRON_WEEKLY_REPORT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
