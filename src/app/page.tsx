'use client';

import Link from 'next/link';
import { LayoutDashboard, Hash, ArrowRight } from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

export default function OrmovHomeHub() {
  const focus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';

  return (
    <div className={`${body.className} min-h-screen bg-[#F1F4F2] text-[#12292D]`}>
      
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#0F766E]">PT Eka Ormed Indonesia</p>
          <h1 className={`${display.className} mt-2 text-4xl font-extrabold tracking-tight md:text-5xl`}>
            Ormov
          </h1>
          <p className="mt-2 text-base text-[#5B7276]">
            Silakan pilih modul atau halaman sistem yang ingin diakses di bawah ini.
          </p>
        </div>

        {/* Daftar Card Menu */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Card 1: Dashboard Monitoring SPK */}
          <Link
            href="/dashboard"
            className={`${focus} group relative flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#D5DEDB] transition-all hover:-translate-y-1 hover:shadow-md hover:ring-[#0F766E]`}
          >
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#E6EFEC] text-[#0F766E] transition-colors group-hover:bg-[#0F766E] group-hover:text-white">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h2 className={`${display.className} mt-5 text-2xl font-bold tracking-tight text-[#12292D]`}>
                Dashboard Monitoring SPK
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5B7276]">
                Pantau status pengerjaan Work Order (SPK) dan dokumen mutasi aktif secara real-time lengkap dengan arsipnya.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-[#0F766E]">
              <span>Buka Dashboard</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 2: Pemberian Nomor Lot (Kosong) */}
          <Link
            href="/lot"
            className={`${focus} group relative flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#D5DEDB] transition-all hover:-translate-y-1 hover:shadow-md hover:ring-[#0F766E]`}
          >
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#E6EFEC] text-[#0F766E] transition-colors group-hover:bg-[#0F766E] group-hover:text-white">
                <Hash className="h-6 w-6" />
              </div>
              <h2 className={`${display.className} mt-5 text-2xl font-bold tracking-tight text-[#12292D]`}>
                Nomor Lot Produksi
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5B7276]">
                Modul pengelolaan dan penomoran lot produk. (Fitur sedang dalam tahap pengembangan awal).
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-[#0F766E]">
              <span>Akses Modul</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}