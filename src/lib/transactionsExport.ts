import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction, PaymentMethod } from './db';
import { PAYMENT_METHOD_LABELS, formatCurrency } from './utils';

export interface TransactionsExportRow {
  invoice: string;
  tanggal: string;
  kasir: string;
  status: string;
  metode: string;
  subtotal: number;
  diskon: number;
  pajak: number;
  service: number;
  total: number;
  catatan?: string;
  pelanggan?: string;
}

function safeFilename(s: string) {
  return s.replace(/[^\w\-]+/g, '-').replace(/\-+/g, '-').slice(0, 80);
}

export function exportTransactionsExcel(opts: {
  businessName: string;
  filterLabel: string;
  generatedAt: Date;
  rows: TransactionsExportRow[];
}) {
  const { businessName, filterLabel, generatedAt, rows } = opts;
  const name = safeFilename(`${businessName}-transaksi-${generatedAt.toISOString().slice(0, 10)}`);
  const wb = XLSX.utils.book_new();

  const meta = [
    ['Laporan transaksi'],
    ['Usaha', businessName],
    ['Filter', filterLabel],
    ['Diunduh', generatedAt.toLocaleString('id-ID')],
    [],
    ['Invoice', 'Tanggal', 'Kasir', 'Status', 'Metode', 'Subtotal', 'Diskon', 'Pajak', 'Service', 'Total', 'Pelanggan', 'Catatan'],
  ];

  const sheet = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      Invoice: r.invoice,
      Tanggal: r.tanggal,
      Kasir: r.kasir,
      Status: r.status,
      Metode: r.metode,
      Subtotal: r.subtotal,
      Diskon: r.diskon,
      Pajak: r.pajak,
      Service: r.service,
      Total: r.total,
      Pelanggan: r.pelanggan ?? '',
      Catatan: r.catatan ?? '',
    }))
  );

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(meta), 'Ringkasan');
  XLSX.utils.book_append_sheet(wb, sheet, 'Transaksi');
  XLSX.writeFile(wb, `${name}.xlsx`);
}

export function exportTransactionsPdf(opts: {
  businessName: string;
  filterLabel: string;
  generatedAt: Date;
  rows: TransactionsExportRow[];
}) {
  const { businessName, filterLabel, generatedAt, rows } = opts;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.setTextColor(13, 148, 136);
  doc.text('Laporan Transaksi', 14, 14);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(businessName, 14, 22);
  doc.setTextColor(100, 100, 100);
  doc.text(`Filter: ${filterLabel}`, 14, 28);
  doc.text(`Diunduh: ${generatedAt.toLocaleString('id-ID')}`, 14, 34);

  const body = rows.slice(0, 200).map((r) => [
    r.invoice,
    r.tanggal,
    r.kasir,
    r.status,
    r.metode,
    formatCurrency(r.subtotal),
    formatCurrency(r.diskon),
    formatCurrency(r.pajak),
    formatCurrency(r.service),
    formatCurrency(r.total),
  ]);

  const startY = 42;
  autoTable(doc, {
    startY,
    head: [['Invoice', 'Tanggal', 'Kasir', 'Status', 'Metode', 'Subtotal', 'Diskon', 'Pajak', 'Service', 'Total']],
    body,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [13, 148, 136] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${safeFilename(`transaksi-${businessName}`)}.pdf`);
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

