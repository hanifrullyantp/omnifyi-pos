import type { User, Tenant, Business } from './db';
import { db } from './db';
import { getSupabase } from './supabaseClient';

export async function provisionTenantAndBusiness(opts?: { businessName?: string }) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase env missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
  const { data, error } = await supabase.rpc('provision_tenant', {
    business_name: opts?.businessName ?? 'Usaha Baru',
  });
  if (error) throw error;
  // RPC returns a 1-row table.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.tenant_id || !row?.business_id) throw new Error('provision_failed');
  return { tenantId: row.tenant_id as string, businessId: row.business_id as string };
}

export async function ensureLocalCoreRows(params: {
  userId: string;
  email: string;
  tenantId: string;
  businessId: string;
  businessName?: string;
}) {
  const now = new Date();
  const user: User = {
    id: params.userId,
    name: params.email.split('@')[0] ?? 'Owner',
    email: params.email,
    passwordHash: '',
    role: 'OWNER',
    createdAt: now,
  };
  const tenant: Tenant = {
    id: params.tenantId,
    ownerId: params.userId,
    name: 'Tenant',
    slug: `t-${params.tenantId.slice(0, 8)}`,
    subscriptionPlan: 'PRO',
    isActive: true,
    createdAt: now,
  };
  const business: Business = {
    id: params.businessId,
    tenantId: params.tenantId,
    name: params.businessName ?? 'Usaha Baru',
    taxPercentage: 0,
    serviceChargePercentage: 0,
    isActive: true,
    createdAt: now,
  };

  await db.users.put(user);
  await db.tenants.put(tenant);
  await db.businesses.put(business);

  return { user, tenant, business };
}

