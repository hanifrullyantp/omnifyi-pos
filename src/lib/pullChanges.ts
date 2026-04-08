import { getSupabase } from './supabaseClient';
import { db } from './db';
import { setSyncHooksEnabled } from './syncHooks';

const TABLES = [
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
] as const;

type TableName = (typeof TABLES)[number];

function keyForTenant(tenantId: string) {
  return `pos:lastSyncAt:${tenantId}`;
}

export async function pullAllChangesForTenant(tenantId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const sinceIso = localStorage.getItem(keyForTenant(tenantId)) || new Date(0).toISOString();
  const nowIso = new Date().toISOString();

  setSyncHooksEnabled(false);
  try {
    for (const table of TABLES) {
      const { data, error } = await supabase
        .from(table)
        .select('id, tenant_id, business_id, data, deleted_at, updated_at, created_at')
        .eq('tenant_id', tenantId)
        .gt('updated_at', sinceIso);
      if (error) throw error;

      const rows = data ?? [];
      if (!rows.length) continue;

      // Apply: upsert data payload into Dexie table; delete tombstoned rows locally.
      const toPut: Record<string, unknown>[] = [];
      const toDelete: string[] = [];

      for (const r of rows as any[]) {
        const id = r.id as string | undefined;
        if (!id) continue;
        if (r.deleted_at) {
          toDelete.push(id);
          continue;
        }
        const payload = (r.data ?? {}) as Record<string, unknown>;
        // Normalize snake_case tenant_id/business_id into camelCase used by Dexie rows.
        if (typeof r.tenant_id === 'string') (payload as any).tenantId = r.tenant_id;
        if (typeof r.business_id === 'string') (payload as any).businessId = r.business_id;
        (payload as any).id = id;
        toPut.push(payload);
      }

      const tbl = (db as any)[table] as any;
      if (toPut.length) await tbl.bulkPut(toPut);
      if (toDelete.length) await tbl.bulkDelete(toDelete);
    }

    localStorage.setItem(keyForTenant(tenantId), nowIso);
  } finally {
    setSyncHooksEnabled(true);
  }
}

