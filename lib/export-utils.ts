interface ExportData {
  date: string;
  type: string;
  category: string;
  note: string;
  amount: number;
}

export const exportToExcel = async (data: ExportData[], fileName: string) => {
  const XLSX = await import('xlsx');
  
  // Hitung total
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  
  // Format data untuk sheet
  const rows = data.map(item => ({
    'Tanggal': item.date,
    'Jenis': item.type,
    'Kategori': item.category,
    'Catatan': item.note,
    'Jumlah (IDR)': item.amount,
  }));
  
  // Tambahkan baris total
  const dataWithTotal = [
    ...rows,
    {
      'Tanggal': '',
      'Jenis': '',
      'Kategori': '',
      'Catatan': 'TOTAL',
      'Jumlah (IDR)': totalAmount
    }
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(dataWithTotal);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPDF = async (data: ExportData[], fileName: string, title: string) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  
  // Header
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 30);
  
  // Table
  autoTable(doc, {
    startY: 35,
    head: [['Tanggal', 'Jenis', 'Kategori', 'Catatan', 'Jumlah']],
    body: [
        ...data.map(item => [
            item.date,
            item.type,
            item.category,
            item.note,
            `Rp ${item.amount.toLocaleString('id-ID')}`
        ]),
        // Baris Total
        [
            '', 
            '', 
            '', 
            { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'right' } }, 
            { content: `Rp ${totalAmount.toLocaleString('id-ID')}`, styles: { fontStyle: 'bold' } }
        ]
    ],
    headStyles: { fillColor: [90, 107, 59] }, // #5a6b3b
    styles: { font: 'helvetica', fontSize: 10 },
    columnStyles: {
        4: { halign: 'right' } // Kolom jumlah rata kanan
    }
  });
  
  doc.save(`${fileName}.pdf`);
};
