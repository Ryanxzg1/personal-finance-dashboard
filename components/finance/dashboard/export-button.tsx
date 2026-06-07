"use client"

import { Download, FileSpreadsheet, FileText } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportToExcel, exportToPDF } from "@/lib/export-utils"

interface ExportButtonProps {
  filteredData: {
    date: string
    type: string
    category: string
    note: string
    amount: number
  }[]
  selectedMonthName: string
  selectedYear: number
  disabled?: boolean
}

export default function ExportButton({ filteredData, selectedMonthName, selectedYear, disabled }: ExportButtonProps) {
  const handleExport = async (format: 'excel' | 'pdf') => {
    if (filteredData.length === 0) return
    
    const fileName = `buku-kas-${selectedMonthName}-${selectedYear}`
    const title = `Laporan Keuangan - ${selectedMonthName} ${selectedYear}`
    
    const exportData = filteredData.map(t => ({
      date: t.date,
      type: t.type,
      category: t.category,
      note: t.note,
      amount: t.amount
    }))

    if (format === 'excel') {
      await exportToExcel(exportData, fileName)
    } else {
      await exportToPDF(exportData, fileName, title)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={disabled}
          className="flex h-9 items-center gap-2 rounded-sm border border-border bg-background px-3 font-serif text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Ekspor
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-sans">
        <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          <span>PDF (.pdf)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
