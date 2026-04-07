import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import {
  db,
  seedInitialData,
  seedDemoWorkspace,
  DEMO_OWNER_EMAIL,
  resetDemoData,
} from '../lib/db';
import { useAuthStore } from '../lib/store';
import { checkMidtransPaid, runLocalBillingFlow, startMidtransCheckout } from '../lib/billingFlow';
import MarketingLayout from '../app/(marketing)/layout';
import { defaultLandingContent, loadLandingContent, type LandingContent } from '../lib/landingContent';
import { supabase } from '../lib/supabaseClient';
import { ensureLocalCoreRows, provisionTenantAndBusiness } from '../lib/cloudProvision';
import { SalesLandingBody, SalesLandingHeader, SalesLandingHero, SalesLoginCard } from '../components/salesLanding';

export default function LoginLandingPage() {
  const { setAuth } = useAuthStore();
  const [demoOpen, setDemoOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [email, setEmail] = useState('owner@example.com');
  const [password, setPassword] = useState('password');
  const [demoName, setDemoName] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoAddress, setDemoAddress] = useState('');
  const [demoBusinessType, setDemoBusinessType] = useState('');
  const [demoBusinessName, setDemoBusinessName] = useState('');
  const [superAdminChoiceOpen, setSuperAdminChoiceOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutLeadId, setCheckoutLeadId] = useState('');
  const [checkoutOrderId, setCheckoutOrderId] = useState('');
  const [checkoutRedirectUrl, setCheckoutRedirectUrl] = useState('');
  const [status, setStatus] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [content, setContent] = useState<LandingContent>(defaultLandingContent);
  const [socialText, setSocialText] = useState('');
  const [socialVisible, setSocialVisible] = useState(false);

  const midtransEnabled = (import.meta.env.VITE_MIDTRANS_ENABLED as string | undefined) === 'true';

  const minMs = useMemo(() => Math.max(1000, content.notificationBanner.minIntervalSec * 1000), [content.notificationBanner.minIntervalSec]);
  const maxMs = useMemo(() => Math.max(minMs, content.notificationBanner.maxIntervalSec * 1000), [content.notificationBanner.maxIntervalSec, minMs]);

  const featureHighlights = useMemo(() => content.features.cards.slice(0, 3), [content.features.cards]);

  useEffect(() => {
    void loadLandingContent().then((c) => setContent(c));
  }, []);

  useEffect(() => {
    if (content.faviconUrl) {
      let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = content.faviconUrl;
    }
  }, [content.faviconUrl]);

  useEffect(() => {
    if (!content.notificationBanner.enabled || content.notificationBanner.items.length === 0) return;
    let timeoutId: number | undefined;
    const loop = () => {
      const waitMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
      timeoutId = window.setTimeout(() => {
        const pick = content.notificationBanner.items[Math.floor(Math.random() * content.notificationBanner.items.length)];
        setSocialText(`${pick.name} baru saja memesan ${pick.package} ${content.brandName}`);
        setSocialVisible(true);
        if (content.notificationBanner.soundUrl) {
          const audio = new Audio(content.notificationBanner.soundUrl);
          void audio.play().catch(() => {});
        }
        window.setTimeout(() => {
          setSocialVisible(false);
          loop();
        }, Math.max(1000, content.notificationBanner.durationSec * 1000));
      }, waitMs);
    };
    loop();
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [content, maxMs, minMs]);

  const loginOwner = async () => {
    await seedInitialData();
    const emailNorm = email.trim().toLowerCase();
    const passInput = password.trim();

    if (emailNorm === DEMO_OWNER_EMAIL) {
      await seedDemoWorkspace();
      const user = await db.users.where('email').equals(emailNorm).first();
      if (!user) return setStatus('Akun demo tidak ditemukan');
      if (passInput !== user.passwordHash) return setStatus('Password salah');
      const tenant = await db.tenants.where('ownerId').equals(user.id!).first();
      const businesses = tenant?.id ? await db.businesses.where('tenantId').equals(tenant.id).toArray() : [];
      if (!tenant || businesses.length === 0) return setStatus('Usaha demo tidak ditemukan');
      setAuth(user, tenant, businesses[0], businesses);
    } else {
      if (!supabase) return setStatus('Supabase env belum diset. Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di .env.local lalu restart dev server.');
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailNorm, password: passInput });
      if (error || !data.user) return setStatus('Email atau password salah');
      const { tenantId, businessId } = await provisionTenantAndBusiness({ businessName: 'Usaha Baru' });
      const { user, tenant, business } = await ensureLocalCoreRows({
        userId: data.user.id,
        email: emailNorm,
        tenantId,
        businessId,
        businessName: 'Usaha Baru',
      });
      setAuth(user, tenant, business, [business]);
    }
    setStatus('');
  };

  const loginDemoOwner = async () => {
    await seedInitialData();
    await seedDemoWorkspace();
    const user = await db.users.where('email').equals('owner@example.com').first();
    if (!user) return setStatus('Akun demo tidak ditemukan');
    const tenant = await db.tenants.where('ownerId').equals(user.id!).first();
    if (!tenant) return setStatus('Tenant demo tidak ditemukan');
    const businesses = await db.businesses.where('tenantId').equals(tenant.id!).toArray();
    if (businesses.length === 0) return setStatus('Bisnis demo tidak ditemukan');
    setAuth(user, tenant, businesses[0], businesses);
  };

  const validPhone = (v: string) => /^(\+?62|0)8[0-9]{7,13}$/.test(v.replace(/\s+/g, ''));
  const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const submitDemoForm = async () => {
    if (!demoName.trim() || !demoPhone.trim() || !demoEmail.trim() || !demoAddress.trim() || !demoBusinessType.trim() || !demoBusinessName.trim()) {
      setStatus('Lengkapi semua form demo dulu ya.');
      return;
    }
    if (!validPhone(demoPhone)) {
      setStatus('Nomor HP belum valid. Gunakan format Indonesia (08xx atau +62xx).');
      return;
    }
    if (!validEmail(demoEmail)) {
      setStatus('Email belum valid.');
      return;
    }
    await db.crmLeads.add({
      id: crypto.randomUUID(),
      fullName: demoName.trim(),
      email: demoEmail.trim(),
      phone: demoPhone.trim(),
      businessType: demoBusinessType.trim(),
      source: 'LANDING_DEMO',
      stage: 'DEMO',
      notes: `Alamat: ${demoAddress.trim()} | Nama usaha: ${demoBusinessName.trim()}`,
      createdAt: new Date(),
    });
    setDemoOpen(false);
    setStatus('Form demo tersimpan. Membuka demo sekarang...');
    await loginDemoOwner();
  };

  const checkout = async (plan: 'starter' | 'growth' | 'pro') => {
    setCheckoutOpen(true);
    if (!checkoutName || !checkoutPhone || !checkoutEmail) return;
    const leadId = crypto.randomUUID();
    const amount = plan === 'starter' ? 79000 : plan === 'growth' ? 149000 : 349000;
    await db.crmLeads.add({
      id: leadId,
      fullName: checkoutName,
      email: checkoutEmail,
      phone: checkoutPhone,
      businessType: 'UMKM',
      source: 'LANDING_CHECKOUT',
      stage: 'CHECKOUT',
      amount,
      createdAt: new Date(),
    });
    setCheckoutLeadId(leadId);

    if (midtransEnabled) {
      setStatus('Membuat invoice Midtrans…');
      const r = await startMidtransCheckout({
        leadId,
        packageId: plan,
        buyerName: checkoutName.trim(),
        buyerEmail: checkoutEmail.trim(),
        buyerPhone: checkoutPhone.trim(),
        amount,
      });
      setCheckoutOrderId(r.orderId);
      setCheckoutRedirectUrl(r.redirectUrl);
      await db.crmLeads.update(leadId, { orderId: r.orderId, updatedAt: new Date() });
      window.open(r.redirectUrl, '_blank', 'noopener,noreferrer');
      setStatus('Silakan selesaikan pembayaran di Midtrans, lalu klik “Saya sudah bayar”.');
      return;
    }

    const orderId = `OMN-${Date.now()}`;
    await db.crmLeads.update(leadId, { orderId, updatedAt: new Date() });
    setStatus('Checkout dibuat. Menunggu pembayaran...');
    const auth = await runLocalBillingFlow({
      leadId,
      orderId,
      packageId: plan,
      buyerName: checkoutName,
      buyerEmail: checkoutEmail.trim(),
    });
    setStatus(`Akun usaha kosong siap dipakai. Login dengan email ${checkoutEmail.trim()} dan password sementara: ${auth.tempPassword}`);
  };

  const confirmPaid = async () => {
    if (!midtransEnabled) return;
    if (!checkoutOrderId || !checkoutLeadId) return;
    setStatus('Mengecek status pembayaran…');
    const s = await checkMidtransPaid(checkoutOrderId);
    if (!s.paid) {
      setStatus(`Belum terdeteksi lunas (status: ${s.transaction_status ?? 'unknown'}). Coba lagi sebentar.`);
      return;
    }
    const auth = await runLocalBillingFlow({
      leadId: checkoutLeadId,
      orderId: checkoutOrderId,
      packageId: 'pro',
      buyerName: checkoutName,
      buyerEmail: checkoutEmail.trim(),
    });
    setStatus(`Pembayaran terverifikasi. Login dengan email ${checkoutEmail.trim()} dan password sementara: ${auth.tempPassword}`);
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset seluruh data lokal ke data demo? Tindakan ini menghapus data POS di perangkat ini.')) return;
    setResetBusy(true);
    setStatus('');
    try {
      await resetDemoData();
      setEmail('owner@example.com');
      setPassword('password');
      setStatus('Data demo telah dipulihkan. Silakan masuk dengan akun demo.');
    } catch {
      setStatus('Gagal mereset demo. Coba lagi.');
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <MarketingLayout>
      <SalesLandingHeader content={content} onCoba={() => setDemoOpen(true)} />
      <SalesLandingHero
        content={content}
        featureHighlights={featureHighlights}
        onCoba={() => setDemoOpen(true)}
        loginPanel={
          <SalesLoginCard
            email={email}
            password={password}
            status={status}
            resetBusy={resetBusy}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onLogin={() => void loginOwner()}
            onResetDemo={() => void handleResetDemo()}
            onOpenCheckout={() => setCheckoutOpen(true)}
          />
        }
      />
      <SalesLandingBody
        content={content}
        onCheckout={(plan) => void checkout(plan)}
        onOpenCheckout={() => setCheckoutOpen(true)}
      />

      {socialVisible && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] rounded-xl border border-teal-500/30 bg-[#0F172A]/95 px-4 py-3 text-sm text-teal-200 shadow-lg shadow-teal-500/15 animate-fade-in-up">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            {socialText}
          </span>
        </div>
      )}

      {superAdminChoiceOpen && (
        <div className="fixed inset-0 z-[73] bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-teal-500/30 bg-[#0F172A] p-5">
            <h4 className="text-white font-bold text-lg">Super Admin Terdeteksi</h4>
            <p className="text-sm text-gray-400 mt-1">Pilih tujuan masuk:</p>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <a href="/admin" className="w-full py-3 text-center rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold">
                Masuk Admin LP
              </a>
              <a href="/dashboard" className="w-full py-3 text-center rounded-xl border border-white/20 text-white">
                Masuk Aplikasi
              </a>
              <button type="button" onClick={() => setSuperAdminChoiceOpen(false)} className="w-full py-2 text-sm text-gray-400">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {demoOpen && (
        <div className="fixed inset-0 z-[72] bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-teal-500/30 bg-gradient-to-b from-[#0F172A] to-[#111827] p-5 shadow-xl shadow-teal-500/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-lg">Form Demo Aplikasi Omnifyi POS</h4>
                <p className="text-xs text-gray-400 mt-0.5">Isi data dulu, lalu klik &quot;Buka Demo Sekarang&quot;.</p>
              </div>
              <button type="button" onClick={() => setDemoOpen(false)} aria-label="Tutup">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={demoName} onChange={(e) => setDemoName(e.target.value)} placeholder="Nama lengkap" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={demoPhone} onChange={(e) => setDemoPhone(e.target.value)} placeholder="No HP aktif" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={demoEmail} onChange={(e) => setDemoEmail(e.target.value)} placeholder="Email aktif" className="sm:col-span-2 px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={demoBusinessName} onChange={(e) => setDemoBusinessName(e.target.value)} placeholder="Nama usaha" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={demoBusinessType} onChange={(e) => setDemoBusinessType(e.target.value)} placeholder="Jenis usaha" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={demoAddress} onChange={(e) => setDemoAddress(e.target.value)} placeholder="Alamat usaha" className="sm:col-span-2 px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
            </div>
            <button type="button" onClick={() => void submitDemoForm()} className="mt-4 w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold">
              Buka Demo Sekarang
            </button>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[70] bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0F172A] p-5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white">Checkout Omnifyi POS</h4>
              <button type="button" onClick={() => setCheckoutOpen(false)} aria-label="Tutup">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} placeholder="Nama" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={checkoutPhone} onChange={(e) => setCheckoutPhone(e.target.value)} placeholder="No HP" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={checkoutEmail} onChange={(e) => setCheckoutEmail(e.target.value)} placeholder="Email" className="sm:col-span-2 px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button type="button" onClick={() => void checkout('starter')} className="py-2 rounded-lg border border-white/20 text-white">
                Bulanan
              </button>
              <button type="button" onClick={() => void checkout('growth')} className="py-2 rounded-lg border border-white/20 text-white">
                Growth
              </button>
              <button type="button" onClick={() => void checkout('pro')} className="py-2 rounded-lg bg-teal-500 text-white font-semibold">
                Lifetime
              </button>
            </div>
            {midtransEnabled && checkoutRedirectUrl && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a href={checkoutRedirectUrl} target="_blank" rel="noreferrer" className="py-2 rounded-lg border border-white/20 text-white text-center">
                  Buka pembayaran
                </a>
                <button type="button" onClick={() => void confirmPaid()} className="py-2 rounded-lg bg-blue-600 text-white font-semibold">
                  Saya sudah bayar
                </button>
              </div>
            )}
            {!!status && <p className="mt-3 text-sm text-teal-300">{status}</p>}
          </div>
        </div>
      )}
    </MarketingLayout>
  );
}
