import { supabase } from '@/lib/supabaseClient';

export interface InventoryStock {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  currentStock: number;
  totalKeluarTahun: number;
  monthlyAvgSales: number;
  unit: string;
  status: 'aman' | 'kurang';
}

export interface UpsertInventoryPayload {
  item_code: string;
  item_name: string;
  category?: string;
  current_stock: number;
  total_keluar: number;
  monthly_avg_sales: number;
  unit?: string;
}

export interface StockUpdatePayload {
  item_code: string;
  current_stock: number;
}

export const ppicService = {
  /**
   * Mengambil seluruh data stok inventaris dari Supabase tanpa batasan 1000 data
   */
  async getAll(): Promise<InventoryStock[]> {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('ppic_inventory')
        .select('*')
        .order('item_code', { ascending: true })
        .range(from, from + step - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < step) {
          hasMore = false;
        } else {
          from += step;
        }
      } else {
        hasMore = false;
      }
    }

    return allData.map((row: any) => ({
      id: String(row.id),
      itemCode: row.item_code || '',
      itemName: row.item_name || '',
      category: row.category || 'General',
      currentStock: Number(row.current_stock) || 0,
      totalKeluarTahun: Number(row.total_keluar) || 0,
      monthlyAvgSales: Number(row.monthly_avg_sales) || 0,
      unit: row.unit || 'Pcs',
      status: (row.status as 'aman' | 'kurang') || 'aman',
    }));
  },

  /**
   * Menyimpan / memperbarui daftar stok dalam jumlah banyak (initial import)
   */
  async bulkUpsert(items: UpsertInventoryPayload[]): Promise<number> {
    const { error } = await supabase
      .from('ppic_inventory')
      .upsert(items, { onConflict: 'item_code' });

    if (error) {
      console.error('Supabase Upsert Error:', error);
      throw new Error(error.message || 'Gagal menyimpan data ke database Supabase');
    }

    return items.length;
  },

  /**
   * Sinkronisasi Stok Saja:
   * Hanya mencocokkan kode barang dan memperbarui angka `current_stock`.
   */
  async syncStockOnly(
    incomingStocks: StockUpdatePayload[]
  ): Promise<{ updatedCount: number; matchedCount: number; ignoredCount: number }> {
    if (incomingStocks.length === 0) {
      return { updatedCount: 0, matchedCount: 0, ignoredCount: 0 };
    }

    let allExisting: { id: string; item_code: string; current_stock: number }[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('ppic_inventory')
        .select('id, item_code, current_stock')
        .range(from, from + step - 1);

      if (error) {
        console.error('Gagal mengambil data existing:', error);
        throw new Error(error.message || 'Gagal mengambil data pembanding di database');
      }

      if (data && data.length > 0) {
        allExisting = [...allExisting, ...data];
        if (data.length < step) {
          hasMore = false;
        } else {
          from += step;
        }
      } else {
        hasMore = false;
      }
    }

    const existingMap = new Map<string, { id: string; current_stock: number }>();
    allExisting.forEach((item) => {
      if (item.item_code) {
        existingMap.set(item.item_code.trim().toLowerCase(), {
          id: item.id,
          current_stock: Number(item.current_stock) || 0,
        });
      }
    });

    const itemsToUpdate: { id: string; current_stock: number }[] = [];
    let matchedCount = 0;
    let ignoredCount = 0;

    incomingStocks.forEach((inc) => {
      const target = existingMap.get(inc.item_code.trim().toLowerCase());
      if (target) {
        matchedCount++;
        if (target.current_stock !== inc.current_stock) {
          itemsToUpdate.push({
            id: target.id,
            current_stock: inc.current_stock,
          });
        }
      } else {
        ignoredCount++;
      }
    });

    if (itemsToUpdate.length === 0) {
      return { updatedCount: 0, matchedCount, ignoredCount };
    }

    const BATCH_SIZE = 50;
    for (let i = 0; i < itemsToUpdate.length; i += BATCH_SIZE) {
      const batch = itemsToUpdate.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((item) =>
          supabase
            .from('ppic_inventory')
            .update({
              current_stock: item.current_stock,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id)
        )
      );
    }

    return {
      updatedCount: itemsToUpdate.length,
      matchedCount,
      ignoredCount,
    };
  },

  /**
   * Memperbarui detail satu data barang
   */
  async updateItem(
    id: string,
    payload: {
      itemCode: string;
      itemName: string;
      category?: string;
      currentStock: number;
      monthlyAvgSales: number;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('ppic_inventory')
      .update({
        item_code: payload.itemCode,
        item_name: payload.itemName,
        category: payload.category || 'General',
        current_stock: payload.currentStock,
        monthly_avg_sales: payload.monthlyAvgSales,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Menghapus satu item barang berdasarkan ID
   */
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('ppic_inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};