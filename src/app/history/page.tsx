'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, RefreshCw, Clock, AlertCircle, CheckCircle2, SlidersHorizontal, X, CalendarDays, Archive, Trash2 } from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
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

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';

const OPTIONS: {
  key: ItemStatus; label: string; Icon: typeof Clock;
  on: string; icon: string;
}[] = [
  { key: 'BELUM_SELESAI', label: 'Belum selesai', Icon: Clock, on: 'border-[#D98E1F] bg-[#FBEFD5] text-[#7A4708]', icon: 'text-[#D98E1F]' },
  { key: 'HAMPIR_SELESAI', label: 'Hampir selesai', Icon: AlertCircle, on: 'border-[#3F63D6] bg-[#E4EAFB] text-[#223F96]', icon: 'text-[#3F63D6]' },
  { key: 'SELESAI', label: 'Sudah selesai', Icon: CheckCircle2, on: 'border-[#16976F] bg-[#DDF3EA] text-[#0B5A42]', icon: 'text-[#16976F]' },
];

export default function ORMOVHistoryPage() {
  const [data, setData] = useState<SPKSimple[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [configItem, setConfigItem] = useState<SPKSimple | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus>('BELUM_SELESAI');
  const [completionNotesInput, setCompletionNotesInput] = useState<string>('');
  const [notesError, setNotesError] = useState<boolean>(false);

  // State untuk modal hapus
  const [deleteTarget, setDeleteTarget] = useState<SPKSimple | null>(null);

  const fetchFinishedSPK = async () => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from('spk_simple')
      .select('*')
      .eq('is_finished', true)
      .order('created_at', { ascending: false });

    if (!error && result) setData(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchFinishedSPK();
  }, []);

  useEffect(() => {
    if (!configItem) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setConfigItem(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [configItem]);

  const handleRestoreStatus = async () => {
    if (!configItem) return;

    if (selectedStatus === 'HAMPIR_SELESAI' && !completionNotesInput.trim()) {
      setNotesError(true);
      return;
    }

    const isFinished = selectedStatus === 'SELESAI';

    const { error } = await supabase
      .from('spk_simple')
      .update({
        item_status: selectedStatus,
        completion_notes:
          selectedStatus === 'HAMPIR_SELESAI' ? completionNotesInput : selectedStatus === 'BELUM_SELESAI' ? null : completionNotesInput,
        is_finished: isFinished,
      })
      .eq('id', configItem.id);

    if (error) {
      alert('Gagal memperbarui status: ' + error.message);
    } else {
      setConfigItem(null);
      fetchFinishedSPK();
    }
  };

  // Eksekusi hapus di arsip
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const { error } = await supabase.from('spk_simple').delete().eq('id', deleteTarget.id);
    if (error) {
      alert('Gagal menghapus data: ' + error.message);
    } else {
      setDeleteTarget(null);
      fetchFinishedSPK();
    }
  };

  const openConfig = (item: SPKSimple) => {
    setConfigItem(item);
    setSelectedStatus(item.item_status);
    setCompletionNotesInput(item.completion_notes || '');
    setNotesError(false);
  };

  const filteredData = data.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.doc_number.toLowerCase().includes(q) ||
      (item.purpose_notes && item.purpose_notes.toLowerCase().includes(q)) ||
      (item.completion_notes && item.completion_notes.toLowerCase().includes(q));

    let matchesDate = true;
    if (startDate && item.handover_date < startDate) matchesDate = false;
    if (endDate && item.handover_date > endDate) matchesDate = false;

    return matchesSearch && matchesDate;
  });

  const hasFilter = !!(searchTerm || startDate || endDate);
  const goesBack = selectedStatus !== 'SELESAI';

  const focus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';
  const field = `${focus} rounded-full bg-white px-4 py-2.5 text-sm ring-1 ring-[#D5DEDB] placeholder:text-[#8FA0A3]`;

  return (
    <div className={`${body.className} min-h-screen bg-[#F1F4F2] text-[#12292D]`}>
      <style>{`
        @keyframes ormov-pop { from { transform: translateY(12px) scale(.98); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes ormov-fade { from { opacity: 0 } to { opacity: 1 } }
        .ormov-pop { animation: ormov-pop .2s ease-out }
        .ormov-fade { animation: ormov-fade .18s ease-out }
        @media (prefers-reduced-motion: reduce) { .ormov-pop, .ormov-fade { animation: none } }
      `}</style>

      <Navbar variant="history" />

      <main className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <section className="py-8">
          <p className="inline-flex items-center gap-2 text-sm text-[#5B7276]">
            <Archive className="h-4 w-4" /> Arsip dan laporan
          </p>
          <h1 className={`${display.className} mt-1 flex flex-wrap items-baseline gap-x-3 text-5xl font-extrabold tracking-tight md:text-6xl`}>
            {loading && data.length === 0 ? '–' : data.length}
            <span className="text-xl font-medium text-[#5B7276] md:text-2xl">SPK sudah selesai</span>
          </h1>
        </section>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F9296]" />
            <input
              type="text"
              placeholder="Cari nomor SPK, tujuan, atau catatan"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${field} w-full pl-10`}
            />
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
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            {hasFilter && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStartDate('');
                  setEndDate('');
                }}
                className={`${focus} rounded-full px-3 py-2 text-sm font-medium text-[#0F766E] hover:bg-[#E1ECE9]`}
              >
                Hapus filter
              </button>
            )}
            <button
              onClick={fetchFinishedSPK}
              aria-label="Muat ulang data"
              className={`${focus} grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#44595D] ring-1 ring-[#D5DEDB] transition hover:ring-[#9DB0B3]`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-[#D5DEDB]">
          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_auto] gap-6 border-b border-[#E4EAE7] bg-[#F7F9F8] px-6 py-3 text-xs font-medium text-[#6A7E82] md:grid">
            <span>SPK</span>
            <span>Tujuan</span>
            <span>Catatan akhir barang</span>
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
                <Archive className="h-6 w-6" />
              </div>
              <p className={`${display.className} mt-4 text-lg font-bold`}>
                {data.length === 0 ? 'Arsip masih kosong' : 'Tidak ada arsip yang cocok'}
              </p>
              <p className="mt-1 max-w-sm text-sm text-[#5B7276]">
                {data.length === 0
                  ? 'SPK yang sudah selesai akan muncul di sini.'
                  : 'Coba kata kunci lain atau ubah rentang tanggal penyerahan.'}
              </p>
            </div>
          ) : (
            <ul>
              {filteredData.map((item) => (
                <li
                  key={item.id}
                  className="grid gap-x-6 gap-y-3 border-b border-[#EEF2F0] px-5 py-5 transition-colors last:border-0 hover:bg-[#F7F9F8] md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_auto] md:items-start md:px-6"
                >
                  <div className="min-w-0">
                    <p className={`${display.className} truncate text-lg font-bold leading-tight`}>{item.doc_number}</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#5B7276]">
                      <CalendarDays className="h-3.5 w-3.5" /> {fmtDate(item.handover_date)}
                    </p>
                    <span className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-[#DDF3EA] px-2.5 py-1 text-xs font-semibold text-[#0B6B4F]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-[#2B4045]">{item.purpose_notes || '–'}</p>

                  <div className="text-sm">
                    {item.completion_notes ? (
                      <div className="whitespace-pre-line rounded-xl bg-[#F1F4F2] p-3 leading-relaxed text-[#2B4045]">
                        {item.completion_notes}
                      </div>
                    ) : (
                      <span className="text-[#7F9296]">Selesai penuh</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 md:w-36">
                    <button
                      onClick={() => openConfig(item)}
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
              ))}
            </ul>
          )}
        </section>

        {!loading && data.length > 0 && (
          <p className="mt-4 text-xs text-[#7F9296]">
            Menampilkan {filteredData.length} dari {data.length} SPK. Filter tanggal memakai tanggal penyerahan.
          </p>
        )}
      </main>

      {configItem && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={`Ubah status ${configItem.doc_number}`}>
          <button
            aria-label="Tutup"
            onClick={() => setConfigItem(null)}
            className="ormov-fade absolute inset-0 cursor-default bg-[#10262B]/50 backdrop-blur-[2px]"
          />
          <div className="ormov-pop relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#E4EAE7] p-6">
              <div>
                <h3 className={`${display.className} text-xl font-extrabold leading-tight`}>Ubah status {configItem.doc_number}</h3>
                <p className="mt-1 text-sm text-[#5B7276]">
                  Jika diubah ke belum atau hampir selesai, SPK kembali ke halaman monitoring.
                </p>
              </div>
              <button
                onClick={() => setConfigItem(null)}
                aria-label="Tutup"
                className={`${focus} grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#44595D] hover:bg-[#EEF2F0]`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-[#44595D]">Status baru</legend>
                <div className="grid grid-cols-3 gap-2">
                  {OPTIONS.map(({ key, label, Icon, on, icon }) => {
                    const active = selectedStatus === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setSelectedStatus(key);
                          setNotesError(false);
                        }}
                        className={`${focus} flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition ${
                          active ? on : 'border-transparent bg-[#F1F4F2] text-[#44595D] hover:bg-[#E6EBE9]'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? icon : 'text-[#7F9296]'}`} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {selectedStatus === 'HAMPIR_SELESAI' && (
                <div>
                  <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold text-[#44595D]">
                    Barang yang sudah selesai (wajib diisi)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={completionNotesInput}
                    onChange={(e) => {
                      setCompletionNotesInput(e.target.value);
                      setNotesError(false);
                    }}
                    placeholder="Contoh: Barang A dan D sudah selesai"
                    aria-invalid={notesError}
                    className={`${focus} w-full rounded-xl bg-white p-3 text-sm ring-1 placeholder:text-[#8FA0A3] ${
                      notesError ? 'ring-2 ring-[#B4402B]' : 'ring-[#C5D1CE]'
                    }`}
                  />
                  {notesError && (
                    <p className="mt-1.5 text-sm text-[#B4402B]">
                      Isi barang yang sudah selesai sebelum menyimpan status hampir selesai.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E4EAE7] p-4">
              <button
                onClick={() => setConfigItem(null)}
                className={`${focus} rounded-lg px-4 py-2.5 text-sm font-medium ring-1 ring-[#C5D1CE] hover:bg-[#F1F4F2]`}
              >
                Batal
              </button>
              <button
                onClick={handleRestoreStatus}
                className={`${focus} rounded-lg bg-[#10262B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1B3A40]`}
              >
                {goesBack ? 'Simpan dan kembalikan' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

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