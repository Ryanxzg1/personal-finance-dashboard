export type { ExportData } from "./export-utils.shared"

type BrowserExportModule = typeof import("./export-utils.browser")
type ServerExportModule = typeof import("./export-utils.server")

export const exportToExcel = async (...args: Parameters<BrowserExportModule["exportToExcel"]>) => {
  const { exportToExcel: browserExportToExcel } = await import("./export-utils.browser")
  return browserExportToExcel(...args)
}

export const exportToPDF = async (...args: Parameters<BrowserExportModule["exportToPDF"]>) => {
  const { exportToPDF: browserExportToPDF } = await import("./export-utils.browser")
  return browserExportToPDF(...args)
}

export const generatePDFBuffer = async (...args: Parameters<ServerExportModule["generatePDFBuffer"]>) => {
  const { generatePDFBuffer: serverGeneratePDFBuffer } = await import("./export-utils.server")
  return serverGeneratePDFBuffer(...args)
}
