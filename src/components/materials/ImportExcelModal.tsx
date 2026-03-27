import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, Check, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db, Material } from '../../lib/db';
import { generateId } from '../../lib/utils';

interface ImportExcelModalProps {
  tenantId: string;
  businessId: string;
  onClose: () => void;
  onImported: () => void;
}

interface ParsedMaterial {
  name: string;
  unit: string;
  pricePerUnit: number;
  stockQuantity: number;
  minStockAlert: number;
  supplierName?: string;
  supplierContact?: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

export function ImportExcelModal({ tenantId, businessId, onClose, onImported }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedMaterial[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [importResult, setImportResult] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = [
      {
        'Nama Bahan': 'Contoh: Tepung Terigu',
        'Satuan': 'kg',
        'Harga Per Unit': 12000,
        'Stok': 10,
        'Minimal Stok': 5,
        'Nama Supplier': 'Toko ABC',
        'Kontak Supplier': '08123456789',
        'Catatan': 'Catatan opsional'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Bahan');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 30 }
    ];
    
    XLSX.writeFile(wb, 'template_import_bahan.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const parsed: ParsedMaterial[] = (jsonData as Record<string, unknown>[]).map((row) => {
          const errors: string[] = [];
          
          const name = String(row['Nama Bahan'] || '').trim();
          const unit = String(row['Satuan'] || '').trim();
          const pricePerUnit = Number(row['Harga Per Unit']) || 0;
          const stockQuantity = Number(row['Stok']) || 0;
          const minStockAlert = Number(row['Minimal Stok']) || 0;
          const supplierName = String(row['Nama Supplier'] || '').trim() || undefined;
          const supplierContact = String(row['Kontak Supplier'] || '').trim() || undefined;
          const notes = String(row['Catatan'] || '').trim() || undefined;

          if (!name) errors.push('Nama bahan wajib diisi');
          if (!unit) errors.push('Satuan wajib diisi');
          if (pricePerUnit < 0) errors.push('Harga tidak boleh negatif');
          if (stockQuantity < 0) errors.push('Stok tidak boleh negatif');

          return {
            name,
            unit,
            pricePerUnit,
            stockQuantity,
            minStockAlert,
            supplierName,
            supplierContact,
            notes,
            isValid: errors.length === 0,
            errors
          };
        });

        setParsedData(parsed);
        setStep('preview');
      } catch (error) {
        console.error('Error parsing Excel:', error);
        alert('Gagal membaca file Excel. Pastikan format file benar.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    let failed = 0;

    try {
      const validData = parsedData.filter(d => d.isValid);
      
      for (const item of validData) {
        try {
          await db.materials.add({
            id: generateId(),
            tenantId,
            businessId,
            name: item.name,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit,
            stockQuantity: item.stockQuantity,
            minStockAlert: item.minStockAlert,
            supplierName: item.supplierName,
            supplierContact: item.supplierContact,
            notes: item.notes,
            isActive: true,
            createdAt: new Date(),
          } as Material);
          success++;
        } catch {
          failed++;
        }
      }

      failed += parsedData.filter(d => !d.isValid).length;
      setImportResult({ success, failed });
      setStep('done');
    } catch (error) {
      console.error('Error importing:', error);
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedData.filter(d => d.isValid).length;
  const invalidCount = parsedData.filter(d => !d.isValid).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import Bahan dari Excel
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Template Download */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">📋 Download Template</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Gunakan template ini untuk memastikan format data sesuai dengan sistem.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-1">Upload File Excel</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Klik atau drag & drop file .xlsx atau .xls
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file && (
                  <p className="text-sm text-blue-600 font-medium">
                    📄 {file.name}
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-medium text-gray-900 mb-2">📝 Panduan Import</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Kolom <strong>Nama Bahan</strong> dan <strong>Satuan</strong> wajib diisi</li>
                  <li>• Kolom <strong>Harga Per Unit</strong> dan <strong>Stok</strong> harus berupa angka</li>
                  <li>• Kolom lainnya bersifat opsional</li>
                  <li>• Baris pertama harus berupa header (nama kolom)</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-2xl font-bold text-green-600">{validCount}</p>
                  <p className="text-sm text-green-700">Data Valid</p>
                </div>
                <div className="flex-1 p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                  <p className="text-sm text-red-700">Data Bermasalah</p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium text-gray-600">Status</th>
                        <th className="text-left p-3 font-medium text-gray-600">Nama Bahan</th>
                        <th className="text-left p-3 font-medium text-gray-600">Satuan</th>
                        <th className="text-right p-3 font-medium text-gray-600">Harga</th>
                        <th className="text-right p-3 font-medium text-gray-600">Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedData.map((item, idx) => (
                        <tr key={idx} className={item.isValid ? '' : 'bg-red-50'}>
                          <td className="p-3">
                            {item.isValid ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="relative group">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <div className="absolute left-0 top-6 bg-gray-900 text-white text-xs p-2 rounded hidden group-hover:block whitespace-nowrap z-10">
                                  {item.errors.join(', ')}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-medium">{item.name || '-'}</td>
                          <td className="p-3">{item.unit || '-'}</td>
                          <td className="p-3 text-right">Rp {item.pricePerUnit.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-right">{item.stockQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidCount > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    {invalidCount} data bermasalah akan dilewati saat import. Hover pada ikon merah untuk melihat detail error.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Import Selesai!</h3>
              <p className="text-gray-500 mb-6">
                {importResult.success} bahan berhasil diimport
                {importResult.failed > 0 && `, ${importResult.failed} data gagal`}
              </p>
              <button
                onClick={() => {
                  onImported();
                  onClose();
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition"
              >
                Selesai
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && (
          <div className="p-4 border-t bg-gray-50 flex gap-3">
            <button
              onClick={() => {
                setStep('upload');
                setFile(null);
                setParsedData([]);
              }}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
            >
              Pilih File Lain
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Import {validCount} Bahan
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
