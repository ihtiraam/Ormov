'use client';

import Link from 'next/link';
import { ArrowLeft, Hash } from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

export default function OrmovLotPage() {
  const focus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';

  return (
    <div className={`${body.className} min-h-screen bg-[#F1F4F2] text-[#12292D]`}>

      <main className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className={`${focus} inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#10262B] ring-1 ring-[#D5DEDB] transition hover:bg-[#F7F9F8] hover:ring-[#9DB0B3]`}
          >
            <ArrowLeft className="h-4 w-4 text-[#5B7276]" /> Kembali ke Beranda
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-8 text-center ring-1 ring-[#D5DEDB] md:py-16">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#E6EFEC] text-[#0F766E]">
            <Hash className="h-8 w-8" />
          </div>
          <h1 className={`${display.className} mt-4 text-3xl font-extrabold tracking-tight`}>
            Pemberian Nomor Lot
          </h1>
          <p className="mt-2 text-sm text-[#5B7276]">
            Halaman ini masih kosong dan sedang dipersiapkan untuk fitur penomoran lot produk.
          </p>
        </section>
      </main>
    </div>
  );
}