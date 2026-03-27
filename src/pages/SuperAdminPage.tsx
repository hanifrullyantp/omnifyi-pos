import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Shield, Users, Inbox, Funnel, Globe } from 'lucide-react';
import { db } from '../lib/db';
import {
  SuperAdminSettings,
  loadSuperAdminSettings,
  saveSuperAdminSettings,
} from '../lib/superAdminSettings';

export default function SuperAdminPage() {
  const [settings, setSettings] = useState<SuperAdminSettings>(() => loadSuperAdminSettings());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'cms' | 'monitoring' | 'crm'>('cms');
  const [activeUsers, setActiveUsers] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);
  const [crmCounts, setCrmCounts] = useState<Record<string, number>>({});
  const [recentInbox, setRecentInbox] = useState<Array<{ id?: string; senderName: string; message: string; createdAt: Date }>>([]);
  const [leads, setLeads] = useState<Array<{ id?: string; fullName: string; email: string; stage: string; source: string; createdAt: Date }>>([]);

  useEffect(() => {
    const loadMetrics = async () => {
      const [sessions, inbox, leads] = await Promise.all([
        db.cashierSessions.where('status').equals('ACTIVE').toArray(),
        db.buyerInbox.where('status').equals('NEW').toArray(),
        db.crmLeads.toArray(),
      ]);
      setActiveUsers(sessions.length);
      setInboxCount(inbox.length);
      const grouped: Record<string, number> = {};
      leads.forEach((l) => {
        grouped[l.stage] = (grouped[l.stage] || 0) + 1;
      });
      setCrmCounts(grouped);
      setRecentInbox(
        inbox
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, 8)
          .map((x) => ({ id: x.id, senderName: x.senderName, message: x.message, createdAt: x.createdAt }))
      );
      setLeads(
        leads
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, 16)
          .map((x) => ({
            id: x.id,
            fullName: x.fullName,
            email: x.email,
            stage: x.stage,
            source: x.source,
            createdAt: x.createdAt,
          }))
      );
    };
    void loadMetrics();
  }, []);

  const moveLeadStage = async (leadId?: string, stage?: string) => {
    if (!leadId || !stage) return;
    const nextMap: Record<string, string> = {
      DEMO: 'CHECKOUT',
      CHECKOUT: 'PAID',
      PAID: 'ONBOARDED',
      ONBOARDED: 'ONBOARDED',
    };
    const next = nextMap[stage] || 'ONBOARDED';
    await db.crmLeads.update(leadId, { stage: next as 'DEMO' | 'CHECKOUT' | 'PAID' | 'ONBOARDED', updatedAt: new Date() });
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: next } : l)));
    setCrmCounts((prev) => ({
      ...prev,
      [stage]: Math.max((prev[stage] || 1) - 1, 0),
      [next]: (prev[next] || 0) + 1,
    }));
  };

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1800);
    return () => clearTimeout(t);
  }, [saved]);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setSettings((prev) => ({ ...prev, brandLogoDataUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveSuperAdminSettings(settings);
    setSaved(true);
  };

  const crmPipeline = useMemo(
    () => [
      { key: 'DEMO', label: 'Demo signup' },
      { key: 'CHECKOUT', label: 'Checkout' },
      { key: 'PAID', label: 'Paid' },
      { key: 'ONBOARDED', label: 'Onboarded' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-24">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-brand-600" />
        </Link>
        <h1 className="text-lg font-bold">Super Admin</h1>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'cms', label: 'CMS & Branding', icon: Globe },
            { id: 'monitoring', label: 'Monitoring', icon: Users },
            { id: 'crm', label: 'CRM Pipeline', icon: Funnel },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'cms' && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-600" />
            Branding OMNIFYI POS
          </h2>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium">Nama Brand</label>
            <input
              value={settings.brandName}
              onChange={(e) => setSettings((prev) => ({ ...prev, brandName: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
            />

            <label className="block text-sm font-medium">Logo Brand</label>
            <label className="w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 px-4 py-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-500">
              <Upload className="w-5 h-5 text-brand-600" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Upload logo (PNG/JPG/WebP)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => void handleUpload(e.target.files?.[0])}
              />
            </label>
            {settings.brandLogoDataUrl && (
              <img src={settings.brandLogoDataUrl} alt="Brand logo preview" className="h-14 object-contain rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-900" />
            )}
            <input value={settings.heroTitle ?? ''} onChange={(e) => setSettings((p) => ({ ...p, heroTitle: e.target.value }))} placeholder="Hero title" className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
            <textarea value={settings.heroSubtitle ?? ''} onChange={(e) => setSettings((p) => ({ ...p, heroSubtitle: e.target.value }))} placeholder="Hero subtitle" className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 min-h-[84px]" />
            <input value={settings.primaryCtaText ?? ''} onChange={(e) => setSettings((p) => ({ ...p, primaryCtaText: e.target.value }))} placeholder="CTA text" className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
            <input value={settings.landingUrl ?? ''} onChange={(e) => setSettings((p) => ({ ...p, landingUrl: e.target.value }))} placeholder="Landing URL" className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
            <input value={settings.faviconUrl ?? ''} onChange={(e) => setSettings((p) => ({ ...p, faviconUrl: e.target.value }))} placeholder="Favicon URL" className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
            <input value={settings.thumbnailUrl ?? ''} onChange={(e) => setSettings((p) => ({ ...p, thumbnailUrl: e.target.value }))} placeholder="Thumbnail/OpenGraph URL" className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
            <input value={settings.facebookPixelId ?? ''} onChange={(e) => setSettings((p) => ({ ...p, facebookPixelId: e.target.value }))} placeholder="Facebook Pixel ID" className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
          </div>
        </div>
        )}

        {activeTab === 'cms' && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <h2 className="font-semibold">Pengaturan Lanjutan</h2>
          <label className="block text-sm font-medium">WhatsApp Support</label>
          <input
            value={settings.supportWhatsapp ?? ''}
            onChange={(e) => setSettings((prev) => ({ ...prev, supportWhatsapp: e.target.value }))}
            placeholder="62812xxxxxxx"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))}
            />
            Maintenance mode
          </label>
        </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-sm text-gray-500">User aktif</p>
              <p className="text-2xl font-bold mt-1">{activeUsers}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-sm text-gray-500">Inbox masukan buyer</p>
              <p className="text-2xl font-bold mt-1 inline-flex items-center gap-2">
                <Inbox className="w-5 h-5 text-brand-600" />
                {inboxCount}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-sm text-gray-500">Landing URL</p>
              <p className="text-sm font-semibold mt-1 break-all">{settings.landingUrl || 'https://pos.omnifyi.com'}</p>
            </div>
            <div className="md:col-span-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-sm font-semibold mb-3">Inbox Masukan Terbaru</p>
              <div className="space-y-2">
                {recentInbox.length === 0 && <p className="text-sm text-gray-500">Belum ada masukan buyer.</p>}
                {recentInbox.map((msg) => (
                  <div key={msg.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-sm font-semibold">{msg.senderName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(msg.createdAt).toLocaleString('id-ID')}</p>
                    <p className="text-sm mt-2">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <h2 className="font-semibold mb-3">CRM & Pipeline Customer</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {crmPipeline.map((p) => (
                <div key={p.key} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-xs text-gray-500">{p.label}</p>
                  <p className="text-xl font-bold mt-1">{crmCounts[p.key] || 0}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Data pipeline berasal dari lead demo, checkout, pembayaran, dan onboarding.
            </p>
            <div className="mt-4 space-y-2">
              {leads.length === 0 && <p className="text-sm text-gray-500">Belum ada data lead.</p>}
              {leads.map((lead) => (
                <div key={lead.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{lead.fullName} <span className="text-xs text-gray-500">({lead.source})</span></p>
                    <p className="text-xs text-gray-500 truncate">{lead.email} • {new Date(lead.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700">{lead.stage}</span>
                    <button
                      onClick={() => void moveLeadStage(lead.id, lead.stage)}
                      className="text-xs px-2 py-1 rounded-lg bg-brand-600 text-white"
                    >
                      Next Stage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleSave} className="w-full md:w-auto px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold">
          Simpan Super Admin
        </button>
        {saved && <p className="text-sm text-emerald-600 font-semibold">Pengaturan super admin disimpan.</p>}
      </div>
    </div>
  );
}
