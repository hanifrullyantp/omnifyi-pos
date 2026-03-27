import { db, type ActivityLog } from './db';

export const ACTIVITY_ACTION_FILTERS = [
  'ALL',
  'CLOCK_IN',
  'CLOCK_OUT',
  'CREATE_TRANSACTION',
  'VOID_TRANSACTION',
  'CREATE_PRODUCT',
  'UPDATE_PRODUCT',
  'DELETE_PRODUCT',
  'UPDATE_STOCK',
  'MATERIAL_RESTOCK',
  'FINANCE_ENTRY',
  'SETTINGS_UPDATE',
  'SHIFT_OPEN',
  'SHIFT_CLOSE',
] as const;

export type ActivityActionFilter = (typeof ACTIVITY_ACTION_FILTERS)[number];

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  CLOCK_IN: 'Clock-in kasir',
  CLOCK_OUT: 'Clock-out kasir',
  CREATE_TRANSACTION: 'Transaksi dibuat',
  VOID_TRANSACTION: 'Transaksi void',
  CREATE_PRODUCT: 'Produk ditambah',
  UPDATE_PRODUCT: 'Produk diubah',
  DELETE_PRODUCT: 'Produk dihapus',
  UPDATE_STOCK: 'Stok diupdate',
  MATERIAL_RESTOCK: 'Bahan di-restock',
  FINANCE_ENTRY: 'Entri keuangan',
  SETTINGS_UPDATE: 'Pengaturan diubah',
  SHIFT_OPEN: 'Shift dibuka',
  SHIFT_CLOSE: 'Shift ditutup',
};

type LogInput = Omit<ActivityLog, 'id' | 'createdAt'> & { id?: string; createdAt?: Date };

export async function logActivity(params: LogInput): Promise<void> {
  await db.activityLogs.add({
    id: params.id ?? crypto.randomUUID(),
    tenantId: params.tenantId,
    businessId: params.businessId,
    actorType: params.actorType,
    actorId: params.actorId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    description: params.description,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    createdAt: params.createdAt ?? new Date(),
  });
}

export function formatActivityAction(action: string): string {
  return ACTIVITY_ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}
