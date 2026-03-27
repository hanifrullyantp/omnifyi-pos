import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
export type CashflowType = 'INCOME' | 'EXPENSE';

export type TimelineSource = 'sale' | 'cost' | 'manual';

export interface CashflowTimelineItem {
  id: string;
  date: Date;
  type: CashflowType;
  category: string;
  description: string;
  amount: number;
  source: TimelineSource;
  attachmentName?: string | null;
}

export interface ProfitLossReport {
  periodeLabel: string;
  penjualanKotor: number;
  diskon: number;
  penjualanBersih: number;
  hpp: number;
  labaKotor: number;
  operatingBreakdown: { category: string; amount: number }[];
  totalBeban: number;
  labaBersih: number;
  netMargin: number;
}

export interface SimpleBalanceSheet {
  periodeLabel: string;
  saldoKas: number;
  piutang: number;
  hutang: number;
  ekuitas: number;
}

function formatDateISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function safeFilename(s: string) {
  return s.replace(/[^\w\-]+/g, '-').replace(/\-+/g, '-');
}

function renderBarChartDataUrl(opts: { labels: string[]; values: number[]; color: string }) {
  const width = 720;
  const height = 320;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Grid + axes
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartHeight * i) / 4;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartWidth, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#d1d5db';
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + chartHeight);
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.stroke();

  const maxVal = Math.max(1, ...opts.values.map(v => Math.abs(v)));
  const barCount = opts.values.length;
  const barGap = 10;
  const barWidth = Math.max(10, (chartWidth - barGap * (barCount - 1)) / Math.max(1, barCount));

  const baseline = padding + chartHeight;
  for (let i = 0; i < barCount; i++) {
    const v = opts.values[i] || 0;
    const barH = (Math.abs(v) / maxVal) * chartHeight;
    const x = padding + i * (barWidth + barGap);
    const y = baseline - barH;

    ctx.fillStyle = opts.color;
    // Positive bar up, negative bar down (we still draw from baseline)
    const adjustedY = y;
    const adjustedH = barH;
    roundRect(ctx, x, adjustedY, barWidth, adjustedH, 6, true, false);

    ctx.fillStyle = '#374151';
    ctx.font = '11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    const label = opts.labels[i] ?? '';
    ctx.save();
    ctx.translate(x + barWidth / 2, baseline + 18);
    ctx.rotate(-Math.PI / 4);
    ctx.textAlign = 'right';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean,
  stroke: boolean
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

export function exportFinanceExcel(params: {
  businessName: string;
  periodeLabel: string;
  cashflowItems: CashflowTimelineItem[];
  profitLoss: ProfitLossReport;
  balanceSheet: SimpleBalanceSheet;
  rawData: {
    transactions: any[];
    transactionItems: any[];
    businessCosts: any[];
    cashflowEntries: any[];
    debtReceivables: any[];
    debtPayments: any[];
  };
}) {
  const { businessName, periodeLabel, cashflowItems, profitLoss, balanceSheet, rawData } = params;

  const wb = XLSX.utils.book_new();

  const cashflowRows = cashflowItems
    .slice()
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(item => ({
      Tanggal: formatDateISO(item.date),
      Tipe: item.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      Kategori: item.category,
      Deskripsi: item.description,
      Sumber: item.source,
      Lampiran: item.attachmentName || '-',
      Jumlah: item.amount,
    }));

  const sheetCashflow = XLSX.utils.json_to_sheet(cashflowRows);
  XLSX.utils.book_append_sheet(wb, sheetCashflow, 'Cashflow Detail');

  const plRows = [
    ['PENDAPATAN', ''],
    ['Penjualan kotor', profitLoss.penjualanKotor],
    ['Diskon', profitLoss.diskon],
    ['Penjualan bersih', profitLoss.penjualanBersih],
    [''],
    ['HPP', profitLoss.hpp],
    ['LABA KOTOR', profitLoss.labaKotor],
    [''],
    ['BEBAN OPERASIONAL', ''],
    ...profitLoss.operatingBreakdown.map(b => [b.category, b.amount]),
    ['Total beban', profitLoss.totalBeban],
    [''],
    ['LABA BERSIH', profitLoss.labaBersih],
    ['Net Margin (%)', profitLoss.netMargin],
  ];
  const sheetPL = XLSX.utils.aoa_to_sheet(plRows);
  XLSX.utils.book_append_sheet(wb, sheetPL, 'Laba Rugi');

  const sheetBSRows = [
    ['Neraca Sederhana', ''],
    ['Saldo Kas', balanceSheet.saldoKas],
    ['Piutang', balanceSheet.piutang],
    ['Hutang', balanceSheet.hutang],
    ['Ekuitas (kas + piutang - hutang)', balanceSheet.ekuitas],
  ];
  const sheetBS = XLSX.utils.aoa_to_sheet(sheetBSRows);
  XLSX.utils.book_append_sheet(wb, sheetBS, 'Neraca Sederhana');

  // Raw data: keep as flat tables to help users export/edit
  const sheetRawTx = XLSX.utils.json_to_sheet(rawData.transactions);
  XLSX.utils.book_append_sheet(wb, sheetRawTx, 'Transaksi Raw');

  const sheetRawCosts = XLSX.utils.json_to_sheet(rawData.businessCosts);
  XLSX.utils.book_append_sheet(wb, sheetRawCosts, 'Biaya Raw');

  const sheetRawCashflow = XLSX.utils.json_to_sheet(rawData.cashflowEntries);
  XLSX.utils.book_append_sheet(wb, sheetRawCashflow, 'Cashflow Entry Raw');

  const sheetRawDebts = XLSX.utils.json_to_sheet(rawData.debtReceivables);
  XLSX.utils.book_append_sheet(wb, sheetRawDebts, 'Debt/Receivable Raw');

  const sheetRawDebtPayments = XLSX.utils.json_to_sheet(rawData.debtPayments);
  XLSX.utils.book_append_sheet(wb, sheetRawDebtPayments, 'Debt Payments Raw');

  const filename = `Finance-${safeFilename(businessName)}-${safeFilename(periodeLabel)}`;
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportFinancePDF(params: {
  businessName: string;
  logoUrl?: string;
  periodeLabel: string;
  cashflowItems: CashflowTimelineItem[];
  profitLoss: ProfitLossReport;
  balanceSheet: SimpleBalanceSheet;
}) {
  const { businessName, logoUrl, periodeLabel, cashflowItems, profitLoss, balanceSheet } = params;

  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const brand = '#10b981';
  const muted = '#6b7280';

  let y = 30;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);

  // Logo placeholder (we keep it simple to avoid CORS issues)
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(40, 18, 24, 24, 6, 6, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('∞', 49.5, 32);

  doc.setTextColor(17, 24, 39);
  doc.text('Laporan Usaha Lengkap', 72, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(10);
  doc.text(`Nama Usaha: ${businessName}`, 72, y);
  y += 12;
  doc.text(`Periode: ${periodeLabel}`, 72, y);
  y += 18;

  // Summary cards (text blocks)
  const totalMasuk = cashflowItems.filter(i => i.type === 'INCOME').reduce((s, i) => s + i.amount, 0);
  const totalKeluar = cashflowItems.filter(i => i.type === 'EXPENSE').reduce((s, i) => s + i.amount, 0);
  const saldo = totalMasuk - totalKeluar;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.setFontSize(9);
  const cardW = 160;
  const cardH = 52;

  const cards = [
    { x: 40, label: 'Total Masuk', value: `Rp ${totalMasuk.toLocaleString('id-ID')}`, color: [16, 185, 129] as [number, number, number] },
    { x: 220, label: 'Total Keluar', value: `Rp ${totalKeluar.toLocaleString('id-ID')}`, color: [239, 68, 68] as [number, number, number] },
    { x: 40, label: 'Saldo', value: `Rp ${saldo.toLocaleString('id-ID')}`, color: [59, 130, 246] as [number, number, number] },
    { x: 220, label: 'Laba Bersih', value: `Rp ${profitLoss.labaBersih.toLocaleString('id-ID')}`, color: profitLoss.labaBersih >= 0 ? ([16, 185, 129] as [number, number, number]) : ([239, 68, 68] as [number, number, number]) },
  ];

  cards.forEach((c, idx) => {
    const row = idx < 2 ? 0 : 1;
    const cx = c.x;
    const cy = 90 + row * 62;
    doc.setFillColor(255, 255, 255);
    doc.rect(cx, cy, cardW, cardH, 'S');
    doc.setTextColor(...mutedToRgb(muted));
    doc.text(c.label, cx + 12, cy + 18);
    doc.setTextColor(...c.color);
    doc.setFontSize(12);
    doc.text(c.value, cx + 12, cy + 36);
    doc.setFontSize(9);
    doc.setTextColor(...mutedToRgb(muted));
  });

  // Charts
  y = 230;
  const timelineSorted = cashflowItems.slice().sort((a, b) => a.date.getTime() - b.date.getTime());
  const last10 = timelineSorted.slice(-10);
  const labels = last10.map(i => i.date.toISOString().slice(5, 10)); // MM-DD
  const values = last10.map(i => (i.type === 'INCOME' ? i.amount : -i.amount));

  const chartDataUrl = renderBarChartDataUrl({
    labels,
    values: values.map(v => Math.abs(v)),
    color: '#10b981',
  });
  const imgX = 40;
  const imgW = 340;
  const imgH = 140;
  if (chartDataUrl) {
    doc.addImage(chartDataUrl, 'PNG', imgX, y, imgW, imgH);
  }

  y += 160;

  // Profit & Loss table
  autoTable(doc as any, {
    startY: y,
    head: [['Bagian', 'Jumlah']],
    body: [
      ['Penjualan kotor', `Rp ${profitLoss.penjualanKotor.toLocaleString('id-ID')}`],
      ['Diskon', `Rp ${profitLoss.diskon.toLocaleString('id-ID')}`],
      ['Penjualan bersih', `Rp ${profitLoss.penjualanBersih.toLocaleString('id-ID')}`],
      ['HPP', `Rp ${profitLoss.hpp.toLocaleString('id-ID')}`],
      ['Laba kotor', `Rp ${profitLoss.labaKotor.toLocaleString('id-ID')}`],
      [''],
      ...profitLoss.operatingBreakdown.map(b => [`${b.category}`, `Rp ${b.amount.toLocaleString('id-ID')}`]),
      ['Total beban', `Rp ${profitLoss.totalBeban.toLocaleString('id-ID')}`],
      ['Laba bersih', `Rp ${profitLoss.labaBersih.toLocaleString('id-ID')}`],
      [`Net margin`, `${profitLoss.netMargin}%`],
    ],
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 190 },
      1: { cellWidth: 160, halign: 'right' },
    },
  });

  let cursorY = ((doc as any).lastAutoTable?.finalY ?? y) + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('Arus Kas (detail terbaru)', 40, cursorY);
  doc.setFont('helvetica', 'normal');

  const cfBody = timelineSorted.slice(-35).map((i) => [
    i.date.toLocaleDateString('id-ID'),
    i.type === 'INCOME' ? 'Masuk' : 'Keluar',
    i.category,
    i.description.length > 36 ? `${i.description.slice(0, 36)}…` : i.description,
    `Rp ${i.amount.toLocaleString('id-ID')}`,
  ]);

  autoTable(doc as any, {
    startY: cursorY + 8,
    head: [['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah']],
    body: cfBody.length ? cfBody : [['—', '—', '—', 'Tidak ada transaksi', 'Rp 0']],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 48 },
      2: { cellWidth: 72 },
      3: { cellWidth: 140 },
      4: { cellWidth: 80, halign: 'right' },
    },
  });

  cursorY = ((doc as any).lastAutoTable?.finalY ?? cursorY) + 16;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Neraca sederhana', 40, cursorY);
  doc.setFont('helvetica', 'normal');

  autoTable(doc as any, {
    startY: cursorY + 8,
    head: [['Pos', 'Jumlah']],
    body: [
      ['Saldo kas (estimasi)', `Rp ${balanceSheet.saldoKas.toLocaleString('id-ID')}`],
      ['Piutang belum tertagih', `Rp ${balanceSheet.piutang.toLocaleString('id-ID')}`],
      ['Hutang belum dibayar', `Rp ${balanceSheet.hutang.toLocaleString('id-ID')}`],
      ['Ekuitas (kas + piutang − hutang)', `Rp ${balanceSheet.ekuitas.toLocaleString('id-ID')}`],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 220 },
      1: { cellWidth: 130, halign: 'right' },
    },
  });

  // Analysis & insights (simple)
  const netSign = profitLoss.labaBersih >= 0 ? 'positif' : 'negatif';
  const topExpense = profitLoss.operatingBreakdown
    .slice()
    .sort((a, b) => b.amount - a.amount)[0]?.category;

  const startAnalysisY = ((doc as any).lastAutoTable?.finalY ?? cursorY) + 18;
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('Analisis & Insight', 40, startAnalysisY);
  doc.setFontSize(10);
  doc.setTextColor(...mutedToRgb(muted));
  doc.text(
    `1) Laba bersih ${netSign}. Margin: ${profitLoss.netMargin}%`,
    40,
    startAnalysisY + 18
  );
  doc.text(
    `2) Kategori beban terbesar: ${topExpense || '-'} (untuk periode ini).`,
    40,
    startAnalysisY + 36
  );
  doc.text(
    `3) Saldo kas: Rp ${saldo.toLocaleString('id-ID')} (pemasukan - pengeluaran).`,
    40,
    startAnalysisY + 54
  );

  // Footer timestamp
  const footerY = startAnalysisY + 75;
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `Generated at: ${new Date().toLocaleString('id-ID')}`,
    40,
    footerY
  );

  doc.save(`Laporan-Usaha-${safeFilename(businessName)}-${safeFilename(periodeLabel)}.pdf`);
}

function mutedToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

