import type { ExportData } from "./export-utils.shared"

export const generatePDFBuffer = async (data: ExportData[], title: string): Promise<Buffer> => {
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF()
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0)

  doc.setFontSize(18)
  doc.text(title, 14, 22)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 30)

  autoTable(doc, {
    startY: 35,
    head: [["Tanggal", "Jenis", "Kategori", "Catatan", "Jumlah"]],
    body: [
      ...data.map((item) => [
        item.date,
        item.type,
        item.category,
        item.note,
        `Rp ${item.amount.toLocaleString("id-ID")}`,
      ]),
      [
        "",
        "",
        "",
        { content: "TOTAL", styles: { fontStyle: "bold", halign: "right" } },
        { content: `Rp ${totalAmount.toLocaleString("id-ID")}`, styles: { fontStyle: "bold" } },
      ],
    ],
    headStyles: { fillColor: [90, 107, 59] },
    styles: { font: "helvetica", fontSize: 10 },
    columnStyles: {
      4: { halign: "right" },
    },
  })

  return Buffer.from(doc.output("arraybuffer"))
}
