# Panduan setup — untuk pengguna awam

Dokumen ini menjelaskan **apa yang harus Anda lakukan sendiri** vs **apa yang sudah disiapkan di kode**, untuk **Supabase**, **Midtrans**, **Resend**, dan hosting.

---

## Istilah cepat

| Istilah | Arti sederhana |
|--------|------------------|
| **Frontend** | Tampilan website/app di browser (proyek ini — sudah ada di folder Anda). |
| **Backend / server** | Program di internet yang rahasia (kunci API pembayaran & email) aman di sana, **bukan** di browser. |
| **Environment variable** | “Pengaturan rahasia” seperti URL dan kunci — di Vercel atau file `.env.local`. |

---

## Seberapa “otomatis” tiap layanan? (jujur)

| Layanan | Perkiraan | Yang Anda lakukan | Yang sudah / bisa dibantu kode di repo ini |
|--------|-----------|-------------------|-------------------------------------------|
| **Supabase (CMS landing)** | **Tinggi (~70–85%)** | Daftar, buat proyek, buat bucket, pasang CLI atau pakai dashboard, jalankan 3–4 perintah deploy | **Sudah ada** template Edge Function di folder `supabase/functions/cms-landing/` — tidak perlu tulis function dari nol |
| **Midtrans (bayar sungguhan)** | **Rendah (~15–25%)** | Daftar Midtrans, ambil kunci sandbox/production | Aplikasi masih pakai **simulasi** checkout. Sambungkan Midtrans **wajib backend** baru + ubah frontend — **belum** ada API Midtrans jadi di repo |
| **Resend (email)** | **Rendah (~15–25%)** | Daftar, verifikasi domain/email | Email nyata **wajib backend** (Resend API key tidak boleh di `VITE_*`). **Belum** ada pengiriman email otomatis di repo |

**Kesimpulan:** Anda **bisa** hampir “login + ikut langkah” untuk **Supabase CMS** kalau mengikuti bagian B di bawah. Untuk **Midtrans + Resend** seperti **kontrak pembangunan tambahan**: siapa pun (termasuk developer) harus menambah **server**; itu **tidak bisa** 90% otomatis hanya dengan Anda download/login.

---

## A. Mode paling mudah — tanpa Supabase / tanpa Midtrans / tanpa email

Cocok untuk **jajal** atau **demo**.

1. Deploy frontend ke Vercel (lihat `LANGKAH_DEPLOY.md`).
2. **Jangan** isi `VITE_CONTENT_EDGE_URL` di Vercel — konten landing disimpan per browser (**localStorage**).
3. Checkout di landing = **simulasi**, bukan uang sungguhan.

Tidak perlu akun Supabase, Midtrans, atau Resend.

---

## B. Supabase — supaya CMS landing tersimpan di cloud (satu untuk semua pengunjung)

Tujuan: admin landing bisa **simpan** ke server; pengunjung dapat konten yang sama.

### Yang Anda lakukan (checklist)

1. **Daftar & buat proyek**  
   - Buka [https://supabase.com](https://supabase.com) → **Start your project** — gratis tier sudah cukup untuk percobaan.

2. **Buat bucket Storage**  
   - Dashboard → **Storage** → **New bucket**  
   - Nama: **`landing-assets`**  
   - Centang **Public bucket** (agar URL gambar/upload bisa dibuka di browser).  
   - Jika tidak public, URL dari upload bisa tidak tampil di landing tanpa pengaturan tambahan.

3. **Pasang Supabase CLI** (sekali di Mac)  
   - Ikuti: [https://supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)  
   - Atau dengan Homebrew: `brew install supabase/tap/supabase`

4. **Hubungkan folder proyek ke proyek Supabase Anda**  
   Buka Terminal, masuk ke folder **OMNIFYI POS**:
   ```bash
   cd "/path/ke/OMNIFYI POS"
   supabase login
   supabase link --project-ref otbmghdygvolmzfdhbbo
   ```
   **Ref proyek Anda (Omnifyi POS):** `otbmghdygvolmzfdhbbo` — bisa dicek kapan saja di Dashboard → **Settings** → **General** → **Reference ID**.  
   *(Kalau suatu saja Anda buat project Supabase baru, ganti nilai ini dengan Reference ID yang baru.)*

5. **Set rahasia untuk admin** (harus sama nanti dengan `VITE_CONTENT_ADMIN_SECRET` di Vercel / `.env.local`):
   ```bash
   supabase secrets set CONTENT_ADMIN_SECRET="reyhan"
   ```
   **Peringatan keamanan:** `reyhan` pendek dan mudah ditebak — cukup untuk **coba / internal**. Untuk production, pakai **string acak panjang** (misalnya 32+ karakter) dan **jangan** simpan secret di repo publik atau screenshot.

6. **Deploy function** (kode sudah ada di repo: `supabase/functions/cms-landing/`):
   ```bash
   supabase functions deploy cms-landing --no-verify-jwt
   ```

7–10. **Setelah deploy function — lanjut pakai Terminal (copas)**  

   Di bawah ini semuanya lewat Terminal. **Ganti 2 baris pertama** kalau project ref atau secret Anda beda.

   ### 7) Tentukan URL function (satu tempat untuk semua perintah)

   Buka Terminal, **edit `PROJECT_REF` dan `SECRET`**, lalu jalankan blok ini:

   ```bash
   # === GANTI DI SINI (copas seluruh blok) ===
   PROJECT_REF="otbmghdygvolmzfdhbbo"
   SECRET="reyhan"
   # ==========================================

   EDGE_URL="https://${PROJECT_REF}.supabase.co/functions/v1/cms-landing"
   echo "URL Edge Function CMS:"
   echo "$EDGE_URL"
   ```

   Itu adalah URL untuk langkah 7–10. Bentuknya selalu:  
   `https://<PROJECT_REF>.supabase.co/functions/v1/cms-landing`

   **Cek cepat** (opsional — kalau function sudah deploy, biasanya dapat JSON atau `{}`):

   ```bash
   curl -sS "${EDGE_URL}?action=get" | head -c 300
   echo
   ```

   ### 8) File `.env.local` di komputer (untuk `npm run dev`)

   Masih di Terminal, masuk folder proyek **OMNIFYI POS** Anda (sesuaikan path), lalu:

   ```bash
   cd "/Users/metikul/Documents/cursor/OMNIFYI POS"

   printf 'VITE_CONTENT_EDGE_URL=%s\nVITE_CONTENT_ADMIN_SECRET=%s\n' "$EDGE_URL" "$SECRET" > .env.local
   echo "Berhasil tulis .env.local — isi ringkas:"
   grep '^VITE_' .env.local
   ```

   Setelah itu jalankan `npm run dev` dan buka URL lokal (biasanya `http://localhost:5173`).

   ### 9) Variabel di Vercel lewat Terminal

   Pastikan Anda sudah pernah login Vercel dan folder ini ter-link ke project (kalau belum: `npx vercel login` lalu `npx vercel link` dari folder proyek).

   **Production** (wajib untuk situs “utama”):

   ```bash
   cd "/Users/metikul/Documents/cursor/OMNIFYI POS"

   printf '%s' "$EDGE_URL" | npx vercel env add VITE_CONTENT_EDGE_URL production
   printf '%s' "$SECRET" | npx vercel env add VITE_CONTENT_ADMIN_SECRET production
   ```

   **Preview** (preview deploy / branch lain — disarankan sama supaya tidak bingung):

   ```bash
   printf '%s' "$EDGE_URL" | npx vercel env add VITE_CONTENT_EDGE_URL preview
   printf '%s' "$SECRET" | npx vercel env add VITE_CONTENT_ADMIN_SECRET preview
   ```

   Kalau perintah di atas meminta pilihan di layar, ikuti saja (biasanya konfirmasi menimpa env lama).

   *Cadangan kalau CLI menyusahkan:* di [Vercel Dashboard](https://vercel.com) → project Anda → **Settings** → **Environment Variables** → tambah manual `VITE_CONTENT_EDGE_URL` dan `VITE_CONTENT_ADMIN_SECRET` untuk **Production** dan **Preview**, nilainya sama dengan `$EDGE_URL` dan `$SECRET`.

   ### 10) Deploy ulang production (agar `VITE_*` ikut ke build)

   Variabel `VITE_*` disisipkan **saat build**. Setelah mengubah env di Vercel, **harus** deploy lagi:

   ```bash
   cd "/Users/metikul/Documents/cursor/OMNIFYI POS"
   npm run deploy:prod
   ```

   Tunggu sampai selesai; di output biasanya ada URL production.

### Yang “kami / repo” sudah lakukan

- File **`supabase/functions/cms-landing/index.ts`** mengikuti API yang dipakai `src/lib/landingContent.ts` (`action=get|save|upload`, header `x-admin-secret`).
- **`supabase/config.toml`** mematikan verifikasi JWT untuk function ini (agar GET konten tidak perlu token Supabase user).

### Jika ada error

- **401 pada save/upload** → `VITE_CONTENT_ADMIN_SECRET` dan `CONTENT_ADMIN_SECRET` tidak sama, atau ada spasi salah ketik.  
- **Gagal upload** → pastikan bucket **`landing-assets`** ada dan nama persis sama.  
- **403 Storage** → cek kebijakan bucket (public read untuk konten yang di-`getPublicUrl`).

---

## C. Midtrans — pembayaran nyata (perlu backend baru)

**Saat ini:** alur di app = **simulasi lokal** (`runLocalBillingFlow` di `src/lib/billingFlow.ts`), aman untuk demo.

**Untuk produksi:**

1. Daftar: [https://midtrans.com](https://midtrans.com) — pakai **Sandbox** dulu.  
2. Simpan **Server Key** dan **Client Key** — **Server Key hanya di server**, jangan variabel `VITE_*`.  
3. Anda perlu **API backend** yang: membuat transaksi Snap/Core API, menerima **webhook** Midtrans, memverifikasi signature, mengubah status pesanan.  
4. Frontend harus **diganti** dari simulasi ke memanggil backend Anda + menampilkan Midtrans.

Ini **bukan** sekadar tempel kunci di Vercel; butuh pekerjaan pengembangan (di luar “90% otomatis”).

---

## D. Resend — email konfirmasi (perlu backend baru)

1. Daftar: [https://resend.com](https://resend.com)  
2. Verifikasi domain atau email pengirim (ikuti wizard Resend).  
3. API Key Resend dipakai **hanya di server** yang mengirim email (misalnya setelah webhook Midtrans “paid”).

Aplikasi ini **belum** mengirim email lewat Resend dari backend yang ada di repo.

---

## E. Ringkas: Vercel + variabel yang relevan sekarang

Yang **sudah umum** untuk frontend:

| Variabel | Kapan diisi |
|----------|-------------|
| `VITE_CONTENT_EDGE_URL` | Jika pakai Supabase CMS (Bagian B) |
| `VITE_CONTENT_ADMIN_SECRET` | Harus sama dengan secret di Supabase Edge |

`VITE_*` di-build ke dalam file JS — **jangan** taruh kunci Midtrans Server atau Resend API di sana.

---

## F. Akun demo (untuk uji di app)

**Super Admin sistem (role khusus di app)**

- Email: `hanif.rullyant@gmail.com`
- Password login: `12345678` (sama dengan yang dipakai di seed `db.ts`)
- Setelah login dari halaman utama, user ini bisa lanjut ke opsi admin landing; **disarankan diganti** sebelum produksi.

**Owner POS demo**

- Email: `owner@example.com`  
- Password: `password`  
- Untuk menguji dashboard setelah data awal di-seed.

---

## G. Checklist sebelum go-live

- [ ] `npm run build` lokal sukses.
- [ ] Uji: landing, login owner, dashboard, POS.
- [ ] Kalau pakai CMS cloud: Supabase function deploy + `VITE_*` di Vercel + redeploy.
- [ ] Midtrans & email: hanya setelah ada backend; webhook diverifikasi; tidak expose secret di browser.

---

## Tautan berguna

| Topik | Link |
|--------|------|
| Supabase | [https://supabase.com](https://supabase.com) |
| Supabase CLI | [https://supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli) |
| Midtrans | [https://midtrans.com](https://midtrans.com) |
| Resend | [https://resend.com](https://resend.com) |
| Deploy Vercel (pemula) | `LANGKAH_DEPLOY.md` di repo ini |

---

## Dokumen teknis tambahan (developer)

Rinci arsitektur dan kontrak API: **`README_DEPLOY_OMNIFYI.md`** dan **`DOKUMENTASI_FITUR_APLIKASI.md`**.
