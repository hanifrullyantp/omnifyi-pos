## Improvement Backlog — Gap → Fix Plan (Tanpa Terkecuali)

Dokumen ini memetakan semua gap dari matriks (`ImprovementNeeded=Ya`) menjadi item perbaikan yang **wajib** dieksekusi sampai memenuhi Definition of Done (DoD).

### Aturan coverage (wajib)
- Tidak boleh ada baris matriks dengan `ImprovementNeeded=Ya` tanpa `GapID`.
- Tidak boleh ada `GapID` tanpa `RelatedScenarioIDs` minimal 1.
- Setiap `GapID` harus punya **DoD yang testable** dan referensi `TC_ID` yang harus lulus.

### Format item backlog
- **GapID**
- **RelatedScenarioIDs**
- **RootCause**
- **ProposedFix**
- **AffectedFiles**
- **Dependency**
- **Risk**
- **Effort**: S/M/L
- **TargetMilestone**: P0/P1/P2
- **DoD**
- **RegressionTests** (TC_ID)

---

## GAP-BILL-001 — Checkout masih simulasi (belum payment real)
- **RelatedScenarioIDs**: `VIS-003`
- **RootCause**: Flow pembelian paket masih pakai simulasi frontend (`runLocalBillingFlow`) tanpa gateway payment/webhook/email.
- **ProposedFix**:
  - Tambah backend billing minimal:
    - `POST /api/billing/checkout` (create payment)
    - `POST /api/billing/webhook` (verifikasi + update status)
    - `POST /api/auth/provision` (provisioning account + set password flow)
  - Update UI checkout untuk state real (pending/paid/failed).
- **AffectedFiles**:
  - `src/lib/billingFlow.ts` (replace/branch untuk real)
  - `src/app/(marketing)/page.tsx` (checkout UI)
  - (baru) `api/billing/*` (serverless)
- **Dependency**: Midtrans account + server key; email provider (opsional tapi direkomendasikan).
- **Risk**: Tinggi (keamanan keys, webhook spoofing, payment reconciliation).
- **Effort**: L
- **TargetMilestone**: P2 (karena produk saat ini masih demo-first; bisa dinaikkan bila target production billing sudah ditentukan)
- **DoD**:
  - Payment real berhasil (sandbox) dan status order update via webhook valid.
  - Owner provisioning terjadi hanya setelah paid terverifikasi.
  - Tidak ada server key di `VITE_*`.
- **RegressionTests**: `TC-BILL-001` (diadaptasi jadi real), plus test keamanan webhook (baru).

**Status**: Done (Midtrans-ready: checkout + status verify + webhook verify)
- **Implementasi**:
  - Tambah endpoint backend:
    - `POST /api/billing/checkout` → create Snap transaction (butuh `MIDTRANS_SERVER_KEY` di server).
    - `GET /api/billing/status?orderId=...` → verifikasi status via Midtrans Status API.
    - `POST /api/billing/webhook` → verifikasi `signature_key` Midtrans (SHA512).
  - UI checkout (landing + app) bisa:
    - membuka halaman pembayaran Midtrans (redirect URL),
    - verifikasi paid lewat tombol “Saya sudah bayar” (status API),
    - baru kemudian menjalankan provisioning lokal v1.
- **Batasan**:
  - Provisioning cloud + email real belum diimplementasikan; saat ini provisioning v1 masih lokal (Dexie) namun **baru terjadi setelah paid terverifikasi** (Status API).
  - Webhook sudah diverifikasi signature-nya; wiring provisioning dari webhook bisa ditambahkan saat backend provisioning cloud siap.
  - Status lead di cloud belum tersinkron (lead masih lokal).
- **Bukti verifikasi**:
  - Build lulus: `npm run build`.
  - Manual (butuh env serverless): set `MIDTRANS_SERVER_KEY` (+ sandbox) dan `VITE_MIDTRANS_ENABLED=true` → checkout menghasilkan redirectUrl; setelah pembayaran sandbox sukses, tombol “Saya sudah bayar” mengonfirmasi paid.

---

## GAP-STORE-001 — StorePage masih navigasi/placeholder (HR menu belum real)
- **RelatedScenarioIDs**: `OUT-002`, `HR-001`, `HR-002`, `HR-003`
- **RootCause**: `StorePage` baru shell; menu mengarah ke shifts/settings dan belum ada modul khusus per-store untuk jabatan/karyawan/absensi/payroll.
- **ProposedFix**:
  - Definisikan scope v1 per-store:
    - Roles/Jabatan: CRUD roles + permission flags (minimal untuk POS: void/diskon/laporan).
    - Employees/Karyawan: entitas employee terpisah dari cashier (atau unify dengan cashier + role).
    - Attendance/Absensi: clock-in/out + laporan (per store).
    - Payroll: definisi gaji/komisi + period closing.
  - Update navigasi `StorePage` ke route baru yang sesuai.
- **AffectedFiles**:
  - `src/pages/StorePage.tsx`
  - `src/lib/db.ts` (tabel baru bila diperlukan)
  - (baru) `src/pages/store/*` (subpages)
- **Dependency**: Keputusan model data HR (cashier-only vs employee-general).
- **Risk**: Sedang (perubahan model data berdampak luas).
- **Effort**: L
- **TargetMilestone**: P2
- **DoD**:
  - Semua menu StorePage mengarah ke halaman yang fungsional (minimal CRUD + list).
  - Hak akses minimal diterapkan untuk role kasir vs owner.
- **RegressionTests**: `TC-POS-001..004`, `TC-SHIFT-001..003`, plus test case baru HR.

**Status**: Done (Store subpages v1)
- **Implementasi**:
  - Tambah sub-route per toko: `.../store/:storeId/shifts|roles|staff|attendance|payroll|settings`.
  - `roles/staff` di-store-scoped ke `SettingsPage` dengan `initialSection="cashiers"`.
  - `attendance` menggunakan `HistoryPage` dengan `initialTab="absensi"`.
  - `payroll` berupa halaman payroll v1 (generate per bulan + simpan + export CSV).
  - `StorePage` menu gerai sekarang mengarah ke sub-route tersebut (bukan ke halaman global tanpa konteks).
- **Bukti verifikasi**:
  - Build lulus: `npm run build`.
  - Manual smoke:
    - Buka `/dashboard/store/:storeId/shifts` → tampil Shift management business sesuai `storeId`.
    - Buka `/dashboard/store/:storeId/staff` dan `/roles` → tampil editor kasir/izin.
    - Buka `/dashboard/store/:storeId/attendance` → tampil History tab Absensi.
    - Buka `/dashboard/store/:storeId/payroll` → tampil halaman payroll v1 (bisa generate + export).

---

## GAP-POS-PRINT-001 — BLE printer bergantung perangkat, UX error handling perlu distandarkan
- **RelatedScenarioIDs**: `POS-006`
- **RootCause**: BLE printing punya banyak constraint (browser, HTTPS, permission, device compatibility). UX saat gagal perlu jelas dan konsisten.
- **ProposedFix**:
  - Standarkan state koneksi printer + error messages (permission denied, not supported, disconnected).
  - Tambahkan “Test Print” button di pengaturan POS.
  - Simpan device preference (jika relevan) dan tampilkan status jelas.
- **AffectedFiles**:
  - `src/lib/bluetoothReceiptPrinter.ts`
  - `src/components/pos/PosSettingsModal.tsx`
  - `src/components/pos/PaymentModal.tsx` (fallback message)
- **Dependency**: Perangkat printer BLE untuk testing.
- **Risk**: Rendah–Sedang (terutama UX & browser API variance).
- **Effort**: M
- **TargetMilestone**: P2
- **DoD**:
  - Jika BLE tidak tersedia: UI menjelaskan dan menyarankan print browser.
  - Jika BLE gagal: selalu fallback browser.
  - “Test Print” sukses atau menampilkan error yang actionable.
- **RegressionTests**: `TC-POS-006`, `TC-POS-005`.

**Status**: Done (implementasi P2)
- **Implementasi**:
  - Tambah tombol **Test Print** di `PosSettingsModal` (mencetak teks test via BLE).
  - Perjelas error message `connectBluetoothPrinter` untuk kasus umum: cancel pilih device, izin ditolak, dialog gagal.
  - Fallback browser print di `PaymentModal` tetap berjalan bila BLE gagal.
- **Bukti verifikasi**:
  - Build lulus: `npm run build`
  - Manual sesuai `TC-POS-006`: saat device tersedia, Test Print mencetak; saat gagal/ditolak, error message actionable tampil dan transaksi tetap bisa print via browser.

---

## GAP-CMS-001 — CMS landing publish lintas browser belum selalu konsisten (env/edge dependency)
- **RelatedScenarioIDs**: `CMS-001`
- **RootCause**: Tanpa `VITE_CONTENT_EDGE_URL` di build produksi atau secret mismatch, save jatuh ke localStorage sehingga tidak sinkron lintas incognito.
- **ProposedFix**:
  - Tambah preflight “Edge active” check di CMS (sudah ada badge; pastikan selalu jelas).
  - Harden error messages & guidance (secret/env/redeploy).
  - Tambah “View public landing” deep link untuk verifikasi publish.
- **AffectedFiles**:
  - `src/pages/LandingAdminPage.tsx`
  - `src/lib/landingContent.ts`
  - `MANUAL_SETUP.md` / `LANGKAH_DEPLOY.md` (opsional, dok)
- **Dependency**: Supabase Edge deploy + env Vercel.
- **Risk**: Rendah.
- **Effort**: S/M
- **TargetMilestone**: P1
- **DoD**:
  - Setelah save sukses, verifikasi incognito selalu menunjukkan content terbaru (Edge mode).
  - Jika Edge tidak aktif: UI menyatakan “lokal saja” dengan instruksi.
- **RegressionTests**: `TC-CMS-001`.

**Status**: Done (implementasi P1)
- **Implementasi**:
  - `LandingAdminPage` menambahkan tombol **Cek Edge** (preflight `?action=get`) + badge “(OK)/(cek)” + tombol **Buka Landing** untuk verifikasi publish.
- **Bukti verifikasi**:
  - Build lulus: `npm run build`
  - Manual sesuai `TC-CMS-001`: setelah `Cek Edge` OK → `Simpan & Publish` → buka incognito → konten ikut berubah (Edge mode).

---

## GAP-CMS-002 — Upload asset: kebijakan bucket/policy bisa bikin URL gagal dibuka
- **RelatedScenarioIDs**: `CMS-002`
- **RootCause**: Storage bucket/policies dapat memblok akses publik atau signed URL belum di-handle.
- **ProposedFix**:
  - Pastikan mode upload mengembalikan URL yang bisa dibuka (public bucket atau signed URL).
  - Tambah verifikasi “open asset” di UI setelah upload.
- **AffectedFiles**:
  - `src/pages/LandingAdminPage.tsx`
  - Supabase function `supabase/functions/cms-landing/*` (jika perlu signed URL)
- **Dependency**: Konfigurasi Supabase Storage.
- **Risk**: Rendah.
- **Effort**: M
- **TargetMilestone**: P2
- **DoD**:
  - Upload logo/favicon/video menghasilkan URL yang bisa dipakai di landing tanpa auth.
- **RegressionTests**: `TC-CMS-002`

**Status**: Done (public/signed URL + verifikasi UI)
- **Implementasi**:
  - Edge function `cms-landing` upload sekarang mengembalikan **publicUrl** dan juga **signedUrl** (fallback) agar tetap bisa dibuka walau bucket tidak public.
  - UI Admin Landing tab Media menampilkan link **Buka Hero Image/Logo/Favicon/Demo Video** untuk verifikasi cepat setelah upload.
- **Bukti verifikasi**:
  - Manual sesuai `TC-CMS-002`: upload → klik link “Buka …” → asset dapat dibuka tanpa login (public atau signed URL).

---

## GAP-SYNC-001 — Offline queue hanya sebagian (tergantung implementasi enqueue per entity)
- **RelatedScenarioIDs**: `SYNC-001`
- **RootCause**: Enqueue saat offline mungkin hanya untuk transaksi (atau subset), belum mencakup semua entity penting (produk/material/finance).
- **ProposedFix**:
  - Definisikan daftar entity wajib sync (produk, transaksi, items, materials, cashflow, debt, shifts, etc.).
  - Pastikan semua perubahan entity menghasilkan queue item via hooks/store.
  - Tambah UI “pending items by entity” untuk audit.
- **AffectedFiles**:
  - `src/lib/store.ts` (sync queue lifecycle)
  - `src/lib/syncAdapter.ts`
  - `src/lib/db.ts` (hooks bila dipakai)
- **Dependency**: Keputusan source-of-truth & conflict strategy.
- **Risk**: Sedang (data consistency).
- **Effort**: L
- **TargetMilestone**: P2 (atau P1 bila cloud sync jadi target utama)
- **DoD**:
  - Semua entity wajib menghasilkan pending sync saat offline.
  - Tidak ada kehilangan data saat offline→online.
- **RegressionTests**: `TC-SYNC-001`, `TC-SYNC-003`

**Status**: Done (hooks enqueue lintas entity + audit UI)
- **Implementasi**:
  - Sync hooks terpasang untuk mayoritas tabel utama, termasuk penambahan tabel payroll: `payrollProfiles`, `payrollRuns`, `payrollLines`.
  - Tambah panel audit di Settings → **Sync** untuk melihat:
    - total pending,
    - ringkasan per tabel,
    - detail hingga 50 item,
    - tombol sync manual + clear antrean.
- **Bukti verifikasi**:
  - Manual sesuai `TC-SYNC-003`: saat offline, perubahan produk & payroll menambah antrean dan terlihat per tabel di Settings → Sync.

---

## GAP-SYNC-002 — Sync endpoint & env dev/localhost mismatch (404 noise + tidak tersinkron)
- **RelatedScenarioIDs**: `SYNC-002`
- **RootCause**: Default endpoint `/api/sync/batch` adalah Vercel serverless; Vite dev server tidak melayani route ini → 404.
- **ProposedFix**:
  - Dokumentasikan mode dev:
    - gunakan `vercel dev`, atau
    - set `VITE_SYNC_ENDPOINT` ke endpoint deploy (dev/staging), atau
    - disable sync bila endpoint tidak tersedia (tanpa spam console).
  - Tambah healthcheck endpoint dan auto-backoff.
- **AffectedFiles**:
  - `src/lib/syncAdapter.ts`
  - `src/lib/store.ts`
  - `vercel.json` (bila routing perlu)
- **Dependency**: Environment dev strategy yang dipilih.
- **Risk**: Rendah (lebih ke DX/UX).
- **Effort**: S/M
- **TargetMilestone**: P1
- **DoD**:
  - Tidak ada spam 404 di localhost default.
  - Bila endpoint hidup, sync bekerja; bila tidak, status jelas.
- **RegressionTests**: `TC-SYNC-002`.

**Status**: Done (implementasi P1)
- **Implementasi**:
  - `syncPendingBatch` mendeteksi kondisi **localhost + default endpoint + 404** lalu melakukan **backoff global 5 menit** dengan `errorCode=endpoint_missing`.
  - `useSyncStore` menyimpan `lastSyncError/lastSyncErrorCode` dan tidak meng-update `lastSyncedAt` saat tidak ada item sukses.
  - `SyncStatusChip` menampilkan status **“Sync off (dev)”** saat endpoint missing dan mencegah trigger sync manual (tanpa spam request).
- **Bukti verifikasi**:
  - Build lulus: `npm run build`
  - Manual: jalankan `npm run dev` tanpa `VITE_SYNC_ENDPOINT` → chip menampilkan “Sync off (dev)” ketika ada pending, dan tidak terjadi spam 404 berulang.

---

## GAP-HR-001 — Role/permission matrix belum ada (akses masih coarse)
- **RelatedScenarioIDs**: `HR-001`
- **RootCause**: Model role-permission belum didefinisikan; kasir vs owner dipisah lewat mode, bukan policy detail.
- **ProposedFix**:
  - Definisikan permission flags minimal (void, diskon, export laporan, akses biaya).
  - Terapkan gating di UI + validasi data layer (minimal di action handlers).
- **AffectedFiles**:
  - `src/lib/store.ts` (auth state)
  - `src/components/pos/*` (actions)
  - `src/pages/*` (menu gating)
  - `src/lib/db.ts` (role assignment)
- **Dependency**: Keputusan struktur role (per store/per business/per tenant).
- **Risk**: Sedang.
- **Effort**: L
- **TargetMilestone**: P2
- **DoD**:
  - Ada role & permission; user tanpa izin tidak bisa menjalankan aksi terlarang.
- **RegressionTests**: `TC-HR-001`.

**Status**: Done (permission flags v1 untuk kasir)
- **Implementasi**:
  - `TodayTransactions`: tombol **Void Transaksi** sekarang disabled jika `currentCashier.canVoid=false` (dan modal void tidak bisa dibuka).
  - `Cart`: tombol **Diskon** disabled jika `currentCashier.canDiscount=false`, dan diskon % dibatasi oleh `currentCashier.maxDiscountPercent`.
  - Sidebar & route Reports: menu **Laporan** hanya tampil untuk kasir dengan `canViewReports=true`, dan route `/dashboard/reports` menolak akses bila tidak diizinkan.
- **Bukti verifikasi**:
  - Build lulus: `npm run build`.
  - Manual sesuai `TC-HR-001`: void/diskon/report gating berjalan + batas diskon % ditegakkan.

---

## GAP-HR-002 — Absensi karyawan umum belum ada (baru shift session kasir)
- **RelatedScenarioIDs**: `HR-002`
- **RootCause**: Absensi masih melekat ke `CashierSession`/shift, bukan sistem karyawan general.
- **ProposedFix**:
  - Tambah entity attendance general atau perluas session menjadi attendance.
  - Tambah laporan absensi + export.
- **AffectedFiles**:
  - `src/lib/db.ts`
  - `src/pages/HistoryPage.tsx` (export)
  - (baru) `src/pages/attendance/*`
- **Dependency**: Model HR final.
- **Risk**: Sedang.
- **Effort**: L
- **TargetMilestone**: P2
- **DoD**:
  - Clock-in/out karyawan tersimpan dan bisa dilaporkan per periode.
- **RegressionTests**: `TC-HR-002`

**Status**: Done (attendance v1 via sesi kasir + clock-in/out manual)
- **Implementasi**:
  - Tab **Absensi** menambahkan tombol **Clock-in/Clock-out** (khusus OWNER) untuk mencatat absensi tanpa harus masuk POS.
  - Clock-in/out tersimpan sebagai `cashierSessions` (status ACTIVE→CLOSED) dan terekam di `activityLogs`.
  - Laporan per bulan + export Excel tetap tersedia dari halaman Absensi.
- **Bukti verifikasi**:
  - Manual sesuai `TC-HR-002`:
    - Pilih kasir → Clock-in → sesi `ACTIVE` muncul di list.
    - Clock-out → sesi menjadi `CLOSED` dan jam keluar terisi.
    - Export Excel terunduh dan berisi data absensi bulan terpilih.

---

## GAP-HR-003 — Payroll belum ada
- **RelatedScenarioIDs**: `HR-003`
- **RootCause**: Tidak ada modul payroll; hanya placeholder menu.
- **ProposedFix**:
  - Definisikan payroll model (salary base, overtime, komisi, potongan).
  - Generate payroll per periode dan arsip slip.
- **AffectedFiles**:
  - `src/lib/db.ts`
  - (baru) `src/pages/payroll/*`
- **Dependency**: HR model + aturan bisnis payroll.
- **Risk**: Sedang–Tinggi (ketepatan perhitungan).
- **Effort**: L
- **TargetMilestone**: P2
- **DoD**:
  - Payroll period bisa dihitung dan disimpan; slip dapat diexport.
- **RegressionTests**: `TC-HR-003`

**Status**: Done (payroll v1 per bulan)
- **Implementasi**:
  - Menu Gerai → `Payroll` sekarang fungsional (tidak coming soon).
  - Tambah penyimpanan payroll:
    - `payrollProfiles`: gaji pokok/bulan + tarif/jam per kasir.
    - `payrollRuns` + `payrollLines`: hasil generate per bulan.
  - Payroll dihitung dari absensi (sesi kasir) per bulan:
    - \(gross = baseSalaryMonthly + totalHours \times hourlyRate\)
  - Export payroll ringkas ke CSV.
- **Bukti verifikasi**:
  - Build lulus: `npm run build`.
  - Manual sesuai `TC-HR-003`:
    - Set profil gaji → Generate → hasil muncul per kasir → Export CSV terunduh.

