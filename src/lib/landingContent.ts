export type NotificationItem = { name: string; package: string };

export type LandingContent = {
  brandName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  heroImageUrl?: string;
  demoVideoUrl?: string;
  nav: { fitur: string; caraKerja: string; harga: string; faq: string; masuk: string; coba: string };
  hero: {
    preHeadline: string;
    headline1: string;
    headline2: string;
    sub1: string;
    sub2: string;
    sub3: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    badge: string;
    badgeSub: string;
  };
  painPoints: { label: string; title: string; cards: Array<{ emoji: string; title: string; desc: string }> };
  deeperPain: { title: string; items: Array<{ bold: string; rest: string }> };
  features: { title: string; subtitle: string; cards: Array<{ title: string; desc: string }> };
  pricing: {
    title: string;
    subtitle: string;
    monthlyPrice: string;
    lifetimePrice: string;
    monthlyFeatures: string[];
    lifetimeFeatures: string[];
  };
  faq: { title: string; subtitle: string; items: Array<{ q: string; a: string }> };
  finalCta: { title: string; subtitle: string; description: string; badge: string; button: string };
  notificationBanner: {
    enabled: boolean;
    items: NotificationItem[];
    minIntervalSec: number;
    maxIntervalSec: number;
    durationSec: number;
    soundUrl?: string;
  };
};

const STORAGE_KEY = 'omnifyi-landing-content-v1';

export const defaultLandingContent: LandingContent = {
  brandName: 'Omnifyi POS',
  tagline: 'Point of Sale untuk UMKM',
  nav: { fitur: 'Fitur', caraKerja: 'Cara Kerja', harga: 'Harga', faq: 'FAQ', masuk: 'Masuk', coba: 'Coba Gratis ->' },
  hero: {
    preHeadline: 'Untuk pemilik UMKM, warung, kedai, dan bisnis kecil di Indonesia',
    headline1: 'Masih Pakai Kalkulator',
    headline2: '& Buku Catatan untuk Jualan?',
    sub1: 'Kelola Penjualan, Stok &',
    sub2: 'Keuangan Usaha dalam',
    sub3: 'Satu Aplikasi Cerdas',
    description: 'Cukup tap layar -> Transaksi tercatat, Stok terupdate, Laporan keuangan siap. Tanpa ribet, tanpa mahal.',
    ctaPrimary: 'Coba Gratis Sekarang ->',
    ctaSecondary: '▶ Lihat Demo',
    badge: 'Beli 1x, Pakai Selamanya',
    badgeSub: '✓ Bisa dipakai offline · ✓ PWA untuk semua device',
  },
  painPoints: {
    label: 'Masalah Umum UMKM',
    title: 'MUNGKIN ANDA MENGALAMI INI',
    cards: [
      { emoji: '😫', title: 'Hitung Manual Terus', desc: 'Tiap transaksi masih dihitung manual pakai kalkulator.' },
      { emoji: '📝', title: 'Catatan Berantakan', desc: 'Masih pakai buku catatan dan nota kertas.' },
      { emoji: '🤷', title: 'Omzet Besar, Profit Hilang', desc: 'Omzet banyak, tapi untung tidak terasa.' },
      { emoji: '😵', title: 'Gak Paham HPP & Margin', desc: 'Tidak tahu harga pokok dan margin sebenarnya.' },
    ],
  },
  deeperPain: {
    title: 'ATAU ANDA JUGA MENGALAMI HAL INI?',
    items: [
      { bold: '"Kok uangnya segini doang?"', rest: ' padahal rasanya rame banget.' },
      { bold: 'Stok sering kehabisan tanpa disadari.', rest: ' Pelanggan datang, barang kosong.' },
      { bold: 'Kasir gak terkontrol dan gak tercatat.', rest: ' Semua berbasis kepercayaan doang.' },
      { bold: 'Mau bikin laporan keuangan tapi gak tau caranya.', rest: ' Akhirnya ngandelin feeling.' },
    ],
  },
  features: {
    title: 'FITUR-FITUR UTAMA OMNIFYI POS',
    subtitle: 'Semua yang dibutuhkan UMKM, dalam satu aplikasi',
    cards: [
      { title: 'Kasir / POS', desc: 'Transaksi cepat, intuitif, dan support cetak struk.' },
      { title: 'Produk & Stok', desc: 'Kelola produk dan alert stok menipis otomatis.' },
      { title: 'Bahan Baku & HPP', desc: 'HPP, margin, dan profit dihitung otomatis.' },
      { title: 'Dashboard Realtime', desc: 'Omzet, transaksi, laba, stok dalam satu layar.' },
    ],
  },
  pricing: {
    title: 'PILIH PAKET INVESTASI ANDA',
    subtitle: 'Mulai kelola usaha dengan cerdas hari ini.',
    monthlyPrice: 'Rp 79.000',
    lifetimePrice: 'Rp 349.000',
    monthlyFeatures: ['Akses semua fitur 1 bulan', 'Unlimited transaksi', 'Dashboard & laporan'],
    lifetimeFeatures: ['Akses seumur hidup', 'Semua fitur premium', 'Update gratis selamanya'],
  },
  faq: {
    title: 'PERTANYAAN YANG SERING DITANYAKAN',
    subtitle: 'Beberapa hal yang paling sering ditanyain calon pengguna.',
    items: [
      { q: 'Apakah data usaha saya aman?', a: 'Ya, data tersimpan aman dan terenkripsi.' },
      { q: 'Apakah bisa dipakai offline?', a: 'Bisa, data tersinkron otomatis saat online kembali.' },
    ],
  },
  finalCta: {
    title: 'Anda sudah bekerja keras membangun usaha.',
    subtitle: 'Biarkan Omnifyi POS membantu Anda mengelola, memahami, dan mengembangkannya.',
    description: 'Dari kasir cepat, stok terpantau, sampai laporan keuangan siap pakai.',
    badge: 'Beli 1x, Pakai Selamanya',
    button: 'Mulai Sekarang ->',
  },
  notificationBanner: {
    enabled: true,
    items: [{ name: 'Hanif', package: 'paket 1 bulan' }],
    minIntervalSec: 8,
    maxIntervalSec: 18,
    durationSec: 4,
  },
};

export async function loadLandingContent(): Promise<LandingContent> {
  const edgeUrl = import.meta.env.VITE_CONTENT_EDGE_URL as string | undefined;
  const adminSecret = import.meta.env.VITE_CONTENT_ADMIN_SECRET as string | undefined;
  try {
    if (edgeUrl) {
      const res = await fetch(`${edgeUrl}?action=get`, {
        headers: adminSecret ? { 'x-admin-secret': adminSecret } : undefined,
      });
      if (res.ok) {
        const json = (await res.json()) as LandingContent;
        return { ...defaultLandingContent, ...json };
      }
    }
  } catch {}
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (!local) return defaultLandingContent;
    return { ...defaultLandingContent, ...(JSON.parse(local) as LandingContent) };
  } catch {
    return defaultLandingContent;
  }
}

export async function saveLandingContent(payload: LandingContent): Promise<void> {
  const edgeUrl = import.meta.env.VITE_CONTENT_EDGE_URL as string | undefined;
  const adminSecret = import.meta.env.VITE_CONTENT_ADMIN_SECRET as string | undefined;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (!edgeUrl) return;
  const res = await fetch(`${edgeUrl}?action=save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(adminSecret ? { 'x-admin-secret': adminSecret } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('failed to save content');
}

export async function uploadAsset(file: File): Promise<string> {
  const edgeUrl = import.meta.env.VITE_CONTENT_EDGE_URL as string | undefined;
  const adminSecret = import.meta.env.VITE_CONTENT_ADMIN_SECRET as string | undefined;
  if (!edgeUrl) {
    return URL.createObjectURL(file);
  }
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${edgeUrl}?action=upload`, {
    method: 'POST',
    headers: adminSecret ? { 'x-admin-secret': adminSecret } : undefined,
    body: fd,
  });
  if (!res.ok) throw new Error('failed to upload asset');
  const json = (await res.json()) as { publicUrl: string };
  return json.publicUrl;
}

