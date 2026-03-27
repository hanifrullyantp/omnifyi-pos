# Omnifyi POS — Fitur, Fungsi, Flow & Integrasi (Dokumentasi Internal)

Dokumen ini menjelaskan detail fitur dan alur yang sudah ada di project **Omnifyi POS** (berbasis React + Vite, Tailwind, Zustand, Dexie, Framer Motion).  
Gunakan untuk menjelaskan produk ke user/klien, dan sebagai pegangan saat melakukan smoke test atau deploy.

---

## 1. Gambaran Umum Aplikasi

Omnifyi POS adalah aplikasi **Point of Sale untuk UMKM Indonesia** dengan pendekatan:

- **Mobile-first** (bottom navigation, layout stabil di iOS/Android)
- **Offline-first** (data transaksi tersimpan lokal, sync otomatis saat online)
- **Multi-role**:
  - `OWNER` (pemilik / admin aplikasi)
  - `ADMIN_SYSTEM` (super admin untuk LP/landing CMS)
  - `CASHIER` (kasir dengan login PIN, aktivitas tercatat)
- **CMS landing terpisah namun menggunakan 1 objek content yang sama**:
  - Landing publik: `pos.omnifyi.com` (root aplikasi sebelum login)
  - Admin LP: route `/admin` (khusus super admin)
- **PWA Ready**: manifest + service worker untuk instalasi dan pengalaman offline yang lebih baik.

---

## 2. Peran & Login (Auth Flow)

### 2.1. User (OWNER / Admin Aplikasi)

1. User membuka landing/public page (root) dan menekan **Masuk**.
2. User login dengan kredensial owner:
   - (Demo) `owner@example.com` / `password`
3. Setelah berhasil login:
   - User diarahkan ke **Dashboard aplikasi**.
4. Pada Dashboard, user dapat mengelola:
   - Produk, bahan baku, member, transaksi, laporan, keuangan, shift, history aktivitas, settings.

### 2.2. Super Admin (`ADMIN_SYSTEM`)

Flow dipersiapkan untuk “login jadi satu”, namun memiliki opsi masuk berbeda:

1. Super admin login dari halaman yang sama seperti user.
2. Jika role terdeteksi `ADMIN_SYSTEM`, aplikasi menampilkan chooser:
   - **Masuk Admin LP** (`/admin`) atau
   - **Masuk Aplikasi** (`/dashboard`)
3. Super admin LP mengelola konten landing melalui panel Admin LP.

### 2.3. Cashier Login (POS)

1. Kasir masuk melalui PIN.
2. Kasir dapat melakukan transaksi tanpa perlu akses dashboard owner.
3. Kasir dapat juga masuk lewat **deep link**:
   - Query string `mode=cashier&business=...&cashier=...`
4. Setelah berhasil verifikasi PIN:
   - Kasir diarahkan ke layar POS.

---

## 3. Landing Page (Root Sebelum Login) — Fitur & Flow

### 3.1. Tujuan landing

Landing berfungsi sebagai:

- Story emosional: masalah UMKM saat tidak pakai sistem POS
- Showcase manfaat fitur (dashboard realtime, stok, HPP, laporan)
- CTA: coba gratis (demo) + lihat demo (login)
- Form “Coba Gratis”:
  - membuat lead CRM demo
  - auto provisioning login demo (menggunakan flow local/simulasi sekarang, siap diganti backend real)
- Social proof notification banner di bottom center (ikon centang).

### 3.2. Form Demo (Wajib)

Form demo di landing meminta minimal:

- Nama
- No HP aktif (validasi format Indonesia `08..` atau `+62..`)
- Email valid
- Nama usaha
- Jenis usaha
- Alamat usaha

Jika valid:

1. Lead dibuat ke tabel CRM (`crmLeads`) dengan stage `DEMO`.
2. Akses demo dibuat dengan login otomatis owner demo (mode lokal/simulasi).
3. Admin LP bisa memantau lead dan pipeline.

### 3.3. Checkout & Auto-provisioning (Midtrans contract-ready)

CTA checkout disiapkan dengan flow “checkout → paid terdeteksi → email konfirmasi → login provision”.

Saat ini berjalan sebagai **simulasi lokal**, tetapi endpoint kontrak sudah disiapkan secara konseptual:

1. Landing membuat lead stage `CHECKOUT`.
2. Backend real (Midtrans webhook) belum dipasang dalam app ini, jadi sistem menggunakan `runLocalBillingFlow()`:
   - stage `PAID`
   - inbox message email konfirmasi dibuat
   - provisioning login selesai (temp password + set-password link)
   - stage `ONBOARDED`
3. Admin bisa memantau pipeline di Super Admin LP.

Catatan: saat integrasi Midtrans real selesai, `runLocalBillingFlow` akan digantikan oleh hasil webhook backend.

---

## 4. Admin LP (`/admin`) — CMS Konten Landing

### 4.1. Prinsip “1 objek content”

Landing publik dan admin LP memakai **satu skema object `LandingContent`**:

- `src/lib/landingContent.ts`
- Default konten tersedia untuk fallback.
- Saat env Edge Function aktif:
  - Admin bisa menyimpan konten via Supabase Edge Function
  - Landing akan load konten via fetch `?action=get`

### 4.2. Apa saja yang bisa diubah admin LP

Dengan panel sidebar, admin dapat mengubah:

- Brand:
  - `brandName`, `tagline`
  - `logoUrl`, `faviconUrl`
  - gambar hero (`heroImageUrl`)
- Konten:
  - headline / subheadline hero
  - deskripsi hero
  - teks tombol CTA
  - section copy (melalui editing JSON)
- Notification banner social proof:
  - enabled/disabled
  - interval min/max (random)
  - durasi tampil
  - sound URL (audio mp3 dari storage)
  - daftar item `{ name, package }`
- Video demo (field `demoVideoUrl`) siap dihubungkan ke player landing (belum “render player” penuh di UI sekarang, tapi kontennya sudah disiapkan untuk digunakan).

### 4.3. Preview & publish

Di panel admin LP:

- Ada **Live Preview** (desktop/mobile toggle) untuk melihat tampilan landing.
- Tombol:
  - **Simpan & Publish**: menulis ke Edge Function (atau fallback localStorage bila Edge Function belum aktif).
  - **Clear Draft**: membatalkan perubahan yang belum publish.

---

## 5. Notifikasi Social Proof — Bottom Center

### 5.1. Format teks

Bentuk teks:

`"<nama> baru saja memesan <paket> <brandName>"`

Contoh:

`Hanif baru saja memesan paket 1 bulan Omnifyi POS`

### 5.2. Perilaku banner

- ON/OFF dari setting admin LP
- Jika enabled dan item tersedia:
  - tunggu jeda random antara `minIntervalSec..maxIntervalSec`
  - pilih item random dari list
  - tampil dengan animasi/masuk pada UI (menggunakan setVisible logic)
  - putar suara jika `soundUrl` diisi
  - sembunyikan setelah `durationSec`
  - loop terus

Di UI, banner memuat icon centang (`CheckCircle2`).

---

## 6. Dashboard Aplikasi (Owner)

Dashboard aplikasi berisi modul-modul berikut (berdasarkan struktur sidebar dan route yang ada):

- Overview KPI & aktivitas
- Transaksi
- Produk
- Bahan baku
- Keuangan (Finance): cashflow, debt, P&L, retained, accounts
- Reports: filterable (charts + export)
- Shift management
- History & activity log
- Settings
- Super Admin (global settings via halaman `/dashboard/super-admin`)
- Member management

### 6.1. Cabang bisnis (business selector) & tambah bisnis

Pada sidebar:

- User bisa pilih business (cabang/usaha)
- Jika ingin menambah business:
  - ada tombol **Tambah Bisnis**
  - membuat record baru di `db.businesses`
  - lalu langsung switching ke business tersebut

Ini membuat workflow multi-outlet lebih ringkas.

### 6.2. Sidebar mobile scroll sampai profil/logout

Sidebar mobile dibuat supaya bisa di-scroll sampai area profil dan tombol logout sehingga user tetap bisa keluar dengan mudah.

---

## 7. POS Screen — Transaksi Kasir

### 7.1. UI utama POS

- Grid produk (dan mode list jika dibutuhkan)
- Tombol/komponen keranjang
- Payment modal
- Scanner modal (barcode)
- Today transactions modal

### 7.2. Guard terhadap looping/bug checkout

Beberapa mekanisme guard sudah diterapkan untuk mencegah looping popup pada mobile:

- Lockout timers saat modal payment ditutup
- Busy/debounce pada tombol checkout
- Deteksi input field saat menekan Enter

### 7.3. Offline-first checkout queue

Saat offline:

- transaksi masuk antrian pending sync
- indikator sync status ditampilkan
- ketika online kembali:
  - `processSyncQueue` memproses batch
  - strategi conflict: server-wins (di adapter)

---

## 8. CRM & Inbox Buyer

### 8.1. Tabel/konsep

- `crmLeads`: memuat lead stage `DEMO`, `CHECKOUT`, `PAID`, `ONBOARDED`
- `buyerInbox`: memuat pesan masuk untuk admin (saran/pertanyaan buyer + log sistem billing dan auth provisioning)

### 8.2. Monitoring

Di admin/super admin:

- stage pipeline ditampilkan
- inbox pesan buyer terbaru ditampilkan untuk ditindaklanjuti

---

## 9. Offline Sync — Alur Teknis (Ringkas)

Komponen utama:

- Dexie schema (IndexedDB)
- `syncAdapter.ts`:
  - endpoint placeholder configurable lewat env
  - retry exponential backoff
  - server-wins conflict
- `useSyncStore`:
  - proses periodic sync (interval 10 detik)
  - filtering due items berdasarkan `nextRetryAt`

UI:

- `SyncStatusChip` menampilkan status online/offline dan pending queue count.

---

## 10. Ekspor Laporan & Export Data

Modul laporan/finance menyediakan export:

- Excel (XLSX)
- PDF (jsPDF + autotable)

Flow secara konseptual:

1. Filter di UI
2. Bangun data rows dari Dexie
3. Render charts + table
4. Export sesuai data yang sedang terfilter.

---

## 11. Integrasi yang Siap Disambungkan (Backend Real)

Dokumentasi ini juga menjelaskan integrasi yang sedang “siap dihubungkan”:

### 11.1. Midtrans (Checkout Real)

Saat ini:

- flow “paid detection” berjalan simulasi lokal

Saat backend real siap:

- frontend akan diarahkan:
  - `POST /api/billing/checkout` untuk mendapatkan token/redirect info Midtrans
  - webhook Midtrans mengubah status lead/transaction
  - email konfirmasi dan provisioning login terjadi setelah webhook.

### 11.2. Supabase Edge Function (CMS)

Landing content memanggil:

- `?action=get` untuk membaca `LandingContent`
- `?action=save` untuk menyimpan JSON
- `?action=upload` untuk upload file asset landing

---

## 12. Smoke Test Checklist (untuk kamu jalankan manual)

1. Landing:
   - scroll & nav berjalan
   - tombol “Coba Gratis” membuka popup demo
   - validasi email + no HP benar (error tampil jika invalid)
2. Demo:
   - setelah submit demo terbuka akses sesuai workflow
3. Login:
   - Owner masuk ke dashboard
   - Super admin masuk dan chooser muncul
4. Admin LP:
   - buka `/admin`
   - sidebar `Config/Content/Notification/Media`
   - ubah teks dan publish
   - refresh landing → konten berubah
   - notification banner:
     - ON/OFF berjalan
     - interval random berfungsi
     - item random tampil
     - icon check muncul
5. POS:
   - tambah produk ke cart
   - buka checkout:
     - tidak looping
   - offline mode:
     - transaksi antre sync
6. Data demo:
   - foto produk tidak kosong
7. Build/deploy:
   - `npm run build` sukses

---

## 13. Catatan Tambahan

- Untuk asset dan foto produk dummy, seed menambahkan `imageUrl` dari URL internet agar tampilan profesional.
- Sound banner browser dapat membatasi autoplay; jika sound tidak terdengar, perlu interaksi user sebelum loop audio berjalan.

--- 

### Lampiran: Lokasi File Penting

- Landing CMS model & edge integration: `src/lib/landingContent.ts`
- Admin LP UI: `src/pages/LandingAdminPage.tsx`
- Marketing landing: `src/app/(marketing)/page.tsx`
- Admin switching based on role: `src/App.tsx`
- Offline sync engine: `src/lib/store.ts`, `src/lib/syncAdapter.ts`
- CRM pipeline + inbox: `src/lib/db.ts`, `src/lib/billingFlow.ts`

