import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { db, seedInitialData, seedDemoWorkspace, DEMO_OWNER_EMAIL } from '../../lib/db';
import { useAuthStore } from '../../lib/store';
import { checkMidtransPaid, runLocalBillingFlow, startMidtransCheckout } from '../../lib/billingFlow';
import MarketingLayout from './layout';
import { defaultLandingContent, loadLandingContent, type LandingContent } from '../../lib/landingContent';
import { supabase } from '../../lib/supabaseClient';
import { ensureLocalCoreRows, provisionTenantAndBusiness } from '../../lib/cloudProvision';

export default function MarketingPage() {
  const { setAuth } = useAuthStore();
  const [loginOpen, setLoginOpen] = useState(false);
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
  const [content, setContent] = useState<LandingContent>(defaultLandingContent);
  const [socialText, setSocialText] = useState('');
  const [socialVisible, setSocialVisible] = useState(false);

  const midtransEnabled = (import.meta.env.VITE_MIDTRANS_ENABLED as string | undefined) === 'true';

  const minMs = useMemo(() => Math.max(1000, content.notificationBanner.minIntervalSec * 1000), [content.notificationBanner.minIntervalSec]);
  const maxMs = useMemo(() => Math.max(minMs, content.notificationBanner.maxIntervalSec * 1000), [content.notificationBanner.maxIntervalSec, minMs]);

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
    setLoginOpen(false);
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

  return (
    <MarketingLayout>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {content.logoUrl ? <img src={content.logoUrl} className="w-7 h-7 rounded-lg object-cover" /> : <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />}
            <p className="font-bold text-white">{content.brandName}</p>
          </div>
          <nav className="hidden md:flex gap-6 text-sm text-gray-400">
            <a href="#fitur" className="hover:text-white">{content.nav.fitur}</a>
            <a href="#cara-kerja" className="hover:text-white">{content.nav.caraKerja}</a>
            <a href="#harga" className="hover:text-white">{content.nav.harga}</a>
            <a href="#faq" className="hover:text-white">{content.nav.faq}</a>
          </nav>
          <div className="flex gap-2">
            <button onClick={() => setLoginOpen(true)} className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm">{content.nav.masuk}</button>
            <button onClick={() => setDemoOpen(true)} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold">{content.nav.coba}</button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 py-14 md:py-20 text-center">
        <p className="text-emerald-400 text-sm">{content.hero.preHeadline}</p>
        <h1 className="mt-4 text-4xl md:text-6xl font-bold text-white leading-tight">{content.hero.headline1}<br />{content.hero.headline2}</h1>
        <h2 className="mt-4 text-2xl md:text-4xl font-bold text-emerald-400 leading-tight">{content.hero.sub1}<br />{content.hero.sub2}<br />{content.hero.sub3}</h2>
        <p className="mt-5 text-base md:text-lg text-gray-400 max-w-2xl mx-auto">{content.hero.description}</p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => setDemoOpen(true)} className="px-8 py-4 rounded-xl text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white">{content.hero.ctaPrimary}</button>
          <button onClick={() => setLoginOpen(true)} className="px-6 py-4 rounded-xl border border-white/20 text-white">{content.hero.ctaSecondary}</button>
        </div>
        <p className="mt-4 text-sm text-emerald-400">{content.hero.badge}</p>
        <p className="text-xs text-gray-500">{content.hero.badgeSub}</p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          {content.heroImageUrl ? <img src={content.heroImageUrl} className="w-full h-64 md:h-80 object-cover rounded-xl" /> : <div className="h-64 md:h-80 rounded-xl bg-slate-800 flex items-center justify-center text-gray-400">Dashboard Preview</div>}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-14">
        <p className="text-emerald-400 text-sm text-center">{content.painPoints.label}</p>
        <h3 className="text-3xl md:text-4xl font-bold text-white text-center mt-2">{content.painPoints.title}</h3>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {content.painPoints.cards.map((c) => <div key={c.title} className="rounded-xl p-6 border border-white/[0.06] bg-white/[0.03]"><p className="text-4xl mb-3">{c.emoji}</p><p className="text-white font-semibold">{c.title}</p><p className="text-sm text-gray-400 mt-1">{c.desc}</p></div>)}
        </div>
      </section>

      <section className="bg-[#111827]">
        <div className="max-w-4xl mx-auto px-5 py-14">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center">{content.deeperPain.title}</h3>
          <div className="mt-8 space-y-4">{content.deeperPain.items.map((i) => <p key={i.bold} className="text-gray-300"><span className="font-semibold text-white">{i.bold}</span>{i.rest}</p>)}</div>
        </div>
      </section>

      <section id="fitur" className="max-w-6xl mx-auto px-5 py-14">
        <h3 className="text-3xl md:text-4xl font-bold text-white text-center">{content.features.title}</h3>
        <p className="text-gray-400 text-center mt-2">{content.features.subtitle}</p>
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">{content.features.cards.map((f) => <div key={f.title} className="rounded-xl p-5 bg-white/[0.03] border border-white/[0.06]"><p className="text-white font-semibold">{f.title}</p><p className="text-sm text-gray-400 mt-1">{f.desc}</p></div>)}</div>
      </section>

      <section id="harga" className="bg-[#111827]">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <h3 className="text-3xl md:text-4xl font-bold text-white text-center">{content.pricing.title}</h3>
          <p className="text-gray-400 text-center mt-2">{content.pricing.subtitle}</p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.03]"><p className="text-white text-3xl font-bold">{content.pricing.monthlyPrice}</p><ul className="mt-4 space-y-1 text-sm text-gray-300">{content.pricing.monthlyFeatures.map((x) => <li key={x}>✓ {x}</li>)}</ul><button onClick={() => void checkout('starter')} className="mt-4 w-full py-2.5 border border-white/20 rounded-xl">Pilih Paket</button></div>
            <div className="rounded-2xl p-6 border border-emerald-500/40 bg-emerald-500/[0.08]"><p className="text-white text-3xl font-bold">{content.pricing.lifetimePrice}</p><ul className="mt-4 space-y-1 text-sm text-gray-200">{content.pricing.lifetimeFeatures.map((x) => <li key={x}>✓ {x}</li>)}</ul><button onClick={() => void checkout('pro')} className="mt-4 w-full py-2.5 bg-emerald-500 rounded-xl">Pilih Paket Lifetime</button></div>
          </div>
        </div>
      </section>

      <section id="faq" className="max-w-4xl mx-auto px-5 py-14">
        <h3 className="text-3xl md:text-4xl font-bold text-white text-center">{content.faq.title}</h3>
        <p className="text-gray-400 text-center mt-2">{content.faq.subtitle}</p>
        <div className="mt-8 space-y-3">{content.faq.items.map((it) => <div key={it.q} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4"><p className="text-white font-medium">{it.q}</p><p className="text-sm text-gray-400 mt-1">{it.a}</p></div>)}</div>
      </section>

      <section className="px-5 py-14">
        <div className="max-w-5xl mx-auto rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white">{content.finalCta.title}</h3>
          <p className="mt-3 text-lg text-gray-300">{content.finalCta.subtitle}</p>
          <p className="mt-3 text-base text-gray-400">{content.finalCta.description}</p>
          <p className="mt-4 text-lg text-emerald-400 font-semibold">{content.finalCta.badge}</p>
          <button onClick={() => setCheckoutOpen(true)} className="mt-6 px-10 py-4 rounded-xl text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white">{content.finalCta.button}</button>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-5 py-10 text-center text-gray-500">
        © 2025 {content.brandName}. {content.tagline}
      </footer>

      {socialVisible && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] rounded-xl border border-emerald-500/30 bg-[#0F172A]/95 px-4 py-3 text-sm text-emerald-200 shadow-lg shadow-emerald-500/20 animate-fade-in-up">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {socialText}
          </span>
        </div>
      )}

      {loginOpen && (
        <div className="fixed inset-0 z-[70] bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0F172A] p-5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white">Masuk Omnifyi POS</h4>
              <button onClick={() => setLoginOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="mt-4 space-y-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
            </div>
            <button onClick={() => void loginOwner()} className="mt-4 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">Masuk</button>
          </div>
        </div>
      )}

      {superAdminChoiceOpen && (
        <div className="fixed inset-0 z-[73] bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-[#0F172A] p-5">
            <h4 className="text-white font-bold text-lg">Super Admin Terdeteksi</h4>
            <p className="text-sm text-gray-400 mt-1">Pilih tujuan masuk:</p>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <a
                href="/admin"
                className="w-full py-3 text-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              >
                Masuk Admin LP
              </a>
              <a
                href="/dashboard"
                className="w-full py-3 text-center rounded-xl border border-white/20 text-white"
              >
                Masuk Aplikasi
              </a>
              <button
                onClick={() => setSuperAdminChoiceOpen(false)}
                className="w-full py-2 text-sm text-gray-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {demoOpen && (
        <div className="fixed inset-0 z-[72] bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#0F172A] to-[#111827] p-5 shadow-xl shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-lg">Form Demo Aplikasi Omnifyi POS</h4>
                <p className="text-xs text-gray-400 mt-0.5">Isi data dulu, lalu klik "Buka Demo Sekarang".</p>
              </div>
              <button onClick={() => setDemoOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={demoName} onChange={(e) => setDemoName(e.target.value)} placeholder="Nama lengkap" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={demoPhone} onChange={(e) => setDemoPhone(e.target.value)} placeholder="No HP aktif" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={demoEmail} onChange={(e) => setDemoEmail(e.target.value)} placeholder="Email aktif" className="sm:col-span-2 px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={demoBusinessName} onChange={(e) => setDemoBusinessName(e.target.value)} placeholder="Nama usaha" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={demoBusinessType} onChange={(e) => setDemoBusinessType(e.target.value)} placeholder="Jenis usaha" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={demoAddress} onChange={(e) => setDemoAddress(e.target.value)} placeholder="Alamat usaha" className="sm:col-span-2 px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
            </div>
            <button
              onClick={() => void submitDemoForm()}
              className="mt-4 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
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
              <button onClick={() => setCheckoutOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} placeholder="Nama" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={checkoutPhone} onChange={(e) => setCheckoutPhone(e.target.value)} placeholder="No HP" className="px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
              <input value={checkoutEmail} onChange={(e) => setCheckoutEmail(e.target.value)} placeholder="Email" className="sm:col-span-2 px-3 py-2 rounded-xl bg-black/25 border border-white/15 text-white" />
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button onClick={() => void checkout('starter')} className="py-2 rounded-lg border border-white/20 text-white">Bulanan</button>
              <button onClick={() => void checkout('growth')} className="py-2 rounded-lg border border-white/20 text-white">Growth</button>
              <button onClick={() => void checkout('pro')} className="py-2 rounded-lg bg-emerald-500 text-white font-semibold">Lifetime</button>
            </div>
            {midtransEnabled && checkoutRedirectUrl && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={checkoutRedirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 rounded-lg border border-white/20 text-white text-center"
                >
                  Buka pembayaran
                </a>
                <button onClick={() => void confirmPaid()} className="py-2 rounded-lg bg-blue-600 text-white font-semibold">
                  Saya sudah bayar
                </button>
              </div>
            )}
            {!!status && <p className="mt-3 text-sm text-emerald-300">{status}</p>}
          </div>
        </div>
      )}
    </MarketingLayout>
  );
}

