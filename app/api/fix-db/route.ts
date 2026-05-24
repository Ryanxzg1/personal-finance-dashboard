import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  // Hanya ijinkan di environment development untuk mencegah eksploitasi di production
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Forbidden in production" }, { status: 403 });
  }

  try {
    console.warn("Memulai perbaikan database manual...");
    
    // Gunakan nama tabel yang baru agar bersih
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS personal_budgets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        limit_amount NUMERIC NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL
      );
    `);

    return NextResponse.json({ 
      success: true, 
      message: "Tabel personal_budgets berhasil dibuat secara manual!" 
    });
  } catch (error: unknown) {
    console.error("Gagal perbaikan manual:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
