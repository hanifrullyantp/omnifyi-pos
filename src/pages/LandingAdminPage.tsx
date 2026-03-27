import React, { useEffect, useMemo, useState } from 'react';
import { loadLandingContent, saveLandingContent, uploadAsset, type LandingContent } from '../lib/landingContent';
import { useAuthStore } from '../lib/store';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';

const contentEdgeUrl = typeof import.meta.env.VITE_CONTENT_EDGE_URL === 'string' && import.meta.env.VITE_CONTENT_EDGE_URL.trim() !== '';

export default function LandingAdminPage() {
  const { currentUser, logout } = useAuthStore();
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState<'config' | 'content' | 'notification' | 'media'>('config');
  const [jsonText, setJsonText] = useState('');
  const [content, setContent] = useState<LandingContent | null>(null);
  const canSave = useMemo(() => !!content, [content]);
  const [draftBase, setDraftBase] = useState<LandingContent | null>(null);
  const [previewText, setPreviewText] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    void loadLandingContent().then((data) => {
      setContent(data);
      setJsonText(JSON.stringify(data, null, 2));
      setDraftBase(data);
    });
  }, []);

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as LandingContent;
      setContent(parsed);
      setMsg('JSON diterapkan.');
    } catch {
      setMsg('JSON tidak valid.');
    }
  };

  const save = async () => {
    if (!content) return;
    await saveLandingContent(content);
    setDraftBase(content);
    setJsonText(JSON.stringify(content, null, 2));
    setMsg('Content tersimpan ke Supabase Edge Function (atau fallback lokal).');
  };

  const onUpload = async (file?: File) => {
    if (!file || !content) return;
    const url = await uploadAsset(file);
    setContent({ ...content, heroImageUrl: url });
    setJsonText(JSON.stringify({ ...content, heroImageUrl: url }, null, 2));
    setMsg('Upload selesai. URL gambar disimpan.');
  };

  useEffect(() => {
    if (!content) return;
    const { enabled, items, minIntervalSec, maxIntervalSec, durationSec, soundUrl } = content.notificationBanner;
    if (!enabled || items.length === 0) {
      setPreviewVisible(false);
      return;
    }
    const minMs = Math.max(0, minIntervalSec * 1000);
    const maxMs = Math.max(minMs, maxIntervalSec * 1000);
    const durMs = Math.max(1000, durationSec * 1000);

    let cancelled = false;
    let timeoutId: number | undefined;

    const pickRandom = () => items[Math.floor(Math.random() * items.length)];

    const loop = () => {
      const waitMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        const pick = pickRandom();
        const text = `${pick.name} baru saja memesan ${pick.package} ${content.brandName}`;
        setPreviewText(text);
        setPreviewVisible(true);
        if (soundUrl) {
          const audio = new Audio(soundUrl);
          void audio.play().catch(() => {});
        }
        window.setTimeout(() => {
          if (cancelled) return;
          setPreviewVisible(false);
          loop();
        }, durMs);
      }, waitMs);
    };

    loop();
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [content]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4 text-center">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-lg font-bold">Admin Landing butuh login utama</h1>
          <p className="text-sm text-gray-400 mt-2">Silakan login dari halaman utama dulu, lalu pilih role Super Admin.</p>
          <a href="/" className="inline-block mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold">Ke Landing</a>
        </div>
      </div>
    );
  }
  if (currentUser.role !== 'ADMIN_SYSTEM') {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4 text-center">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-lg font-bold">Akses ditolak</h1>
          <p className="text-sm text-gray-400 mt-2">Halaman ini khusus role Super Admin.</p>
          <a href="/dashboard" className="inline-block mt-4 px-4 py-2 rounded-xl border border-white/20">Ke Aplikasi</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050A14] text-white">
      <div className="h-14 border-b border-white/10 bg-[#0A1222] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">O</span>
          <p className="font-semibold">Kelola landing</p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${
              contentEdgeUrl
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-200 border-amber-500/25'
            }`}
            title="Set VITE_CONTENT_EDGE_URL di build untuk simpan konten ke Edge Function"
          >
            {contentEdgeUrl ? 'Edge content aktif' : 'Penyimpanan lokal (localStorage)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void save()} disabled={!canSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-50">Simpan & Publish</button>
          <button
            onClick={() => {
              if (!draftBase) return;
              setContent(draftBase);
              setJsonText(JSON.stringify(draftBase, null, 2));
              setMsg('Draft dibatalkan.');
            }}
            disabled={!draftBase}
            className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm font-semibold disabled:opacity-50"
          >
            Clear Draft
          </button>
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="px-3 py-2 rounded-lg border border-white/20 text-white text-sm font-semibold"
          >
            Logout
          </button>
          <a href="/dashboard" className="px-4 py-2 rounded-lg border border-white/20 text-sm">Ke App</a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] min-h-[calc(100vh-56px)]">
        <aside className="border-r border-white/10 bg-[#081021] p-3 space-y-3">
          <div className="flex gap-2">
            {[
              { id: 'config', label: 'Config & Style' },
              { id: 'content', label: 'Content' },
              { id: 'notification', label: 'Notification' },
              { id: 'media', label: 'Media' },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={`px-3 py-2 rounded-lg text-xs ${tab === t.id ? 'bg-[#0F1B34] border border-emerald-500/40 text-emerald-300' : 'bg-[#0A152B] border border-white/10 text-gray-300'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'config' && content && (
            <div className="rounded-xl border border-white/10 bg-[#0A152B] p-3 space-y-2">
              <p className="text-xs text-emerald-300 font-semibold">VISUAL APPEARANCE</p>
              <input value={content.brandName} onChange={(e) => setContent({ ...content, brandName: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm" placeholder="Brand Name" />
              <input value={content.tagline} onChange={(e) => setContent({ ...content, tagline: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm" placeholder="Tagline" />
              <input value={content.hero.headline1} onChange={(e) => setContent({ ...content, hero: { ...content.hero, headline1: e.target.value } })} className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm" placeholder="Headline 1" />
              <input value={content.hero.headline2} onChange={(e) => setContent({ ...content, hero: { ...content.hero, headline2: e.target.value } })} className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm" placeholder="Headline 2" />
            </div>
          )}

          {tab === 'content' && content && (
            <div className="rounded-xl border border-white/10 bg-[#0A152B] p-3 space-y-2">
              <p className="text-xs text-emerald-300 font-semibold">CONTENT SETTINGS</p>
              <textarea value={content.hero.description} onChange={(e) => setContent({ ...content, hero: { ...content.hero, description: e.target.value } })} className="w-full min-h-[90px] px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm" />
              <input value={content.hero.ctaPrimary} onChange={(e) => setContent({ ...content, hero: { ...content.hero, ctaPrimary: e.target.value } })} className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm" placeholder="CTA Primary" />
              <input value={content.hero.ctaSecondary} onChange={(e) => setContent({ ...content, hero: { ...content.hero, ctaSecondary: e.target.value } })} className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm" placeholder="CTA Secondary" />
            </div>
          )}

          {tab === 'notification' && content && (
            <div className="rounded-xl border border-white/10 bg-[#0A152B] p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs text-emerald-300 font-semibold">Notification Banner</p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={content.notificationBanner.enabled}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        notificationBanner: { ...content.notificationBanner, enabled: e.target.checked },
                      })
                    }
                  />
                  ON / OFF
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[11px] text-gray-300 mb-1">Min Interval (detik)</p>
                  <input
                    type="number"
                    value={content.notificationBanner.minIntervalSec}
                    min={0}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        notificationBanner: { ...content.notificationBanner, minIntervalSec: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm"
                  />
                </div>
                <div>
                  <p className="text-[11px] text-gray-300 mb-1">Max Interval (detik)</p>
                  <input
                    type="number"
                    value={content.notificationBanner.maxIntervalSec}
                    min={0}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        notificationBanner: { ...content.notificationBanner, maxIntervalSec: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm"
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] text-gray-300 mb-1">Durasi Tampil (detik)</p>
                <input
                  type="number"
                  value={content.notificationBanner.durationSec}
                  min={1}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      notificationBanner: { ...content.notificationBanner, durationSec: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm"
                />
              </div>

              <div>
                <p className="text-[11px] text-gray-300 mb-1">Sound URL (opsional)</p>
                <input
                  value={content.notificationBanner.soundUrl ?? ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      notificationBanner: { ...content.notificationBanner, soundUrl: e.target.value || undefined },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm"
                  placeholder="URL MP3 dari Storage"
                />
                <input
                  type="file"
                  accept="audio/*"
                  className="block mt-2 text-xs"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadAsset(file);
                    setContent({
                      ...content,
                      notificationBanner: { ...content.notificationBanner, soundUrl: url },
                    });
                    e.currentTarget.value = '';
                  }}
                />
              </div>

              <div className="rounded-lg border border-white/10 bg-[#081021] p-2">
                <p className="text-[11px] text-emerald-300 font-semibold mb-2">Social Proof Items</p>
                <div className="space-y-2">
                  {content.notificationBanner.items.map((it, idx) => (
                    <div key={`${it.name}-${idx}`} className="flex items-center gap-2">
                      <input
                        value={it.name}
                        onChange={(e) => {
                          const next = [...content.notificationBanner.items];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setContent({ ...content, notificationBanner: { ...content.notificationBanner, items: next } });
                        }}
                        placeholder="Nama"
                        className="flex-1 px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm"
                      />
                      <input
                        value={it.package}
                        onChange={(e) => {
                          const next = [...content.notificationBanner.items];
                          next[idx] = { ...next[idx], package: e.target.value };
                          setContent({ ...content, notificationBanner: { ...content.notificationBanner, items: next } });
                        }}
                        placeholder="Paket"
                        className="flex-1 px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm"
                      />
                      <button
                        onClick={() => {
                          const next = content.notificationBanner.items.filter((_, i) => i !== idx);
                          setContent({ ...content, notificationBanner: { ...content.notificationBanner, items: next } });
                        }}
                        className="p-2 rounded-lg border border-white/10 hover:bg-white/5"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="w-4 h-4 text-gray-300" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const next = [...content.notificationBanner.items, { name: '', package: '' }];
                    setContent({ ...content, notificationBanner: { ...content.notificationBanner, items: next } });
                  }}
                  className="mt-2 w-full py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-200 flex items-center justify-center gap-2 hover:bg-white/10"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
            </div>
          )}

          {tab === 'media' && content && (
            <div className="rounded-xl border border-white/10 bg-[#0A152B] p-3 space-y-2">
              <p className="text-xs text-emerald-300 font-semibold">MEDIA</p>
              <input value={content.logoUrl ?? ''} onChange={(e) => setContent({ ...content, logoUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm" placeholder="Logo URL" />
              <input value={content.faviconUrl ?? ''} onChange={(e) => setContent({ ...content, faviconUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm" placeholder="Favicon URL" />
              <input value={content.heroImageUrl ?? ''} onChange={(e) => setContent({ ...content, heroImageUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm" placeholder="Hero image URL" />
              <input value={content.demoVideoUrl ?? ''} onChange={(e) => setContent({ ...content, demoVideoUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#0B172F] border border-white/10 text-sm" placeholder="Demo video URL" />
              <input type="file" accept="image/*,video/*,audio/*" className="block mt-1 text-xs" onChange={(e) => void onUpload(e.target.files?.[0])} />
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-[#0A152B] p-3">
            <p className="text-xs text-emerald-300 font-semibold mb-2">ADVANCED JSON</p>
            <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} className="w-full min-h-[160px] rounded-lg bg-black/30 border border-white/10 p-2 font-mono text-[11px]" />
            <button onClick={applyJson} className="mt-2 w-full py-2 rounded-lg border border-white/20 text-xs">Apply JSON</button>
          </div>
        </aside>

        <section className="p-4 bg-[#020817]">
          <div className="rounded-xl border border-white/10 bg-[#0A1222] px-3 py-2 text-sm text-gray-300 mb-3">Live Preview</div>
          <div className="max-w-sm mx-auto rounded-[28px] border border-white/15 bg-[#060D1C] p-3 shadow-2xl">
            <div className="flex gap-2 justify-center mb-2">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs border ${
                  previewDevice === 'desktop'
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-gray-300'
                }`}
              >
                Desktop View
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs border ${
                  previewDevice === 'mobile'
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-gray-300'
                }`}
              >
                Mobile View
              </button>
            </div>

            <div
              className="rounded-[22px] bg-[#020617] p-4 min-h-[620px] relative"
              style={{ maxWidth: previewDevice === 'mobile' ? 320 : 380, margin: '0 auto' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">O</span>
                  <span className="font-semibold text-white">{content?.brandName || 'Omnifyi POS'}</span>
                </div>
                <button className="px-4 py-1.5 rounded-full bg-emerald-500/80 text-white text-xs">Login</button>
              </div>
              <p className="mt-5 text-white text-2xl font-bold leading-tight">{content?.hero.headline1}<br />{content?.hero.headline2}</p>
              <p className="mt-3 text-sm text-gray-300">{content?.hero.description}</p>
              <button className="mt-4 w-full py-3 rounded-full bg-emerald-500 text-white font-semibold">{content?.hero.badge}</button>
              <div className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-[#0b1220]">
                {content?.heroImageUrl ? (
                  <img src={content.heroImageUrl} alt="preview" className="w-full h-44 object-cover" />
                ) : (
                  <div className="h-44 flex items-center justify-center text-gray-500 text-xs">Hero image preview</div>
                )}
              </div>

              {previewVisible && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 rounded-xl border border-emerald-500/30 bg-[#0F172A]/95 px-4 py-3 text-sm text-emerald-200 shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap">{previewText}</span>
                </div>
              )}
            </div>
          </div>
          {msg && <p className="mt-3 text-xs text-emerald-300">{msg}</p>}
        </section>
      </div>
    </div>
  );
}

