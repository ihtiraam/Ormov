'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Package,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

interface WOPlanning {
  id: string;
  noWO: string;
  productName: string;
  category: string;
  targetQty: number;
  actualQty: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: 'Completed' | 'On Track' | 'Behind Schedule' | 'Delayed';
}

const initialWOData: WOPlanning[] = [
  {
    id: '1',
    noWO: 'WO/PPIC/2026/03-001',
    productName: 'Hospital Bed Manual 3 Crank',
    category: 'Furniture Medis',
    targetQty: 50,
    actualQty: 42,
    unit: 'Unit',
    startDate: '2026-03-01',
    targetDate: '2026-03-15',
    status: 'On Track',
  },
  {
    id: '2',
    noWO: 'WO/PPIC/2026/03-002',
    productName: 'Patient Stretcher Transfer',
    category: 'Furniture Medis',
    targetQty: 30,
    actualQty: 30,
    unit: 'Unit',
    startDate: '2026-03-02',
    targetDate: '2026-03-10',
    status: 'Completed',
  },
  {
    id: '3',
    noWO: 'WO/PPIC/2026/03-003',
    productName: 'Infuse Stand Stainless Steel',
    category: 'Aksesori Medis',
    targetQty: 150,
    actualQty: 65,
    unit: 'Pcs',
    startDate: '2026-03-05',
    targetDate: '2026-03-20',
    status: 'Behind Schedule',
  },
  {
    id: '4',
    noWO: 'WO/PPIC/2026/03-004',
    productName: 'Examination Table Electric',
    category: 'Furniture Medis',
    targetQty: 20,
    actualQty: 4,
    unit: 'Unit',
    startDate: '2026-03-08',
    targetDate: '2026-03-18',
    status: 'Behind Schedule',
  },
  {
    id: '5',
    noWO: 'WO/PPIC/2026/03-005',
    productName: 'Overbed Table Hydraulic',
    category: 'Furniture Medis',
    targetQty: 80,
    actualQty: 80,
    unit: 'Pcs',
    startDate: '2026-03-01',
    targetDate: '2026-03-12',
    status: 'Completed',
  },
];

export default function PPICPlanningProgressPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    const userRole = sessionStorage.getItem('ormov_user_role') || localStorage.getItem('ormov_user_role');
    const normalizedRole = userRole ? userRole.toLowerCase().replace(/[\s_-]/g, '') : '';
    
    if (normalizedRole === 'superadmin') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      alert('Akses Ditolak! Halaman PPIC Planning & Progress hanya khusus untuk akun Super Admin.');
      router.push('/');
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F4F2] text-[#12292D]">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber-600 animate-bounce" />
          <p className="mt-4 text-sm font-semibold text-[#5B7276]">Memeriksa hak akses Super Admin...</p>
        </div>
      </div>
    );
  }

  const filteredData = initialWOData.filter((item) => {
    const matchesSearch =
      item.noWO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalWO = initialWOData.length;
  const completedWO = initialWOData.filter((i) => i.status === 'Completed').length;
  const totalTargetUnits = initialWOData.reduce((acc, curr) => acc + curr.targetQty, 0);
  const totalActualUnits = initialWOData.reduce((acc, curr) => acc + curr.actualQty, 0);
  const overallPercentage = Math.round((totalActualUnits / totalTargetUnits) * 100) || 0;

  const getStatusBadge = (status: WOPlanning['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
          </span>
        );
      case 'On Track':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-[#0F766E]">
            <Clock className="h-3.5 w-3.5" /> On Track
          </span>
        );
      case 'Behind Schedule':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" /> Perlu Perhatian
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className={`${body.className} min-h-screen bg-[#F1F4F2] text-[#12292D] pb-16`}>
      <header className="border-b border-[#D5DEDB] bg-white sticky top-0 z-10 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6EFEC] text-[#0F766E] transition-colors hover:bg-[#0F766E] hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                PT Eka Ormed Indonesia
              </p>
              <h1 className={`${display.className} text-xl font-bold md:text-2xl text-[#12292D]`}>
                PPIC Planning & Progress
              </h1>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-amber-50 px-3 py-1.5 text-amber-800 ring-1 ring-amber-200">
            🔒 Super Admin Restricted Area
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#D5DEDB]">
            <div className="flex items-center justify-between text-[#5B7276]">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Work Order</span>
              <Layers className="h-5 w-5 text-[#0F766E]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`${display.className} text-3xl font-extrabold text-[#12292D]`}>
                {totalWO}
              </span>
              <span className="text-xs text-[#5B7276]">WO Diterbitkan</span>
            </div>
            <p className="mt-2 text-xs text-[#5B7276]">
              <span className="font-semibold text-emerald-600">{completedWO} WO</span> telah selesai dikerjakan
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#D5DEDB]">
            <div className="flex items-center justify-between text-[#5B7276]">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Target Unit</span>
              <Package className="h-5 w-5 text-[#0F766E]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`${display.className} text-3xl font-extrabold text-[#12292D]`}>
                {totalTargetUnits}
              </span>
              <span className="text-xs text-[#5B7276]">Unit / Pcs</span>
            </div>
            <p className="mt-2 text-xs text-[#5B7276]">Target gabungan seluruh WO aktif</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#D5DEDB]">
            <div className="flex items-center justify-between text-[#5B7276]">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Realisasi</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`${display.className} text-3xl font-extrabold text-[#12292D]`}>
                {totalActualUnits}
              </span>
              <span className="text-xs text-[#5B7276]">Unit / Pcs</span>
            </div>
            <p className="mt-2 text-xs text-[#5B7276]">
              Sisa akumulasi: <span className="font-semibold text-amber-700">{totalTargetUnits - totalActualUnits} Unit</span>
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#D5DEDB]">
            <div className="flex items-center justify-between text-[#5B7276]">
              <span className="text-xs font-semibold uppercase tracking-wider">Capaian Progres</span>
              <TrendingUp className="h-5 w-5 text-[#0F766E]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`${display.className} text-3xl font-extrabold text-[#0F766E]`}>
                {overallPercentage}%
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E6EFEC]">
              <div
                className="h-full rounded-full bg-[#0F766E] transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#D5DEDB] md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B7276]" />
            <input
              type="text"
              placeholder="Cari No. WO, Produk, atau Kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-[#F1F4F2] pl-9 pr-4 py-2 text-sm text-[#12292D] placeholder-[#5B7276] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="h-4 w-4 text-[#5B7276] ml-1 hidden sm:block" />
            <span className="text-xs font-semibold text-[#5B7276] hidden sm:block">Status:</span>
            {['ALL', 'On Track', 'Behind Schedule', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-[#0F766E] text-white shadow-sm'
                    : 'bg-[#F1F4F2] text-[#5B7276] hover:bg-[#E6EFEC] hover:text-[#0F766E]'
                }`}
              >
                {status === 'ALL' ? 'Semua Status' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#D5DEDB]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#D5DEDB] bg-[#F1F4F2]/60 text-xs font-semibold uppercase tracking-wider text-[#5B7276]">
                <tr>
                  <th className="px-6 py-4">No. WO & Informasi Produk</th>
                  <th className="px-6 py-4">Status & Progres Target</th>
                  <th className="px-6 py-4 text-center">Realisasi / Target</th>
                  <th className="px-6 py-4">Tenggat Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D5DEDB]">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => {
                    const progressPercent = Math.min(
                      Math.round((item.actualQty / item.targetQty) * 100),
                      100
                    );

                    return (
                      <tr key={item.id} className="hover:bg-[#F1F4F2]/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#0F766E] text-xs md:text-sm">{item.noWO}</p>
                          <p className={`${display.className} text-base font-bold text-[#12292D] mt-0.5`}>
                            {item.productName}
                          </p>
                          <span className="inline-block mt-1 text-xs text-[#5B7276]">
                            Kategori: {item.category}
                          </span>
                        </td>

                        <td className="px-6 py-4 min-w-[200px]">
                          <div className="flex items-center justify-between mb-1.5">
                            {getStatusBadge(item.status)}
                            <span className="text-xs font-extrabold text-[#12292D]">
                              {progressPercent}%
                            </span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E6EFEC]">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                progressPercent === 100
                                  ? 'bg-emerald-500'
                                  : item.status === 'Behind Schedule'
                                  ? 'bg-amber-500'
                                  : 'bg-[#0F766E]'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="text-base font-bold text-[#12292D]">
                            {item.actualQty}
                          </span>
                          <span className="text-sm text-[#5B7276]"> / {item.targetQty}</span>
                          <span className="block text-xs text-[#5B7276] mt-0.5">
                            {item.unit}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs text-[#5B7276]">
                            Mulai: <span className="font-medium text-[#12292D]">{item.startDate}</span>
                          </p>
                          <p className="text-xs text-[#5B7276] mt-1">
                            Target: <span className="font-bold text-[#0F766E]">{item.targetDate}</span>
                          </p>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[#5B7276]">
                      Tidak ada data Work Order yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}