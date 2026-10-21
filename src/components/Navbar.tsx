'use client';

import Link from 'next/link';
import { Archive, ArrowLeft, Plus } from 'lucide-react';
import { Bricolage_Grotesque } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });

interface NavbarProps {
  variant: 'main' | 'history';
  onOpenAddModal?: () => void;
}

export default function Navbar({ variant, onOpenAddModal }: NavbarProps) {
  const focus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10262B]';

  return (
    <header className="bg-[#10262B] text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className={`${display.className} text-2xl font-extrabold tracking-tight`}>Ormov</div>
          <span className="h-5 w-px bg-white/20" />
          <span className="text-sm text-white/70">PT Eka Ormed Indonesia</span>
        </div>

        {variant === 'main' ? (
          <div className="flex items-center gap-2">
            <Link
              href="/history"
              className={`${focus} inline-flex items-center gap-2 rounded-lg border border-white/25 px-3.5 py-2 text-sm font-medium text-white/95 transition hover:bg-white/10`}
            >
              <Archive className="h-4 w-4" /> Arsip
            </Link>
            {onOpenAddModal && (
              <button
                onClick={onOpenAddModal}
                className={`${focus} inline-flex items-center gap-2 rounded-lg bg-[#2DD4BF] px-3.5 py-2 text-sm font-semibold text-[#06302B] transition hover:bg-[#5EEAD4]`}
              >
                <Plus className="h-4 w-4" /> Buat SPK baru
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/"
            className={`${focus} inline-flex items-center gap-2 rounded-lg border border-white/25 px-3.5 py-2 text-sm font-medium text-white/95 transition hover:bg-white/10`}
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke monitoring
          </Link>
        )}
      </div>
    </header>
  );
}