'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, Clock, AlertCircle, CheckCircle2, SlidersHorizontal, X, CalendarDays, Archive, Trash2, ArrowLeft } from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
import DateRangeFilter, { DateFilterValue } from '@/components/DateRangeFilter';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import LoginModal from '@/components/LoginModal';

// Import service backend & Auth Context
import { getFinishedSPK, updateSPKStatus, deleteSPK, SPKSimple, ItemStatus } from '@/services/spkService';
import { useAuth } from '@/context/AuthContext';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseLocal = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';

const getCompletionDuration = (handover: string, updated: string) => {
  if (!handover) return null;
  const startDate = new Date(handover).setHours(0, 0, 0, 0);
  const endDate = new Date(updated || Date.now()).setHours(0, 0, 0, 0);
  const diffTime = endDate - startDate;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

const OPTIONS: {
  key: ItemStatus; label: string; Icon: typeof Clock;
  on: string; icon: string;
}[] = [
  { key: 'BELUM_SELESAI', label: 'Belum selesai', Icon: Clock, on: 'border-[#D98E1F] bg-[#FBEFD5] text-[#7A4708]', icon: 'text-[#D98E1F]' },
  { key: 'HAMPIR_SELESAI', label: 'Hampir selesai', Icon: AlertCircle, on: 'border-[#3F63D6] bg-[#E4EAFB] text-[#223F96]', icon: 'text-[#3F63D6]' },
  { key: 'SELESAI', label: 'Sudah selesai', Icon: CheckCircle2, on: 'border-[#16976F] bg-[#DDF3EA] text-[#0B5A42]', icon: 'text-[#16976F]' },
];

export default function ORMOVHistoryPage() {
  const { isLoggedIn } = useAuth();
  const [data, setData] = useState<SPKSimple[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter tanggal menggunakan DateFilterValue dari DateRangeFilter
  const [dateFilter, setDateFilter] = useState<DateFilterValue | null>(null);

  // Tanggal acuan di-mount via useEffect agar aman dari prerender SSR Next.js
  const [dateWindow, setDateWindow] = useState<{ yesterday: string; today: string; tomorrow: string }>({
    yesterday: '',
    today: '',
    tomorrow: '',
  });

  const [configItem, setConfigItem] = useState<SPKSimple | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus>('BELUM_SELESAI');
  const [completionNotesInput, setCompletionNotesInput] = useState<string>('');
  const [notesError, setNotesError] = useState<boolean>(false);

  const [deleteTarget, setDeleteTarget] = useState<SPKSimple | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    action();
  };

  const fetchFinishedSPK = async () => {
    setLoading(true);
    try {
      const result = await getFinishedSPK();
      setData(result);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const y = new Date();
    y.setDate(now.getDate() - 1);
    const tm = new Date();
    tm.setDate(now.getDate() + 1);

    setDateWindow({
      yesterday: toLocalISO(y),
      today: toLocalISO(now),
      tomorrow: toLocalISO(tm),
    });

    fetchFinishedSPK();
  }, []);

  useEffect(() => {
    if (!configItem) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setConfigItem(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [configItem]);

  const formatDateLabel = (dateStr: string) => {
    if (dateWindow.yesterday && dateStr === dateWindow.yesterday) return 'Kemarin';
    if (dateWindow.today && dateStr === dateWindow.today) return 'Hari Ini';
    if (dateWindow.tomorrow && dateStr === dateWindow.tomorrow) return 'Besok';
    return parseLocal(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handleRestoreStatus = async () => {
    if (!configItem) return;

    if (selectedStatus === 'HAMPIR_SELESAI' && !completionNotesInput.trim()) {
      setNotesError(true);
      return;
    }

    try {
      await updateSPKStatus(configItem.id, selectedStatus, completionNotesInput);
      setConfigItem(null);
      fetchFinishedSPK();
    } catch (err: any) {
      alert('Gagal memperbarui status: ' + err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteSPK(deleteTarget.id);
      setDeleteTarget(null);
      fetchFinishedSPK();
    } catch (err: any) {
      alert('Gagal menghapus data: ' + err.message);
    }
  };

  const openConfig = (item: SPKSimple) => {
    requireAuth(() => {
      setConfigItem(item);
      setSelectedStatus(item.item_status);
      setCompletionNotesInput(item.completion_notes || '');
      setNotesError(false);
    });
  };

  const filteredData = data.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.doc_number.toLowerCase().includes(q) ||
      (item.purpose_notes && item.purpose_notes.toLowerCase().includes(q)) ||
      (item.completion_notes && item.completion_notes.toLowerCase().includes(q));

    let matchesDate = true;
    if (dateFilter) {
      matchesDate = item.handover_date >= dateFilter.start && item.handover_date <= dateFilter.end;
    }

    return matchesSearch && matchesDate;
  });

  const hasFilter = !!(searchTerm || dateFilter);
  const goesBack = selectedStatus !== 'SELESAI';

  const allSPKDates = useMemo(() => Array.from(new Set(data.map((d) => d.handover_date))), [data]);

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

      <main className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <section className="py-8">
          <p className="inline-flex items-center gap-2 text-sm text-[#5B7276]">
            <Archive className="h-4 w-4" /> Arsip dan laporan
          </p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-4">
            <h1 className={`${display.className} flex flex-wrap items-baseline gap-x-3 text-5xl font-extrabold tracking-tight md:text-6xl`}>
              {loading && data.length === 0 ? '–' : data.length}
              <span className="text-xl font-medium text-[#5B7276] md:text-2xl">SPK sudah selesai</span>
            </h1>

            <Link
              href="/dashboard"
              className={`${focus} inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#10262B] ring-1 ring-[#D5DEDB] transition hover:bg-[#F7F9F8] hover:ring-[#9DB0B3] active:scale-[0.98]`}
            >
              <ArrowLeft className="h-4 w-4 text-[#5B7276]" /> Kembali ke monitoring
            </Link>
          </div>
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
            {/* Filter Kalender Rentang Tanggal Modular */}
            <DateRangeFilter
              value={dateFilter}
              onChange={setDateFilter}
              todayStr={dateWindow.today}
              yesterdayStr={dateWindow.yesterday}
              tomorrowStr={dateWindow.tomorrow}
              formatLabel={formatDateLabel}
              taskDates={allSPKDates}
            />
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            {hasFilter && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter(null);
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
              {filteredData.map((item) => {
                const durationDays = getCompletionDuration(item.handover_date, item.updated_at || item.created_at);
                return (
                  <li
                    key={item.id}
                    className="grid gap-x-6 gap-y-3 border-b border-[#EEF2F0] px-5 py-5 transition-colors last:border-0 hover:bg-[#F7F9F8] md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_auto] md:items-start md:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`${display.className} truncate text-lg font-bold leading-tight`}>{item.doc_number}</p>
                        {item.label_text && (() => {
                          const [bgClass, textClass] = (item.label_color || 'bg-[#DDF3EA]|text-[#0B6B4F]').split('|');
                          return (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${bgClass} ${textClass}`}>
                              {item.label_text}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#5B7276]">
                        <CalendarDays className="h-3.5 w-3.5" /> {fmtDate(item.handover_date)}
                      </p>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF3EA] px-2.5 py-1 text-xs font-semibold text-[#0B6B4F]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                        </span>
                        {durationDays !== null && (
                          <span className="text-xs font-medium text-[#5B7276]">
                            ({durationDays === 0 ? 'Selesai di hari yang sama' : `Selesai dalam ${durationDays} hari`})
                          </span>
                        )}
                      </div>
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
                        onClick={() => requireAuth(() => setDeleteTarget(item))}
                        className={`${focus} inline-flex items-center justify-center rounded-lg p-2 text-[#B4402B] ring-1 ring-[#F2D6D0] transition hover:bg-[#FBE8E5]`}
                        title="Hapus SPK"
                        aria-label={`Hapus ${item.doc_number}`}
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

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        docNumber={deleteTarget?.doc_number || ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}