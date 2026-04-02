import type Dexie from 'dexie';
import { db } from './db';
import { useSyncStore } from './store';

let hooksEnabled = true;
let installed = false;

export function setSyncHooksEnabled(enabled: boolean) {
  hooksEnabled = enabled;
}

function table<T>(name: string) {
  return (db as unknown as Dexie).table(name) as any;
}

function queue(tableName: string, op: 'upsert' | 'delete', row: Record<string, unknown>) {
  if (!hooksEnabled) return;
  useSyncStore.getState().addPendingRowChange(tableName, op, row);
}

export function installSyncHooks() {
  if (installed) return;
  installed = true;

  const tables = [
    'users',
    'tenants',
    'businesses',
    'cashiers',
    'cashierSessions',
    'shifts',
    'categories',
    'products',
    'materials',
    'productMaterials',
    'transactions',
    'transactionItems',
    'debtReceivables',
    'businessCosts',
    'cashflowEntries',
    'debtPayments',
    'financeAccounts',
    'activityLogs',
    'todoItems',
    'materialRestockHistory',
    'shiftAssignments',
    'shiftCloses',
    'members',
    'crmLeads',
    'buyerInbox',
    'payrollProfiles',
    'payrollRuns',
    'payrollLines',
    'storeDays',
    'cashierHandovers',
    'stockOpnameSessions',
    'stockOpnameLines',
    'stockAdjustments',
    'materialStockAdjustments',
    'paymentManualAccounts',
    'tasks',
    'taskColumns',
  ];

  for (const t of tables) {
    const tbl = table(t);

    tbl.hook('creating', (_primKey: any, obj: any) => {
      const id = obj?.id ?? _primKey;
      if (!id) return;
      queue(t, 'upsert', { ...obj, id });
    });

    tbl.hook('updating', (mods: any, primKey: any, obj: any) => {
      const id = obj?.id ?? primKey;
      if (!id) return;
      queue(t, 'upsert', { ...obj, ...mods, id });
    });

    tbl.hook('deleting', (primKey: any, obj: any) => {
      const id = obj?.id ?? primKey;
      if (!id) return;
      queue(t, 'delete', { ...obj, id });
    });
  }
}

