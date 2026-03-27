import React, { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Search, Edit2, Star, Gift, Calendar, X } from 'lucide-react';
import { db, type Member, type MemberTier } from '../lib/db';
import { useAuthStore } from '../lib/store';

const TIER_OPTIONS: MemberTier[] = ['REGULAR', 'SILVER', 'GOLD'];

function tierColor(t: MemberTier) {
  if (t === 'GOLD') return 'bg-amber-100 text-amber-700';
  if (t === 'SILVER') return 'bg-slate-200 text-slate-700';
  return 'bg-emerald-100 text-emerald-700';
}

type MemberFormProps = {
  initial?: Member | null;
  onClose: () => void;
  onSaved: () => void;
};

function MemberForm({ initial, onClose, onSaved }: MemberFormProps) {
  const { currentBusiness } = useAuthStore();
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [tier, setTier] = useState<MemberTier>(initial?.tier ?? 'REGULAR');
  const [points, setPoints] = useState(initial?.points ?? 0);
  const [specialPricePercent, setSpecialPricePercent] = useState(initial?.specialPricePercent ?? 0);
  const [specialDiscountPercent, setSpecialDiscountPercent] = useState(initial?.specialDiscountPercent ?? 0);
  const [benefitStartAt, setBenefitStartAt] = useState(
    initial?.benefitStartAt ? new Date(initial.benefitStartAt).toISOString().slice(0, 10) : ''
  );
  const [benefitEndAt, setBenefitEndAt] = useState(
    initial?.benefitEndAt ? new Date(initial.benefitEndAt).toISOString().slice(0, 10) : ''
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const save = async () => {
    if (!currentBusiness?.id || !name.trim()) return;
    const payload: Member = {
      id: initial?.id ?? crypto.randomUUID(),
      businessId: currentBusiness.id,
      tenantId: currentBusiness.tenantId,
      name: name.trim(),
      phone: phone || undefined,
      email: email || undefined,
      tier,
      points: Number(points) || 0,
      specialPricePercent: Number(specialPricePercent) || 0,
      specialDiscountPercent: Number(specialDiscountPercent) || 0,
      benefitStartAt: benefitStartAt ? new Date(benefitStartAt) : undefined,
      benefitEndAt: benefitEndAt ? new Date(benefitEndAt) : undefined,
      isActive,
      createdAt: initial?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    if (isEdit && initial?.id) {
      await db.members.update(initial.id, payload);
    } else {
      await db.members.add(payload);
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Member' : 'Tambah Member'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama member" className="sm:col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="No. HP" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (opsional)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          <select value={tier} onChange={(e) => setTier(e.target.value as MemberTier)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} placeholder="Poin" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          <input type="number" value={specialPricePercent} onChange={(e) => setSpecialPricePercent(Number(e.target.value))} placeholder="Harga khusus (%)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          <input type="number" value={specialDiscountPercent} onChange={(e) => setSpecialDiscountPercent(Number(e.target.value))} placeholder="Diskon khusus (%)" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          <input type="date" value={benefitStartAt} onChange={(e) => setBenefitStartAt(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          <input type="date" value={benefitEndAt} onChange={(e) => setBenefitEndAt(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" />
          <label className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Member aktif
          </label>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-gray-600">Batal</button>
          <button onClick={save} className="flex-1 py-2 rounded-xl bg-brand-600 text-white font-semibold">Simpan</button>
        </div>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const { currentBusiness } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  const load = async () => {
    if (!currentBusiness?.id) return;
    const rows = await db.members.where('businessId').equals(currentBusiness.id).toArray();
    setMembers(rows.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
  };

  useEffect(() => {
    void load();
  }, [currentBusiness?.id]);

  const filtered = useMemo(
    () =>
      members.filter((m) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return `${m.name} ${m.phone ?? ''} ${m.email ?? ''}`.toLowerCase().includes(q);
      }),
    [members, search]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-36">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-brand-600" />Member</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manajemen pelanggan, poin, dan benefit khusus</p>
          </div>
          <button onClick={() => { setEditing(null); setOpenForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari member..." className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { setEditing(m); setOpenForm(true); }}
              className="text-left rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{m.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{m.phone || m.email || '-'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${tierColor(m.tier)}`}>{m.tier}</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 text-violet-600"><Star className="w-4 h-4" /> {m.points} poin</span>
                <span className="inline-flex items-center gap-1 text-emerald-600"><Gift className="w-4 h-4" /> {m.specialDiscountPercent || 0}% diskon</span>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {m.benefitStartAt ? new Date(m.benefitStartAt).toLocaleDateString('id-ID') : '-'} s/d {m.benefitEndAt ? new Date(m.benefitEndAt).toLocaleDateString('id-ID') : '-'}
              </div>
              <div className="mt-2 text-xs text-brand-600 inline-flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Klik untuk edit</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500">Belum ada member.</div>
          )}
        </div>
      </div>
      {openForm && <MemberForm initial={editing} onClose={() => setOpenForm(false)} onSaved={() => { setOpenForm(false); void load(); }} />}
    </div>
  );
}
