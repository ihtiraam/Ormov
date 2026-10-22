'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Home, LogIn } from 'lucide-react';
import { Bricolage_Grotesque } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import LoginModal from '@/components/LoginModal'; // Import Modal Login

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });

export default function Navbar() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // State untuk mengontrol Modal Login
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('ormov_sidebar_open');
    if (saved) {
      setIsSidebarOpen(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('ormov_sidebar_open', JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen, isMounted]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const focus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10262B]';

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#10262B] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          
          {/* Bagian Kiri: Tombol Hamburger & Logo */}
          <div className="flex items-center gap-3.5">
            <button
              id="hamburger-toggle-btn"
              onClick={handleToggleSidebar}
              aria-label="Toggle Menu Sidebar"
              className={`${focus} grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/5 text-white transition hover:bg-white/15`}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
              <div className={`${display.className} text-2xl font-extrabold tracking-tight`}>Ormov</div>
              <span className="hidden h-5 w-px bg-white/25 sm:inline-block" />
              <span className="hidden text-sm text-white/75 sm:inline-block">PT Eka Ormed Indonesia</span>
            </Link>
          </div>

          {/* Bagian Kanan: Aksi (Ke Beranda & Tombol Login) */}
          <div className="flex items-center gap-2.5">
            {!isHomePage && (
              <Link
                href="/"
                className={`${focus} inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/90 transition hover:bg-white/15 hover:text-white md:text-sm`}
              >
                <Home className="h-4 w-4 text-[#2DD4BF]" />
                <span className="hidden sm:inline">Ke Beranda</span>
              </Link>
            )}

            {/* Tombol Pemicu Modal Login */}
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className={`${focus} inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#115E56] active:scale-[0.98] md:text-sm`}
            >
              <LogIn className="h-4 w-4 text-white" />
              <span>Masuk</span>
            </button>
          </div>

        </div>
      </header>

      {/* Komponen Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Komponen Modal Login */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}