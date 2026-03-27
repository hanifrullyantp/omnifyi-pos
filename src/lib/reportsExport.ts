import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PAYMENT_METHOD_LABELS } from './utils';

export interface ReportKpisSnapshot {
  totalOmzet: number;
  completedCount: number;
  voidCount: number;
  pendingCount: number;
  totalDiscount: number;
  totalTax: number;
  totalService: number;
  totalHpp: number;
  grossProfit: number;
  marginPercent: number;
  avgBasket: number;
  totalItemsQty: number;
}

export interface ReportExportPayload {
  businessName: string;
  generatedAt: Date;
  filterLabel: string;
  kpis: ReportKpisSnapshot;
  daily: { tanggal: string; omzet: number; transaksi: number; labaKotor: number }[];
  paymentRows: { metode: string; jumlahTrx: number; total: number }[];
  topProducts: { nama: string; qty: number; pendapatan: number }[];
  transactions: {
    invoice: string;
    tanggal: string;
    status: string;
    metode: string;
    kasir: string;
    subtotal: number;
    diskon: number;
    pajak: number;
    service: number;
    total: number;
  }[];
}

function safeFilename(s: string) {
  return s.replace(/[^\w\-]+/g, '-').replace(/\-+/g, '-').slice(0, 80);
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);
}

export function exportReportsExcel(payload: ReportExportPayload) {
  const name = safeFilename(`${payload.businessName}-laporan-${payload.generatedAt.toISOString().slice(0, 10)}`);
  const wb = XLSX.utils.book_new();

  const ringkasan: (string | number)[][] = [
    ['Laporan Penjualan'],
    ['Usaha', payload.businessName],
    ['Filter', payload.filterLabel],
    ['Diunduh', payload.generatedAt.toLocaleString('id-ID')],
    [],
    ['Metrik', 'Nilai'],
    ['Omzet (transaksi selesai)', payload.kpis.totalOmzet],
    ['Jumlah transaksi selesai', payload.kpis.completedCount],
    ['Transaksi pending', payload.kpis.pendingCount],
    ['Transaksi dibatalkan (void)', payload.kpis.voidCount],
    ['Total diskon', payload.kpis.totalDiscount],
    ['Total pajak', payload.kpis.totalTax],
    ['Total service charge', payload.kpis.totalService],
    ['HPP / COGS', payload.kpis.totalHpp],
    ['Laba kotor', payload.kpis.grossProfit],
    ['Margin (%)', payload.kpis.marginPercent],
    ['Rata-rata keranjang', payload.kpis.avgBasket],
    ['Total qty item terjual', payload.kpis.totalItemsQty],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ringkasan), 'Ringkasan');

  const dailySheet = XLSX.utils.json_to_sheet(
    payload.daily.map((d) => ({
      Tanggal: d.tanggal,
      Omzet: d.omzet,
      Transaksi: d.transaksi,
      Laba_kotor: d.labaKotor,
    }))
  );
  XLSX.utils.book_append_sheet(wb, dailySheet, 'Harian');

  const paySheet = XLSX.utils.json_to_sheet(
    payload.paymentRows.map((r) => ({
      Metode: r.metode,
      Jumlah_trx: r.jumlahTrx,
      Total: r.total,
    }))
  );
  XLSX.utils.book_append_sheet(wb, paySheet, 'Metode Bayar');

  const topSheet = XLSX.utils.json_to_sheet(
    payload.topProducts.map((r) => ({
      Produk: r.nama,
      Qty: r.qty,
      Pendapatan: r.pendapatan,
    }))
  );
  XLSX.utils.book_append_sheet(wb, topSheet, 'Top Produk');

  const trxSheet = XLSX.utils.json_to_sheet(
    payload.transactions.map((r) => ({
      Invoice: r.invoice,
      Tanggal: r.tanggal,
      Status: r.status,
      Metode: r.metode,
      Kasir: r.kasir,
      Subtotal: r.subtotal,
      Diskon: r.diskon,
      Pajak: r.pajak,
      Service: r.service,
      Total: r.total,
    }))
  );
  XLSX.utils.book_append_sheet(wb, trxSheet, 'Detail Transaksi');

  XLSX.writeFile(wb, `${name}.xlsx`);
}

export function exportReportsPdf(payload: ReportExportPayload) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 14;

  doc.setFontSize(16);
  doc.setTextColor(13, 148, 136);
  doc.text('Laporan Penjualan', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(payload.businessName, 14, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Filter: ${payload.filterLabel}`, 14, y);
  y += 4;
  doc.text(`Diunduh: ${payload.generatedAt.toLocaleString('id-ID')}`, 14, y);
  y += 8;

  const kpiBody: (string | number)[][] = [
    ['Omzet (selesai)', fmtMoney(payload.kpis.totalOmzet)],
    ['Trx selesai / pending / void', `${payload.kpis.completedCount} / ${payload.kpis.pendingCount} / ${payload.kpis.voidCount}`],
    ['Diskon', fmtMoney(payload.kpis.totalDiscount)],
    ['Pajak', fmtMoney(payload.kpis.totalTax)],
    ['Service', fmtMoney(payload.kpis.totalService)],
    ['HPP', fmtMoney(payload.kpis.totalHpp)],
    ['Laba kotor', fmtMoney(payload.kpis.grossProfit)],
    ['Margin', `${payload.kpis.marginPercent}%`],
    ['Avg keranjang', fmtMoney(payload.kpis.avgBasket)],
    ['Qty item', payload.kpis.totalItemsQty],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Metrik', 'Nilai']],
    body: kpiBody,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [13, 148, 136] },
    margin: { left: 14, right: 14 },
  });
  let cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const addSection = (title: string) => {
    if (cursor > 250) {
      doc.addPage();
      cursor = 14;
    }
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(title, 14, cursor);
    cursor += 5;
  };

  addSection('Ringkasan harian');
  autoTable(doc, {
    startY: cursor,
    head: [['Tanggal', 'Omzet', 'Trx', 'Laba kotor']],
    body: payload.daily.slice(0, 31).map((d) => [
      d.tanggal,
      fmtMoney(d.omzet),
      String(d.transaksi),
      fmtMoney(d.labaKotor),
    ]),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [13, 148, 136] },
    margin: { left: 14, right: 14 },
  });
  cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  addSection('Metode pembayaran');
  autoTable(doc, {
    startY: cursor,
    head: [['Metode', 'Trx', 'Total']],
    body: payload.paymentRows.map((r) => [r.metode, String(r.jumlahTrx), fmtMoney(r.total)]),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [13, 148, 136] },
    margin: { left: 14, right: 14 },
  });
  cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  addSection('Top produk');
  autoTable(doc, {
    startY: cursor,
    head: [['Produk', 'Qty', 'Pendapatan']],
    body: payload.topProducts.slice(0, 20).map((r) => [r.nama.slice(0, 36), String(r.qty), fmtMoney(r.pendapatan)]),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [99, 102, 241] },
    margin: { left: 14, right: 14 },
  });
  cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  addSection('Detail transaksi (maks. 40 baris)');
  autoTable(doc, {
    startY: cursor,
    head: [['Invoice', 'Tgl', 'Status', 'Metode', 'Total']],
    body: payload.transactions.slice(0, 40).map((r) => [
      r.invoice,
      r.tanggal.slice(0, 19),
      r.status,
      r.metode,
      fmtMoney(r.total),
    ]),
    styles: { fontSize: 6 },
    headStyles: { fillColor: [55, 65, 81] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${safeFilename(`laporan-${payload.businessName}`)}.pdf`);
}

export function paymentLabel(method: string) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
