import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, UserPlus } from 'lucide-react';
import { db, type Cashier, type TaskColumn, type TaskItem, type TodoPriority } from '../lib/db';
import { useAuthStore } from '../lib/store';
import { cn } from '../lib/utils';

function parseAssignees(json: string | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export default function TasksKanbanPage() {
  const { currentBusiness, currentTenant, currentUser } = useAuthStore();
  const bid = currentBusiness?.id;
  const tid = currentTenant?.id;
  const ownerId = currentUser?.id;

  const columns = useLiveQuery(
    () => (bid ? db.taskColumns.where('businessId').equals(bid).toArray() : []),
    [bid]
  ) as TaskColumn[] | undefined;

  const cashiers = useLiveQuery(
    () => (bid ? db.cashiers.where('businessId').equals(bid).toArray() : []),
    [bid]
  ) as Cashier[] | undefined;

  const tasks = useLiveQuery(
    () => (bid ? db.tasks.where('businessId').equals(bid).toArray() : []),
    [bid]
  ) as TaskItem[] | undefined;

  const sortedColumns = useMemo(() => {
    const list = [...(columns ?? [])];
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return list;
  }, [columns]);

  const firstColumnId = sortedColumns[0]?.id;

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('MEDIUM');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [colEditorOpen, setColEditorOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [editCol, setEditCol] = useState<TaskColumn | null>(null);

  // Ensure default columns exist per business.
  useEffect(() => {
    if (!bid || !tid) return;
    if (columns === undefined) return;
    if (columns.length > 0) return;
    void (async () => {
      const now = new Date();
      const base = [
        { title: 'To do', sortOrder: 10 },
        { title: 'Process', sortOrder: 20 },
        { title: 'Done', sortOrder: 30 },
      ];
      for (const c of base) {
        await db.taskColumns.add({
          id: crypto.randomUUID(),
          tenantId: tid,
          businessId: bid,
          title: c.title,
          sortOrder: c.sortOrder,
          kind: 'DEFAULT',
          createdAt: now,
          updatedAt: now,
        });
      }
    })();
  }, [bid, tid, columns]);

  const byStatus = useMemo(() => {
    const m = new Map<string, TaskItem[]>();
    for (const c of sortedColumns) if (c.id) m.set(c.id, []);
    (tasks ?? []).forEach((t) => {
      const colId = t.columnId || firstColumnId;
      if (!colId) return;
      const list = m.get(colId) ?? [];
      list.push(t);
      m.set(colId, list);
    });
    for (const c of sortedColumns) {
      if (!c.id) continue;
      const list = m.get(c.id) ?? [];
      list.sort(
        (a, b) =>
          (b.updatedAt ? +new Date(b.updatedAt) : +new Date(b.createdAt)) -
          (a.updatedAt ? +new Date(a.updatedAt) : +new Date(a.createdAt))
      );
      m.set(c.id, list);
    }
    return m;
  }, [tasks, sortedColumns, firstColumnId]);

  const cashierNameById = useMemo(() => {
    const m = new Map<string, string>();
    (cashiers ?? []).forEach((c) => c.id && m.set(c.id, c.name));
    return m;
  }, [cashiers]);

  const toggleAssignee = (id: string) =>
    setAssignees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const createTask = async () => {
    if (!bid || !tid || !ownerId) return;
    const t = title.trim();
    if (!t) {
      setErr('Judul wajib.');
      return;
    }
    if (!firstColumnId) {
      setErr('Kolom belum siap. Coba refresh.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await db.tasks.add({
        id: crypto.randomUUID(),
        tenantId: tid,
        businessId: bid,
        title: t,
        description: desc.trim() || undefined,
        columnId: firstColumnId,
        priority,
        assigneeCashierIdsJson: JSON.stringify(assignees),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByOwnerId: ownerId,
      });
      setCreateOpen(false);
      setTitle('');
      setDesc('');
      setAssignees([]);
      setPriority('MEDIUM');
    } catch (e: any) {
      setErr(e?.message || 'Gagal membuat task.');
    } finally {
      setBusy(false);
    }
  };

  const move = async (task: TaskItem, next: TaskStatus) => {
    // kept for backward compatibility; no-op
    void task;
    void next;
  };

  const moveToColumn = async (task: TaskItem, nextColumnId: string) => {
    if (!task.id) return;
    await db.tasks.update(task.id, { columnId: nextColumnId, updatedAt: new Date() });
  };

  const saveColumn = async () => {
    if (!bid || !tid) return;
    const t = (editCol ? editCol.title : newColTitle).trim();
    if (!t) return;
    const now = new Date();
    if (editCol?.id) {
      await db.taskColumns.update(editCol.id, { title: t, updatedAt: now });
    } else {
      const max = Math.max(0, ...(sortedColumns.map((c) => c.sortOrder ?? 0)));
      await db.taskColumns.add({
        id: crypto.randomUUID(),
        tenantId: tid,
        businessId: bid,
        title: t,
        sortOrder: max + 10,
        kind: 'CUSTOM',
        createdAt: now,
        updatedAt: now,
      });
    }
    setColEditorOpen(false);
    setNewColTitle('');
    setEditCol(null);
  };

  const deleteColumn = async (col: TaskColumn) => {
    if (!col.id) return;
    if (col.kind === 'DEFAULT') return;
    const target = firstColumnId;
    if (!target) return;
    const affected = (tasks ?? []).filter((t) => t.columnId === col.id);
    for (const t of affected) {
      if (t.id) await db.tasks.update(t.id, { columnId: target, updatedAt: new Date() });
    }
    await db.taskColumns.delete(col.id);
  };

  if (!bid || !tid || !ownerId) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500">Pilih bisnis terlebih dulu.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Tugas (Kanban)</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Owner bisa tag karyawan, lalu muncul di dashboard kasir.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setColEditorOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            + Kolom
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" />
            Buat Tugas
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {sortedColumns.map((col) => (
          <div key={col.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-gray-900 dark:text-white">{col.title}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditCol(col);
                      setNewColTitle(col.title);
                      setColEditorOpen(true);
                    }}
                    className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={col.kind === 'DEFAULT'}
                    onClick={() => void deleteColumn(col)}
                    className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-red-50 disabled:opacity-50"
                    title={col.kind === 'DEFAULT' ? 'Kolom default tidak bisa dihapus' : 'Hapus kolom'}
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{(col.id ? byStatus.get(col.id)?.length : 0) ?? 0} item</p>
            </div>
            <div className="p-3 space-y-3">
              {((col.id ? byStatus.get(col.id) : []) ?? []).map((t) => {
                const tagged = parseAssignees(t.assigneeCashierIdsJson);
                return (
                  <div key={t.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-950">
                    <p className="font-semibold text-gray-900 dark:text-white">{t.title}</p>
                    {t.description ? <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{t.description}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tagged.slice(0, 3).map((id) => (
                        <span key={id} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {cashierNameById.get(id) ?? 'Kasir'}
                        </span>
                      ))}
                      {tagged.length > 3 ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          +{tagged.length - 3}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {sortedColumns.filter((c) => c.id && c.id !== col.id).slice(0, 2).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => c.id && void moveToColumn(t, c.id)}
                          className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-900"
                        >
                          → {c.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {((col.id ? byStatus.get(col.id) : []) ?? []).length === 0 ? (
                <div className="p-6 text-sm text-gray-500">Kosong.</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Buat Tugas</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Judul</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-gray-950 dark:border-gray-800" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Deskripsi</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1 w-full min-h-[90px] rounded-xl border px-3 py-2 dark:bg-gray-950 dark:border-gray-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TodoPriority)}
                    className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-gray-950 dark:border-gray-800"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Tag karyawan</label>
                  <div className="mt-1 max-h-[120px] overflow-auto rounded-xl border border-gray-200 dark:border-gray-800 p-2">
                    {(cashiers ?? []).filter((c) => c.isActive).map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm py-1">
                        <input type="checkbox" checked={!!c.id && assignees.includes(c.id)} onChange={() => c.id && toggleAssignee(c.id)} />
                        <span>{c.name}</span>
                      </label>
                    ))}
                    {(cashiers ?? []).length === 0 ? <p className="text-xs text-gray-500">Belum ada kasir.</p> : null}
                  </div>
                </div>
              </div>
              {err ? <p className="text-sm text-red-600">{err}</p> : null}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => void createTask()}
                  disabled={busy}
                  className={cn('flex-1 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700', busy && 'opacity-50')}
                >
                  {busy ? 'Menyimpan...' : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Simpan
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {colEditorOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editCol ? 'Edit Kolom' : 'Tambah Kolom'}</h3>
            <div className="mt-4">
              <label className="text-xs font-medium text-gray-500">Nama kolom</label>
              <input
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-gray-950 dark:border-gray-800"
              />
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setColEditorOpen(false);
                  setEditCol(null);
                  setNewColTitle('');
                }}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void saveColumn()}
                className="flex-1 py-2 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

