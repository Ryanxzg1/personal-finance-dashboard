import "server-only"

import { clerkClient, auth, currentUser } from "@clerk/nextjs/server"
import { and, desc, eq, gte, isNull, lt, or, sql } from "drizzle-orm"
import { Resend } from "resend"
import { db } from "@/lib/db"
import { transactions, weeklyReportDeliveries } from "@/lib/db/schema"
import { WeeklyReportEmail } from "@/emails/weekly-report"
import { generatePDFBuffer } from "@/lib/export-utils.server"
import {
  formatWibDate,
  getWeeklyReportWindow,
  isReportableTransaction,
  summarizeTransactions,
  type WeeklyReportWindow,
} from "@/lib/reports/weekly"

const MAX_USERS = 100
const CONCURRENCY = 5
const MAX_ATTEMPTS = 3
const STALE_AFTER_MS = 15 * 60 * 1000

type DeliveryResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "duplicate" | "in_progress" | "attempts_exhausted" | "no_transactions" }
  | { status: "failed"; error: string }

export interface WeeklyReportSummary {
  periodStart: string
  periodEnd: string
  eligible: number
  sent: number
  failed: number
  skipped: number
  duplicateSkipped: number
  missingEmail: number
}

function getResend() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<R>,
) {
  const results = new Array<R>(values.length)
  let cursor = 0

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor++
      results[index] = await worker(values[index])
    }
  }))

  return results
}

async function claimDelivery(userId: string, period: WeeklyReportWindow) {
  const now = new Date()
  const [inserted] = await db
    .insert(weeklyReportDeliveries)
    .values({
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      status: "pending",
      attemptCount: 1,
      lastAttemptAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()
    .returning()

  if (inserted) return { claimed: true as const, delivery: inserted }

  const [existing] = await db
    .select()
    .from(weeklyReportDeliveries)
    .where(and(
      eq(weeklyReportDeliveries.userId, userId),
      eq(weeklyReportDeliveries.periodStart, period.start),
      eq(weeklyReportDeliveries.periodEnd, period.end),
    ))
    .limit(1)

  if (!existing) return { claimed: false as const, reason: "in_progress" as const }
  if (existing.status === "sent") return { claimed: false as const, reason: "duplicate" as const }
  if (existing.status === "skipped") return { claimed: false as const, reason: "no_transactions" as const }
  if (existing.attemptCount >= MAX_ATTEMPTS) {
    return { claimed: false as const, reason: "attempts_exhausted" as const }
  }

  const staleBefore = new Date(now.getTime() - STALE_AFTER_MS)
  const [reclaimed] = await db
    .update(weeklyReportDeliveries)
    .set({
      status: "pending",
      attemptCount: existing.attemptCount + 1,
      lastAttemptAt: now,
      lastError: null,
      updatedAt: now,
    })
    .where(and(
      eq(weeklyReportDeliveries.id, existing.id),
      lt(weeklyReportDeliveries.attemptCount, MAX_ATTEMPTS),
      or(
        eq(weeklyReportDeliveries.status, "failed"),
        isNull(weeklyReportDeliveries.lastAttemptAt),
        lt(weeklyReportDeliveries.lastAttemptAt, staleBefore),
      ),
    ))
    .returning()

  return reclaimed
    ? { claimed: true as const, delivery: reclaimed }
    : { claimed: false as const, reason: "in_progress" as const }
}

async function updateDelivery(
  id: number,
  status: "sent" | "failed" | "skipped",
  values: { error?: string; providerId?: string } = {},
) {
  const now = new Date()
  await db
    .update(weeklyReportDeliveries)
    .set({
      status,
      sentAt: status === "sent" ? now : undefined,
      resendEmailId: values.providerId,
      lastError: values.error ?? null,
      updatedAt: now,
    })
    .where(eq(weeklyReportDeliveries.id, id))
}

async function sendForUser(params: {
  userId: string
  email: string
  name: string
  period: WeeklyReportWindow
}): Promise<DeliveryResult> {
  const claim = await claimDelivery(params.userId, params.period)
  if (!claim.claimed) return { status: "skipped", reason: claim.reason }

  try {
    const rows = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, params.userId),
        gte(transactions.date, params.period.start),
        lt(transactions.date, params.period.end),
      ))
      .orderBy(desc(transactions.date))

    const reportableRows = rows.filter(isReportableTransaction)
    if (reportableRows.length === 0) {
      await updateDelivery(claim.delivery.id, "skipped", { error: "Tidak ada transaksi laporan" })
      return { status: "skipped", reason: "no_transactions" }
    }

    const resend = getResend()
    const from = process.env.REPORT_FROM_EMAIL
    if (!resend || !from) throw new Error("Konfigurasi Resend belum lengkap")

    const stats = summarizeTransactions(reportableRows)
    const startLabel = formatWibDate(params.period.start, { day: "numeric", month: "short", year: "numeric" })
    const endLabel = formatWibDate(params.period.end, { day: "numeric", month: "short", year: "numeric" })
    const title = `Laporan Keuangan Mingguan (${startLabel} - ${endLabel})`
    const attachment = await generatePDFBuffer(reportableRows.map((transaction) => ({
      date: formatWibDate(new Date(transaction.date), { day: "2-digit", month: "short" }),
      type: transaction.type === "income" ? "Pemasukan" : "Pengeluaran",
      category: transaction.category,
      note: transaction.description,
      amount: transaction.type === "income" ? Number(transaction.amount) : -Number(transaction.amount),
    })), title)

    const recipient = process.env.NODE_ENV !== "production" && process.env.REPORT_RECIPIENT_OVERRIDE
      ? process.env.REPORT_RECIPIENT_OVERRIDE
      : params.email
    const { data, error } = await resend.emails.send({
      from,
      to: recipient,
      subject: `Laporan Mingguan Buku Kas: ${startLabel} - ${endLabel}`,
      react: WeeklyReportEmail({
        userName: params.name,
        startDate: startLabel,
        endDate: endLabel,
        ...stats,
      }),
      attachments: [{ filename: `Laporan_Mingguan_${startLabel.replace(/ /g, "_")}.pdf`, content: attachment }],
    }, {
      idempotencyKey: `weekly-report/${params.userId}/${params.period.start.toISOString()}`,
    })

    if (error) throw new Error(error.message)
    await updateDelivery(claim.delivery.id, "sent", { providerId: data?.id })
    return { status: "sent" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengirim laporan"
    await updateDelivery(claim.delivery.id, "failed", { error: message })
    return { status: "failed", error: message }
  }
}

export async function runWeeklyReportHeadless(reference = new Date()) {
  const period = getWeeklyReportWindow(reference)
  const candidates = await db
    .selectDistinct({ userId: transactions.userId })
    .from(transactions)
    .where(and(
      gte(transactions.date, period.start),
      lt(transactions.date, period.end),
      sql`${transactions.category} NOT LIKE 'Transfer%'`,
      sql`${transactions.category} NOT IN ('Saldo Awal', 'Penyesuaian Saldo')`,
    ))
    .limit(MAX_USERS)

  const summary: WeeklyReportSummary = {
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
    eligible: candidates.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    duplicateSkipped: 0,
    missingEmail: 0,
  }

  if (candidates.length === 0) return { success: true as const, summary }

  const client = await clerkClient()
  const users = await client.users.getUserList({
    userId: candidates.map(({ userId }) => userId),
    limit: MAX_USERS,
  })
  const usersById = new Map(users.data.map((user) => [user.id, user]))

  const results = await mapWithConcurrency(candidates, CONCURRENCY, async ({ userId }) => {
    const user = usersById.get(userId)
    const primaryEmail = user?.primaryEmailAddress
    if (!user || user.banned || user.locked || !primaryEmail || primaryEmail.verification?.status !== "verified") {
      return { status: "missing_email" as const }
    }

    const name = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Pengguna"
    return sendForUser({ userId, email: primaryEmail.emailAddress, name, period })
  })

  for (const result of results) {
    if (result.status === "sent") summary.sent++
    else if (result.status === "failed") summary.failed++
    else if (result.status === "missing_email") summary.missingEmail++
    else {
      summary.skipped++
      if (result.reason === "duplicate") summary.duplicateSkipped++
    }
  }

  return summary.failed > 0
    ? { success: false as const, error: "Sebagian laporan gagal dikirim", summary }
    : { success: true as const, summary }
}

export async function sendWeeklyReport() {
  const { userId } = await auth()
  if (!userId) return { success: false, error: "Unauthorized" }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress
  if (!email) return { success: false, error: "User email not found" }

  const result = await sendForUser({
    userId,
    email,
    name: user.fullName || user.firstName || "Pengguna",
    period: getWeeklyReportWindow(),
  })

  return result.status === "failed"
    ? { success: false, error: result.error }
    : { success: true, result }
}
