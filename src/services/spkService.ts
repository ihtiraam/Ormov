import { supabase } from '@/lib/supabaseClient';

export type ItemStatus = 'BELUM_SELESAI' | 'HAMPIR_SELESAI' | 'SELESAI';

export interface SPKSimple {
  id: string;
  doc_number: string;
  handover_date: string;
  purpose_notes: string | null;
  completion_notes: string | null;
  item_status: ItemStatus;
  is_finished: boolean;
  label_text?: string | null;   // Tambahan untuk label kustom
  label_color?: string | null;  // Tambahan untuk warna label
  created_at: string;
  updated_at?: string;
}

// 1. Ambil SPK Aktif (Belum Selesai)
export async function getActiveSPK() {
  const { data, error } = await supabase
    .from('spk_simple')
    .select('*')
    .eq('is_finished', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// 2. Ambil SPK Arsip (Sudah Selesai)
export async function getFinishedSPK() {
  const { data, error } = await supabase
    .from('spk_simple')
    .select('*')
    .eq('is_finished', true)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// 3. Buat SPK Baru (Mendukung Label & Warna)
export async function createSPK(
  docNumber: string,
  handoverDate: string,
  purposeNotes: string,
  labelText?: string,
  labelColor?: string
) {
  const { error } = await supabase.from('spk_simple').insert([
    {
      doc_number: docNumber,
      handover_date: handoverDate,
      purpose_notes: purposeNotes,
      item_status: 'BELUM_SELESAI',
      is_finished: false,
      label_text: labelText?.trim() || null,
      label_color: labelColor || null,
    },
  ]);

  if (error) throw new Error(error.message);
}

// 4. Update Status SPK
export async function updateSPKStatus(id: string, status: ItemStatus, notes: string) {
  const isFinished = status === 'SELESAI';
  const { error } = await supabase
    .from('spk_simple')
    .update({
      item_status: status,
      completion_notes: status === 'HAMPIR_SELESAI' ? notes : status === 'SELESAI' ? notes : null,
      is_finished: isFinished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// 5. Hapus SPK
export async function deleteSPK(id: string) {
  const { error } = await supabase.from('spk_simple').delete().eq('id', id);
  if (error) throw new Error(error.message);
}