# Panduan setup manual (deploy & integrasi)

Dokumen ini menjelaskan langkah **manual** yang perlu Anda lakukan di luar kode aplikasi: hosting, environment, dan layanan pihak ketiga. Sesuaikan URL, kunci API, dan nama proyek dengan milik Anda.

---

## 1. Prasyarat lokal

1. Node.js LTS terpasang.
2. Di folder proyek: `npm install`
3. Salin `.env.example` menjadi `.env.local`, isi variabel jika sudah punya Edge Function (boleh kosong untuk demo).
4. Jalankan `npm run dev` dan buka URL yang ditampilkan (biasanya `http://localhost:5173`).

---

## 2. Build produksi

1. `npm run build` — menghasilkan folder `dist/` (HTML tunggal + PWA assets jika ada).
2. Uji lokal: `npm run preview` — pastikan navigasi ke `/`, `/dashboard`, `/admin` (setelah login) berjalan.

---

## 3. Deploy ke Vercel

1. Buat akun [Vercel](https://vercel.com) dan hubungkan repositori Git (atau deploy dari CLI `vercel`).
2. **Root directory**: folder yang memuat `package.json` proyek ini.
3. **Build command**: `npm run build`
4. **Output directory**: `dist`
5. **Environment variables**: tambahkan `VITE_CONTENT_EDGE_URL` dan `VITE_CONTENT_ADMIN_SECRET` jika dipakai (lihat `.env.example`). Variabel `VITE_*` harus di-set **sebelum build** agar tertanam di bundle.
6. File `vercel.json` mengarahkan semua path ke `index.html` agar routing client-side (React Router) tidak 404 saat refresh halaman dalam.

---

## 4. Supabase (Edge Function untuk konten landing)

Aplikasi memuat/menyimpan konten landing lewat `loadLandingContent` / `saveLandingContent` di `src/lib/landingContent.ts`:

- Query `?action=get` — GET, mengembalikan JSON konten.
- Query `?action=save` — POST body JSON konten.
- Query `?action=upload` — POST `multipart/form-data` dengan field `file`, mengembalikan `{ publicUrl }`.

Langkah umum:

1. Buat proyek di [Supabase](https://supabase.com).
2. Buat **Edge Function** (Deno) yang menangani tiga `action` di atas; simpan payload ke Storage atau tabel `landing_content` sesuai kebutuhan.
3. Deploy function, salin URL publiknya ke `VITE_CONTENT_EDGE_URL`.
4. Set `VITE_CONTENT_ADMIN_SECRET` dan validasi header `x-admin-secret` di function agar endpoint tidak terbuka sembarangan.

Tanpa URL ini, konten tetap bisa diedit dan disimpan di **localStorage** per browser (badge di admin landing menampilkan status penyimpanan lokal).

---

## 5. Midtrans (pembayaran nyata)

Saat ini alur checkout di landing memakai **simulasi lokal** (`runLocalBillingFlow` di `src/lib/billingFlow.ts`). Untuk produksi:

1. Daftar [Midtrans](https://midtrans.com), dapatkan **Server Key** dan **Client Key**.
2. Buat backend (Node/Edge) yang: membuat transaksi Snap atau Core API, menangani **notification URL** (webhook), memverifikasi signature, lalu memperbarui status order/CRM di database Anda.
3. Frontend: ganti pemanggilan simulasi dengan redirect ke Snap atau tampilkan token pembayaran dari API Anda.
4. Simpan secret di **server** saja; jangan menaruh Server Key di variabel `VITE_*` yang terbuka ke browser.

---

## 6. Email transaksional

Notifikasi di demo disimpan ke inbox lokal (`buyerInbox`). Untuk email sungguhan:

1. Pilih penyedia (mis. Resend, SendGrid, AWS SES, Mailgun).
2. Verifikasi domain pengirim (SPF/DKIM).
3. Panggil API kirim email dari **backend** setelah pembayaran dikonfirmasi atau user mendaftar — jangan expose API key di client.

---

## 7. Super Admin landing (CMS)

- **Email**: `hanif.rullyant@gmail.com`
- **Password**: `12345678`
- Login dari halaman utama → setelah sukses, pilih **Masuk Admin LP** untuk membuka `/admin`.
- Tombol publik "Admin" tidak ditampilkan; hanya user dengan role ini yang mendapat dialog pilihan setelah login.

---

## 8. Akun demo owner (POS)

- **Email**: `owner@example.com`
- **Password**: `password`  
Digunakan untuk menguji dashboard/POS setelah seed data (`seedInitialData`).

---

## 9. PWA & HTTPS

Service worker / manifest (jika ada di `dist/`) membutuhkan **HTTPS** di produksi. Vercel menyediakan HTTPS otomatis.

---

## 10. Checklist sebelum go-live

- [ ] `npm run build` tanpa error.
- [ ] Smoke test: landing, login owner, login super admin, `/admin`, dashboard utama, POS.
- [ ] Variabel `VITE_*` di Vercel sesuai environment production.
- [ ] Midtrans & email: hanya lewat backend; webhook diverifikasi.
- [ ] Ganti password default super admin jika data sensitif (disarankan autentikasi server-side untuk CMS).
