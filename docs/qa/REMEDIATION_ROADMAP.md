## Remediation Roadmap — P0/P1/P2 (Execution Plan)

Roadmap ini mengubah backlog gap menjadi urutan eksekusi yang bisa dipakai untuk sprint planning. Fokus utamanya: **P0 dulu**, lalu stabilisasi P1, baru ekspansi P2.

### Prinsip
- **Tidak ada gap tanpa DoD** dan tanpa regression test yang jelas.
- Setiap milestone harus menghasilkan peningkatan coverage matriks (Supported naik, Partial turun).
- Setiap perubahan harus lulus regression pack minimal untuk domain terdampak.

---

## Milestone P0 — Stabilitas transaksi & integritas data (Blocker)
> Tujuan: aplikasi tidak crash, transaksi aman, stok konsisten, shift close valid.

### Scope P0
- Tidak ada crash saat bayar / proses transaksi.
- Proteksi oversell stok bekerja konsisten.
- Shift close menghasilkan expected cash & variance konsisten.
- Setting tax/service berpengaruh ke total POS dengan benar.

### Work items
1. **Stabilitas POS payment pipeline**
   - Pastikan modal bayar tidak punya runtime error.
   - Validasi stok sebelum commit transaksi.
   - Loloskan test: `TC-POS-002`, `TC-POS-003`, `TC-POS-004`.
2. **Data integrity untuk transaksi**
   - Pastikan `transactions` dan `transactionItems` selalu konsisten (tidak ada orphan).
   - Loloskan test: `TC-POS-004`, `TC-REP-001`.
3. **Shift close reconciliation**
   - Pastikan close shift mengunci sesi dan menyimpan breakdown.
   - Loloskan test: `TC-SHIFT-003`.

### Exit criteria (Sign-off P0)
- Semua TC P0 lulus: `TC-POS-002/003/004`, `TC-SHIFT-003`, `TC-SET-001`.
- Tidak ada crash blocker baru di flow kasir.

---

## Milestone P1 — Operasional end-to-end + DX sinkronisasi
> Tujuan: owner/kasir bisa menjalankan operasi harian end-to-end; dev experience sync jelas (tidak 404 spam).

### Scope P1
- CMS landing publish lintas browser jelas (Edge vs local).
- Sync dev environment tidak noisy; jika endpoint ada, sync berjalan; jika tidak, status jelas.
- Backup/export dan laporan inti stabil.

### Work items (diambil dari backlog)
1. **GAP-CMS-001** — Hardening CMS publish lintas browser
   - Regression: `TC-CMS-001`.
2. **GAP-SYNC-002** — Strategy untuk dev sync endpoint (hindari 404 noise)
   - Regression: `TC-SYNC-002`.
3. **(Opsional P1)**: Perluas `TC` pack untuk laporan/backup
   - Regression: `TC-DATA-001`, `TC-REP-001`.

### Exit criteria (Sign-off P1)
- `TC-CMS-001` lulus untuk skenario Edge aktif.
- Local dev default tidak spam 404; ada message status yang jelas.
- Export laporan/backup stabil.

---

## Milestone P2 — Ekspansi StorePage + HR + Cloud sync maturity + Integrasi payment real
> Tujuan: modul per-toko (store) menjadi “operational hub”; HR (role/attendance/payroll) nyata; sinkron cloud matang; billing real siap produksi jika ditargetkan.

### Scope P2
- `StorePage` menu bukan placeholder; ada sub-modul nyata.
- HR minimal: role & permission, attendance, payroll.
- BLE printing UX lebih matang.
- Offline queue mencakup entity wajib (jika cloud sync ditargetkan).
- Checkout paket real (Midtrans/email) bila menjadi target produk.

### Work items (diambil dari backlog)
1. **GAP-STORE-001** — Per-store management v1
   - Tambah test suite: StorePage navigation & CRUD minimal.
2. **GAP-HR-001** — Role/permission matrix
   - Tambah test suite permissions (baru).
3. **GAP-HR-002** — Attendance general
   - Tambah test suite attendance (baru).
4. **GAP-HR-003** — Payroll
   - Tambah test suite payroll (baru).
5. **GAP-POS-PRINT-001** — BLE print UX hardening
   - Regression: `TC-POS-006`.
6. **GAP-SYNC-001** — Offline queue per entity (jika cloud sync target)
   - Regression: perluasan `TC-SYNC-001` + TC baru per entity.
7. **GAP-BILL-001** — Billing real (Midtrans/webhook/provision/email)
   - Regression: adaptasi `TC-BILL-001` ke flow real + test keamanan webhook.

### Exit criteria (Sign-off P2)
- StorePage v1 lengkap (menu mengarah ke modul fungsional).
- Permission minimal terpasang dan tervalidasi lewat test.
- HR attendance & payroll minimal berjalan untuk 1 store.
- Print BLE punya “test print” + fallback konsisten.
- Jika billing real dipilih: flow sandbox paid → provision → login berjalan aman.

---

## Regression Pack (minimal) per perubahan

### Jika menyentuh POS / transaksi
- `TC-POS-001..004`, `TC-REP-001`, `TC-SET-001`

### Jika menyentuh stok / produk / bahan
- `TC-PROD-001`, `TC-PROD-002`, `TC-INV-001..003`

### Jika menyentuh shift
- `TC-SHIFT-001..003`

### Jika menyentuh CMS
- `TC-CMS-001`

### Jika menyentuh sync
- `TC-SYNC-001`, `TC-SYNC-002`

