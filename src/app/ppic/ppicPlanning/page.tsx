'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Boxes, 
  CalendarDays, 
  Factory, 
  RefreshCw, 
  Plus, 
  Truck, 
  ChevronRight,
  SlidersHorizontal,
  CalendarCheck,
  Search,
  PackageX,
  ChevronDown,
  Layers,
  Check,
  ChevronLeft
} from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
import { ppicPlanningService, PlanningItem } from '@/services/ppicPlanningService';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';

interface AgendaItem {
  id: string;
  code: string;
  title: string;
  type: 'production' | 'transfer';
  date: string;
  itemCount: number;
  status: 'draft' | 'scheduled';
}

export default function PPICPlanningPage() {
  const [targetMonths, setTargetMonths] = useState<number>(2);
  const [customInput, setCustomInput] = useState<string>('2');
  const [isTargetPopoverOpen, setIsTargetPopoverOpen] = useState<boolean>(false);
  const targetPopoverRef = useRef<HTMLDivElement>(null);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);

  // Paginasi & Baris per halaman
  const [pageSize, setPageSize] = useState<number | 'ALL'>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [agendas] = useState<AgendaItem[]>([
    {
      id: 'c3d4e5f6-0001-4000-8000-000000000001',
      code: 'AGD-PRD-2601',
      title: 'Batch Produksi Tangki & Fitting Silinder',
      type: 'production',
      date: '04 Nov 2026',
      itemCount: 4,
      status: 'scheduled',
    },
    {
      id: 'c3d4e5f6-0002-4000-8000-000000000002',
      code: 'AGD-TRF-2602',
      title: 'Transfer Pasokan Resin Gudang Utara',
      type: 'transfer',
      date: '06 Nov 2026',
      itemCount: 2,
      status: 'draft',
    },
  ]);

  // Tutup target popover saat klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (targetPopoverRef.current && !targetPopoverRef.current.contains(e.target as Node)) {
        setIsTargetPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load data awal dari ppic_planning_items
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        const data = await ppicPlanningService.getPlanningItems();
        setPlanningItems(data);
      } catch (err) {
        console.error('Gagal memuat item perencanaan:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Fungsi sinkronisasi
  const handleSyncData = async () => {
    try {
      setIsSyncing(true);
      const updatedItems = await ppicPlanningService.syncDeficitInventory(targetMonths);
      setPlanningItems(updatedItems);
      setCurrentPage(1);
    } catch (err: any) {
      alert(`Sinkronisasi gagal: ${err.message || 'Periksa koneksi database'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler apply custom bulan
  const applyCustomTarget = (val: number) => {
    const validVal = Math.max(0.1, Number(val) || 1);
    setTargetMonths(validVal);
    setCustomInput(String(validVal));
    setIsTargetPopoverOpen(false);
  };

  // Filter pencarian
  const filteredPlanningItems = planningItems.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.item_code.toLowerCase().includes(term) ||
      item.item_name.toLowerCase().includes(term)
    );
  });

  // Kalkulasi paginasi
  const totalRows = filteredPlanningItems.length;
  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(totalRows / pageSize);
  const paginatedItems = pageSize === 'ALL'
    ? filteredPlanningItems
    : filteredPlanningItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Total estimasi unit produksi seluruh item
  const totalMustProduceCount = filteredPlanningItems.reduce((acc, item) => {
    const avg = Number(item.avg_usage_monthly) || 0;
    const stock = Number(item.current_stock) || 0;
    return acc + Math.max(0, Math.ceil(avg * targetMonths - stock));
  }, 0);

  return (
    <div className={`${body.className} min-h-screen bg-[#F1F4F2] pb-16 text-[#12292D]`}>
      <main className="mx-auto max-w-7xl px-3 py-4 md:px-8 md:py-6">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            title="Kembali ke Beranda"
            className={`${focus} inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white px-3 sm:px-3.5 text-xs md:text-sm font-medium text-[#44595D] ring-1 ring-[#D5DEDB] transition hover:bg-[#F1F4F2] hover:text-[#10262B] shadow-sm shrink-0`}
          >
            <ArrowLeft className="h-4 w-4 text-[#5B7276]" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>

          <nav aria-label="Menu Modul PPIC" className="grid h-10 grid-cols-3 gap-1 rounded-xl bg-[#E4EAE7] p-1 shadow-inner flex-1 max-w-full">
            <Link
              href="/ppic"
              className="inline-flex h-full items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[#44595D] transition hover:bg-white/60 hover:text-[#10262B] text-center"
            >
              <Boxes className="h-3.5 w-3.5 shrink-0 text-[#5B7276]" />
              <span className="truncate">
                <span className="sm:hidden">Stok</span>
                <span className="hidden sm:inline">Monitoring Stok</span>
              </span>
            </Link>

            <Link
              href="/ppic/ppicPlanning"
              className="inline-flex h-full items-center justify-center gap-1.5 rounded-lg bg-[#10262B] px-2 text-xs font-semibold text-white shadow-sm transition text-center"
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#2DD4BF]" />
              <span className="truncate">
                <span className="sm:hidden">PPIC Plan</span>
                <span className="hidden sm:inline">PPIC Planning</span>
              </span>
            </Link>

            <Link
              href="/ppic/productionPlanning"
              className="inline-flex h-full items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[#44595D] transition hover:bg-white/60 hover:text-[#10262B] text-center"
            >
              <Factory className="h-3.5 w-3.5 shrink-0 text-[#5B7276]" />
              <span className="truncate">
                <span className="sm:hidden">Prod Plan</span>
                <span className="hidden sm:inline">Production Planning</span>
              </span>
            </Link>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="relative mt-4 overflow-hidden rounded-3xl bg-[#10262B] p-5 text-white sm:p-6 md:p-8">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage: 'radial-gradient(ellipse at top left, black 10%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at top left, black 10%, transparent 75%)',
            }}
          />
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#2DD4BF]/25 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-0 h-60 w-60 rounded-full bg-[#3F63D6]/25 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className={`${display.className} mt-1 text-2xl font-extrabold tracking-tight md:text-3xl`}>
                PPIC Planning
              </h1>
              <p className="text-xs text-white/65 sm:text-sm">
                Sinkronisasi material berstatus kurang, kalkulasi kebutuhan jangka waktu, dan penjadwalan alur kerja.
              </p>
            </div>

            <button
              onClick={handleSyncData}
              disabled={isSyncing}
              className={`${focus} inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2DD4BF] px-4 text-xs font-semibold text-[#083344] shadow-md transition hover:bg-[#20bdab] active:scale-95 disabled:opacity-60`}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data Stok Kurang'}</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/[0.08] p-3 ring-1 ring-white/10">
              <span className="text-[11px] text-white/60">Total SKU Kurang</span>
              <p className={`${display.className} mt-0.5 text-xl font-bold text-white`}>
                {planningItems.length} <span className="text-xs font-normal text-white/60">item</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.08] p-3 ring-1 ring-white/10">
              <span className="text-[11px] text-white/60">Target Perencanaan</span>
              <p className={`${display.className} mt-0.5 text-xl font-bold text-[#2DD4BF]`}>
                {targetMonths} <span className="text-xs font-normal text-white/60">Bulan</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.08] p-3 ring-1 ring-white/10 col-span-2">
              <span className="text-[11px] text-white/60">Total Kebutuhan Produksi</span>
              <p className={`${display.className} mt-0.5 text-xl font-bold text-[#8FE3C2]`}>
                +{totalMustProduceCount.toLocaleString('id-ID')} <span className="text-xs font-normal text-white/60">unit</span>
              </p>
            </div>
          </div>
        </section>

        {/* Konten Utama 2 Kolom */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Kolom Kiri: Tabel Kebutuhan Produksi */}
          <section className="flex flex-col rounded-3xl border border-[#D5DEDB] bg-white p-5 shadow-sm lg:col-span-8">
            <div className="flex flex-col justify-between gap-3 border-b border-[#E4EAE7] pb-4 sm:flex-row sm:items-center">
              <div>
                <h2 className={`${display.className} text-base font-bold text-[#10262B]`}>
                  Kebutuhan Produksi / Restock
                </h2>
                <p className="text-xs text-[#5B7276]">
                  Daftar material defisit dengan estimasi kebutuhan {targetMonths} bulan
                </p>
              </div>

              {/* Setelan Fleksibel Target Bulan Popover */}
              <div className="relative" ref={targetPopoverRef}>
                <button
                  type="button"
                  onClick={() => setIsTargetPopoverOpen(!isTargetPopoverOpen)}
                  className={`${focus} inline-flex h-9 items-center gap-2 rounded-xl border border-[#D5DEDB] bg-[#F8FAF9] px-3 text-xs font-semibold text-[#10262B] transition hover:bg-white`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#0F766E]" />
                  <span>Target: <strong>{targetMonths} Bulan</strong></span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#7F9296]" />
                </button>

                {isTargetPopoverOpen && (
                  <div className="absolute right-0 top-11 z-30 w-72 rounded-2xl border border-[#D5DEDB] bg-white p-4 shadow-xl">
                    <p className="text-xs font-bold text-[#10262B]">Atur Target Bulan Kebutuhan</p>
                    <p className="mt-0.5 text-[11px] text-[#5B7276]">Pilih durasi cepat atau masukkan angka manual</p>

                    {/* Presets Grid */}
                    <div className="mt-3 grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 9, 12].map((m) => (
                        <button
                          key={m}
                          onClick={() => applyCustomTarget(m)}
                          className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                            targetMonths === m
                              ? 'bg-[#10262B] text-white shadow-xs'
                              : 'bg-[#F1F4F2] text-[#44595D] hover:bg-[#E4EAE7] hover:text-[#10262B]'
                          }`}
                        >
                          {m} Bln
                        </button>
                      ))}
                    </div>

                    {/* Input Bebas Manual */}
                    <div className="mt-3 border-t border-[#E4EAE7] pt-3">
                      <label className="text-[11px] font-semibold text-[#5B7276]">Custom Bebas (Bulan):</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="60"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          className={`${focus} w-full rounded-lg bg-[#F8FAF9] px-2.5 py-1.5 text-xs ring-1 ring-[#D5DEDB]`}
                          placeholder="Misal 2.5 atau 8"
                        />
                        <button
                          type="button"
                          onClick={() => applyCustomTarget(parseFloat(customInput))}
                          className="rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0D645D]"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar Filter Pencarian & Jumlah Tampilan Data */}
            <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              {/* Search Field */}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7F9296]" />
                <input
                  type="text"
                  placeholder="Cari kode atau nama item di daftar rencana..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`${focus} w-full rounded-xl bg-[#F8FAF9] py-2 pl-8 pr-3 text-xs ring-1 ring-[#D5DEDB] placeholder:text-[#8FA0A3]`}
                />
              </div>

              {/* Rows per page selector */}
              <div className="flex items-center gap-1.5 shrink-0 text-xs text-[#5B7276]">
                <span>Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPageSize(val === 'ALL' ? 'ALL' : Number(val));
                    setCurrentPage(1);
                  }}
                  className={`${focus} rounded-lg border border-[#D5DEDB] bg-[#F8FAF9] px-2 py-1 text-xs font-semibold text-[#10262B]`}
                >
                  <option value={10}>10 data</option>
                  <option value={25}>25 data</option>
                  <option value={50}>50 data</option>
                  <option value={100}>100 data</option>
                  <option value="ALL">Semua ({filteredPlanningItems.length})</option>
                </select>
              </div>
            </div>

            {/* Tabel Data */}
            <div className="mt-3.5 overflow-x-auto">
              <table className="w-full text-left text-xs text-[#44595D]">
                <thead className="bg-[#F8FAF9] text-[11px] font-bold uppercase tracking-wider text-[#5B7276]">
                  <tr>
                    <th className="rounded-l-lg py-3 pl-3">Item</th>
                    <th className="py-3 px-2 text-right">Stok Riil</th>
                    <th className="py-3 px-2 text-right">Avg / Bln</th>
                    <th className="py-3 px-2 text-right">Kebutuhan ({targetMonths} Bln)</th>
                    <th className="rounded-r-lg py-3 pr-3 text-right text-[#0F766E]">Harus Produksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4EAE7]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#5B7276]">
                        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#0F766E]" />
                        <span className="mt-2 block text-xs">Memuat data perencanaan...</span>
                      </td>
                    </tr>
                  ) : paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#5B7276]">
                        <PackageX className="mx-auto h-7 w-7 text-[#95A5A8]" />
                        <p className="mt-2 font-medium">
                          {planningItems.length === 0
                            ? 'Belum ada item berstatus kurang.'
                            : 'Tidak ada item yang cocok dengan pencarian.'}
                        </p>
                        {planningItems.length === 0 && (
                          <p className="mt-1 text-[11px] text-[#7F9296]">
                            Klik <strong>Sinkronkan Data Stok Kurang</strong> untuk memindai inventaris terkini.
                          </p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => {
                      const avg = Number(item.avg_usage_monthly) || 0;
                      const stock = Number(item.current_stock) || 0;
                      const totalNeeded = avg * targetMonths;
                      const mustProduce = Math.max(0, Math.ceil(totalNeeded - stock));

                      return (
                        <tr key={item.id} className="hover:bg-[#F8FAF9]/80 transition">
                          <td className="py-3 pl-3">
                            <p className="font-semibold text-[#10262B]">{item.item_name}</p>
                            <span className="font-mono text-[10px] text-[#5B7276]">{item.item_code}</span>
                          </td>
                          <td className="py-3 px-2 text-right font-medium">
                            {stock.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-2 text-right font-medium">
                            {avg.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-2 text-right font-medium text-[#5B7276]">
                            {Math.ceil(totalNeeded).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 pr-3 text-right">
                            <span className="inline-flex rounded-md bg-[#CCFBF1] px-2 py-0.5 text-xs font-bold text-[#0F766E]">
                              +{mustProduce.toLocaleString('id-ID')}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalRows > 0 && pageSize !== 'ALL' && (
              <div className="mt-4 flex flex-col items-center justify-between gap-2.5 border-t border-[#E4EAE7] pt-3 text-xs sm:flex-row">
                <span className="text-[#5B7276]">
                  Menampilkan <strong>{Math.min(totalRows, (currentPage - 1) * pageSize + 1)}</strong> -{' '}
                  <strong>{Math.min(totalRows, currentPage * pageSize)}</strong> dari <strong>{totalRows}</strong> item
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D5DEDB] bg-white px-2.5 font-medium text-[#44595D] transition hover:bg-[#F1F4F2] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="px-2 font-semibold text-[#10262B]">
                    {currentPage} / {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D5DEDB] bg-white px-2.5 font-medium text-[#44595D] transition hover:bg-[#F1F4F2] disabled:opacity-40"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Kolom Kanan: Card Buat Agenda & Daftar Agenda Berderet */}
          <section className="flex flex-col gap-4 lg:col-span-4">
            
            {/* Action Trigger Card */}
            <div className="rounded-3xl border border-[#D5DEDB] bg-white p-5 shadow-sm">
              <h2 className={`${display.className} text-base font-bold text-[#10262B]`}>
                Tindakan Perencanaan
              </h2>
              <p className="mt-0.5 text-xs text-[#5B7276]">
                Konversikan kalkulasi di samping ke dalam jadwal kerja resmi.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <Link
                  href="/ppic/ppicPlanning/new-production"
                  className={`${focus} flex items-center justify-between rounded-xl bg-[#10262B] p-3 text-white transition hover:bg-[#183a42]`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-white/10 p-2">
                      <Factory className="h-4 w-4 text-[#2DD4BF]" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold">Agenda Produksi</p>
                      <p className="text-[10px] text-white/60">Buat Work Order pabrik</p>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-white/60" />
                </Link>

                <Link
                  href="/ppic/ppicPlanning/new-transfer"
                  className={`${focus} flex items-center justify-between rounded-xl border border-[#D5DEDB] bg-[#F8FAF9] p-3 text-[#10262B] transition hover:bg-white`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-[#E4EAE7] p-2">
                      <Truck className="h-4 w-4 text-[#0F766E]" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold">Transfer Barang</p>
                      <p className="text-[10px] text-[#5B7276]">Alokasi antar gudang</p>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-[#5B7276]" />
                </Link>
              </div>
            </div>

            {/* List Agenda Terjadwal */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B7276]">
                  Agenda Terdaftar ({agendas.length})
                </h3>
              </div>

              {agendas.map((agenda) => (
                <Link
                  key={agenda.id}
                  href={`/ppic/ppicPlanning/agenda/${agenda.id}`}
                  className={`${focus} group relative flex flex-col rounded-2xl border border-[#D5DEDB] bg-white p-4 shadow-xs transition hover:border-[#0F766E] hover:shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-md p-1.5 ${
                        agenda.type === 'production' ? 'bg-[#CCFBF1] text-[#0F766E]' : 'bg-[#E0E7FF] text-[#4338CA]'
                      }`}>
                        {agenda.type === 'production' ? <Factory className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-[#5B7276]">{agenda.code}</span>
                    </div>

                    <span className="inline-flex rounded-full bg-[#F1F4F2] px-2 py-0.5 text-[10px] font-medium text-[#44595D]">
                      {agenda.status}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs font-bold text-[#10262B] group-hover:text-[#0F766E] transition">
                    {agenda.title}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-[#F1F4F2] pt-2 text-[11px] text-[#5B7276]">
                    <div className="flex items-center gap-1.5">
                      <CalendarCheck className="h-3.5 w-3.5 text-[#5B7276]" />
                      <span>{agenda.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#0F766E] font-medium">
                      <span>{agenda.itemCount} item</span>
                      <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </section>
        </div>

      </main>
    </div>
  );
}