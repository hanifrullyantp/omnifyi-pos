/**
 * Export Utilities for Omnifyi Reports
 * Supports PDF and CSV/Excel export
 */

// Format number to Indonesian currency
export const formatCurrency = (n: number, short = false): string => {
  if (short) {
    if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}B`;
    if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toFixed(1)}M`;
    if (Math.abs(n) >= 1e3) return `Rp ${(n / 1e3).toFixed(0)}K`;
  }
  return `Rp ${n.toLocaleString('id-ID')}`;
};

// Format date to Indonesian locale
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

// Generate CSV content
export const generateCSV = (headers: string[], rows: (string | number)[][]): string => {
  const escape = (val: string | number) => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const headerRow = headers.map(escape).join(',');
  const dataRows = rows.map(row => row.map(escape).join(','));
  
  return [headerRow, ...dataRows].join('\n');
};

// Download CSV file
export const downloadCSV = (content: string, filename: string): void => {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate simple text-based PDF content (printable)
export const generatePrintablePDF = (
  title: string,
  subtitle: string,
  sections: { heading: string; rows: { label: string; value: string }[] }[]
): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup blocked! Please allow popups for this site.');
    return;
  }
  
  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1f2937;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #14b8a6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 { 
          font-size: 24px; 
          color: #0d9488;
          margin-bottom: 5px;
        }
        .header .subtitle { 
          font-size: 14px; 
          color: #6b7280;
        }
        .header .date {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 10px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h2 {
          font-size: 16px;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .row:last-child {
          border-bottom: none;
        }
        .row .label { color: #6b7280; }
        .row .value { 
          font-weight: 600; 
          color: #1f2937;
        }
        .row.highlight {
          background: #f0fdfa;
          margin: 0 -10px;
          padding: 10px;
          border-radius: 8px;
        }
        .row.highlight .value {
          color: #0d9488;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div class="subtitle">${subtitle}</div>
        <div class="date">Dicetak: ${formatDate(new Date())}</div>
      </div>
      
      ${sections.map(section => `
        <div class="section">
          <h2>${section.heading}</h2>
          ${section.rows.map((row, i) => `
            <div class="row ${i === section.rows.length - 1 ? 'highlight' : ''}">
              <span class="label">${row.label}</span>
              <span class="value">${row.value}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
      
      <div class="footer">
        <p>Omnifyi - Business Management Platform</p>
        <p>Laporan ini dihasilkan secara otomatis</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

// Export Profit & Loss to CSV
export const exportProfitLossCSV = (report: {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalOperatingExpenses: number;
  netProfit: number;
  revenueBreakdown: { category: string; amount: number }[];
  expenseBreakdown: { category: string; amount: number }[];
}, period: string): void => {
  const headers = ['Kategori', 'Jumlah (Rp)'];
  const rows: (string | number)[][] = [
    ['=== PENDAPATAN ===', ''],
    ...report.revenueBreakdown.map(r => [r.category, r.amount]),
    ['Total Pendapatan', report.totalRevenue],
    ['', ''],
    ['=== HARGA POKOK ===', ''],
    ['HPP', report.totalCOGS],
    ['Laba Kotor', report.grossProfit],
    ['', ''],
    ['=== BEBAN OPERASIONAL ===', ''],
    ...report.expenseBreakdown.map(e => [e.category, e.amount]),
    ['Total Beban', report.totalOperatingExpenses],
    ['', ''],
    ['LABA BERSIH', report.netProfit],
  ];
  
  downloadCSV(generateCSV(headers, rows), `Laba-Rugi-${period}`);
};

// Export Cash Flow to CSV
export const exportCashFlowCSV = (report: {
  openingBalance: number;
  closingBalance: number;
  netCashFlow: number;
  operating: {
    inflows: { category: string; amount: number }[];
    outflows: { category: string; amount: number }[];
    netOperating: number;
  };
  investing: {
    inflows: { description: string; amount: number }[];
    outflows: { description: string; amount: number }[];
    netInvesting: number;
  };
}, period: string): void => {
  const totalInflow = report.operating.inflows.reduce((s, i) => s + i.amount, 0) + 
                      report.investing.inflows.reduce((s, i) => s + i.amount, 0);
  const totalOutflow = report.operating.outflows.reduce((s, i) => s + i.amount, 0) +
                       report.investing.outflows.reduce((s, i) => s + i.amount, 0);
  
  const headers = ['Keterangan', 'Jumlah (Rp)'];
  const rows: (string | number)[][] = [
    ['Saldo Awal', report.openingBalance],
    ['', ''],
    ['=== AKTIVITAS OPERASIONAL ===', ''],
    ['-- Pemasukan --', ''],
    ...report.operating.inflows.map(a => [a.category, a.amount]),
    ['-- Pengeluaran --', ''],
    ...report.operating.outflows.map(a => [a.category, -a.amount]),
    ['Net Operasional', report.operating.netOperating],
    ['', ''],
    ['=== AKTIVITAS INVESTASI ===', ''],
    ['-- Pemasukan --', ''],
    ...report.investing.inflows.map(a => [a.description, a.amount]),
    ['-- Pengeluaran --', ''],
    ...report.investing.outflows.map(a => [a.description, -a.amount]),
    ['Net Investasi', report.investing.netInvesting],
    ['', ''],
    ['Total Uang Masuk', totalInflow],
    ['Total Uang Keluar', totalOutflow],
    ['Arus Kas Bersih', report.netCashFlow],
    ['', ''],
    ['Saldo Akhir', report.closingBalance],
  ];
  
  downloadCSV(generateCSV(headers, rows), `Arus-Kas-${period}`);
};

// Export Balance Sheet to CSV
export const exportBalanceSheetCSV = (report: {
  assets: {
    current: { total: number; items: { name: string; balance: number }[] };
    fixed: { total: number; items: { name: string; balance: number }[] };
    totalAssets: number;
  };
  liabilities: {
    current: { total: number; items: { name: string; balance: number }[] };
    longTerm: { total: number; items: { name: string; balance: number }[] };
    totalLiabilities: number;
  };
  equity: { total: number; items: { name: string; balance: number }[] };
}, asOf: string): void => {
  const headers = ['Akun', 'Saldo (Rp)'];
  const rows: (string | number)[][] = [
    ['=== ASET LANCAR ===', ''],
    ...report.assets.current.items.map(a => [a.name, a.balance]),
    ['Subtotal Aset Lancar', report.assets.current.total],
    ['=== ASET TETAP ===', ''],
    ...report.assets.fixed.items.map(a => [a.name, a.balance]),
    ['Subtotal Aset Tetap', report.assets.fixed.total],
    ['TOTAL ASET', report.assets.totalAssets],
    ['', ''],
    ['=== KEWAJIBAN LANCAR ===', ''],
    ...report.liabilities.current.items.map(l => [l.name, l.balance]),
    ['Subtotal Kewajiban Lancar', report.liabilities.current.total],
    ['=== KEWAJIBAN JANGKA PANJANG ===', ''],
    ...report.liabilities.longTerm.items.map(l => [l.name, l.balance]),
    ['Subtotal Kewajiban Jangka Panjang', report.liabilities.longTerm.total],
    ['TOTAL KEWAJIBAN', report.liabilities.totalLiabilities],
    ['', ''],
    ['=== EKUITAS ===', ''],
    ...report.equity.items.map(e => [e.name, e.balance]),
    ['TOTAL EKUITAS', report.equity.total],
  ];
  
  downloadCSV(generateCSV(headers, rows), `Neraca-${asOf}`);
};

// Export Aging Report to CSV
export const exportAgingCSV = (
  type: 'receivables' | 'payables',
  items: { entityName: string; amount: number; dueDate: string; daysOverdue: number }[],
  summary: { total: number; current: number; days31to60: number; days61to90: number; over90: number }
): void => {
  const headers = ['Nama', 'Jumlah (Rp)', 'Jatuh Tempo', 'Hari Terlambat'];
  const rows: (string | number)[][] = items.map(item => [
    item.entityName,
    item.amount,
    item.dueDate,
    item.daysOverdue
  ]);
  
  rows.push(['', '', '', '']);
  rows.push(['=== RINGKASAN ===', '', '', '']);
  rows.push(['Total', summary.total, '', '']);
  rows.push(['Belum Jatuh Tempo (0-30 hari)', summary.current, '', '']);
  rows.push(['31-60 Hari', summary.days31to60, '', '']);
  rows.push(['61-90 Hari', summary.days61to90, '', '']);
  rows.push(['> 90 Hari', summary.over90, '', '']);
  
  const filename = type === 'receivables' ? 'Laporan-Piutang' : 'Laporan-Hutang';
  downloadCSV(generateCSV(headers, rows), filename);
};

// Export Transactions to CSV
export const exportTransactionsCSV = (
  transactions: { date: string; description: string; category: string; type: string; amount: number; project?: string }[],
  period: string
): void => {
  const headers = ['Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Project', 'Jumlah (Rp)'];
  const rows = transactions.map(t => [
    t.date,
    t.description,
    t.category,
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    t.project || '-',
    t.type === 'income' ? t.amount : -t.amount
  ]);
  
  downloadCSV(generateCSV(headers, rows), `Transaksi-${period}`);
};

// Export Project Financial Report to CSV
export const exportProjectFinanceCSV = (
  projectName: string,
  report: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    budgetUtilization: number;
    categories: { name: string; budgeted: number; actual: number; variance: number }[];
  }
): void => {
  const headers = ['Kategori', 'Anggaran (Rp)', 'Realisasi (Rp)', 'Selisih (Rp)'];
  const rows: (string | number)[][] = report.categories.map(c => [
    c.name,
    c.budgeted,
    c.actual,
    c.variance
  ]);
  
  rows.push(['', '', '', '']);
  rows.push(['=== RINGKASAN ===', '', '', '']);
  rows.push(['Total Pendapatan', report.totalIncome, '', '']);
  rows.push(['Total Pengeluaran', '', report.totalExpense, '']);
  rows.push(['Laba/Rugi Bersih', '', '', report.netProfit]);
  rows.push(['Utilisasi Anggaran', '', '', `${report.budgetUtilization.toFixed(1)}%`]);
  
  downloadCSV(generateCSV(headers, rows), `Project-${projectName.replace(/\s+/g, '-')}`);
};

// Helper text for financial concepts (for tooltips)
export const financialHelpers = {
  revenue: {
    title: 'Pendapatan',
    description: 'Uang yang masuk ke bisnis dari penjualan jasa atau produk.',
    tip: 'Semakin tinggi pendapatan, semakin banyak pekerjaan yang diterima bisnis.'
  },
  cogs: {
    title: 'Harga Pokok (HPP)',
    description: 'Biaya langsung untuk menghasilkan jasa/produk. Contoh: material, upah tukang.',
    tip: 'Jika HPP terlalu tinggi, perlu cek harga bahan atau efisiensi pekerja.'
  },
  grossProfit: {
    title: 'Laba Kotor',
    description: 'Pendapatan dikurangi Harga Pokok. Menunjukkan margin dari pekerjaan.',
    tip: 'Idealnya laba kotor minimal 20-30% dari pendapatan.'
  },
  operatingExpense: {
    title: 'Beban Operasional',
    description: 'Biaya untuk menjalankan bisnis sehari-hari. Contoh: gaji admin, listrik, sewa.',
    tip: 'Jaga agar beban operasional tidak melebihi laba kotor.'
  },
  netProfit: {
    title: 'Laba Bersih',
    description: 'Keuntungan akhir setelah semua biaya dikurangi. Ini yang bisa ditabung atau diinvestasikan.',
    tip: 'Laba bersih positif = bisnis sehat. Negatif = perlu evaluasi.'
  },
  cashFlow: {
    title: 'Arus Kas',
    description: 'Pergerakan uang masuk dan keluar dari bisnis.',
    tip: 'Meski untung, jika arus kas negatif, bisnis bisa kesulitan bayar tagihan.'
  },
  receivables: {
    title: 'Piutang',
    description: 'Uang yang masih harus diterima dari pelanggan. Sudah dikerjakan tapi belum dibayar.',
    tip: 'Piutang terlalu lama bisa ganggu cash flow. Follow up pelanggan.'
  },
  payables: {
    title: 'Hutang',
    description: 'Uang yang harus dibayar ke supplier atau pihak lain.',
    tip: 'Bayar hutang tepat waktu untuk menjaga reputasi bisnis.'
  },
  assets: {
    title: 'Aset',
    description: 'Apa yang dimiliki bisnis. Termasuk uang kas, stok barang, dan peralatan.',
    tip: 'Aset lancar (kas, piutang) lebih mudah digunakan daripada aset tetap.'
  },
  liabilities: {
    title: 'Kewajiban',
    description: 'Apa yang harus dibayar bisnis. Termasuk hutang supplier dan pinjaman.',
    tip: 'Kewajiban harus lebih kecil dari aset agar bisnis sehat.'
  },
  equity: {
    title: 'Modal/Ekuitas',
    description: 'Nilai kepemilikan dalam bisnis. Aset dikurangi Kewajiban.',
    tip: 'Ekuitas bertambah jika bisnis menghasilkan laba.'
  },
  budgetUtilization: {
    title: 'Utilisasi Anggaran',
    description: 'Seberapa banyak anggaran yang sudah terpakai.',
    tip: '< 75% = aman, 75-90% = perhatikan, > 90% = hati-hati overbudget.'
  }
};
