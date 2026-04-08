import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import type { User } from '../lib/db';
import { db, seedInitialData, seedDemoWorkspace, DEMO_OWNER_EMAIL, resetDemoData } from '../lib/db';
import { useAuthStore } from '../lib/store';
import { checkMidtransPaid, runLocalBillingFlow, startMidtransCheckout } from '../lib/billingFlow';
import { getSupabase, SUPABASE_ENV_SETUP_HINT } from '../lib/supabaseClient';
import { ensureLocalCoreRows, provisionTenantAndBusiness } from '../lib/cloudProvision';
import { formatProvisionError, formatSupabaseSignInError } from '../lib/authLoginErrors';
import { getLandingReturningUser, setLandingReturningUser } from '../lib/landingReturningUser';
import { CmsProvider } from '../salesPageBaru/context/CmsContext';
import { LandingIntegrationProvider, type SalesLeadFormPayload } from '../salesPageBaru/context/LandingIntegrationContext';
import { LandingLoginViewProvider } from '../salesPageBaru/context/LandingLoginViewContext';
import { SalesBaruPageContent } from '../salesPageBaru/SalesBaruPageContent';
import { SalesLoginCard } from '../components/salesLanding/SalesLoginCard';
import { getAppPath } from '../lib/routingTargets';

export default function LoginLandingPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [returningUser, setReturningUser] = useState(() => getLandingReturningUser());
  const [formPulseKey, setFormPulseKey] = useState(0);
  const [leadFormOpen, setLeadFormOpen] = useState(false);

  const showAuthPanel = !currentUser && returningUser;

  const revealLogin = useCallback(() => {
    setLandingReturningUser();
    setReturningUser(true);
    setFormPulseKey((k) => k + 1);
    window.requestAnimationFrame(() => {
      document.getElementById('auth-login')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);
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
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutLeadId, setCheckoutLeadId] = useState('');
  const [checkoutOrderId, setCheckoutOrderId] = useState('');
  const [checkoutRedirectUrl, setCheckoutRedirectUrl] = useState('');
  const [status, setStatus] = useState('');
  const [statusShakeKey, setStatusShakeKey] = useState(0);
  const [statusTone, setStatusTone] = useState<'neutral' | 'error' | 'info'>('neutral');
  const [loginBusy, setLoginBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [autoEnterApp, setAutoEnterApp] = useState(true);
  const [welcomeUserName, setWelcomeUserName] = useState('');
  const [welcomeTargetPath, setWelcomeTargetPath] = useState('/dashboard');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const pushDebug = useCallback((msg: string) => {
    const line = `[${new Date().toLocaleTimeString('id-ID', { hour12: false })}] ${msg}`;
    setDebugLogs((prev) => {
      const next = [...prev.slice(-19), line];
      try {
        localStorage.setItem('omnifyi_login_debug_logs_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    // eslint-disable-next-line no-console
    console.log('[LOGIN DEBUG]', line);
  }, []);

  const bumpStatus = (msg: string, tone: 'error' | 'info' | 'neutral' = 'error') => {
    setStatus(msg);
    setStatusTone(tone === 'neutral' ? 'neutral' : tone);
    if (tone !== 'neutral') setStatusShakeKey((k) => k + 1);
  };

  const midtransEnabled = (import.meta.env.VITE_MIDTRANS_ENABLED as string | undefined) === 'true';

  const formatErr = (err: unknown) => {
    if (err instanceof Error) return `${err.name}: ${err.message}`;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  };

  const getPostLoginPath = (user: User) => (user.role === 'ADMIN_SYSTEM' ? '/kelola-sales-landing' : '/dashboard');
  const goAfterLogin = (user: User) => {
    const target = getPostLoginPath(user);
    const fullUrl = getAppPath(target);
    pushDebug(`Redirect ke ${fullUrl} (role=${user.role})`);
    if (typeof window !== 'undefined' && window.location.origin !== new URL(fullUrl).origin) {
      window.location.assign(fullUrl);
      return;
    }
    navigate(target, { replace: true });
  };
  const handleLoginSuccess = (user: User) => {
    pushDebug(`Login sukses untuk ${user.email} (${user.role})`);
    if (user.role === 'ADMIN_SYSTEM') {
      try {
        localStorage.setItem('omnifyi_force_inline_admin_mode_v1', '1');
      } catch {
        // ignore
      }
    }
    setWelcomeUserName(user.name || user.email || 'Pengguna');
    setWelcomeTargetPath(getPostLoginPath(user));
    if (autoEnterApp) {
      goAfterLogin(user);
      return;
    }
    // Tetap di landing saat auto-enter dimatikan.
    navigate('/pos1', { replace: true });
  };

  const loginOwner = async () => {
    setLoginBusy(true);
    setStatus('');
    setStatusTone('neutral');
    pushDebug('Mulai proses login');
    try {
      await seedInitialData();
      pushDebug('seedInitialData selesai');
      const emailNorm = email.trim().toLowerCase();
      const passInput = password.trim();
      pushDebug(`Input login email=${emailNorm}`);

      if (emailNorm === DEMO_OWNER_EMAIL) {
        pushDebug('Mode demo lokal terdeteksi');
        await seedDemoWorkspace();
        pushDebug('seedDemoWorkspace selesai');
        const user = await db.users.where('email').equals(emailNorm).first();
        if (!user) {
          pushDebug('Gagal: akun demo tidak ditemukan di DB lokal');
          bumpStatus('Akun demo tidak ditemukan');
          return;
        }
        if (passInput !== user.passwordHash) {
          pushDebug('Gagal: password demo tidak cocok');
          bumpStatus('Password salah');
          return;
        }
        const tenant = await db.tenants.where('ownerId').equals(user.id!).first();
        const businesses = tenant?.id ? await db.businesses.where('tenantId').equals(tenant.id).toArray() : [];
        if (!tenant || businesses.length === 0) {
          pushDebug('Gagal: tenant/bisnis demo kosong');
          bumpStatus('Usaha demo tidak ditemukan');
          return;
        }
        setLandingReturningUser();
        setAuth(user, tenant, businesses[0], businesses);
        pushDebug('setAuth demo sukses');
        handleLoginSuccess(user);
      } else {
        const sb = getSupabase();
        if (!sb) {
          pushDebug('Gagal: Supabase client tidak tersedia');
          bumpStatus(SUPABASE_ENV_SETUP_HINT, 'info');
          return;
        }
        pushDebug('Memanggil supabase.auth.signInWithPassword');
        const { data, error } = await sb.auth.signInWithPassword({ email: emailNorm, password: passInput });
        if (error) {
          // eslint-disable-next-line no-console
          console.error('[Omnifyi login] signInWithPassword', error.code, error.message);
          pushDebug(`Gagal Supabase signIn: ${error.code ?? 'unknown'} - ${error.message}`);
          bumpStatus(formatSupabaseSignInError(error));
          return;
        }
        if (!data.user) {
          pushDebug('Gagal: Supabase signIn tanpa data.user');
          bumpStatus('Email atau password salah');
          return;
        }
        pushDebug(`Supabase login sukses userId=${data.user.id}`);
        try {
          let tenantId = '';
          let businessId = '';
          try {
            const provision = await provisionTenantAndBusiness({ businessName: 'Usaha Baru' });
            tenantId = provision.tenantId;
            businessId = provision.businessId;
            pushDebug(`provisionTenant sukses tenant=${tenantId} business=${businessId}`);
          } catch (provisionErr) {
            pushDebug(`provisionTenant gagal: ${formatErr(provisionErr)}`);
            tenantId = crypto.randomUUID();
            businessId = crypto.randomUUID();
            pushDebug(`Fallback local bootstrap tenant=${tenantId} business=${businessId}`);
          }
          const { user, tenant, business } = await ensureLocalCoreRows({
            userId: data.user.id,
            email: emailNorm,
            tenantId,
            businessId,
            businessName: 'Usaha Baru',
          });
          pushDebug(`ensureLocalCoreRows sukses localUser=${user.id ?? '-'} business=${business.id ?? '-'}`);
          setLandingReturningUser();
          setAuth(user, tenant, business, [business]);
          pushDebug('setAuth cloud sukses');
          handleLoginSuccess(user);
        } catch (provErr) {
          // eslint-disable-next-line no-console
          console.error('[Omnifyi login] provisionTenant / ensureLocalCoreRows', provErr);
          pushDebug(`Gagal provisioning/local rows: ${formatErr(provErr)}`);
          bumpStatus(formatProvisionError(provErr));
        }
      }
      setStatus('');
      setStatusTone('neutral');
    } finally {
      pushDebug('Proses login selesai');
      setLoginBusy(false);
    }
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
    setLandingReturningUser();
    setAuth(user, tenant, businesses[0], businesses);
    handleLoginSuccess(user);
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

  const persistLead = useCallback(async (payload: SalesLeadFormPayload) => {
    await seedInitialData();
    const phone = payload.whatsapp.trim().replace(/\s+/g, '');
    const emailLocal = phone ? `${phone.replace(/\D/g, '')}@wa.lead.local` : `lead-${crypto.randomUUID().slice(0, 8)}@wa.lead.local`;
    await db.crmLeads.add({
      id: crypto.randomUUID(),
      fullName: payload.name.trim(),
      email: emailLocal,
      phone: payload.whatsapp.trim(),
      businessType: payload.needs || 'Lainnya',
      source: 'LANDING_SALES',
      stage: 'DEMO',
      notes: `Kota: ${payload.city} | Outlet: ${payload.size || '-'} | Catatan: ${payload.notes || '-'}`,
      createdAt: new Date(),
    });
  }, []);

  const authPanel = (
    <SalesLoginCard
      email={email}
      password={password}
      status={status}
      statusShakeKey={statusShakeKey}
      statusTone={statusTone}
      loginBusy={loginBusy}
      resetBusy={resetBusy}
      onEmailChange={(v) => {
        setWelcomeUserName('');
        setEmail(v);
      }}
      onPasswordChange={(v) => {
        setWelcomeUserName('');
        setPassword(v);
      }}
      onLogin={() => void loginOwner()}
      onResetDemo={() => void handleResetDemo()}
      onOpenCheckout={() => setCheckoutOpen(true)}
      onOpenCobaGratis={() => setLeadFormOpen(true)}
      autoEnterApp={autoEnterApp}
      onAutoEnterAppChange={setAutoEnterApp}
      welcomeUserName={welcomeUserName}
      onEnterAppNow={() => {
        const fullUrl = getAppPath(welcomeTargetPath);
        if (typeof window !== 'undefined' && window.location.origin !== new URL(fullUrl).origin) {
          window.location.assign(fullUrl);
          return;
        }
        navigate(welcomeTargetPath, { replace: true });
      }}
      debugLogs={debugLogs}
      onClearDebugLogs={() => setDebugLogs([])}
      scrollToCobaGratis={() =>
        document.querySelector<HTMLElement>('[data-hero-cta-free]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    />
  );

  return (
    <CmsProvider>
      <LandingIntegrationProvider persistLead={persistLead} openCheckoutModal={() => setCheckoutOpen(true)}>
        <LandingLoginViewProvider
          value={{
            showAuthPanel,
            revealLogin,
            formPulseKey,
            leadFormOpen,
            openLeadForm: () => setLeadFormOpen(true),
            closeLeadForm: () => setLeadFormOpen(false),
          }}
        >
          <div className="bg-slate-950 min-h-screen text-slate-50 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 scroll-smooth">
            <SalesBaruPageContent authPanel={authPanel} />
          </div>
        </LandingLoginViewProvider>

        {demoOpen && (
          <div className="fixed inset-0 z-[72] bg-black/70 p-4 flex items-center justify-center">
            <div className="w-full max-w-xl rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#0F172A] to-[#111827] p-5 shadow-xl shadow-emerald-500/10">
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
              <button type="button" onClick={() => void submitDemoForm()} className="mt-4 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                Buka Demo Sekarang
              </button>
            </div>
          </div>
        )}

        {checkoutOpen && (
          <div className="fixed inset-0 z-[210] bg-black/70 p-4 flex items-center justify-center">
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
                <button type="button" onClick={() => void checkout('pro')} className="py-2 rounded-lg bg-emerald-500 text-white font-semibold">
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
              {!!status && <p className="mt-3 text-sm text-emerald-300">{status}</p>}
            </div>
          </div>
        )}
      </LandingIntegrationProvider>
    </CmsProvider>
  );
}
