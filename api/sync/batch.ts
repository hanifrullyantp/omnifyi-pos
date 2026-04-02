import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type IncomingItem =
  | {
      id: string;
      type: 'transaction' | 'product' | 'stock';
      data: Record<string, unknown>;
      createdAt?: string;
      retryCount?: number;
    }
  | {
      id: string;
      table: string;
      op: 'upsert' | 'delete';
      row: Record<string, unknown>;
      createdAt?: string;
      retryCount?: number;
    };

type IncomingBatch = {
  sentAt?: string;
  strategy?: 'server_wins' | 'client_wins';
  items: IncomingItem[];
};

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

function tableFromLegacyType(type: string) {
  if (type === 'transaction') return 'transactions';
  if (type === 'product' || type === 'stock') return 'products';
  return null;
}

function extractTenantId(row: Record<string, unknown>): string | null {
  const t = row.tenantId ?? row.tenant_id;
  return typeof t === 'string' && t ? t : null;
}

function extractBusinessId(row: Record<string, unknown>): string | null {
  const b = row.businessId ?? row.business_id;
  return typeof b === 'string' && b ? b : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  try {
    const supabaseUrl = env('SUPABASE_URL');
    const anonKey = env('SUPABASE_ANON_KEY');
    const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');

    const authHeader = req.headers.authorization || '';
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : '';
    if (!token) return json(res, 401, { error: 'missing_token' });

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await authClient.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return json(res, 401, { error: 'invalid_token' });

    const svc = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const batch = (typeof req.body === 'string' ? (JSON.parse(req.body) as IncomingBatch) : (req.body as IncomingBatch)) ?? {
      items: [],
    };
    const items = Array.isArray(batch.items) ? batch.items : [];

    const normalized = items
      .map((it): { id: string; table: string; op: 'upsert' | 'delete'; row: Record<string, unknown> } | null => {
        if (!it || typeof (it as any).id !== 'string') return null;
        if ('table' in it) {
          const table = typeof it.table === 'string' ? it.table : '';
          const op = it.op === 'delete' ? 'delete' : 'upsert';
          const row = it.row && typeof it.row === 'object' ? (it.row as Record<string, unknown>) : {};
          return table ? { id: it.id, table, op, row } : null;
        }
        const legacyTable = tableFromLegacyType((it as any).type);
        if (!legacyTable) return null;
        const row = (it as any).data && typeof (it as any).data === 'object' ? ((it as any).data as Record<string, unknown>) : {};
        return { id: it.id, table: legacyTable, op: 'upsert', row };
      })
      .filter(Boolean) as { id: string; table: string; op: 'upsert' | 'delete'; row: Record<string, unknown> }[];

    // Validate tenant ownership for all tenantIds in batch
    const tenantIds = Array.from(
      new Set(
        normalized
          .map((n) => extractTenantId(n.row))
          .filter((x): x is string => typeof x === 'string' && x.length > 0),
      ),
    );
    if (tenantIds.length === 0) {
      return json(res, 400, { error: 'missing_tenant_id_in_rows' });
    }

    const { data: ownedTenants, error: ownedErr } = await svc
      .from('tenants')
      .select('id')
      .eq('owner_user_id', userId)
      .in('id', tenantIds);
    if (ownedErr) return json(res, 500, { error: 'tenant_check_failed', detail: ownedErr.message });

    const owned = new Set((ownedTenants ?? []).map((t: any) => t.id));
    for (const tid of tenantIds) {
      if (!owned.has(tid)) return json(res, 403, { error: 'forbidden_tenant', tenantId: tid });
    }

    const results: Array<{ id: string; status: 'ok' | 'retry' | 'conflict' | 'failed'; message?: string }> = [];

    // Write per item (kept simple; can be optimized later with bulk per table)
    for (const n of normalized) {
      try {
        const tenant_id = extractTenantId(n.row);
        const business_id = extractBusinessId(n.row);
        if (!tenant_id) {
          results.push({ id: n.id, status: 'failed', message: 'missing_tenant_id' });
          continue;
        }

        if (n.op === 'delete') {
          const { error } = await svc
            .from(n.table)
            .upsert({ id: n.id, tenant_id, business_id: business_id ?? null, data: n.row, deleted_at: new Date().toISOString() }, { onConflict: 'id' });
          if (error) throw error;
          results.push({ id: n.id, status: 'ok' });
          continue;
        }

        const { error } = await svc
          .from(n.table)
          .upsert({ id: n.id, tenant_id, business_id: business_id ?? null, data: n.row, deleted_at: null }, { onConflict: 'id' });
        if (error) throw error;
        results.push({ id: n.id, status: 'ok' });
      } catch (e: any) {
        results.push({ id: n.id, status: 'retry', message: e?.message || 'write_failed' });
      }
    }

    return json(res, 200, { results });
  } catch (e: any) {
    return json(res, 500, { error: 'server_error', detail: e?.message || String(e) });
  }
}

