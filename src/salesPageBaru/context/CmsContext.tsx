import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CmsState {
  isAdmin: boolean;
  isLoggedIn: boolean;
  settings: {
    loginUrl: string;
    appUrlAfterLogin: string;
    primaryColor: string;
    secondaryColor: string;
    toastEnabled: boolean;
  };
  hero: {
    label: string;
    headline: string;
    subheadline: string;
    featuresStrip: string[];
    cta1: string;
    cta2: string;
    imageUrl: string;
  };
  problem: {
    headline: string;
    intro: string[];
    highlight: string;
    fears: string[];
  };
  problemDetails: {
    headline: string;
    points: string[];
  };
  solution: {
    headline: string;
    subheadline: string;
    benefits: string[];
  };
  transition: {
    headline: string;
  };
  features: {
    headline: string;
    items: { title: string; desc: string }[];
  };
  steps: {
    headline: string;
    subheadline: string;
    items: string[];
  };
  softCta: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  valueStack: {
    headline: string;
    items: string[];
  };
  urgency: {
    headline: string;
    reasons: string[];
  };
  trust: {
    headline: string;
    narative: string[];
    points: string[];
  };
  comparison: {
    headline: string;
    criteria: string[];
    manual: string[];
    basicPos: string[];
    omnifyi: string[];
  };
  productExplanation: {
    headline: string;
    points: string[];
  };
  demo: {
    headline: string;
    mediaUrl: string;
    isVideo: boolean;
  };
  finalPush: {
    headline: string;
    points: string[];
  };
  faq: {
    headline: string;
    items: { q: string; a: string }[];
  };
  finalCta: {
    headline: string;
    subheadline: string;
    cta1: string;
    cta2: string;
    cta3: string;
  };
  footer: {
    address: string;
    contact: string;
    hours: string;
    social: { platform: string; url: string }[];
    privacyUrl: string;
  };
}

const initialState: CmsState = {
  isAdmin: false,
  isLoggedIn: false,
  settings: {
    loginUrl: '#auth-login',
    appUrlAfterLogin: '/dashboard',
    primaryColor: '#10B981', // Emerald 500
    secondaryColor: '#0F766E', // Teal 600
    toastEnabled: true,
  },
  hero: {
    label: 'Aplikasi Kasir Gratis untuk UMKM',
    headline: 'Omzet meningkat 2x lipat, tanpa khawatir ditipu karyawan',
    subheadline: 'Usaha Jalan, Owner Bisa Jalan-Jalan',
    featuresStrip: ['Kasir On/Offline', 'Akuntansi', 'Aplikasi CRM', 'Dashboard Realtime', 'Karyawan', 'Inventori', 'Analisa Bisnis', 'Order Online', 'Business Plan'],
    cta1: 'Coba Gratis',
    cta2: 'Demo Aplikasi',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop', // Data dashboard placeholder
  },
  problem: {
    headline: 'Bayangkan...',
    intro: [
      'Usaha Anda mulai ramai.',
      'Transaksi jalan setiap hari.',
      'Karyawan sudah ada.',
      'Pelanggan terus datang.'
    ],
    highlight: '“Apakah uang hasil penjualan hari ini benar-benar aman?”',
    fears: [
      'Takut ada transaksi yang tidak tercatat',
      'Takut uang tidak sesuai dengan laporan',
      'Takut stok keluar tanpa jejak',
      'Takut karyawan tidak sepenuhnya amanah',
      'Takut profit bocor sedikit demi sedikit'
    ]
  },
  problemDetails: {
    headline: 'Masalahnya Bukan Sekadar Kasir. Masalahnya Adalah Kontrol',
    points: [
      'Owner hanya mengandalkan rasa percaya',
      'Angka penjualan sulit diverifikasi secara pasti',
      'Kas dan transaksi sulit dicocokkan',
      'Stok dan penjualan tidak sinkron',
      'Kesalahan atau kebocoran sulit dilacak',
      'Owner jadi tidak bisa benar-benar lepas dari usaha'
    ]
  },
  solution: {
    headline: 'Omnifyi Membantu Owner Mengontrol Usaha Tanpa Harus Selalu Mengawasi',
    subheadline: 'Bukan cuma aplikasi kasir, tetapi sistem yang membantu transaksi, karyawan, stok, laporan, dan data bisnis berjalan lebih rapi.',
    benefits: [
      'Semua transaksi tercatat secara otomatis dan aman',
      'Owner bisa memantau data secara realtime dari mana saja',
      'Kasir tetap beroperasi meski koneksi internet terputus (Offline Mode)',
      'Aktivitas operasional karyawan menjadi jauh lebih transparan',
      'Laporan keuangan dan kontrol bisnis menjadi lebih jelas',
      'Usaha Anda lebih siap tumbuh besar dengan fondasi sistem yang benar'
    ]
  },
  transition: {
    headline: 'Sekali Sistemnya Rapi, Bisnis Lebih Tenang Setiap Hari'
  },
  features: {
    headline: 'Fitur Unggulan Omnifyi',
    items: [
      { title: 'Mobile Friendly', desc: 'Dipakai di HP, tablet, laptop; ringan, tanpa instal, UI cepat.' },
      { title: 'Offline Ready', desc: 'Transaksi tetap jalan tanpa internet; otomatis sinkron saat online.' },
      { title: 'Realtime Dashboard', desc: 'Pantau omzet, transaksi, produk terlaris, dan tren kapan saja.' },
      { title: 'Kontrol Kas', desc: 'Minim selisih; semua transaksi terekam dan mudah dicocokkan dengan uang fisik.' },
      { title: 'Inventori', desc: 'Stok masuk-keluar tercatat; cegah kehabisan barang dan kehilangan stok.' },
      { title: 'Akses Role', desc: 'Owner dan kasir punya hak berbeda; keamanan meningkat, operasional tetap cepat.' },
      { title: 'PIN Kasir', desc: 'Login kasir pakai PIN; pergantian petugas cepat, aktivitas tetap tercatat.' },
      { title: 'Audit Trail', desc: 'Riwayat perubahan dan transaksi tersimpan; mudah telusuri sumber selisih atau kesalahan.' },
      { title: 'Shift', desc: 'Rekap per shift membantu kontrol kas, performa, dan disiplin operasional.' },
      { title: 'CRM', desc: 'Simpan data pelanggan dan riwayat belanja; dorong repeat order lebih mudah.' },
      { title: 'Akuntansi', desc: 'Catat pemasukan, pengeluaran, dan cashflow; tahu untung-rugi tanpa tebakan.' },
      { title: 'Laporan', desc: 'Laporan penjualan dan stok otomatis; filter harian, mingguan, bulanan.' },
      { title: 'Ekspor Data', desc: 'Export PDF atau Excel untuk arsip, pembukuan, dan kebutuhan administrasi.' },
      { title: 'Multi Outlet', desc: 'Kelola banyak cabang dalam satu akun; switching bisnis cepat.' },
      { title: 'PWA Install', desc: 'Pasang di home screen; akses lebih cepat seperti aplikasi.' },
      { title: 'Order Online', desc: 'Terima pesanan online; otomatis tercatat bersama transaksi kasir.' },
      { title: 'Business Insights', desc: 'Lihat produk terlaris dan jam ramai; optimalkan stok dan strategi promo.' },
      { title: 'Stok Alert', desc: 'Peringatan stok menipis membantu restock tepat waktu dan mencegah lost sales.' },
      { title: 'Integrasi API', desc: 'Siap dihubungkan payment, e-commerce, dan backend; mudah scale saat kebutuhan bertambah.' },
      { title: 'Keamanan Data', desc: 'Akses terkontrol dan sesi aman; kurangi risiko penyalahgunaan akun.' },
      { title: 'Onboarding Cepat', desc: 'Setup awal sederhana; tim bisa mulai transaksi dalam hitungan menit.' },
    ],
  },
  steps: {
    headline: 'Caranya Mudah',
    subheadline: 'Mulai Dalam 5 Langkah',
    items: [
      'Klik Coba Gratis',
      'Login atau buat akun usaha Anda',
      'Input daftar produk dan tim kasir',
      'Gunakan untuk mencatat transaksi harian',
      'Pantau perkembangan usaha dari dashboard Anda'
    ]
  },
  softCta: {
    headline: 'Mudah, Bukan?',
    subheadline: 'Biarkan Omnifyi membantu mencatat, mengontrol, dan merapikan usaha Anda tanpa repot.',
    cta: 'Coba Gratis Sekarang'
  },
  valueStack: {
    headline: 'Yang Anda Dapatkan Saat Menggunakan Omnifyi',
    items: [
      'Transaksi yang jauh lebih rapi dan tercatat',
      'Owner yang lebih tenang dan bisa fokus ke hal lain',
      'Kontrol karyawan yang lebih jelas dan transparan',
      'Laporan bisnis yang lebih cepat dan akurat',
      'Stok barang yang lebih tertata rapi',
      'Keputusan bisnis yang lebih berdasar pada data',
      'Usaha yang lebih siap untuk scale up dan buka cabang'
    ]
  },
  urgency: {
    headline: 'Semakin Lama Menunda, Semakin Besar Risiko Kebocoran yang Tidak Terlihat',
    reasons: [
      'Transaksi yang tidak tercatat bisa terus terjadi setiap hari',
      'Owner tetap harus memeriksa semuanya secara manual setiap tutup toko',
      'Kebocoran kecil yang dibiarkan lama-lama akan menjadi besar',
      'Usaha sulit berkembang dan stagnan jika semua masih diawasi manual oleh Anda'
    ]
  },
  trust: {
    headline: 'Dibuat untuk UMKM Indonesia, Bukan untuk Menambah Ribet',
    narative: [
      'Omnifyi dirancang khusus agar mudah dipakai oleh owner maupun tim operasional.',
      'Bahkan saat internet toko sedang tidak stabil, operasional kasir tetap bisa berjalan lancar tanpa kendala.'
    ],
    points: [
      'Sangat mudah dipakai',
      'Mobile-friendly (Bisa dari HP)',
      'Support Online & Offline',
      'Dashboard Realtime',
      'Sistem keamanan kontrol usaha yang canggih'
    ]
  },
  comparison: {
    headline: 'Kenapa Omnifyi Lebih Baik daripada Catatan Manual?',
    criteria: [
      'Transparansi Transaksi',
      'Kontrol Karyawan',
      'Laporan Keuangan',
      'Manajemen Stok',
      'Akses Owner',
      'Mode Operasional',
      'Insight Bisnis'
    ],
    manual: [
      'Sulit diverifikasi',
      'Hanya mengandalkan trust',
      'Sering terlambat & rawan salah',
      'Sering selisih',
      'Harus datang ke toko',
      'Offline saja',
      'Hanya feeling'
    ],
    basicPos: [
      'Cukup tercatat',
      'Ada PIN kasir',
      'Otomatis tapi basic',
      'Otomatis',
      'Bisa via web',
      'Harus selalu Online',
      'Grafik standar'
    ],
    omnifyi: [
      'Realtime & transparan',
      'Akses & Log aktivitas detail',
      'Otomatis & Komprehensif',
      'Sinkronasi otomatis & peringatan',
      'Kapan saja via aplikasi/web',
      'Seamless Online & Offline',
      'Analisa cerdas & prediktif'
    ]
  },
  productExplanation: {
    headline: 'Omnifyi — Bukan Sekadar Aplikasi Kasir, Tapi Sistem yang Membuat Owner Lebih Tenang',
    points: [
      'Owner tidak harus terus berdiri di belakang mesin kasir lagi',
      'Data penjualan dan stok jauh lebih jelas dan dapat dipertanggungjawabkan',
      'Tim operasional menjadi lebih tertib dan disiplin',
      'Usaha lebih siap tumbuh karena sistem sudah berjalan dengan baik',
      'Kontrol bisnis menjadi jauh lebih rapi tanpa menghambat laju operasional harian'
    ]
  },
  demo: {
    headline: 'Lihat Omnifyi Bekerja',
    mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
    isVideo: false
  },
  finalPush: {
    headline: 'Jangan Tunggu Sampai Kebocoran Menjadi Hal Biasa',
    points: [
      'Tanpa sistem yang kuat, Anda akan terus menerus mengawasi hal yang sama setiap hari.',
      'Kebocoran kecil yang tak terlihat bisa menggerus profit bulanan Anda secara diam-diam.',
      'Bisnis sangat sulit untuk tumbuh kalau owner tidak punya alat kontrol yang rapi dan terpercaya.'
    ]
  },
  faq: {
    headline: 'Pertanyaan yang Sering Diajukan',
    items: [
      { q: 'Apakah Omnifyi bisa dipakai saat offline?', a: 'Ya, Omnifyi dilengkapi fitur mode offline sehingga Anda tetap bisa melakukan transaksi meskipun koneksi internet terputus. Data akan otomatis disinkronkan saat koneksi kembali.' },
      { q: 'Apakah owner bisa memantau usaha dari jauh?', a: 'Tentu. Selama terhubung dengan internet, owner bisa memantau laporan penjualan, stok, dan aktivitas karyawan secara realtime melalui dashboard.' },
      { q: 'Apakah kasir bisa punya akses terbatas?', a: 'Ya, Anda bisa mengatur hak akses yang berbeda untuk setiap peran karyawan (kasir, supervisor, admin).' },
      { q: 'Apakah ada laporan dan dashboard realtime?', a: 'Omnifyi menyediakan dashboard komprehensif yang menampilkan data penjualan, profit, dan analitik bisnis Anda secara langsung saat itu juga.' },
      { q: 'Apakah cocok untuk UMKM kecil?', a: 'Sangat cocok. Omnifyi didesain agar user-friendly dan ramah digunakan untuk berbagai skala UMKM, dari kedai kopi hingga toko ritel.' },
      { q: 'Apakah bisa dipakai untuk lebih dari satu outlet?', a: 'Bisa. Sistem kami mendukung multi-outlet sehingga Anda bisa memantau semua cabang dari satu akun.' },
      { q: 'Apakah ada fitur CRM dan analisa bisnis?', a: 'Ya, kami memiliki fitur CRM dasar untuk mengelola loyalitas pelanggan dan analitik bisnis untuk melihat tren penjualan.' },
      { q: 'Bagaimana cara mulai menggunakan Omnifyi?', a: 'Anda cukup klik tombol "Coba Gratis", buat akun, masukkan beberapa data toko dan produk awal, lalu Anda siap berjualan.' }
    ]
  },
    finalCta: {
    headline: 'Rapikan Sistemnya. Tenangkan Ownernya. Tumbuhkan Usahanya.',
    subheadline: 'Mulai gunakan Omnifyi sekarang dan rasakan perbedaannya saat transaksi, tim, dan bisnis berjalan lebih rapi.',
    cta1: 'Coba Gratis',
    cta2: 'Demo Aplikasi',
    cta3: 'Hubungi Tim'
  },
  footer: {
    address: 'Gedung Menara Omnifyi, Jl. Sudirman No. 123, Jakarta, Indonesia',
    contact: 'halo@omnifyi.com | +62 811 1234 5678',
    hours: 'Senin - Jumat: 09:00 - 18:00 WIB',
    social: [
      { platform: 'Instagram', url: '#' },
      { platform: 'LinkedIn', url: '#' },
      { platform: 'Twitter', url: '#' }
    ],
    privacyUrl: '#'
  }
};

type CmsContextType = {
  data: CmsState;
  updateData: (path: string, value: any) => void;
  toggleAdmin: () => void;
  toggleLogin: () => void;
};

const CmsContext = createContext<CmsContextType | undefined>(undefined);

export const CmsProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<CmsState>(() => {
    const saved = localStorage.getItem('omnifyi_sales_landing_cms_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure isAdmin and isLoggedIn are always false on first load
        return { ...initialState, ...parsed, isAdmin: false, isLoggedIn: false };
      } catch (e) {
        return initialState;
      }
    }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem('omnifyi_sales_landing_cms_v1', JSON.stringify(data));
  }, [data]);

  const updateData = (path: string, value: any) => {
    setData((prev) => {
      const keys = path.split('.');
      const updateLevel = (obj: any, keyIndex: number): any => {
        if (keyIndex === keys.length) return value;
        const key = keys[keyIndex];
        if (Array.isArray(obj)) {
          const newArr = [...obj];
          newArr[Number(key)] = updateLevel(obj[Number(key)], keyIndex + 1);
          return newArr;
        } else {
          return {
            ...obj,
            [key]: updateLevel(obj[key], keyIndex + 1)
          };
        }
      };
      return updateLevel(prev, 0);
    });
  };

  const toggleAdmin = () => updateData('isAdmin', !data.isAdmin);
  const toggleLogin = () => updateData('isLoggedIn', !data.isLoggedIn);

  return (
    <CmsContext.Provider value={{ data, updateData, toggleAdmin, toggleLogin }}>
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) throw new Error('useCms must be used within a CmsProvider');
  return context;
};
