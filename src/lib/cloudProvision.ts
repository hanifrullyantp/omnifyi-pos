import type { User, Tenant, Business } from './db';
import { db, SUPER_ADMIN_EMAIL, seedFinanceAccountsForBusiness } from './db';
import { getSupabase } from './supabaseClient';

function isPlatformSuperAdminEmail(email: string) {
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

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
  const emailNorm = params.email.trim().toLowerCase();
  const isSuper = isPlatformSuperAdminEmail(emailNorm);
  const businessName = isSuper
    ? 'Kantor Pusat'
    : (params.businessName ?? 'Usaha Baru');

  const user: User = {
    id: params.userId,
    name: isSuper ? 'Hanif Super Admin' : (params.email.split('@')[0] ?? 'Owner'),
    email: emailNorm,
    passwordHash: '',
    role: isSuper ? 'ADMIN_SYSTEM' : 'OWNER',
    createdAt: now,
  };
  const tenant: Tenant = {
    id: params.tenantId,
    ownerId: params.userId,
    name: isSuper ? 'Administrasi Platform' : 'Tenant',
    slug: isSuper ? 'platform-admin' : `t-${params.tenantId.slice(0, 8)}`,
    subscriptionPlan: isSuper ? 'ENTERPRISE' : 'PRO',
    isActive: true,
    createdAt: now,
  };
  const business: Business = {
    id: params.businessId,
    tenantId: params.tenantId,
    name: businessName,
    taxPercentage: 0,
    serviceChargePercentage: 0,
    isActive: true,
    createdAt: now,
  };

  await db.users.put(user);
  await db.tenants.put(tenant);
  await db.businesses.put(business);

  if (isSuper) await seedFinanceAccountsForBusiness(params.businessId, params.tenantId);

  return { user, tenant, business };
}

