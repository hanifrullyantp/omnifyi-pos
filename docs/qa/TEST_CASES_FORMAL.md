## Test Cases QA Formal — Omnifyi POS

Dokumen ini berisi test case yang bisa dijalankan manual (dan siap diotomasi) untuk memverifikasi skenario pada matriks `docs/qa/SCENARIO_MODULE_PERSONA_MATRIX.md`.

### Konvensi
- **TC_ID**: `TC-<DOMAIN>-<NNN>`
- **ScenarioID**: harus cocok dengan matriks.
- **AutomationCandidate**:
  - **High**: bisa Playwright/Cypress tanpa mock kompleks
  - **Medium**: butuh seed data atau kontrol waktu/offline
  - **Low**: bergantung perangkat (BLE printer), integrasi eksternal, atau UI sistem (print dialog)

### Test Data baseline (default)
Gunakan salah satu:
- **Demo workspace** (seed) untuk skenario yang butuh data contoh (produk/kasir/shift).
- **Workspace kosong** (akun non-demo) untuk skenario onboarding & data-empty.

---

## A. Onboarding & Auth

### TC-AUTH-001 — Owner login non-demo (cloud auth + local provisioning)
- **ScenarioID**: `AUTH-001`
- **Persona**: Owner
- **Objective**: Owner non-demo bisa login dan workspace siap dipakai tanpa data demo.
- **Preconditions**:
  - Environment `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` terpasang.
  - Akun Supabase Auth user sudah ada (email/password valid).
- **TestData**: Email non-demo + password valid.
- **Steps**:
  1. Buka aplikasi.
  2. Masuk sebagai owner non-demo.
  3. Masuk ke dashboard.
  4. Buka tab Produk dan pastikan belum ada data demo (jika ini akun baru).
- **Expected**:
  - Login sukses tanpa error.
  - Tenant & Business terprovision.
  - Data inti (finance accounts) tersedia; produk/kategori kosong (kecuali default minimal bila ada).
- **Postconditions**: Session tersimpan.
- **FailureImpact**: P0 — user tidak bisa masuk aplikasi.
- **AutomationCandidate**: Medium (butuh env + akun test).

### TC-AUTH-002 — Session restore setelah refresh
- **ScenarioID**: `AUTH-002`
- **Persona**: Owner
- **Objective**: Session owner pulih setelah refresh.
- **Preconditions**:
  - Owner sudah login pada TC-AUTH-001.
- **Steps**:
  1. Refresh halaman (Cmd+R).
  2. Pastikan kembali ke dashboard tanpa login ulang.
- **Expected**:
  - Session tetap aktif; halaman tidak balik ke login.
- **FailureImpact**: P0 (UX fatal untuk operasional).
- **AutomationCandidate**: High.

---

## B. Marketing → Demo → Checkout (Simulasi)

### TC-MKT-001 — Landing open (no login)
- **ScenarioID**: `VIS-001`
- **Persona**: Visitor
- **Objective**: Landing bisa dibuka tanpa error.
- **Preconditions**: App ter-deploy / dev server berjalan.
- **Steps**:
  1. Buka landing.
  2. Scroll hingga Pricing & FAQ.
- **Expected**:
  - Tidak ada blank/crash; section tampil.
- **FailureImpact**: P1.
- **AutomationCandidate**: High.

### TC-MKT-002 — Demo signup → login demo owner
- **ScenarioID**: `VIS-002`
- **Persona**: Visitor
- **Objective**: Form demo membuat lead dan login demo owner.
- **Preconditions**: Mode demo tersedia; seed demo aktif.
- **Steps**:
  1. Klik CTA demo.
  2. Isi form (nama, email, phone) valid.
  3. Submit.
- **Expected**:
  - Lead tersimpan.
  - User masuk dashboard sebagai demo owner.
  - Data demo terlihat (produk/kasir/dll).
- **FailureImpact**: P1.
- **AutomationCandidate**: Medium.

### TC-BILL-001 — Checkout simulasi → paid → provisioning owner
- **ScenarioID**: `VIS-003`
- **Persona**: Visitor
- **Objective**: Checkout simulasi menghasilkan owner baru + kredensial sementara.
- **Preconditions**:
  - Mode simulasi: Flow `runLocalBillingFlow` aktif; tidak perlu Midtrans, ATAU
  - Mode Midtrans (sandbox):
    - `VITE_MIDTRANS_ENABLED=true`
    - Backend serverless punya `MIDTRANS_SERVER_KEY` (sandbox)
- **Steps**:
  1. Mulai checkout dari landing.
  2. Lengkapi data buyer.
  3. Jalankan proses sampai status “paid”.
  4. Catat kredensial sementara yang ditampilkan.
  5. Logout lalu login dengan akun baru.
- **Expected**:
  - Status lead berubah (DEMO → CHECKOUT → PAID → ONBOARDED sesuai flow).
  - Owner baru bisa login.
- **FailureImpact**: P1.
- **AutomationCandidate**: Low/Medium (bergantung UI flow).

---

## C. Products & Inventory

### TC-PROD-001 — Create product (minimal fields) dan tampil di list
- **ScenarioID**: `PROD-001`
- **Persona**: Owner
- **Objective**: Produk bisa dibuat dan tersimpan.
- **Preconditions**: Owner login; business aktif.
- **TestData**:
  - Nama: “Es Teh”
  - Harga jual: 5000
  - Stok: 10
- **Steps**:
  1. Buka Produk.
  2. Tambah produk dengan data di atas.
  3. Simpan.
- **Expected**:
  - Produk muncul di list.
  - Produk default aktif.
- **FailureImpact**: P0 (POS tidak bisa dipakai tanpa produk).
- **AutomationCandidate**: High.

### TC-PROD-002 — Nonaktifkan produk → hilang dari POS grid
- **ScenarioID**: `PROD-002`
- **Persona**: Owner/Kasir
- **Objective**: Produk nonaktif tidak bisa dijual.
- **Preconditions**: Ada produk aktif.
- **Steps**:
  1. Nonaktifkan produk dari Produk page.
  2. Masuk POS sebagai kasir.
  3. Cari produk tersebut di grid.
- **Expected**:
  - Produk tidak tampil di grid.
- **FailureImpact**: P0 (integritas katalog).
- **AutomationCandidate**: High.

### TC-INV-OPNAME-001 — Stock opname full → koreksi stok + audit trail
- **ScenarioID**: `INV-OPNAME-001`
- **Persona**: Owner
- **Objective**: Opname full mengubah stok sistem sesuai hasil hitung dan membuat record penyesuaian.
- **Preconditions**:
  - Owner login; business aktif.
  - Ada minimal 2 produk aktif dengan stok sistem non-0 (mis. stok 10 dan 5).
- **Steps**:
  1. Buka menu **Stock Opname**.
  2. Klik “Mulai Opname”.
  3. Isi hitungan fisik untuk semua produk aktif (mis. produk A=8, produk B=7).
  4. Klik “Finalisasi (Koreksi Stok)”.
  5. Buka kembali Produk page dan cek stok kedua produk.
- **Expected**:
  - Finalisasi sukses dan status opname menjadi FINAL.
  - Stok sistem produk berubah menjadi hasil hitung (A=8, B=7).
  - Ada audit trail penyesuaian stok (reason OPNAME) untuk item yang selisihnya tidak 0.
- **FailureImpact**: P0 (integritas stok).
- **AutomationCandidate**: Low/Medium (butuh seed produk dan interaksi banyak input).

### TC-INV-001 — Create material
- **ScenarioID**: `INV-001`
- **Persona**: Owner
- **Objective**: Bahan baku bisa dibuat.
- **Preconditions**: Owner login.
- **TestData**: Nama “Gula”, unit “kg”, stok 5, min stok 1, harga/unit 14000.
- **Steps**:
  1. Buka Bahan Baku.
  2. Tambah bahan dengan data di atas.
  3. Simpan.
- **Expected**:
  - Material muncul di list; nilai stok masuk perhitungan.
- **FailureImpact**: P1.
- **AutomationCandidate**: High.

### TC-INV-002 — Restock material + history
- **ScenarioID**: `INV-002`
- **Persona**: Owner
- **Objective**: Restock menambah stok dan mencatat riwayat.
- **Preconditions**: Material ada.
- **Steps**:
  1. Pilih material → Restock.
  2. Masukkan qty 3.
  3. Konfirmasi.
- **Expected**:
  - Stok bertambah 3.
  - Riwayat restock tercatat.
- **FailureImpact**: P1.
- **AutomationCandidate**: Medium (cek history UI).

### TC-INV-003 — Low stock alert muncul di dashboard
- **ScenarioID**: `INV-003`
- **Persona**: Owner
- **Objective**: Owner mendapat alert saat stok ≤ min.
- **Preconditions**:
  - Setting `notifyLowStock=true`.
  - Ada produk/material dengan `stockQuantity <= minStockAlert`.
- **Steps**:
  1. Set stok item ke 0/di bawah min.
  2. Buka Dashboard.
- **Expected**:
  - Widget attention/notif menampilkan item tersebut.
- **FailureImpact**: P1.
- **AutomationCandidate**: Medium.

---

## D. POS Transaction (Kasir)

### TC-POS-001 — PIN login kasir → POS screen
- **ScenarioID**: `POS-001`
- **Persona**: Kasir
- **Objective**: Kasir masuk POS via PIN.
- **Preconditions**: Ada kasir aktif dan PIN diketahui.
- **Steps**:
  1. Klik “Buka Kasir”.
  2. Pilih kasir, masukkan PIN.
- **Expected**:
  - Masuk ke POS screen; header menampilkan nama gerai & kasir.
- **FailureImpact**: P0.
- **AutomationCandidate**: Medium.

### TC-POS-007 — Buka toko (opening cash) wajib sebelum transaksi
- **ScenarioID**: `POS-007`
- **Persona**: Kasir
- **Objective**: POS meminta input modal awal (uang receh) sebelum mulai jualan.
- **Preconditions**:
  - Owner sudah login dan memilih bisnis.
  - Belum ada record “store day” untuk hari ini (fresh run / data baru / hari baru).
- **Steps**:
  1. Klik “Buka Kasir” → pilih kasir → input PIN.
  2. Amati muncul modal **Buka Toko**.
  3. Isi modal awal (mis. 200000) → klik “Mulai Jualan”.
  4. Tambah item ke cart dan buka modal pembayaran.
- **Expected**:
  - Saat awal masuk POS, transaksi diblok sampai modal “Buka Toko” disubmit.
  - Setelah submit, POS bisa dipakai normal.
- **FailureImpact**: P0 (operasional kasir).
- **AutomationCandidate**: Low/Medium (butuh kontrol data per hari).

### TC-POS-008 — Tutup toko (close day) menghitung expected cash + variance
- **ScenarioID**: `POS-008`
- **Persona**: Kasir/Owner
- **Objective**: Tutup toko menghitung expected laci (modal + cash sales) dan simpan variance.
- **Preconditions**:
  - Toko hari ini sudah dibuka (TC-POS-007).
  - Ada minimal 1 transaksi `COMPLETED` metode **Tunai**.
- **Steps**:
  1. Di POS, klik tombol **Tutup Toko** (desktop) atau lakukan via kontrol yang disediakan.
  2. Lihat ringkasan expected cash sales dan expected laci.
  3. Masukkan kas fisik aktual → konfirmasi tutup toko.
  4. Logout kasir lalu login kembali.
- **Expected**:
  - Store day berubah status menjadi CLOSED.
  - Expected laci = opening cash + total cash sales.
  - Variance tersimpan (actual - expected).
  - Setelah CLOSED, user tidak bisa transaksi sebelum membuka toko kembali (hari baru).
- **FailureImpact**: P0 (rekonsiliasi harian).
- **AutomationCandidate**: Low/Medium.

### TC-POS-002 — Tambah item ke cart (stok cukup)
- **ScenarioID**: `POS-002`
- **Persona**: Kasir
- **Objective**: Tap produk menambah cart.
- **Preconditions**: Ada produk stok > 0.
- **Steps**:
  1. Tap produk.
  2. Lihat cart.
- **Expected**:
  - Item ada di cart; subtotal bertambah.
- **FailureImpact**: P0.
- **AutomationCandidate**: High.

### TC-POS-003 — Prevent oversell (stok habis / tidak cukup)
- **ScenarioID**: `POS-003`
- **Persona**: Kasir
- **Objective**: POS menolak menjual ketika stok tidak cukup.
- **Preconditions**: Ada produk dengan stok 0 atau stok 1.
- **Steps**:
  1. Set stok produk = 0.
  2. Tap produk tersebut.
  3. Set stok = 1, tambah qty jadi 2.
  4. Klik Bayar.
- **Expected**:
  - Saat stok 0: muncul alert dan item tidak masuk.
  - Saat qty > stok: proses bayar ditolak dengan pesan stok tidak cukup.
- **FailureImpact**: P0 (integritas stok).
- **AutomationCandidate**: Medium.

### TC-POS-004 — Pembayaran semua metode (tunai/non-tunai)
- **ScenarioID**: `POS-004`
- **Persona**: Kasir
- **Objective**: Transaksi tersimpan dan stok berkurang sesuai.
- **Preconditions**: Ada minimal 1 item di cart; stok cukup.
- **Steps**:
  1. Klik Bayar.
  2. Pilih metode Tunai, masukkan uang diterima, konfirmasi.
  3. Ulangi untuk QRIS/Transfer/Ewallet (masing-masing 1 transaksi).
- **Expected**:
  - Transaksi `COMPLETED` tersimpan.
  - `transactionItems` tersimpan sesuai isi cart.
  - Stok produk berkurang sesuai qty terjual.
- **Postconditions**: Data transaksi muncul di laporan/hari ini.
- **FailureImpact**: P0.
- **AutomationCandidate**: Medium.

### TC-POS-005 — Print receipt via browser
- **ScenarioID**: `POS-005`
- **Persona**: Kasir
- **Objective**: Cetak struk via browser tersedia.
- **Preconditions**: Transaksi sukses.
- **Steps**:
  1. Pada layar sukses, klik Print.
- **Expected**:
  - Dialog print browser muncul, text struk sesuai invoice.
- **FailureImpact**: P2.
- **AutomationCandidate**: Low.

### TC-POS-006 — Bluetooth print (BLE) + fallback
- **ScenarioID**: `POS-006`
- **Persona**: Kasir
- **Objective**: BLE print bekerja bila perangkat mendukung; fallback bila gagal.
- **Preconditions**:
  - Browser Chrome/Edge.
  - HTTPS atau localhost.
  - Printer BLE kompatibel dan dapat dipair.
- **Steps**:
  1. Buka Pengaturan POS → hubungkan printer BLE.
  2. Lakukan transaksi.
  3. Print via BLE.
  4. Simulasikan kegagalan (matikan printer) lalu coba print lagi.
- **Expected**:
  - Saat terkoneksi: print berhasil.
  - Saat gagal: user diberi info, lalu fallback ke print browser.
- **FailureImpact**: P2.
- **AutomationCandidate**: Low.

---

## E. Shift & Workforce (Operasional kasir)

### TC-SHIFT-001 — Create shift
- **ScenarioID**: `SHIFT-001`
- **Persona**: Owner
- **Objective**: Shift dapat dibuat.
- **Preconditions**: Owner login.
- **Steps**:
  1. Buka Shift.
  2. Buat shift (nama, jam).
- **Expected**:
  - Shift muncul di list.
- **FailureImpact**: P1.
- **AutomationCandidate**: High.

### TC-SHIFT-002 — Assign kasir ke hari+shift
- **ScenarioID**: `SHIFT-002`
- **Persona**: Owner
- **Objective**: Jadwal kasir tersimpan.
- **Preconditions**: Ada shift + kasir aktif.
- **Steps**:
  1. Pilih hari (weekly view).
  2. Assign kasir untuk shift tertentu.
- **Expected**:
  - Assignment tersimpan dan terlihat pada grid jadwal.
- **FailureImpact**: P1.
- **AutomationCandidate**: Medium.

### TC-SHIFT-003 — Close shift (rekonsiliasi)
- **ScenarioID**: `SHIFT-003`
- **Persona**: Owner
- **Objective**: Tutup shift menghitung expected cash dan variance.
- **Preconditions**:
  - Ada sesi kasir ACTIVE.
  - Ada transaksi `COMPLETED` pada sesi tersebut.
- **Steps**:
  1. Buka Shift → pilih sesi aktif.
  2. Masukkan kas aktual.
  3. Konfirmasi tutup shift.
- **Expected**:
  - Record `shiftCloses` dibuat.
  - Sesi kasir status menjadi CLOSED.
  - Activity log tercatat.
- **FailureImpact**: P0.
- **AutomationCandidate**: Medium.

---

## F. Finance & Reports

### TC-FIN-001 — Tambah cashflow entry
- **ScenarioID**: `FIN-001`
- **Persona**: Owner
- **Objective**: Cashflow entry tersimpan.
- **Preconditions**: Owner login.
- **Steps**:
  1. Buka Finance → Cashflow.
  2. Tambah pemasukan/pengeluaran.
- **Expected**:
  - Entry tersimpan dan muncul di list.
- **FailureImpact**: P1.
- **AutomationCandidate**: Medium.

### TC-FIN-002 — Hutang/piutang + pembayaran
- **ScenarioID**: `FIN-002`
- **Persona**: Owner
- **Objective**: Debt/receivable dapat dibuat dan dibayar cicilan.
- **Preconditions**: Owner login.
- **Steps**:
  1. Buat hutang/piutang baru.
  2. Tambah pembayaran cicilan.
- **Expected**:
  - Saldo dan status terupdate.
- **FailureImpact**: P1.
- **AutomationCandidate**: Medium.

### TC-REP-001 — Laporan filter + export
- **ScenarioID**: `REP-001`
- **Persona**: Owner
- **Objective**: Laporan bisa difilter dan diexport.
- **Preconditions**: Ada transaksi.
- **Steps**:
  1. Buka Laporan.
  2. Set filter tanggal.
  3. Export.
- **Expected**:
  - Ringkasan sesuai filter.
  - File export terunduh.
- **FailureImpact**: P1.
- **AutomationCandidate**: Low/Medium.

---

## G. Settings & Data

### TC-SET-001 — Ubah pajak/service/receipt → berdampak ke POS
- **ScenarioID**: `SET-001`
- **Persona**: Owner
- **Objective**: Pengaturan bisnis mempengaruhi perhitungan dan struk.
- **Preconditions**: Owner login.
- **Steps**:
  1. Settings → Business: ubah tax/service %.
  2. Masuk POS, buat transaksi kecil.
  3. Lihat total dan komponen pajak/service.
  4. Ubah receipt header/footer; print preview.
- **Expected**:
  - Tax/service dihitung sesuai setting.
  - Header/footer struk sesuai setting.
- **FailureImpact**: P0/P1.
- **AutomationCandidate**: Medium.

### TC-DATA-001 — Export backup JSON
- **ScenarioID**: `DATA-001`
- **Persona**: Owner
- **Objective**: Backup JSON terunduh dan berisi data.
- **Preconditions**: Owner login; ada data minimal.
- **Steps**:
  1. Settings → Data & backup → Export.
  2. Buka file hasil export.
- **Expected**:
  - JSON valid; memuat produk/kategori/transaksi/material/activity logs.
- **FailureImpact**: P1.
- **AutomationCandidate**: Low.

### TC-DATA-002 — Danger clear transactions (scoped to business)
- **ScenarioID**: `DATA-002`
- **Persona**: Owner
- **Objective**: Menghapus transaksi dan item terkait untuk business yang aktif.
- **Preconditions**: Ada transaksi pada business aktif.
- **Steps**:
  1. Settings → Data & backup → Danger clear.
  2. Konfirmasi.
  3. Cek daftar transaksi.
- **Expected**:
  - Transaksi business aktif kosong; business lain tidak terpengaruh.
- **FailureImpact**: P0 (data loss risk) — but by design.
- **AutomationCandidate**: Medium.

---

## H. Admin Landing & Branding

### TC-CMS-001 — CMS landing save & publish lintas browser
- **ScenarioID**: `CMS-001`
- **Persona**: SuperAdminLanding
- **Objective**: Konten landing tersimpan di Edge (bukan localStorage saja).
- **Preconditions**:
  - `VITE_CONTENT_EDGE_URL` dan `VITE_CONTENT_ADMIN_SECRET` benar di build.
  - Supabase Edge function `cms-landing` sudah deploy.
- **Steps**:
  1. Login sebagai ADMIN_SYSTEM.
  2. Buka `/admin`.
  3. Ubah teks kecil → Simpan.
  4. Buka incognito → lihat landing.
- **Expected**:
  - Konten sama di incognito.
  - Badge menunjukkan Edge aktif.
- **FailureImpact**: P1.
- **AutomationCandidate**: Low (butuh env + cross-profile).

### TC-CMS-002 — Upload asset menghasilkan URL yang bisa dibuka publik
- **ScenarioID**: `CMS-002`
- **Persona**: SuperAdminLanding
- **Objective**: Upload media menghasilkan URL yang bisa dibuka tanpa login (public atau signed URL).
- **Preconditions**:
  - Bucket Storage `landing-assets` tersedia.
  - Edge function `cms-landing` terdeploy dan admin secret valid.
- **Steps**:
  1. Login sebagai ADMIN_SYSTEM dan buka `/admin`.
  2. Tab Media → upload file (image/audio/video).
  3. Setelah upload, klik link **Buka …** untuk membuka asset di tab baru.
  4. (Opsional) Coba buka URL di incognito.
- **Expected**:
  - URL bisa dibuka tanpa auth.
  - Jika bucket private, URL signed tetap dapat dibuka sampai expiry.
- **FailureImpact**: P2.
- **AutomationCandidate**: Low (butuh storage + cross-profile).

### TC-SADM-001 — SuperAdmin app branding (local)
- **ScenarioID**: `SADM-001`
- **Persona**: SuperAdminApp
- **Objective**: Branding login app berubah pada device ini.
- **Preconditions**: Owner login.
- **Steps**:
  1. Buka Super Admin (dashboard app).
  2. Ubah brandName/logo/pixel.
  3. Logout lalu lihat login screen.
- **Expected**:
  - Branding berubah sesuai setting.
- **FailureImpact**: P2.
- **AutomationCandidate**: Low.

---

## I. Offline & Sync

### TC-SYNC-001 — Offline queue bertambah saat offline
- **ScenarioID**: `SYNC-001`
- **Persona**: Owner/Kasir
- **Objective**: Aplikasi tetap bisa transaksi dan menambah antrean sync saat offline.
- **Preconditions**:
  - Browser dipaksa offline (DevTools).
  - Sinkronisasi queue aktif.
- **Steps**:
  1. Set offline.
  2. Buat transaksi.
  3. Cek indikator/queue sync.
- **Expected**:
  - Transaksi tersimpan lokal.
  - Pending sync bertambah (minimal untuk transaksi).
- **FailureImpact**: P1.
- **AutomationCandidate**: Medium.

### TC-SYNC-003 — Offline enqueue multi-entity (produk + payroll)
- **ScenarioID**: `SYNC-001`
- **Persona**: Owner
- **Objective**: Perubahan entity non-transaksi juga masuk antrean sync saat offline.
- **Preconditions**:
  - Owner login.
  - Sync hooks aktif (default).
  - Browser dipaksa offline (DevTools).
- **Steps**:
  1. Set browser ke offline.
  2. Buat produk baru (Produk page) atau edit stok produk.
  3. Buka Settings → Sync dan lihat ringkasan per tabel (mis. `products` bertambah).
  4. Buka menu Gerai → Payroll, ubah profil gaji kasir → Simpan.
  5. Kembali ke Settings → Sync dan pastikan antrean bertambah untuk `payrollProfiles`.
- **Expected**:
  - Pending sync bertambah untuk perubahan `products` dan `payrollProfiles` (tidak hanya `transactions`).
  - Ringkasan per tabel menampilkan count yang sesuai.
- **FailureImpact**: P2 (cloud sync maturity).
- **AutomationCandidate**: Low/Medium (butuh offline mode & observasi UI).

### TC-SYNC-002 — Sync ke endpoint tersedia
- **ScenarioID**: `SYNC-002`
- **Persona**: Owner
- **Objective**: Pending sync terkirim ke backend dan terselesaikan.
- **Preconditions**:
  - `VITE_SYNC_ENDPOINT` mengarah ke endpoint yang hidup.
  - Auth token tersedia.
  - Ada pending items di queue.
- **Steps**:
  1. Kembali online.
  2. Trigger siklus sync (tunggu interval).
  3. Observasi status.
- **Expected**:
  - Pending items berkurang; status ok.
  - Conflict ditangani sesuai strategi (server wins).
- **FailureImpact**: P1.
- **AutomationCandidate**: Low/Medium (butuh backend).

---

## J. HR Permissions (Kasir flags)

### TC-HR-001 — Gating void & diskon berdasarkan izin kasir
- **ScenarioID**: `HR-001`
- **Persona**: Kasir
- **Objective**: Aksi POS yang sensitif (void transaksi dan diskon) harus mengikuti flag `canVoid` dan `canDiscount` pada kasir.
- **Preconditions**:
  - Ada kasir dengan flag:
    - Case A: `canVoid=false`, `canDiscount=true`
    - Case B: `canVoid=true`, `canDiscount=false`
    - Case C: `canDiscount=true`, `maxDiscountPercent=10`, `canViewReports=false`
    - Case D: `canViewReports=true`
  - Skenario POS punya minimal 1 transaksi `COMPLETED` (untuk mengaktifkan tombol void di TodayTransactions).
  - Sesi kasir aktif (currentCashier terisi).
- **TestData**:
  - Transaksi Completed: `INV-*` dengan `status=COMPLETED` dibuat dari POS.
- **Steps (Case A)**:
  1. Login kasir (canVoid=false).
  2. Buka TodayTransactions (pilih transaksi).
  3. Klik tombol void pada transaksi Completed.
  4. Lihat apakah void confirmation muncul.
  5. Buka Cart dan pastikan toggle Diskon tersedia (karena canDiscount=true).
- **Expected (Case A)**:
  - Void Transaksi tidak diizinkan: tombol void terkunci/disabled dan modal void tidak muncul.
  - Diskon bisa dibuka dan diterapkan.
- **Steps (Case B)**:
  1. Login kasir (canVoid=true, canDiscount=false).
  2. Buka TodayTransactions (pilih transaksi Completed).
  3. Klik tombol void dan pastikan modal void muncul.
  4. Buka Cart dan coba klik tombol Diskon.
- **Expected (Case B)**:
  - Void Transaksi diizinkan: modal void muncul.
  - Diskon terkunci: panel diskon tidak bisa dibuka (tombol disabled).
- **Steps (Case C)**:
  1. Login kasir (canDiscount=true, maxDiscountPercent=10).
  2. Buka Cart → Diskon.
  3. Coba set diskon 20% lalu Terapkan.
- **Expected (Case C)**:
  - Diskon di atas batas ditolak, dan tampil pesan batas diskon.
- **Steps (Case D)**:
  1. Login kasir (canViewReports=false) → coba buka menu Laporan.
  2. Login kasir (canViewReports=true) → buka menu Laporan.
- **Expected (Case D)**:
  - Tanpa izin: menu Laporan tidak tampil atau menolak akses.
  - Dengan izin: menu Laporan bisa dibuka.
- **Postconditions**: Tidak ada perubahan status transaksi selain yang diizinkan.
- **FailureImpact**: P1 — kontrol izin tidak berjalan (integritas transaksi/keuangan).
- **AutomationCandidate**: Medium (butuh seed data kasir + transaksi).

---

## K. HR Attendance (Absensi)

### TC-HR-002 — Clock-in/out manual dari halaman Absensi + laporan bulanan
- **ScenarioID**: `HR-002`
- **Persona**: Owner/Karyawan
- **Objective**: Absensi dapat dicatat (clock-in/out) dan dilihat/di-export per periode.
- **Preconditions**:
  - Owner login.
  - Ada minimal 1 kasir aktif (dipakai sebagai “karyawan” v1).
- **Steps**:
  1. Buka menu Gerai → Absensi (atau `HistoryPage` tab Absensi).
  2. Pilih 1 kasir pada dropdown.
  3. Klik **Clock-in** → pastikan muncul sesi baru status `ACTIVE` pada list sesi.
  4. Klik **Clock-out** → pastikan sesi berubah menjadi `CLOSED` dan kolom keluar terisi.
  5. Ubah filter bulan → pastikan sesi tampil di bulan yang sesuai.
  6. Klik **Export Excel**.
- **Expected**:
  - Clock-in membuat record sesi baru.
  - Clock-out menutup sesi aktif dan menyimpan jam keluar.
  - Ringkasan bulanan (hari kerja & total jam) terupdate.
  - File Excel terunduh dan berisi data absensi.
- **FailureImpact**: P2 (HR/operasional).
- **AutomationCandidate**: Medium (butuh kontrol waktu/filter bulan).

---

## L. HR Payroll

### TC-HR-003 — Generate payroll bulanan dari absensi + export
- **ScenarioID**: `HR-003`
- **Persona**: Owner
- **Objective**: Payroll period bisa dihitung dan disimpan, lalu bisa diexport.
- **Preconditions**:
  - Owner login.
  - Ada minimal 1 kasir aktif.
  - Ada data absensi (minimal 1 sesi CLOSED di bulan yang dipilih), bisa dibuat via `TC-HR-002`.
- **Steps**:
  1. Buka menu Gerai → Payroll.
  2. Pilih bulan yang sama dengan data absensi.
  3. Isi profil gaji kasir (gaji pokok/bulan dan/atau tarif/jam) → Simpan.
  4. Klik **Generate**.
  5. Pastikan tabel “Hasil payroll” menampilkan baris per kasir dengan nilai gross pay.
  6. Klik **Export CSV**.
- **Expected**:
  - Payroll run tersimpan untuk bulan tersebut dan bisa dibuka ulang.
  - Nilai gross pay mengikuti rumus: \(gross = baseSalaryMonthly + totalHours \times hourlyRate\).
  - File CSV terunduh dan berisi ringkasan payroll per kasir.
- **FailureImpact**: P2.
- **AutomationCandidate**: Medium (butuh seed data absensi & verifikasi file export).

