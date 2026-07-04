import { NextResponse } from "next/server";
import { runWeeklyReportHeadless } from "@/lib/actions/reports";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  try {
    if (!process.env.CRON_SECRET) {
      console.error("[CRON_WEEKLY_REPORT] CRON_SECRET is not configured");
      return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
    }

    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
    }

    const result = await runWeeklyReportHeadless();

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          summary: result.summary,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      summary: result.summary,
    });
  } catch (error) {
    console.error("[CRON_WEEKLY_REPORT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
