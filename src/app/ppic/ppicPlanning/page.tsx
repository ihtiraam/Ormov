'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Boxes, CalendarDays, Factory, Construction } from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';

export default function PPICPlanningPage() {
  return (
    <div className={`${body.className} min-h-screen bg-[#F1F4F2] pb-16 text-[#12292D]`}>
      <main className="mx-auto max-w-7xl px-3 py-4 md:px-8 md:py-6">
        
        {/* Top Navigation Bar: Tinggi Sama Persis (h-10 / 40px) & Responsif */}
        <div className="flex items-center gap-2">
          {/* Tombol Back */}
          <Link
            href="/"
            title="Kembali ke Beranda"
            className={`${focus} inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white px-3 sm:px-3.5 text-xs md:text-sm font-medium text-[#44595D] ring-1 ring-[#D5DEDB] transition hover:bg-[#F1F4F2] hover:text-[#10262B] shadow-sm shrink-0`}
          >
            <ArrowLeft className="h-4 w-4 text-[#5B7276]" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>

          {/* Segmented Control Navigasi PPIC */}
          <nav aria-label="Menu Modul PPIC" className="grid h-10 grid-cols-3 gap-1 rounded-xl bg-[#E4EAE7] p-1 shadow-inner flex-1 max-w-full">
            {/* Tab 1: Monitoring Stok */}
            <Link
              href="/ppic"
              title="Monitoring Stok"
              className="inline-flex h-full items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[#44595D] transition hover:bg-white/60 hover:text-[#10262B] text-center"
            >
              <Boxes className="h-3.5 w-3.5 shrink-0 text-[#5B7276]" />
              <span className="truncate">
                <span className="sm:hidden">Stok</span>
                <span className="hidden sm:inline">Monitoring Stok</span>
              </span>
            </Link>

            {/* Tab 2: PPIC Planning (Aktif) */}
            <Link
              href="/ppic/ppicPlanning"
              title="PPIC Planning"
              className="inline-flex h-full items-center justify-center gap-1.5 rounded-lg bg-[#10262B] px-2 text-xs font-semibold text-white shadow-sm transition text-center"
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#2DD4BF]" />
              <span className="truncate">
                <span className="sm:hidden">PPIC Plan</span>
                <span className="hidden sm:inline">PPIC Planning</span>
              </span>
            </Link>

            {/* Tab 3: Production Planning */}
            <Link
              href="/ppic/productionPlanning"
              title="Production Planning"
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
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#2DD4BF]/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 right-0 h-60 w-60 rounded-full bg-[#3F63D6]/25 blur-3xl" />

          <div className="relative flex flex-col gap-2">
            <h1 className={`${display.className} mt-1 text-2xl font-extrabold tracking-tight md:text-3xl`}>
              PPIC Planning
            </h1>
            <p className="text-xs text-white/65 sm:text-sm">Perencanaan alokasi material dan prioritas pemenuhan stok gudang</p>
          </div>
        </section>

        {/* Placeholder Content */}
        <section className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#C5D1CE] bg-white p-12 sm:p-16 text-center shadow-sm">
          <div className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl bg-[#E6EFEC] text-[#0F766E]">
            <Construction className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse" />
          </div>
          <h2 className={`${display.className} mt-5 text-lg sm:text-xl font-bold text-[#10262B]`}>
            Halaman Sedang Dikerjakan
          </h2>
          <p className="mt-2 max-w-md text-xs sm:text-sm text-[#5B7276] leading-relaxed">
            Modul <strong>PPIC Planning</strong> sedang dalam tahap integrasi alur kerja. Fitur perencanaan jadwal dan estimasi kebutuhan restock akan segera hadir di sini.
          </p>
        </section>
      </main>
    </div>
  );
}