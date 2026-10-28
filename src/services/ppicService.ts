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

export const ppicService = {
  /**
   * Mengambil seluruh data stok inventaris dari Supabase tanpa batas 1000 data
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
    }));
  },

  /**
   * Menyimpan / memperbarui daftar stok dalam jumlah banyak (Upsert dari file Excel)
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
   * Memperbarui detail satu data barang
   */
  async updateItem(
    id: string,
    payload: {
      itemCode: string;
      itemName: string;
      currentStock: number;
      monthlyAvgSales: number;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('ppic_inventory')
      .update({
        item_code: payload.itemCode,
        item_name: payload.itemName,
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