# Sales landing (`sales page baru`)

Salinan modul dari folder `sales page baru/` di root repo, diintegrasikan ke **Omnifyi POS**.

- **`SalesBaruPageContent.tsx`** — merakit Header, Hero, semua section, Footer, AdminToolbar, NotificationToast.
- **`context/CmsContext.tsx`** — konten editable + `localStorage` key `omnifyi_sales_landing_cms_v1`.
- **`context/LandingIntegrationContext.tsx`** — jembatan ke app: simpan lead ke Dexie, buka modal checkout.
- **`LoginLandingPage`** (`src/pages/LoginLandingPage.tsx`) membungkus dengan `CmsProvider` + `LandingIntegrationProvider` dan menaruh **`SalesLoginCard`** di slot `Hero` (`#auth-login`).

Untuk menyalin ulang dari sumber asli: overwrite `components/` dan `context/CmsContext.tsx` dari `sales page baru/src`, lalu sesuaikan lagi patch di `Header.tsx`, `Hero.tsx`, `LeadFormPopup.tsx`, `Sections2.tsx` (footer + Final CTA), dan `EditableElements` (`cn` dari `src/utils/cn`).
