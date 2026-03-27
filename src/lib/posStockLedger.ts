import { db, type TransactionItem } from './db';

type SaleLine = { productId: string; quantity: number };

/** Kurangi stok produk + bahan baku (resep) setelah penjualan. */
export async function applySaleStockDeduction(lines: SaleLine[]): Promise<void> {
  for (const line of lines) {
    const product = await db.products.get(line.productId);
    if (product) {
      await db.products.update(line.productId, {
        stockQuantity: Math.max(0, product.stockQuantity - line.quantity),
      });
    }

    const comps = await db.productMaterials.where('productId').equals(line.productId).toArray();
    for (const pm of comps) {
      const mat = await db.materials.get(pm.materialId);
      if (!mat) continue;
      const deduct = pm.quantityUsed * line.quantity;
      await db.materials.update(pm.materialId, {
        stockQuantity: Math.max(0, mat.stockQuantity - deduct),
      });
    }
  }
}

/** Kembalikan stok produk + bahan baku saat void transaksi. */
export async function restoreSaleStockFromItems(txItems: TransactionItem[]): Promise<void> {
  for (const item of txItems) {
    const product = await db.products.get(item.productId);
    if (product) {
      await db.products.update(item.productId, {
        stockQuantity: product.stockQuantity + item.quantity,
      });
    }

    const comps = await db.productMaterials.where('productId').equals(item.productId).toArray();
    for (const pm of comps) {
      const mat = await db.materials.get(pm.materialId);
      if (!mat) continue;
      const restore = pm.quantityUsed * item.quantity;
      await db.materials.update(pm.materialId, {
        stockQuantity: mat.stockQuantity + restore,
      });
    }
  }
}
