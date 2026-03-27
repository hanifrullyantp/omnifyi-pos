# Panduan deploy Omnifyi POS — untuk pemula

Ditulis untuk yang **baru pertama kali** dan belum paham istilah seperti *repository* atau *Git*. Anda bisa ikuti dari atas ke bawah.

---

## Istilah singkat (supaya tidak bingung)

| Istilah | Arti sederhana |
|---------|----------------|
| **Kode / proyek** | Folder **OMNIFYI POS** di komputer Anda (isi aplikasi). |
| **GitHub** | Situs untuk **menyimpan kode di internet** (seperti “Google Drive” khusus program). |
| **Repository (repo)** | **Satu “folder proyek”** di GitHub — tempat kode Anda disimpan online. |
| **Vercel** | Layanan yang **menjalankan website** dari kode Anda dan memberi **alamat https://...** |
| **Deploy** | Proses **menampilkan aplikasi ke internet** supaya orang bisa buka lewat browser. |

---

## Yang Anda butuhkan

1. **Komputer** dengan kode folder **OMNIFYI POS** (misalnya di `Documents/cursor/OMNIFYI POS`).
2. **Akun email** untuk daftar GitHub dan Vercel (boleh email yang sama).
3. **Koneksi internet**.

---

# Bagian 1 — Daftar GitHub (simpan kode online)

1. Buka: **[https://github.com/signup](https://github.com/signup)**  
   *(atau buka [github.com](https://github.com) lalu klik **Sign up**)*

2. Isi email, buat password, pilih nama pengguna (username).

3. Selesaikan verifikasi email jika diminta.

4. **Selesai** — Anda sekarang punya akun GitHub.

---

# Bagian 2 — Buat repository kosong di GitHub

1. Login ke **[https://github.com](https://github.com)**.

2. Klik tombol **+** di pojok kanan atas → **New repository**.

3. Isi **Repository name**, misalnya: `omnifyi-pos` (boleh nama lain, tanpa spasi).

4. Pilih **Public** (gratis, mudah untuk pemula).

5. **Jangan** centang “Add a README” kalau mau ikut langkah aplikasi GitHub Desktop di bawah (biar repo benar-benar kosong).

6. Klik **Create repository**.

7. **Catat** alamat repo Anda. Contoh:  
   `https://github.com/nama-pengguna-anda/omnifyi-pos`  
   *(nama pengguna dan nama repo mengikuti yang Anda buat)*

---

# Bagian 3 — Unggah kode dari komputer ke GitHub (paling mudah: aplikasi)

Anda **tidak wajib** mengetik perintah panjang. Gunakan **GitHub Desktop** (gratis, resmi GitHub).

### 3.1 Install aplikasi

1. Buka: **[https://desktop.github.com](https://desktop.github.com)**
2. Download untuk **Mac** atau **Windows**, install seperti aplikasi biasa.
3. Buka GitHub Desktop, login dengan akun GitHub Anda.

### 3.2 Tambahkan folder proyek Anda

1. Di GitHub Desktop menu: **File** → **Add Local Repository...**

2. Klik **Choose...** dan pilih folder **OMNIFYI POS** di komputer Anda.  
   Contoh path Mac:  
   `/Users/namauser/Documents/cursor/OMNIFYI POS`

3. Jika diminta “create a repository”, setuju saja (GitHub Desktop yang buatkan pengaturan awal).

### 3.3 Unggah ke internet (Publish)

1. Klik **Publish repository** (atau **Push origin** jika sudah pernah publish).

2. Pastikan nama repo cocok dengan yang di GitHub (boleh sama seperti yang Anda buat di web).

3. Tunggu sampai selesai — kode Anda sekarang ada di **github.com** di bawah akun Anda.

**Cek:** buka halaman repo di browser, Anda harusnya melihat file-file seperti `package.json`, folder `src`, dll.

---

# Bagian 4 — Daftar Vercel dan tancapkan GitHub

1. Buka: **[https://vercel.com/signup](https://vercel.com/signup)**

2. Pilih **Continue with GitHub** — login dengan akun GitHub yang sama.

3. **Izinkan** Vercel mengakses GitHub bila diminta (supaya Vercel bisa membaca repo).

---

# Bagian 5 — Deploy pertama di Vercel (penting)

1. Setelah login Vercel, klik **Add New...** → **Project**.

2. Anda akan melihat daftar **repository** dari GitHub. Pilih repo **omnifyi-pos** (atau nama yang Anda pakai). Klik **Import**.

3. **Jangan langsung Deploy** — periksa pengaturan berikut (scroll ke bawah di halaman yang sama):

   | Pengaturan bahasa Inggris | Isi yang benar |
   |---------------------------|----------------|
   | **Framework Preset** | **Vite** (atau biarkan auto-detect) |
   | **Root Directory** | `./` atau kosongkan default **jika** `package.json` ada di folder utama repo |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |
   | **Install Command** | `npm install` |

4. Bagian **Environment Variables** — **lewati dulu** (kosong juga boleh untuk coba pertama). Nanti kalau pakai CMS cloud, baru diisi (lihat **`MANUAL_SETUP.md`**).

5. Klik **Deploy**.

6. Tunggu beberapa menit. Kalau sukses, Vercel menampilkan **alamat website**, misalnya:  
   `https://omnifyi-pos-xxxx.vercel.app`

7. **Klik link itu** — aplikasi Omnifyi POS Anda sudah hidup di internet.

**Kalau gagal (merah / error):** buka tab **Deployment** → klik baris terbaru → lihat **Build Logs**, foto/salin teks error-nya untuk ditanyakan ke tim atau asisten.

---

# Bagian 6 — Setelah sukses: update ke depannya (ringkas)

Kalau sudah deploy sekali dengan cara di atas, **Vercel terhubung dengan GitHub**. Artinya:

1. Anda ubah kode di komputer (misalnya di Cursor).

2. Buka **GitHub Desktop** → tulis ringkasan perubahan di **Summary** → klik **Commit to main** → klik **Push origin**.

3. **Tunggu 1–2 menit** — Vercel biasanya **otomatis** build dan ganti website dengan versi terbaru.

Anda **tidak perlu** buka vercel.com setiap kali, kecuali mau ubah pengaturan atau cek error.

---

# Bagian 7 — (Pilihan) Deploy lewat terminal

Hanya jika suka pakai **Terminal** atau minta Cursor menjalankan perintah.

1. Install Node.js: **[https://nodejs.org](https://nodejs.org)** (pilih versi **LTS**, download, install).

2. Di Terminal / Cursor Terminal:

```bash
cd "/Users/metikul/Documents/cursor/OMNIFYI POS"
npm install
npm run build
```

Kalau `npm run build` **tanpa error**, lanjut (opsi deploy langsung ke Vercel):

```bash
npx vercel login
npx vercel link
npm run deploy:prod
```

Ikuti pertanyaan di layar. Ini **alternatif** kalau tidak pakai GitHub + import web. Untuk pemula, **Bagian 3–5 lebih mudah**.

---

# Cek singkat sebelum deploy pertama

| Langkah | Periksa |
|--------|---------|
| Folder benar | Ada file `package.json` di dalam **OMNIFYI POS** |
| Build lokal | Jalankan `npm install` lalu `npm run build` — harus selesai tanpa error |

---

# Link penting (bookmark)

| Untuk apa | Alamat |
|-----------|--------|
| Daftar / login GitHub | [https://github.com](https://github.com) |
| Aplikasi unggah kode (mudah) | [https://desktop.github.com](https://desktop.github.com) |
| Daftar / login Vercel | [https://vercel.com](https://vercel.com) |
| Download Node.js (kalau pakai terminal) | [https://nodejs.org](https://nodejs.org) |

---

# Dokumentasi lain di folder ini

| File | Isi |
|------|-----|
| **`MANUAL_SETUP.md`** | Setelan lanjutan (Midtrans, email, Supabase, variabel lingkungan). |
| **`DOKUMENTASI_FITUR_APLIKASI.md`** | Penjelasan fitur aplikasi. |
| **`.env.example`** | Nama variabel opsional untuk CMS landing. |

---

# Ringkasan alur terpendek untuk pemula

1. Daftar **GitHub** → buat **repository** kosong.  
2. Install **GitHub Desktop** → tambah folder **OMNIFYI POS** → **Publish**.  
3. Daftar **Vercel** dengan akun GitHub → **Import** repo → isi **Output: dist**, **Build: npm run build** → **Deploy**.  
4. Buka URL yang diberikan Vercel.

Selamat — itu saja inti yang perlu Anda lakukan sendiri. Sisanya bisa dilakukan otomatis lewat **Push** dari GitHub Desktop setiap kali Anda menyimpan perubahan kode.
