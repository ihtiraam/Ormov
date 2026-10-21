'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Search, RefreshCw, SlidersHorizontal, ChevronRight, CalendarDays, ClipboardList, Trash2,
} from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
import AddSPKModal from '@/components/AddSPKModal';
import StatusConfigModal from '@/components/StatusConfigModal';
import DetailDrawer from '@/components/DetailDrawer';
import DateRangeFilter from '@/components/DateRangeFilter';
import Navbar from '@/components/Navbar';
import DeleteConfirmModal from '@/components/DeleteConfirmModal'; // <-- Import modal hapus

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

type ItemStatus = 'BELUM_SELESAI' | 'HAMPIR_SELESAI' | 'SELESAI';

interface SPKSimple {
  id: string;
  doc_number: string;
  handover_date: string;
  purpose_notes: string | null;
  completion_notes: string | null;
  item_status: ItemStatus;
  is_finished: boolean;
  created_at: string;
}

type Filter = 'SEMUA' | ItemStatus;

const STALE_DAYS = 14;

const STATUS: Record<ItemStatus, { label: string; step: number; text: string; bg: string; bar: string }> = {
  BELUM_SELESAI: { label: 'Belum selesai', step: 1, text: 'text-[#9A5B0B]', bg: 'bg-[#FBEFD5]', bar: 'bg-[#D98E1F]' },
  HAMPIR_SELESAI: { label: 'Hampir selesai', step: 2, text: 'text-[#2D4FB3]', bg: 'bg-[#E4EAFB]', bar: 'bg-[#3F63D6]' },
  SELESAI: { label: 'Selesai', step: 3, text: 'text-[#0B6B4F]', bg: 'bg-[#DDF3EA]', bar: 'bg-[#16976F]' },
};

const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function ProgressTrack({ status }: { status: ItemStatus }) {
  const s = STATUS[status];
  return (
    <div className="flex gap-1" role="img" aria-label={`Tahap ${s.step} dari 3: ${s.label}`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`h-1.5 w-8 rounded-full ${n <= s.step ? s.bar : 'bg-[#DDE4E1]'}`} />
      ))}
    </div>
  );
}

export default function ORMOVMainDashboard() {
  const [data, setData] = useState<SPKSimple[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filter, setFilter] = useState<Filter>('SEMUA');

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [detailItem, setDetailItem] = useState<SPKSimple | null>(null);
  const [configItem, setConfigItem] = useState<SPKSimple | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // State untuk modal hapus
  const [deleteTarget, setDeleteTarget] = useState<SPKSimple | null>(null);

  const fetchActiveSPK = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('spk_simple')
      .select('*')
      .eq('is_finished', false)
      .order('created_at', { ascending: false });
    if (result) setData(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveSPK();
    const channel = supabase
      .channel('spk_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spk_simple' }, fetchActiveSPK)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateSPK = async (docNumber: string, handoverDate: string, purposeNotes: string) => {
    await supabase.from('spk_simple').insert([
      {
        doc_number: docNumber,
        handover_date: handoverDate,
        purpose_notes: purposeNotes,
        item_status: 'BELUM_SELESAI',
        is_finished: false,
      },
    ]);
    setIsAddModalOpen(false);
    fetchActiveSPK();
  };

  const handleUpdateStatus = async (status: ItemStatus, notes: string) => {
    if (!configItem) return;
    const { error } = await supabase
      .from('spk_simple')
      .update({
        item_status: status,
        completion_notes: status === 'HAMPIR_SELESAI' ? notes : null,
        is_finished: status === 'SELESAI',
      })
      .eq('id', configItem.id);

    if (error) alert(error.message);
    else {
      setConfigItem(null);
      fetchActiveSPK();
    }
  };

  // Eksekusi hapus setelah konfirmasi modal
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const { error } = await supabase.from('spk_simple').delete().eq('id', deleteTarget.id);
    if (error) {
      alert('Gagal menghapus data: ' + error.message);
    } else {
      setDeleteTarget(null);
      fetchActiveSPK();
    }
  };

  const counts = useMemo(
    () => ({
      SEMUA: data.length,
      BELUM_SELESAI: data.filter((d) => d.item_status === 'BELUM_SELESAI').length,
      HAMPIR_SELESAI: data.filter((d) => d.item_status === 'HAMPIR_SELESAI').length,
      SELESAI: data.filter((d) => d.item_status === 'SELESAI').length,
    }),
    [data],
  );

  const filteredData = data.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.doc_number.toLowerCase().includes(q) || (item.purpose_notes && item.purpose_notes.toLowerCase().includes(q));
    const matchFilter = filter === 'SEMUA' || item.item_status === filter;

    let matchDate = true;
    if (startDate && item.handover_date < startDate) matchDate = false;
    if (endDate && item.handover_date > endDate) matchDate = false;

    return matchSearch && matchFilter && matchDate;
  });

  const tabs: { key: Filter; label: string }[] = [
    { key: 'SEMUA', label: 'Semua' },
    { key: 'BELUM_SELESAI', label: 'Belum selesai' },
    { key: 'HAMPIR_SELESAI', label: 'Hampir selesai' },
  ];

  const focus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';

  return (
    <div className={`${body.className} min-h-screen bg-[#F1F4F2] text-[#12292D]`}>
      <style>{`
        @keyframes ormov-drawer { from { transform: translateX(24px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes ormov-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ormov-pop { from { transform: translateY(12px) scale(.98); opacity: 0 } to { transform: none; opacity: 1 } }
        .ormov-drawer { animation: ormov-drawer .22s ease-out }
        .ormov-fade { animation: ormov-fade .18s ease-out }
        .ormov-pop { animation: ormov-pop .2s ease-out }
        @media (prefers-reduced-motion: reduce) { .ormov-drawer, .ormov-fade, .ormov-pop { animation: none } }
      `}</style>

      <Navbar variant="main" onOpenAddModal={() => setIsAddModalOpen(true)} />

      <main className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <section className="flex flex-col gap-6 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-[#5B7276]">Monitoring SPK / MUTASI aktif</p>
            <h1 className={`${display.className} mt-1 flex items-baseline gap-3 text-5xl font-extrabold tracking-tight md:text-6xl`}>
              {loading && data.length === 0 ? '–' : counts.SEMUA}
              <span className="text-xl font-medium text-[#5B7276] md:text-2xl">SPK / MUTASI sedang berjalan</span>
            </h1>
          </div>

          {counts.SEMUA > 0 && (
            <div className="w-full md:w-80">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-[#DDE4E1]" aria-hidden>
                <div className={`${STATUS.BELUM_SELESAI.bar}`} style={{ width: `${(counts.BELUM_SELESAI / counts.SEMUA) * 100}%` }} />
                <div className={`${STATUS.HAMPIR_SELESAI.bar}`} style={{ width: `${(counts.HAMPIR_SELESAI / counts.SEMUA) * 100}%` }} />
              </div>
              <div className="mt-2.5 flex justify-between text-sm text-[#44595D]">
                <span className="inline-flex items-center gap-1.5">
                  <i className={`h-2 w-2 rounded-full ${STATUS.BELUM_SELESAI.bar}`} /> {counts.BELUM_SELESAI} belum selesai
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className={`h-2 w-2 rounded-full ${STATUS.HAMPIR_SELESAI.bar}`} /> {counts.HAMPIR_SELESAI} hampir selesai
                </span>
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Filter status" className="flex flex-wrap gap-1.5">
            {tabs.map((t) => {
              const active = filter === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(t.key)}
                  className={`${focus} inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? 'bg-[#10262B] text-white' : 'bg-white text-[#44595D] ring-1 ring-[#D5DEDB] hover:ring-[#9DB0B3]'
                  }`}
                >
                  {t.label}
                  <span className={`text-xs ${active ? 'text-white/60' : 'text-[#7F9296]'}`}>{counts[t.key]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />

            <div className="relative flex-1 lg:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F9296]" />
              <input
                type="text"
                placeholder="Cari nomor SPK atau tujuan"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${focus} w-full rounded-full bg-white py-2.5 pl-10 pr-4 text-sm ring-1 ring-[#D5DEDB] placeholder:text-[#8FA0A3]`}
              />
            </div>
            <button
              onClick={fetchActiveSPK}
              aria-label="Muat ulang data"
              className={`${focus} grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#44595D] ring-1 ring-[#D5DEDB] transition hover:ring-[#9DB0B3]`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-[#D5DEDB]">
          <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.8fr)_200px_auto] gap-6 border-b border-[#E4EAE7] bg-[#F7F9F8] px-6 py-3 text-xs font-medium text-[#6A7E82] md:grid">
            <span>SPK</span>
            <span>Tujuan</span>
            <span>Status</span>
            <span className="w-36 text-right">Aksi</span>
          </div>

          {loading && data.length === 0 ? (
            <ul aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex animate-pulse items-center gap-6 border-b border-[#EEF2F0] px-6 py-5 last:border-0">
                  <div className="h-4 w-32 rounded bg-[#E4EAE7]" />
                  <div className="h-4 flex-1 rounded bg-[#EEF2F0]" />
                  <div className="h-4 w-24 rounded bg-[#E4EAE7]" />
                </li>
              ))}
            </ul>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#E6EFEC] text-[#0F766E]">
                <ClipboardList className="h-6 w-6" />
              </div>
              <p className={`${display.className} mt-4 text-lg font-bold`}>
                {data.length === 0 ? 'Belum ada SPK aktif' : 'Tidak ada SPK yang cocok'}
              </p>
              <p className="mt-1 max-w-sm text-sm text-[#5B7276]">
                {data.length === 0
                  ? 'Buat SPK baru untuk mulai memantau penyerahan barang.'
                  : 'Coba kata kunci lain atau ganti filter status / tanggal.'}
              </p>
            </div>
          ) : (
            <ul>
              {filteredData.map((item) => {
                const s = STATUS[item.item_status];
                const days = daysSince(item.handover_date);
                const stale = days >= STALE_DAYS;
                return (
                  <li
                    key={item.id}
                    className="grid gap-x-6 gap-y-3 border-b border-[#EEF2F0] px-5 py-5 transition-colors last:border-0 hover:bg-[#F7F9F8] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.8fr)_200px_auto] md:items-center md:px-6"
                  >
                    <div className="min-w-0">
                      <p className={`${display.className} truncate text-lg font-bold leading-tight`}>{item.doc_number}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-[#5B7276]">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" /> {fmtDate(item.handover_date)}
                        </span>
                        <span className={stale ? 'font-semibold text-[#B4402B]' : ''}>
                          {days === 0 ? 'hari ini' : `${days} hari lalu`}
                        </span>
                      </p>
                    </div>

                    <p className="line-clamp-2 text-sm leading-relaxed text-[#2B4045]">{item.purpose_notes || '–'}</p>

                    <div className="flex flex-col gap-2">
                      {item.item_status === 'HAMPIR_SELESAI' ? (
                        <button
                          onClick={() => setDetailItem(item)}
                          className={`${focus} group inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}
                        >
                          {s.label}
                          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                        </button>
                      ) : (
                        <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
                          {s.label}
                        </span>
                      )}
                      <ProgressTrack status={item.item_status} />
                    </div>

                    <div className="flex items-center justify-end gap-2 md:w-36">
                      <button
                        onClick={() => setConfigItem(item)}
                        className={`${focus} inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#10262B] ring-1 ring-[#C5D1CE] transition hover:bg-[#10262B] hover:text-white hover:ring-[#10262B]`}
                        title="Ubah Status"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" /> <span className="md:hidden">Ubah</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className={`${focus} inline-flex items-center justify-center rounded-lg p-2 text-[#B4402B] ring-1 ring-[#F2D6D0] transition hover:bg-[#FBE8E5]`}
                        title="Hapus SPK"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-4 text-xs text-[#7F9296]">
          Data diperbarui otomatis. Tanggal berwarna merah menandai SPK yang sudah berjalan {STALE_DAYS} hari atau lebih.
        </p>
      </main>

      <DetailDrawer
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onOpenConfig={(item) => setConfigItem(item)}
      />

      <StatusConfigModal item={configItem} onClose={() => setConfigItem(null)} onSave={handleUpdateStatus} />
      <AddSPKModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleCreateSPK} />

      {/* Modal Konfirmasi Hapus */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        docNumber={deleteTarget?.doc_number || ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}