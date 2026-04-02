## Matriks QA — Skenario × Modul × Persona

Dokumen ini adalah **peta cakupan** perilaku aplikasi Omnifyi POS (berdasarkan implementasi saat ini). Setiap baris adalah satu skenario uji yang bisa dieksekusi, ditautkan ke test case detail dan backlog perbaikan bila ada gap.

### Legenda
- **CurrentCoverage**
  - **Supported**: sudah ada alur UI + penyimpanan/logic utama
  - **Partial**: ada sebagian, tapi ada gap penting / tergantung integrasi eksternal
  - **NotYet**: belum ada / masih placeholder
- **Priority**
  - **P0**: blocker transaksi/data/auth; crash; integritas stok; kehilangan data
  - **P1**: alur operasional inti owner/kasir; laporan/shift end-to-end
  - **P2**: enhancement, modul HR penuh, hardening sync/UX

### Referensi sumber bukti (EvidenceSource)
Mayoritas skenario diturunkan dari:
- `DOKUMENTASI_FITUR_APLIKASI.md`
- `src/App.tsx`
- `src/components/pos/POSScreen.tsx`
- `src/components/pos/PaymentModal.tsx`
- `src/pages/ProductsPage.tsx`
- `src/components/materials/MaterialsPage.tsx`
- `src/pages/ShiftsPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/StorePage.tsx`
- `src/lib/syncAdapter.ts`

---

### Matriks

| ScenarioID | Persona | Module | Submodule/Flow | Preconditions (data/env/role/state) | TestSteps (ringkas) | ExpectedResult | CurrentCoverage | EvidenceSource | Priority | ImprovementNeeded | GapID |
|---|---|---|---|---|---|---|---|---|---|---|---|
| VIS-001 | Visitor | Marketing | Landing_open | App bisa dibuka; tidak login | Buka landing | Landing tampil, CTA terlihat, tidak ada error | Supported | `src/app/(marketing)/page.tsx`, `DOKUMENTASI_FITUR_APLIKASI.md` | P1 | Tidak | - |
| VIS-002 | Visitor | Marketing | Demo_signup_to_owner_demo | Tidak login; mode demo aktif | Isi form demo → submit | Lead tercatat; login demo owner; dashboard demo tampil | Supported | `src/app/(marketing)/page.tsx`, `src/lib/billingFlow.ts`, `src/lib/db.ts` | P1 | Tidak | - |
| VIS-003 | Visitor | Billing | Checkout_simulated_paid_provision | Tidak login; checkout flow tersedia | Checkout (simulasi) hingga paid | Status lead berubah; owner baru diprovision; kredensial sementara tersedia | Partial | `src/lib/billingFlow.ts`, `src/lib/db.ts`, `MANUAL_SETUP.md` | P1 | Ya | GAP-BILL-001 |
| AUTH-001 | Owner | Auth | Owner_login_non_demo | Supabase env tersedia; akun non-demo ada | Login email/password | Login sukses; tenant+business terprovision; workspace kosong siap dipakai | Supported | `src/App.tsx`, `src/lib/cloudProvision.ts` | P0 | Tidak | - |
| AUTH-002 | Owner | Auth | Session_restore | Sudah login sebelumnya | Refresh halaman | Sesi pulih; dashboard terbuka tanpa login ulang | Supported | `src/App.tsx` | P0 | Tidak | - |
| OUT-001 | Owner | MultiOutlet | Switch_business_context | Owner punya ≥2 business | Pindah business dari selector | Data (produk/transaksi/laporan) berganti sesuai business | Supported | `src/App.tsx`, `src/lib/store.ts` | P1 | Tidak | - |
| OUT-002 | Owner | StorePage | Open_store_dashboard | Ada business; route store ada | Klik kartu gerai → store page | Masuk `/dashboard/store/:storeId`; menu tampil | Partial | `src/pages/StorePage.tsx`, `src/App.tsx` | P2 | Ya | GAP-STORE-001 |
| DASH-001 | Owner | Dashboard | KPI_overview | Ada transaksi/produk minimal | Buka Dashboard tab overview | KPI, grafik, aktivitas, notifikasi tampil tanpa overflow | Supported | `src/App.tsx` | P1 | Tidak | - |
| DASH-002 | Owner | Dashboard | Notification_new_order | Ada transaksi terbaru | Buka Dashboard; lihat notifikasi | Notif “Orderan baru masuk” muncul sesuai transaksi terbaru | Supported | `src/App.tsx` | P1 | Tidak | - |
| PROD-001 | Owner | Products | Create_product | Login owner; business aktif | Tambah produk (nama/harga/stok) | Produk tersimpan; muncul di list; aktif | Supported | `src/pages/ProductsPage.tsx`, `src/components/products/*` | P0 | Tidak | - |
| PROD-002 | Owner | Products | Deactivate_product_hidden_in_pos | Ada produk aktif | Nonaktifkan produk → buka POS | Produk nonaktif tidak tampil di grid POS | Supported | `src/components/pos/POSScreen.tsx` | P0 | Tidak | - |
| INV-001 | Owner | Materials | Create_material | Login owner | Tambah bahan baku | Material tersimpan; terlihat di list | Supported | `src/components/materials/MaterialsPage.tsx` | P1 | Tidak | - |
| INV-002 | Owner | Materials | Restock_material_history | Ada material | Restock material | Stok bertambah; history tersimpan; nilai stok terupdate | Supported | `src/components/materials/RestockModal.tsx`, `src/lib/db.ts` | P1 | Tidak | - |
| INV-003 | Owner | Inventory | Low_stock_alerts_owner | `notifyLowStock=true`; ada item <= min | Buka Dashboard attention | Item stok menipis muncul di attention/notif | Supported | `src/App.tsx`, `src/pages/SettingsPage.tsx` | P1 | Tidak | - |
| POS-001 | Kasir | POS | Cashier_pin_login | Ada kasir aktif + PIN | Masuk POS via PIN | Kasir terpilih; POS screen tampil | Supported | `src/App.tsx`, `src/components/pos/POSScreen.tsx` | P0 | Tidak | - |
| POS-002 | Kasir | POS | Add_to_cart_in_stock | Ada produk stok cukup | Tap produk | Item masuk keranjang; qty bertambah | Supported | `src/components/pos/POSScreen.tsx`, `src/lib/store.ts` | P0 | Tidak | - |
| POS-003 | Kasir | POS | Prevent_oversell_stock_insufficient | Produk stok rendah/0 | Tap produk stok 0 / qty > stok | Alert stok; item tidak bertambah; bayar ditolak bila qty > stok | Supported | `src/components/pos/POSScreen.tsx`, `src/components/pos/PaymentModal.tsx` | P0 | Tidak | - |
| POS-004 | Kasir | POS | Checkout_payment_methods | Ada item di cart | Bayar Tunai/QRIS/Transfer/Ewallet | Transaksi `COMPLETED` tersimpan; item transaksi tersimpan; stok berkurang | Supported | `src/components/pos/PaymentModal.tsx`, `src/lib/posStockLedger.ts` | P0 | Tidak | - |
| POS-005 | Kasir | POS | Print_receipt_browser | Setelah transaksi sukses | Klik cetak (browser) | Dialog print muncul; konten struk sesuai invoice | Supported | `src/components/pos/PaymentModal.tsx` | P1 | Tidak | - |
| POS-006 | Kasir | POS | Print_receipt_bluetooth | Device mendukung BLE; HTTPS/localhost; printer paired | Hubungkan printer → cetak | Jika BLE sukses, struk tercetak; jika gagal fallback browser | Partial | `src/lib/bluetoothReceiptPrinter.ts`, `src/components/pos/PosSettingsModal.tsx` | P2 | Ya | GAP-POS-PRINT-001 |
| SHIFT-001 | Owner | Shift | Create_shift | Login owner | Buat shift baru | Shift tersimpan & muncul di list | Supported | `src/pages/ShiftsPage.tsx`, `src/lib/db.ts` | P1 | Tidak | - |
| SHIFT-002 | Owner | Shift | Assign_cashier_to_shift_date | Ada shift+kasir aktif | Assign kasir ke hari+shift | Assignment tersimpan; terlihat pada jadwal | Supported | `src/pages/ShiftsPage.tsx` | P1 | Tidak | - |
| SHIFT-003 | Owner | Shift | Close_shift_reconciliation | Ada cashier session ACTIVE + transaksi | Tutup shift isi kas aktual | Shift close record tersimpan; variance dihitung; sesi CLOSED | Supported | `src/pages/ShiftsPage.tsx`, `src/lib/shiftCloseHelpers.ts` | P0 | Tidak | - |
| FIN-001 | Owner | Finance | Cashflow_entry | Login owner | Tambah pemasukan/pengeluaran | Entry tersimpan; muncul di cashflow | Supported | `src/pages/FinancePage.tsx`, `src/lib/financeData.ts` | P1 | Tidak | - |
| FIN-002 | Owner | Finance | Debt_receivable_and_payment | Login owner | Buat hutang/piutang → bayar cicilan | Data tersimpan; saldo terupdate | Supported | `src/pages/FinancePage.tsx`, `src/lib/db.ts` | P1 | Tidak | - |
| REP-001 | Owner | Reports | Reports_filter_export | Ada transaksi | Buka laporan, filter, export | Ringkasan sesuai filter; export file terunduh | Supported | `src/pages/ReportsPage.tsx`, `src/lib/reportsExport.ts` | P1 | Tidak | - |
| SET-001 | Owner | Settings | Business_tax_service_receipt | Login owner; business aktif | Ubah pajak/service/receipt header/footer | Perhitungan POS mengikuti; struk mengikuti | Supported | `src/pages/SettingsPage.tsx`, `src/components/pos/POSScreen.tsx` | P0 | Tidak | - |
| DATA-001 | Owner | Settings | Backup_export_json | Login owner; business aktif | Export backup JSON | File JSON terunduh berisi data utama | Supported | `src/pages/SettingsPage.tsx` | P1 | Tidak | - |
| DATA-002 | Owner | Settings | Danger_clear_transactions | Ada transaksi | Clear transaksi (danger zone) | Transaksi & item terkait terhapus untuk business itu | Supported | `src/pages/SettingsPage.tsx` | P0 | Tidak | - |
| CMS-001 | SuperAdminLanding | CMS_Landing | Edit_save_publish_edge | Env `VITE_CONTENT_EDGE_URL`+secret benar; Edge function deploy | Edit konten → Simpan → cek incognito | Konten konsisten lintas browser/incognito | Partial | `src/pages/LandingAdminPage.tsx`, `src/lib/landingContent.ts` | P1 | Ya | GAP-CMS-001 |
| CMS-002 | SuperAdminLanding | CMS_Landing | Upload_asset_to_storage | Bucket storage tersedia | Upload media di CMS | URL asset valid; muncul di preview | Partial | `src/pages/LandingAdminPage.tsx` | P2 | Ya | GAP-CMS-002 |
| SADM-001 | SuperAdminApp | SuperAdmin | Branding_login_screen_local | Login owner; akses super admin | Ubah brand settings | Login screen app berubah di device ini | Supported | `src/pages/SuperAdminPage.tsx`, `src/lib/superAdminSettings.ts` | P2 | Tidak | - |
| SYNC-001 | Owner | Sync | Offline_queue_when_offline | Browser offline; transaksi dibuat | Buat transaksi offline | Transaksi tetap tersimpan lokal; antre sync bertambah | Partial | `src/lib/store.ts`, `src/lib/syncAdapter.ts` | P1 | Ya | GAP-SYNC-001 |
| SYNC-002 | Owner | Sync | Sync_endpoint_available | Endpoint `VITE_SYNC_ENDPOINT` valid; user punya token | Jalankan siklus sync | Pending sync terkirim; status ok; konflik ditangani | Partial | `src/lib/syncAdapter.ts`, `api/sync/batch.ts` | P1 | Ya | GAP-SYNC-002 |
| HR-001 | Karyawan | HR | Roles_permissions_matrix | Perlu definisi role & policy | Coba akses menu terbatas | Pembatasan menu/aksi sesuai role | NotYet | (belum ada modul izin granular) | P2 | Ya | GAP-HR-001 |
| HR-002 | Karyawan | HR | Attendance_general | Perlu modul absensi karyawan umum | Clock-in/out karyawan | Absensi tercatat; laporan absensi tersedia | Partial | `src/pages/HistoryPage.tsx` (export absensi), shift session | P2 | Ya | GAP-HR-002 |
| HR-003 | Karyawan | HR | Payroll | Perlu modul payroll | Hitung gaji/komisi | Payroll tersimpan; slip tersedia | NotYet | (placeholder) | P2 | Ya | GAP-HR-003 |

---

### Catatan eksekusi
- Detail langkah uji dan data uji untuk setiap `ScenarioID` ada di `docs/qa/TEST_CASES_FORMAL.md`.
- Semua baris yang `ImprovementNeeded=Ya` harus punya `GapID` yang terdefinisi di `docs/qa/IMPROVEMENT_BACKLOG.md`.
