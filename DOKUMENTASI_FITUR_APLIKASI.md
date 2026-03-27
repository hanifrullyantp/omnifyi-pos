# Dokumentasi fitur Omnifyi POS (Monefyi POS)

Dokumen ini merangkum **secara detail** apa yang sudah dibangun di folder proyek ini: tujuan produk, peran pengguna, alur operasional, modul fitur, penyimpanan data, dan batasan (demo vs produksi). Cocok dipakai untuk presentasi, onboarding tim, atau penjelasan ke klien.

---

## 1. Ringkasan produk

**Omnifyi POS** adalah aplikasi **Point of Sale (POS) berbasis web** untuk UMKM: kasir, katalog produk, stok, bahan baku, member, keuangan (cashflow, hutang/piutang, laba rugi, chart of accounts), laporan, shift kasir, serta **landing page pemasaran** yang bisa dikelola lewat **CMS landing** terpisah.

- **Filosofi UX**: satu dashboard untuk pemilik, mode kasir terpisah untuk operasional, dengan **tombol mengambang “Buka Kasir”** untuk masuk cepat ke layar POS.
- **Data utama** disimpan di **browser** (IndexedDB lewat Dexie) sehingga **bisa dipakai offline** untuk operasi lokal; ada kerangka **sinkronisasi antre** (jika backend nanti disambungkan) dan **PWA** (service worker di produksi).

---

## 2. Arsitektur teknis (singkat)

| Aspek | Implementasi |
|--------|----------------|
| **Frontend** | React 19 + TypeScript, Vite, Tailwind CSS |
| **Routing** | React Router (`/dashboard`, `/dashboard/finance/...`, `/admin`, dll.) |
| **State global** | Zustand (auth, keranjang, UI, antre sinkron) |
| **Database lokal** | IndexedDB via **Dexie** (`src/lib/db.ts`) |
| **Landing & CMS** | Konten landing: `loadLandingContent` / `saveLandingContent` — bisa **Edge Function** (env `VITE_CONTENT_EDGE_URL`) atau fallback **localStorage** |
| **Super Admin (app)** | Pengaturan “brand” login screen: `superAdminSettings` di **localStorage** (`src/lib/superAdminSettings.ts`) |
| **Build produksi** | `vite-plugin-singlefile` (bundle utama dalam satu `index.html` besar); `dist/` siap di-host statis (mis. Vercel) |

---

## 3. Peran pengguna

| Peran | Deskripsi | Akses utama |
|--------|-----------|-------------|
| **Owner** | Pemilik bisnis; login email/password ke aplikasi utama | Dashboard, semua menu kecuali yang khusus super admin sistem |
| **Kasir** | Akun dengan PIN; **tidak** login sebagai owner | Layar POS setelah **PIN kasir** dari dashboard |
| **Super Admin (sistem)** | Mengelola **konten landing page** (marketing) | Login dari halaman utama → dialog **Masuk Admin LP** → `/admin` (CMS landing). **Bukan** tombol publik di navbar |
| **Super Admin (app)** | Menu **Super Admin** di sidebar dashboard | Pengaturan brand/favicon/pixel/maintenance untuk **layar login aplikasi** (bukan konten landing CMS penuh) |

---

## 4. Alur utama (flow)

### 4.1 Pengunjung (belum login)

1. Membuka aplikasi → **halaman marketing** (`MarketingPage`): hero, fitur, harga, FAQ, CTA.
2. **Coba Gratis / Demo**: form demo → data masuk ke **`crmLeads`** (lead) → otomatis login sebagai **akun demo owner** (seed).
3. **Checkout paket** (UI): mengisi data lead + **simulasi** alur pembayaran (`runLocalBillingFlow` — bukan Midtrans nyata).
4. **Masuk**: modal login; owner memakai kredensial seed; **super admin sistem** memakai kredensial seed terpisah → setelah sukses muncul pilihan **Masuk Admin LP** vs **Masuk Aplikasi**.

### 4.2 Owner (setelah login)

1. **Dashboard** (`/dashboard`): ringkasan omzet, transaksi, produk aktif, piutang, grafik, aktivitas terkini, notifikasi (stok rendah, hutang/piutang), aksi cepat.
2. **Pemilih bisnis**: multi-**business** dalam satu **tenant**; bisa **tambah bisnis** baru.
3. Sidebar:
   - **Dashboard** — overview (tab internal).
   - **Transaksi** — daftar transaksi (tab internal).
   - **Produk** — katalog & stok (tab internal).
   - **Member** — program member (tab internal).
   - **Bahan Baku** — inventori bahan & resep ke produk (tab internal).
   - **Keuangan** → `/dashboard/finance/*` (sub-route).
   - **History** → `/dashboard/history`.
   - **Shift** → `/dashboard/shifts`.
   - **Laporan** → `/dashboard/reports`.
   - **Pengaturan** → `/dashboard/settings`.
   - **Super Admin** → `/dashboard/super-admin` (pengaturan app login).

4. **Buka Kasir**: tombol tetap mengarah ke **login PIN kasir** atau langsung **POS** jika sesi kasir sudah aktif.

### 4.3 Kasir (POS)

1. **Login PIN** (`CashierLoginScreen`) memilih kasir aktif.
2. **POSScreen**: grid produk per kategori, **keranjang**, diskon per item & transaksi, **pembayaran** (tunai, QRIS, transfer, e-wallet), **scan barcode** (UI), transaksi hari ini, indikator online/offline.
3. **Keyboard**: mis. **Enter** untuk buka modal bayar (dengan syarat).
4. **Logout kasir** kembali ke mode dashboard owner (tanpa logout owner).

### 4.4 Super Admin landing (`/admin`)

1. Hanya jika user **ADMIN_SYSTEM** dan sudah login.
2. **LandingAdminPage**: tab **Config & Style**, **Content**, **Notification** (social proof banner), **Media**, **Advanced JSON**, **live preview** desktop/mobile.
3. **Simpan**: konten ke Edge (jika URL di-set) + **localStorage**; badge status menunjukkan Edge vs lokal.

---

## 5. Modul fitur (detail)

### 5.1 Dashboard & notifikasi

- Statistik ringkas, filter periode, perbandingan dengan periode sebelumnya (di mana tersedia).
- **Activity log** operasional (dari `activityLogs`).
- Widget perhatian: stok minimum, jatuh tempo hutang/piutang.
- **Sync status chip** (UI sinkron antre).

### 5.2 Transaksi (tab)

- Daftar transaksi per bisnis dengan filter; terkait **invoice**, metode bayar, status (selesai/void/dll. sesuai model).

### 5.3 Produk & kategori

- CRUD produk: SKU, barcode, gambar URL, harga jual, **HPP**, stok, minimum alert, **pajak default** bisnis.
- Kategori untuk organisasi grid POS.

### 5.4 Member

- **Tier** (REGULAR, SILVER, GOLD), poin, diskon khusus, periode benefit (sesuai model `Member`).

### 5.5 Bahan baku & resep

- **Material** (bahan baku), restock, riwayat restock.
- **ProductMaterial**: menghubungkan produk dengan bahan dan jumlah pemakaian (untuk pelacakan biaya/resep).

### 5.6 Keuangan (`/dashboard/finance`)

Sub-halaman (nav + swipe mobile):

- **Cashflow** — entri pemasukan/pengeluaran, kategori, lampiran (blob lokal).
- **Hutang & Piutang** — `DebtReceivable` + pembayaran cicilan (`DebtPayment`).
- **Laba Rugi** — agregasi dari data transaksi & biaya (per logika `financeData`).
- **Laba Ditahan** — tampilan akumulasi (panel terkait).
- **Chart of Accounts** — `FinanceAccount` (kategori akuntansi).
- **Export** Excel/PDF (per `financeExport` / shell di UI).

### 5.7 History

- Riwayat operasional/audit yang relevan untuk dipanggil dari menu History (struktur mengikuti `HistoryPage`).

### 5.8 Shift & jadwal kasir

- **Shift** (jam kerja), **penugasan kasir per tanggal** (`ShiftAssignment`).
- **Sesi kasir** (`CashierSession`), **tutup shift** (`ShiftCloseRecord`) dengan rekonsiliasi kas (expected vs actual, variance, breakdown metode bayar).

### 5.9 Laporan (`ReportsPage`)

- Filter rentang tanggal, kasir, status, metode pembayaran.
- Agregasi harian, metode pembayaran, produk terlaris, **HPP** vs pendapatan.
- **Export** Excel/PDF (`reportsExport`).

### 5.10 Pengaturan (`SettingsPage`)

- **Akun** owner, **bisnis** (pajak, service charge, struk, notifikasi, printer kertas, SKU prefix, dll.).
- **Kasir**: daftar, PIN, izin void/diskon/maks diskon/laporan.
- **Data & backup**, **langganan** (UI), dll. sesuai section di file.

### 5.11 Super Admin (dashboard app)

- `SuperAdminPage`: branding login app, favicon, thumbnail OG, **Facebook Pixel**, WhatsApp support, **maintenance mode** — disimpan di localStorage.

### 5.12 CRM & inbox (lead)

- **`CrmLead`**: lead dari landing demo/checkout, tahapan DEMO → CHECKOUT → PAID → ONBOARDED (simulasi billing mengisi tahapan).
- **`BuyerInboxMessage`**: pesan sistem terkait simulasi (billing/auth) — **bukan** email SMTP nyata.

### 5.13 Aktivitas & todo

- **`ActivityLog`**: pencatatan aksi penting (produk, transaksi, finance, shift, dll.).
- **`TodoItem`**: tugas internal (prioritas, due date).

### 5.14 Sinkron

- **`syncAdapter`**: antre operasi untuk dikirim ke endpoint `VITE_SYNC_ENDPOINT` (default `/api/sync/batch`); jika backend belum ada, perilaku tetap lokal.

---

## 6. Model data (IndexedDB) — gambaran

Tabel utama (lihat `src/lib/db.ts` untuk definisi lengkap):

- **users**, **tenants**, **businesses**
- **cashiers**, **cashierSessions**, **shifts**, **shiftAssignments**, **shiftCloses**
- **categories**, **products**, **materials**, **productMaterials**, **materialRestockHistory**
- **transactions**, **transactionItems**
- **debtReceivables**, **debtPayments**
- **businessCosts**, **cashflowEntries**, **financeAccounts**
- **activityLogs**, **todoItems**
- **members**
- **crmLeads**, **buyerInbox**

**Seed awal** (`seedInitialData`):

- Owner demo, tenant, bisnis, kategori, produk dengan **foto placeholder** (URL Unsplash tetap), kasir demo, dan akun **super admin sistem** untuk CMS landing (detail kredensial di `MANUAL_SETUP.md`).

---

## 7. Yang bersifat demo / placeholder

Untuk menghindari salah paham saat menjelaskan ke klien:

| Area | Perilaku saat ini |
|------|-------------------|
| **Login** | Password disimpan sebagai **plain** di IndexedDB (cocok demo; **tidak** untuk produksi tanpa auth server) |
| **Pembayaran landing** | **Simulasi** delay + update lead + inbox lokal |
| **Email** | Tidak ada pengiriman email sungguhan |
| **Midtrans** | Belum terintegrasi; perlu backend + webhook |
| **Sinkron cloud** | Antre ada; **server** harus Anda sediakan |
| **CMS landing** | Tanpa `VITE_CONTENT_EDGE_URL`, konten hanya **per browser** (localStorage) |

---

## 8. File & folder penting (referensi)

| Lokasi | Fungsi |
|--------|--------|
| `src/App.tsx` | Routing, layar login owner/demo, dashboard, sidebar, POS, finance routes |
| `src/lib/db.ts` | Skema DB, seed, migrasi ringan |
| `src/lib/store.ts` | Auth, cart, sync queue, UI |
| `src/components/pos/POSScreen.tsx` | Alur kasir |
| `src/app/(marketing)/page.tsx` | Landing publik |
| `src/pages/LandingAdminPage.tsx` | CMS landing |
| `src/lib/landingContent.ts` | Load/save konten landing |
| `src/lib/billingFlow.ts` | Simulasi billing |
| `MANUAL_SETUP.md` | Deploy, env, integrasi manual |

---

## 9. PWA

- Di **production build**, `main.tsx` mendaftarkan **`/sw.js`** jika ada — mendukung instalasi/semi-offline sesuai implementasi service worker di `dist/`.

---

## 10. Cara memakai dokumen ini saat presentasi

1. **Jelaskan dulu** peran Owner vs Kasir vs Super Admin (landing).
2. **Demo flow**: landing → demo form → dashboard → buka kasir → satu transaksi → buka laporan.
3. **Tekankan** data lokal + offline-first, lalu **roadmap** backend (auth, Midtrans, email, sync) jika audiens teknis.

---

*Dokumen ini menggambarkan perilaku kode di repositori saat ini; jika ada penambahan fitur baru, sesuaikan bagian terkait modul dan alur.*
