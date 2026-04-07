# Sales page (referensi desain)

Folder ini awalnya berisi mini-projek Vite terpisah (`Hero`, `Header`, `Problem`, `Sections`, `LeadFormPopup`, `CmsContext`, dll.).

**Catatan:** berkas `.tsx` / `.json` di sini pernah rusak (isi berupa byte nol). Implementasi landing **sales** yang dipakai aplikasi utama ada di:

- `src/components/salesLanding/` — komponen UI (header, hero, body, kartu login)
- `src/pages/LoginLandingPage.tsx` — logika: `loadLandingContent`, demo, Supabase login, `crmLeads`, Midtrans/checkout, reset demo

Untuk mengedit teks landing dari CMS/admin, tetap memakai alur `landingContent` + Landing Admin seperti sebelumnya.

Jika Anda memulihkan sumber asli dari backup, bisa membandingkan dengan `src/components/salesLanding/` dan menggabungkan perubahan secara manual.
