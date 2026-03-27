import { db, type Product, type Transaction, type TransactionItem } from './db';

export type SyncQueueItem = {
  id: string;
  type: 'transaction' | 'product' | 'stock';
  data: Transaction | Product | Record<string, unknown>;
  createdAt: Date;
  retryCount: number;
};

type SyncResultRow = {
  id: string;
  status: 'ok' | 'retry' | 'conflict' | 'failed';
  message?: string;
  serverData?: Record<string, unknown>;
};

type SyncBatchResponse = {
  results: SyncResultRow[];
};

const DEFAULT_SYNC_ENDPOINT = '/api/sync/batch';
const MAX_RETRY_COUNT = 5;

function endpointUrl() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return env?.VITE_SYNC_ENDPOINT || DEFAULT_SYNC_ENDPOINT;
}

function backoffMs(retryCount: number) {
  const capped = Math.min(retryCount, MAX_RETRY_COUNT);
  return Math.min(30_000, 1_000 * 2 ** capped);
}

async function applyServerWinsConflict(item: SyncQueueItem, serverData?: Record<string, unknown>) {
  if (!serverData) return;
  if (item.type === 'transaction') {
    const tx = (serverData.transaction ?? serverData.tx) as Transaction | undefined;
    const items = (serverData.items ?? serverData.transactionItems) as TransactionItem[] | undefined;
    if (tx?.id) await db.transactions.put(tx);
    if (items?.length) await db.transactionItems.bulkPut(items);
    return;
  }

  if (item.type === 'product' || item.type === 'stock') {
    const product = (serverData.product ?? serverData.item) as Product | undefined;
    if (product?.id) await db.products.put(product);
  }
}

export async function syncPendingBatch(items: SyncQueueItem[]) {
  if (!items.length) {
    return { succeeded: [] as string[], retry: [] as string[] };
  }

  const payload = {
    sentAt: new Date().toISOString(),
    strategy: 'server_wins',
    items: items.map((it) => ({
      id: it.id,
      type: it.type,
      data: it.data,
      createdAt: new Date(it.createdAt).toISOString(),
      retryCount: it.retryCount,
    })),
  };

  try {
    const res = await fetch(endpointUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`SYNC_HTTP_${res.status}`);
    }

    const body = (await res.json()) as SyncBatchResponse;
    const byId = new Map(body.results.map((r) => [r.id, r]));
    const succeeded: string[] = [];
    const retry: string[] = [];

    for (const item of items) {
      const row = byId.get(item.id);
      if (!row || row.status === 'ok') {
        succeeded.push(item.id);
        continue;
      }

      if (row.status === 'conflict') {
        await applyServerWinsConflict(item, row.serverData);
        succeeded.push(item.id);
        continue;
      }

      if (row.status === 'retry') {
        retry.push(item.id);
        continue;
      }

      // failed -> keep for retry with backoff
      retry.push(item.id);
    }

    return { succeeded, retry };
  } catch {
    // Network/server unavailable: retry all in next cycle.
    return { succeeded: [] as string[], retry: items.map((i) => i.id) };
  }
}

export { backoffMs, MAX_RETRY_COUNT };
