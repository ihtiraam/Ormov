'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Search, RefreshCw, SlidersHorizontal, ChevronRight, CalendarDays, ClipboardList, Trash2, Plus, Archive,
} from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
import AddSPKModal from '@/components/AddSPKModal';
import StatusConfigModal from '@/components/StatusConfigModal';
import DetailDrawer from '@/components/DetailDrawer';
import DateRangeFilter, { DateFilterValue } from '@/components/DateRangeFilter';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import LoginModal from '@/components/LoginModal';

// Import service backend & Auth Context
import { getActiveSPK, createSPK, updateSPKStatus, deleteSPK, SPKSimple, ItemStatus } from '@/services/spkService';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

type Filter = 'SEMUA' | ItemStatus;
const STALE_DAYS = 14;

const STATUS: Record<ItemStatus, { label: string; step: number; text: string; bg: string; bar: string }> = {
  BELUM_SELESAI: { label: 'Belum selesai', step: 1, text: 'text-[#9A5B0B]', bg: 'bg-[#FBEFD5]', bar: 'bg-[#D98E1F]' },
  HAMPIR_SELESAI: { label: 'Hampir selesai', step: 2, text: 'text-[#2D4FB3]', bg: 'bg-[#E4EAFB]', bar: 'bg-[#3F63D6]' },
  SELESAI: { label: 'Selesai', step: 3, text: 'text-[#0B6B4F]', bg: 'bg-[#DDF3EA]', bar: 'bg-[#16976F]' },
};

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseLocal = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
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
  const { isLoggedIn } = useAuth();
  const [data, setData] = useState<SPKSimple[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filter, setFilter] = useState<Filter>('SEMUA');

  // Filter tanggal menggunakan DateFilterValue dari DateRangeFilter
  const [dateFilter, setDateFilter] = useState<DateFilterValue | null>(null);

  // Tanggal acuan di-mount via useEffect agar aman dari prerender SSR Next.js
  const [dateWindow, setDateWindow] = useState<{ yesterday: string; today: string; tomorrow: string }>({
    yesterday: '',
    today: '',
    tomorrow: '',
  });

  const [detailItem, setDetailItem] = useState<SPKSimple | null>(null);
  const [configItem, setConfigItem] = useState<SPKSimple | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<SPKSimple | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    action();
  };

  const fetchActiveSPK = async () => {
    setLoading(true);
    try {
      const result = await getActiveSPK();
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

    fetchActiveSPK();
    const channel = supabase
      .channel('spk_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spk_simple' }, fetchActiveSPK)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDateLabel = (dateStr: string) => {
    if (dateWindow.yesterday && dateStr === dateWindow.yesterday) return 'Kemarin';
    if (dateWindow.today && dateStr === dateWindow.today) return 'Hari Ini';
    if (dateWindow.tomorrow && dateStr === dateWindow.tomorrow) return 'Besok';
    return parseLocal(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handleCreateSPK = async (
    docNumber: string,
    handoverDate: string,
    purposeNotes: string,
    labelText?: string,
    labelColor?: string
  ) => {
    try {
      await createSPK(docNumber, handoverDate, purposeNotes, labelText, labelColor);
      setIsAddModalOpen(false);
      fetchActiveSPK();
    } catch (err: any) {
      alert('Gagal membuat SPK: ' + err.message);
    }
  };

  const handleUpdateStatus = async (status: ItemStatus, notes: string) => {
    if (!configItem) return;
    try {
      await updateSPKStatus(configItem.id, status, notes);
      setConfigItem(null);
      fetchActiveSPK();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSPK(deleteTarget.id);
      setDeleteTarget(null);
      fetchActiveSPK();
    } catch (err: any) {
      alert('Gagal menghapus data: ' + err.message);
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
    if (dateFilter) {
      matchDate = item.handover_date >= dateFilter.start && item.handover_date <= dateFilter.end;
    }

    return matchSearch && matchFilter && matchDate;
  });

  const tabs: { key: Filter; label: string }[] = [
    { key: 'SEMUA', label: 'Semua' },
    { key: 'BELUM_SELESAI', label: 'Belum selesai' },
    { key: 'HAMPIR_SELESAI', label: 'Hampir selesai' },
  ];

  const allSPKDates = useMemo(() => Array.from(new Set(data.map((d) => d.handover_date))), [data]);

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

      <main className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <section className="py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-[#5B7276]">Monitoring SPK / MUTASI aktif</p>
              <h1 className={`${display.className} mt-1 flex flex-wrap items-baseline gap-x-3 text-5xl font-extrabold tracking-tight md:text-6xl`}>
                {loading && data.length === 0 ? '–' : counts.SEMUA}
                <span className="text-xl font-medium text-[#5B7276] md:text-2xl">SPK / MUTASI berjalan</span>
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:flex md:shrink-0 md:items-center md:pt-1">
              <Link
                href="/dashboard/history"
                className={`${focus} inline-flex items-center justify-center gap-2 rounded-xl bg-[#E3EEEB] px-4 py-2.5 text-sm font-semibold text-[#0B5A52] ring-1 ring-inset ring-[#C6DAD5] transition hover:bg-[#D5E6E1] active:scale-[0.98]`}
              >
                <Archive className="h-4 w-4" /> Arsip
              </Link>

              <button
                onClick={() => requireAuth(() => setIsAddModalOpen(true))}
                className={`${focus} inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_-8px_rgba(15,118,110,0.75)] transition hover:bg-[#0D645D] active:scale-[0.98]`}
              >
                <span className="grid h-5 w-5 place-items-center rounded-md bg-white/15">
                  <Plus className="h-3.5 w-3.5" />
                </span>
                Buat SPK baru
              </button>
            </div>
          </div>

          {counts.SEMUA > 0 && (
            <div className="mt-6 w-full max-w-md">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-[#DDE4E1]" aria-hidden>
                <div className={`${STATUS.BELUM_SELESAI.bar}`} style={{ width: `${(counts.BELUM_SELESAI / counts.SEMUA) * 100}%` }} />
                <div className={`${STATUS.HAMPIR_SELESAI.bar}`} style={{ width: `${(counts.HAMPIR_SELESAI / counts.SEMUA) * 100}%` }} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#44595D]">
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
                  : 'Coba kata kunci lain atau sesuaikan filter status / tanggal.'}
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
                        onClick={() => requireAuth(() => setConfigItem(item))}
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

        <p className="mt-4 text-xs text-[#7F9296]">
          Data diperbarui otomatis. Tanggal berwarna merah menandai SPK yang sudah berjalan {STALE_DAYS} hari atau lebih.
        </p>
      </main>

      <DetailDrawer
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onOpenConfig={(item) => requireAuth(() => setConfigItem(item))}
      />

      <StatusConfigModal item={configItem} onClose={() => setConfigItem(null)} onSave={handleUpdateStatus} />
      <AddSPKModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleCreateSPK} />

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