import { useEffect, useState } from 'react';
import { useSyncStore } from '../../lib/store';
import { cn } from '../../lib/utils';

export function SyncStatusChip({ className }: { className?: string }) {
  const pending = useSyncStore((s) => s.pendingSyncs.length);
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const lastSyncError = useSyncStore((s) => s.lastSyncError);
  const lastSyncErrorCode = useSyncStore((s) => s.lastSyncErrorCode);
  const processSyncQueue = useSyncStore((s) => s.processSyncQueue);
  const [online, setOnline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine);

  useEffect(() => {
    if (online && pending > 0 && !isSyncing) {
      void processSyncQueue();
    }
  }, [online, pending, isSyncing, processSyncQueue]);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  const syncDisabled = online && pending > 0 && !isSyncing && lastSyncErrorCode === 'endpoint_missing';

  const label = syncDisabled
    ? `Sync off (dev) · ${pending} pending`
    : !online
    ? pending > 0
      ? `Offline (${pending} pending)`
      : 'Offline'
    : isSyncing
      ? `Syncing (${pending} pending)`
      : pending > 0
      ? `Syncing (${pending} pending)`
      : 'Online';

  const tone = syncDisabled
    ? 'bg-slate-200 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200'
    : !online
    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
    : isSyncing || pending > 0
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200';

  return (
    <button
      type="button"
      onClick={() => {
        if (online && pending > 0 && !isSyncing && !syncDisabled) void processSyncQueue();
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        tone,
        className
      )}
      title={
        syncDisabled
          ? lastSyncError || 'Sync dimatikan di dev (endpoint tidak tersedia).'
          : 'Status koneksi (local-first). Klik untuk sync manual saat online.'
      }
    >
      <span className="text-base leading-none">{syncDisabled ? '⚪' : !online ? '🔴' : pending > 0 ? '🟡' : '🟢'}</span>
      {label}
    </button>
  );
}
