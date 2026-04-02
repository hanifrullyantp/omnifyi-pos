## Midtrans Setup (OMNIFYI POS)

Dokumen ini untuk memasang Midtrans untuk:
- **Checkout langganan** (bulanan + lifetime) via **Midtrans Snap**
- **Pembayaran POS QRIS** via **Midtrans Core API (charge qris)** dengan **konfirmasi otomatis** (webhook + polling)

### 1) Midtrans Dashboard (Sandbox dulu)
- **Ambil keys**:
  - **Server Key** (backend only)
  - **Client Key** (untuk Snap script di frontend, jika dipakai)
- **Set Payment Notification URL**:
  - `https://<domain>/api/billing/webhook`
- (Opsional) set redirect URL Snap untuk UX:
  - Finish/Unfinish/Error URL sesuai kebutuhan.

### 2) Vercel Environment Variables
Set di Vercel Project Settings → Environment Variables:

- **Midtrans**
  - `MIDTRANS_SERVER_KEY` = `<server_key>`
  - `MIDTRANS_IS_PROD` = `false` (sandbox) / `true` (production)

- **Supabase (server-side service role)**
  - `SUPABASE_URL` = `<supabase_url>`
  - `SUPABASE_SERVICE_ROLE_KEY` = `<service_role_key>`
  - `SUPABASE_ANON_KEY` hanya dibutuhkan untuk endpoint sync existing (`/api/sync/batch`)

Catatan:
- Jangan pernah expose `MIDTRANS_SERVER_KEY` atau `SUPABASE_SERVICE_ROLE_KEY` ke frontend.

### 3) Supabase migrations
Jalankan migrations termasuk:
- `supabase/migrations/20260331_000001_pos_schema_rls.sql`
- `supabase/migrations/20260401_000001_midtrans_billing_pos.sql`

### 4) Endpoint yang dipakai

#### Checkout langganan (Snap)
- `POST /api/billing/checkout`
  - body: `{ leadId, packageId, buyerName, buyerEmail, buyerPhone, amount, plan }`
  - `plan`: `MONTHLY` atau `LIFETIME`
  - response: `{ orderId, token, redirectUrl }`
- `POST /api/billing/webhook`
  - Midtrans akan memanggil endpoint ini.
  - Endpoint memverifikasi signature dan menyimpan event + update status ke Supabase.
- `GET /api/billing/status?orderId=...`
  - fallback polling status (optional).

#### POS QRIS
- `POST /api/pos/qris/create`
  - body: `{ businessId, tenantId, cashierId, invoiceNumber, grossAmount }`
  - response: `{ orderId, transactionId, qrUrl, qrString }`
- `GET /api/pos/qris/status?orderId=...`
  - response: `{ paid, transaction_status }`

### 5) Test checklist (Sandbox)

#### A) Checkout (MONTHLY + LIFETIME)
- Buka halaman checkout (yang memanggil `/api/billing/checkout`)
- Pastikan Snap muncul dan pembayaran sukses
- Pastikan `payment_orders` terisi (PENDING → PAID) via webhook
- Pastikan `subscriptions` terbuat:
  - MONTHLY: ada `valid_until`
  - LIFETIME: `valid_until` null

#### B) POS QRIS
- Di POS pilih metode `QRIS`
- Tekan “Selesaikan Pembayaran” → sistem membuat QR
- Scan QR dan selesaikan pembayaran
- Status di modal berubah menjadi “QRIS sudah dibayar”
- Tekan “Selesaikan Pembayaran” sekali lagi untuk menyimpan transaksi

### 6) Go-live (Production)
- Set `MIDTRANS_IS_PROD=true`
- Ganti `MIDTRANS_SERVER_KEY` ke production key
- Pastikan Payment Notification URL mengarah ke domain production
- Uji minimal 1 transaksi checkout + 1 transaksi QRIS di POS

