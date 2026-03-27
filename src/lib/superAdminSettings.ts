export type SuperAdminSettings = {
  brandName: string;
  brandLogoDataUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  primaryCtaText?: string;
  landingUrl?: string;
  faviconUrl?: string;
  thumbnailUrl?: string;
  facebookPixelId?: string;
  supportWhatsapp?: string;
  maintenanceMode: boolean;
};

export const SUPER_ADMIN_SETTINGS_KEY = 'omnifyi-super-admin-settings-v1';

const defaultSettings: SuperAdminSettings = {
  brandName: 'OMNIFYI POS',
  heroTitle: 'Omnifyi POS untuk bisnis modern',
  heroSubtitle: 'Kasir, stok, laporan, dan keuangan dalam satu tempat.',
  primaryCtaText: 'Mulai Demo',
  landingUrl: 'https://pos.omnifyi.com',
  maintenanceMode: false,
};

export function loadSuperAdminSettings(): SuperAdminSettings {
  try {
    const raw = localStorage.getItem(SUPER_ADMIN_SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as SuperAdminSettings;
    return {
      ...defaultSettings,
      ...parsed,
      brandName: parsed.brandName || defaultSettings.brandName,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSuperAdminSettings(payload: SuperAdminSettings) {
  localStorage.setItem(SUPER_ADMIN_SETTINGS_KEY, JSON.stringify(payload));
}

