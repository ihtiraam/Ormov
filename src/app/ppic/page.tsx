'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Search, ShieldAlert, Boxes, X, UploadCloud, Loader2, CheckCircle2, AlertCircle,
  Pencil, Trash2, Check, RefreshCw, Lock,
} from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';

import { ppicService, InventoryStock, StockUpdatePayload } from '@/services/ppicService';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_-8px_rgba(15,118,110,0.75)] transition hover:bg-[#0D645D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
const btnGhost =
  'rounded-xl px-4 py-2.5 text-sm font-medium ring-1 ring-[#C5D1CE] transition hover:bg-[#F1F4F2] disabled:cursor-not-allowed disabled:opacity-50';
const inputCls =
  'w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-[#C5D1CE] placeholder:text-[#8FA0A3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]';
const labelCls = 'mb-1.5 block text-sm font-semibold text-[#44595D]';

function ModalShell({
  title, onClose, children, maxW = 'max-w-md',
}: { title: string; onClose: () => void; children: React.ReactNode; maxW?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="ormov-fade fixed inset-0 cursor-default bg-[#10262B]/55 backdrop-blur-[2px]"
      />
      <div className={`ormov-pop relative my-auto w-full ${maxW} rounded-2xl bg-white text-[#12292D] shadow-2xl`}>
        <div className="flex items-center justify-between gap-4 border-b border-[#E4EAE7] px-6 py-4">
          <h3 className={`${display.className} text-lg font-extrabold`}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-9 w-9 place-items-center rounded-full text-[#44595D] hover:bg-[#EEF2F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PPICPlanningProgressPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stockList, setStockList] = useState<InventoryStock[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AMAN' | 'KURANG'>('ALL');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // State Edit Item
  const [editingItem, setEditingItem] = useState<InventoryStock | null>(null);

  // State Modal Import Excel (Sinkronisasi Stok)
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isImportLoading, setIsImportLoading] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<string>('');
  const [importSummary, setImportSummary] = useState<{
    totalInFile: number;
    matched: number;
    updated: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    const userRole = sessionStorage.getItem('ormov_user_role') || localStorage.getItem('ormov_user_role');
    const normalizedRole = userRole ? userRole.toLowerCase().replace(/[\s_-]/g, '') : '';

    if (normalizedRole === 'superadmin') {
      setIsAuthorized(true);
      loadInventoryData();
    } else {
      setIsAuthorized(false);
      alert('Akses Ditolak! Halaman PPIC hanya khusus untuk akun Super Admin.');
      router.push('/');
    }
  }, [router]);

  const loadInventoryData = async () => {
    setLoadingData(true);
    try {
      const data = await ppicService.getAll();
      setStockList(data);
    } catch (err: any) {
      console.error('Error fetching inventory:', err?.message || err);
    } finally {
      setLoadingData(false);
    }
  };

  // Parser Excel: Hanya baca KODE & STOK untuk mengupdate angka stok
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportLoading(true);
    setImportError(null);
    setImportSummary(null);
    setImportProgress('Membaca file Excel stok harian...');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const incomingStocks: StockUpdatePayload[] = rawData
        .map((row) => {
          const kodeKey = Object.keys(row).find((k) => k.trim().toUpperCase() === 'KODE') || 'KODE';
          const stokKey =
            Object.keys(row).find((k) => k.trim().toUpperCase().includes('STOK')) || 'STOK GD CENTER';

          const itemCode = String(row[kodeKey] || '').trim();
          const rawStok = String(row[stokKey]).replace(/[^\d-]/g, '');
          const currentStock = isNaN(parseInt(rawStok, 10)) ? 0 : Math.max(0, parseInt(rawStok, 10));

          return {
            item_code: itemCode,
            current_stock: currentStock,
          };
        })
        .filter((item) => item.item_code !== '');

      if (incomingStocks.length === 0) {
        throw new Error('Data tidak ditemukan. Pastikan file Excel memiliki kolom KODE dan kolom STOK.');
      }

      setImportProgress(`Mencocokkan dan menyinkronkan stok ${incomingStocks.length} barang...`);

      // Panggil fungsi sync stok di service
      const res = await ppicService.syncStockOnly(incomingStocks);

      setImportSummary({
        totalInFile: incomingStocks.length,
        matched: res.matchedCount,
        updated: res.updatedCount,
      });

      // Muat ulang data terbaru
      await loadInventoryData();
    } catch (err: any) {
      console.error('Error saat sinkronisasi stok:', err);
      setImportError(err?.message || 'Terjadi kendala saat menyinkronkan stok gudang.');
    } finally {
      setIsImportLoading(false);
      setImportProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await ppicService.updateItem(editingItem.id, {
        itemCode: editingItem.itemCode,
        itemName: editingItem.itemName,
        category: editingItem.category,
        currentStock: editingItem.currentStock,
        monthlyAvgSales: editingItem.monthlyAvgSales,
      });

      setStockList((prev) =>
        prev.map((item) => (item.id === editingItem.id ? editingItem : item))
      );
      setEditingItem(null);
    } catch (err: any) {
      alert('Gagal update data: ' + (err?.message || 'Error tidak diketahui'));
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini dari database Supabase?')) return;

    try {
      await ppicService.deleteItem(id);
      setStockList((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert('Gagal menghapus data: ' + (err?.message || 'Error tidak diketahui'));
    }
  };

  if (!isAuthorized) {
    return (
      <div className={`${body.className} flex min-h-screen items-center justify-center bg-[#F1F4F2] text-[#12292D]`}>
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FBEFD5] text-[#9A5B0B]">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm font-medium text-[#5B7276]">Memeriksa hak akses Super Admin...</p>
        </div>
      </div>
    );
  }

  const filteredData = stockList.filter((item) => {
    const matchesSearch =
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const isSafe = item.currentStock >= item.monthlyAvgSales;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'AMAN' && isSafe) ||
      (statusFilter === 'KURANG' && !isSafe);

    return matchesSearch && matchesStatus;
  });

  const totalSKU = stockList.length;
  const safeStockCount = stockList.filter((i) => i.currentStock >= i.monthlyAvgSales).length;
  const criticalStockCount = totalSKU - safeStockCount;

  const stats = [
    { label: 'Total item produk', value: totalSKU, sub: 'Jenis barang di database', tone: 'text-white' },
    { label: 'Stok aman', value: safeStockCount, sub: 'Mencukupi penjualan bulan ini', tone: 'text-[#8FE3C2]' },
    { label: 'Stok kurang', value: criticalStockCount, sub: 'Di bawah rata-rata penjualan', tone: criticalStockCount > 0 ? 'text-[#FF9B8A]' : 'text-white' },
  ];

  const tabs: { label: string; value: 'ALL' | 'AMAN' | 'KURANG'; count: number }[] = [
    { label: 'Semua', value: 'ALL', count: totalSKU },
    { label: 'Aman', value: 'AMAN', count: safeStockCount },
    { label: 'Kurang', value: 'KURANG', count: criticalStockCount },
  ];

  return (
    <div className={`${body.className} min-h-screen bg-[#F1F4F2] pb-16 text-[#12292D]`}>
      <style>{`
        @keyframes ormov-pop { from { transform: translateY(12px) scale(.98); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes ormov-fade { from { opacity: 0 } to { opacity: 1 } }
        .ormov-pop { animation: ormov-pop .2s ease-out }
        .ormov-fade { animation: ormov-fade .18s ease-out }
        @media (prefers-reduced-motion: reduce) { .ormov-pop, .ormov-fade { animation: none } }
      `}</style>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Link
          href="/"
          className={`${focus} inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#10262B] ring-1 ring-[#D5DEDB] transition hover:ring-[#9DB0B3]`}
        >
          <ArrowLeft className="h-4 w-4 text-[#5B7276]" /> Kembali ke Beranda
        </Link>

        {/* Hero + Ringkasan */}
        <section className="relative mt-5 overflow-hidden rounded-3xl bg-[#10262B] p-6 text-white md:p-8">
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
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#2DD4BF]/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 right-0 h-60 w-60 rounded-full bg-[#3F63D6]/25 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className={`${display.className} mt-3 text-3xl font-extrabold tracking-tight md:text-4xl`}>
                Monitoring Stok Gudang
              </h1>
              <p className="mt-1 text-sm text-white/65">PT Eka Ormed Indonesia</p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadInventoryData}
                aria-label="Muat ulang data dari Supabase"
                title="Muat ulang data"
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
              >
                <RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => {
                  setImportSummary(null);
                  setImportError(null);
                  setIsImportModalOpen(true);
                }}
                className={`${btnPrimary} h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]`}
              >
                <UploadCloud className="h-4 w-4" /> Sinkronkan Stok (Excel)
              </button>
            </div>
          </div>

          <dl className="relative mt-7 grid gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                <dt className="text-xs font-medium text-white/55">{s.label}</dt>
                <dd className={`${display.className} mt-1 text-3xl font-extrabold ${s.tone}`}>{loadingData ? '–' : s.value}</dd>
                <p className="mt-0.5 text-xs text-white/45">{s.sub}</p>
              </div>
            ))}
          </dl>
        </section>

        {/* Toolbar */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Filter status stok" className="flex flex-wrap gap-1.5">
            {tabs.map((t) => {
              const active = statusFilter === t.value;
              return (
                <button
                  key={t.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(t.value)}
                  className={`${focus} inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? 'bg-[#10262B] text-white' : 'bg-white text-[#44595D] ring-1 ring-[#D5DEDB] hover:ring-[#9DB0B3]'
                  }`}
                >
                  {t.label}
                  <span className={`text-xs ${active ? 'text-white/60' : 'text-[#7F9296]'}`}>{t.count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[14rem] flex-1 lg:w-80 lg:flex-none">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F9296]" />
            <input
              type="text"
              placeholder="Cari kode, nama produk, atau kategori"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${focus} w-full rounded-full bg-white py-2.5 pl-10 pr-4 text-sm ring-1 ring-[#D5DEDB] placeholder:text-[#8FA0A3]`}
            />
          </div>
        </div>

        {/* Tabel Stok Gudang */}
        <section className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-[#D5DEDB]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#E4EAE7] bg-[#F7F9F8] text-xs font-medium text-[#6A7E82]">
                  <th className="px-6 py-3">Kode & Nama Barang</th>
                  <th className="px-4 py-3 text-center">Stok Gudang</th>
                  <th className="px-4 py-3 text-center">Avg Penjualan / Bln</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="w-24 px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F0]">
                {loadingData ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-[#5B7276]">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" /> Mengambil data inventaris...
                      </span>
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item) => {
                    const isSafe = item.currentStock >= item.monthlyAvgSales;
                    const coverage = item.monthlyAvgSales > 0 ? item.currentStock / item.monthlyAvgSales : null;

                    return (
                      <tr key={item.id} className="transition-colors hover:bg-[#F7F9F8]">
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[#E1ECE9] px-2 py-0.5 font-mono text-xs font-bold text-[#0B5A52]">{item.itemCode}</span>
                            {item.category && item.category !== 'Stok Impor' && item.category !== 'General' && (
                              <span className="rounded-md bg-[#F1F4F2] px-2 py-0.5 text-[11px] font-medium text-[#44595D] ring-1 ring-[#D5DEDB]">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <p className={`${display.className} mt-1 text-[15px] font-bold leading-snug`}>{item.itemName}</p>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="text-base font-bold tabular-nums">{item.currentStock}</span>
                          <span className="block text-[11px] text-[#7F9296]">{item.unit}</span>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="text-base font-semibold tabular-nums">{item.monthlyAvgSales}</span>
                          <span className="block text-[11px] text-[#7F9296]">{item.unit} / bln</span>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isSafe ? 'bg-[#DDF3EA] text-[#0B6B4F]' : 'bg-[#FBE8E5] text-[#B4402B]'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isSafe ? 'bg-[#16976F]' : 'bg-[#B4402B]'}`} />
                            {isSafe ? 'Aman' : 'Kurang'}
                          </span>
                          <span className="mt-1 block text-[11px] text-[#7F9296]">
                            {coverage === null ? 'tanpa penjualan' : `cukup ±${coverage.toLocaleString('id-ID', { maximumFractionDigits: 1 })} bln`}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              aria-label={`Edit ${item.itemName}`}
                              title="Edit item"
                              className="grid h-9 w-9 place-items-center rounded-lg text-[#5B7276] transition hover:bg-[#E1ECE9] hover:text-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteItem(item.id, e)}
                              aria-label={`Hapus ${item.itemName}`}
                              title="Hapus item"
                              className="grid h-9 w-9 place-items-center rounded-lg text-[#95A5A8] transition hover:bg-[#FBE8E5] hover:text-[#B4402B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4402B]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#E6EFEC] text-[#0F766E]">
                        <Boxes className="h-6 w-6" />
                      </div>
                      <p className={`${display.className} mt-4 text-lg font-bold`}>
                        {stockList.length === 0 ? 'Belum ada data barang' : 'Tidak ada barang yang cocok'}
                      </p>
                      <p className="mx-auto mt-1 max-w-sm text-sm text-[#5B7276]">
                        {stockList.length === 0
                          ? 'Belum ada data barang di database Supabase.'
                          : 'Coba kata kunci lain atau ganti filter status.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {!loadingData && stockList.length > 0 && (
          <p className="mt-4 text-xs text-[#7F9296]">
            Menampilkan {filteredData.length} dari {stockList.length} jenis barang. Status aman didasarkan pada perbandingan stok gudang dengan estimasi penjualan bulanan.
          </p>
        )}
      </main>

      {/* Modal Edit Item */}
      {editingItem && (
        <ModalShell title="Edit Data Barang" onClose={() => setEditingItem(null)}>
          <form onSubmit={handleSaveEdit}>
            <div className="space-y-4 p-6">
              <div>
                <label htmlFor="edit-code" className={labelCls}>Kode Barang</label>
                <input
                  id="edit-code"
                  type="text"
                  required
                  value={editingItem.itemCode}
                  onChange={(e) => setEditingItem({ ...editingItem, itemCode: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="edit-name" className={labelCls}>Nama Barang</label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={editingItem.itemName}
                  onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="edit-category" className={labelCls}>Kategori</label>
                <input
                  id="edit-category"
                  type="text"
                  placeholder="Misal: Plate, Screw, Mesh, Wire..."
                  value={editingItem.category === 'Stok Impor' || editingItem.category === 'General' ? '' : editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-stock" className={labelCls}>Stok Gudang</label>
                  <input
                    id="edit-stock"
                    type="number"
                    min="0"
                    value={editingItem.currentStock}
                    onChange={(e) => setEditingItem({ ...editingItem, currentStock: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="edit-avg" className={labelCls}>Avg Penjualan / Bln</label>
                  <input
                    id="edit-avg"
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingItem.monthlyAvgSales}
                    onChange={(e) => setEditingItem({ ...editingItem, monthlyAvgSales: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E4EAE7] px-6 py-4">
              <button type="button" onClick={() => setEditingItem(null)} className={btnGhost}>Batal</button>
              <button type="submit" className={btnPrimary}>
                <Check className="h-4 w-4" /> Simpan Perubahan
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Modal Sinkronisasi Stok Harian */}
      {isImportModalOpen && (
        <ModalShell
          title="Sinkronkan Stok dari Excel"
          onClose={() => !isImportLoading && setIsImportModalOpen(false)}
          maxW="max-w-lg"
        >
          <div className="p-6">
            <p className="text-sm leading-relaxed text-[#5B7276]">
              Import data <strong>Excel</strong> untuk memperbarui <strong>Jumlah Stok</strong>.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImportLoading}
              className={`${focus} mt-4 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#0F766E]/35 bg-[#F4F9F8] px-6 py-8 text-center transition ${
                isImportLoading ? 'cursor-not-allowed opacity-50' : 'hover:border-[#0F766E] hover:bg-[#E9F3F0]'
              }`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E1ECE9] text-[#0F766E]">
                <UploadCloud className="h-6 w-6" />
              </span>
              <span className="mt-3 text-sm font-semibold">Pilih File Excel Update Stok</span>
              <span className="mt-0.5 text-xs text-[#7F9296]">Bisa file penuh maupun sebagian (.xlsx, .xls)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              disabled={isImportLoading}
              onChange={handleFileUpload}
              className="hidden"
            />

            {isImportLoading && (
              <div role="status" className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-[#0F766E]">
                <Loader2 className="h-4 w-4 animate-spin" /> {importProgress}
              </div>
            )}

            {importSummary && (
              <div role="status" className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#DDF3EA] p-3 text-sm text-[#0B5A42]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">Sinkronisasi stok selesai!</p>
                  <p className="mt-0.5 text-xs text-[#0B5A42]/90">
                    Dari <strong>{importSummary.totalInFile}</strong> item dalam file, ditemukan <strong>{importSummary.matched}</strong> barang cocok di database, dan <strong>{importSummary.updated}</strong> stok barang berhasil diperbarui angkanya.
                  </p>
                </div>
              </div>
            )}

            {importError && (
              <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#FBE8E5] p-3 text-sm font-medium text-[#B4402B]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
          </div>
          <div className="flex justify-end border-t border-[#E4EAE7] px-6 py-4">
            <button type="button" disabled={isImportLoading} onClick={() => setIsImportModalOpen(false)} className={btnGhost}>
              Selesai / Tutup
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}