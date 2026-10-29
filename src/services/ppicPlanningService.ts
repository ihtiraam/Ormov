import { supabase } from '@/lib/supabaseClient';

export interface PlanningItem {
  id: string;
  inventory_id: string;
  item_code: string;
  item_name: string;
  current_stock: number;
  avg_usage_monthly: number;
  target_months: number;
  suggested_production: number;
  status: 'pending' | 'scheduled' | 'completed';
  synced_at?: string;
}

export const ppicPlanningService = {
  /**
   * Mengambil data yang saat ini tersimpan di tabel ppic_planning_items
   */
  async getPlanningItems(): Promise<PlanningItem[]> {
    const { data, error } = await supabase
      .from('ppic_planning_items')
      .select('*')
      .order('item_code', { ascending: true });

    if (error) {
      console.error('Error fetching planning items:', error.message);
      throw error;
    }

    return (data as PlanningItem[]) || [];
  },

  /**
   * Mengambil data dari ppic_inventory dengan status = 'kurang',
   * menghitung saran produksi, lalu menyimpannya ke ppic_planning_items
   */
  async syncDeficitInventory(targetMonths: number = 1): Promise<PlanningItem[]> {
    // 1. Ambil data barang dari ppic_inventory yang statusnya 'kurang'
    const { data: deficitItems, error: fetchError } = await supabase
      .from('ppic_inventory')
      .select('id, item_code, item_name, current_stock, monthly_avg_sales, status')
      .eq('status', 'kurang');

    if (fetchError) {
      console.error('Error fetching deficit inventory:', fetchError.message);
      throw fetchError;
    }

    if (!deficitItems || deficitItems.length === 0) {
      // Kosongkan snapshot jika tidak ada barang berstatus kurang
      await supabase
        .from('ppic_planning_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      return [];
    }

    // 2. Petakan data dan hitung kebutuhan produksi
    const recordsToInsert = deficitItems.map((item) => {
      const avg = Number(item.monthly_avg_sales) || 0;
      const stock = Number(item.current_stock) || 0;
      const mustProduce = Math.max(0, Math.ceil(avg * targetMonths - stock));

      return {
        inventory_id: item.id,
        item_code: item.item_code,
        item_name: item.item_name,
        current_stock: stock,
        avg_usage_monthly: avg,
        target_months: targetMonths,
        suggested_production: mustProduce,
        status: 'pending' as const,
        synced_at: new Date().toISOString(),
      };
    });

    // 3. Bersihkan snapshot lama sebelum menyimpan data sinkronisasi baru
    const { error: deleteError } = await supabase
      .from('ppic_planning_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Error clearing old planning items:', deleteError.message);
      throw deleteError;
    }

    // 4. Masukkan data hasil kalkulasi baru
    const { data: insertedData, error: insertError } = await supabase
      .from('ppic_planning_items')
      .insert(recordsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting planning items:', insertError.message);
      throw insertError;
    }

    return (insertedData as PlanningItem[]) || [];
  },
};