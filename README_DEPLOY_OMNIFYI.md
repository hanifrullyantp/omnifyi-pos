# Omnifyi POS — Deploy & Integrations Tutorial (Step-by-Step)

Dokumen ini dibuat untuk membantu kamu menyiapkan sistem **Omnifyi POS** agar siap deploy (front-end, Supabase, Edge Function, Midtrans, dan Email).  
Di project ini, beberapa alur saat ini masih mode demo/simulasi (frontend), jadi tutorial ini juga menjelaskan titik mana yang harus kamu “hubungkan” ke backend real.

---

## 0. Prasyarat
- Node.js 18+ terpasang
- Akun Supabase + project sudah dibuat
- Akun Midtrans (sandbox/production) sudah aktif
- Email provider (mis. Resend/SendGrid/SMTP) siap
- Vercel (atau platform hosting lain) siap untuk deploy

---

## 1. Deploy Frontend ke Vercel
1. Pastikan build berhasil:
   - Jalankan: `npm run build`
2. Setup environment variables di Vercel (Production + Preview):
   - `VITE_CONTENT_EDGE_URL` (URL Supabase Edge Function untuk CMS landing)
   - `VITE_CONTENT_ADMIN_SECRET` (secret untuk akses admin CMS)
   - (opsional) `VITE_SYNC_ENDPOINT` jika kamu sudah punya endpoint sync backend real
3. Deploy:
   - Upload project ke GitHub
   - Connect ke Vercel → gunakan command `npm run build`

Catatan: karena app ini SPA (React Router), semua page di-handle oleh route client. Pastikan Vercel rewrite `/*` → `index.html` jika diperlukan (umumnya otomatis untuk Vite/React SPA).

---

## 2. Supabase Storage untuk Asset Landing (Logo/Thumbnail/Video/Audio)
Tujuan: admin LP bisa upload asset, lalu kita simpan ke Storage dan URL-nya disimpan ke JSON content landing.

Rekomendasi bucket:
- `landing-assets` (public read / atau private + signed URL sesuai kebutuhan)

Langkah:
1. Buat bucket di Supabase: `landing-assets`
2. Cek kebijakan (RLS/policies) sesuai mode:
   - Kalau public assets: set public bucket
   - Kalau private: kamu perlu signed URL dari Edge Function

---

## 3. Supabase Edge Function: CMS Landing (GET / SAVE / UPLOAD)
Tujuan: “admin.html dan index.html saling pakai satu objek content” (1 sumber kebenaran).

Di frontend saat ini dipanggil oleh:
- `GET  ${VITE_CONTENT_EDGE_URL}?action=get`
- `POST ${VITE_CONTENT_EDGE_URL}?action=save` (body: JSON `LandingContent`)
- `POST ${VITE_CONTENT_EDGE_URL}?action=upload` (multipart FormData file)

Buat Edge Function endpoint yang:
1. Memeriksa secret:
   - Header `x-admin-secret` harus cocok dengan `VITE_CONTENT_ADMIN_SECRET`
   - Untuk action `get`, biasanya boleh tanpa secret.
2. Menyimpan 1 dokumen JSON content (mis. di table `landing_contents` atau KV-like storage)
3. Action `upload`:
   - Upload file ke Supabase Storage bucket `landing-assets`
   - Kembalikan `{ publicUrl }`

## 4. Perluas JSON `LandingContent`
Pastikan object JSON menyertakan minimal:
- `brandName`, `tagline`
- `hero.*` (preHeadline, headline1/2, sub1/2/3, description, ctaPrimary/Secondary, badge, badgeSub)
- `logoUrl`, `faviconUrl`, `heroImageUrl`, `demoVideoUrl`
- `notificationBanner`:
  - `enabled`
  - `items: [{ name, package }]`
  - `minIntervalSec`, `maxIntervalSec`, `durationSec`
  - `soundUrl?`

---

## 5. Midtrans Integration (Checkout -> Webhook -> Paid -> Provision Login)
Di project saat ini, frontend melakukan simulasi lokal via `runLocalBillingFlow()` untuk memproses:
checkout → paid → email konfirmasi → provisioning login

Untuk menjadi real:

### 5A. Endpoint backend yang dibutuhkan
Kamu butuh backend (serverless/express) dengan contract berikut:
1. `POST /api/billing/checkout`
   - Input: `{ orderId, amount, buyer: {name, phone, email}, packageId }`
   - Output: `{ token }` atau data yang diperlukan Midtrans.
2. `POST /api/billing/midtrans-webhook`
   - Midtrans akan mengirim callback status pembayaran.
   - Backend memvalidasi signature.
   - Update status payment (PAID) dan trigger email.
3. `POST /api/auth/provision`
   - Input: data buyer + orderId / leadId
   - Output: mekanisme login (link set password / temp password).

### 5B. Flow penggantinya di frontend
Frontend harus:
- Create checkout → dapat token Midtrans
- Tampilkan embed/redirect Midtrans
- Deteksi status payment:
  - Via polling `GET /api/billing/status?orderId=...` atau via webhook yang memicu status di database
- Setelah status PAID:
  - email konfirmasi terkirim
  - provisioning login dibuat (link set-password atau temp password)

---

## 6. Email Integration (Email Konfirmasi Pembayaran)
Yang dibutuhkan:
1. Email template konfirmasi pembayaran (isi orderId + ringkasan paket)
2. Email provisioning:
   - Link “set password” ATAU temp password
3. Endpoint yang dipanggil dari webhook Midtrans ketika payment sukses.

Saran implementasi:
- Gunakan provider seperti Resend/SendGrid
- Simpan log email agar admin bisa monitor (opsional tapi recommended untuk debugging)

---

## 7. Hosting Vercel + Environment Variables Checklist
Di Vercel pastikan:
- `VITE_CONTENT_EDGE_URL` (contoh: `https://xxxx.supabase.co/functions/v1/cms-landing`)
- `VITE_CONTENT_ADMIN_SECRET` (string secret)
- (opsional) `VITE_SYNC_ENDPOINT`

Tambahkan juga pada Vercel backend (kalau kamu deploy server functions):
- Midtrans server key
- Email API key

---

## 8. Smoke Test (yang harus kamu jalankan setelah deploy)
1. Landing load tanpa error.
2. Navbar:
   - Klik CTA membuka popup demo.
   - Form demo validasi email & no HP.
3. Login:
   - Masuk sebagai OWNER → masuk `/dashboard`.
   - Masuk sebagai ADMIN_SYSTEM → muncul chooser:
     - Admin LP (`/admin`)
     - Aplikasi (`/dashboard`)
4. Admin LP:
   - Ubah brandName/headline/CTA.
   - ON/OFF notification banner + isi item + sound url.
   - Klik “Simpan & Publish”.
   - Refresh landing → preview notification banner berubah sesuai setting.
5. Video/media:
   - Upload media → url masuk ke object JSON.
6. Offline/PWA (kalau sudah diaktifkan):
   - Test install prompt + simulasi offline.

---

## Catatan Penting (Browser Autoplay Sound)
Beberapa browser melarang autoplay suara tanpa interaksi user.
Jika sound tidak terdengar:
- Pastikan ada aksi user sebelum loop notification mulai (mis. klik tombol “Mulai Demo”)
- Atau tampilkan toggle “Sound aktif” dan hanya play jika user menyalakan secara eksplisit.

