'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Home, LogIn, LogOut, AlertTriangle, X, ChevronDown, ShieldCheck, User } from 'lucide-react';
import { Bricolage_Grotesque } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/context/AuthContext';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });

const initialsOf = (name: string) => {
  const parts = (name || '?').trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
};

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={`${display.className} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5EEAD4] to-[#2DD4BF] font-extrabold text-[#06302B] ${
        size === 'lg' ? 'h-11 w-11 text-base' : 'h-8 w-8 text-xs'
      }`}
    >
      {initialsOf(name)}
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const { isLoggedIn, username, role, logout } = useAuth();
  const isSuperAdmin = role === 'super_admin';
  const roleLabel = isSuperAdmin ? 'Super Admin' : 'Staf';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // State untuk menu akun dan modal konfirmasi logout
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

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

  // Tutup menu akun: klik di luar atau tekan Escape
  useEffect(() => {
    if (!isAccountOpen) return;
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setIsAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsAccountOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isAccountOpen]);

  // Escape menutup modal konfirmasi logout
  useEffect(() => {
    if (!isLogoutConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsLogoutConfirmOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isLogoutConfirmOpen]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleConfirmLogout = () => {
    logout();
    setIsLogoutConfirmOpen(false);
  };

  const focus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10262B]';

  return (
    <>
      <style>{`
        @keyframes ormov-pop { from { transform: translateY(12px) scale(.98); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes ormov-fade { from { opacity: 0 } to { opacity: 1 } }
        .ormov-pop { animation: ormov-pop .2s ease-out }
        .ormov-fade { animation: ormov-fade .18s ease-out }
        @media (prefers-reduced-motion: reduce) { .ormov-pop, .ormov-fade { animation: none } }
      `}</style>

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

          {/* Bagian Kanan: Ke Beranda + Masuk / Menu Akun */}
          <div className="flex items-center gap-2.5">
            {!isHomePage && (
              <Link
                href="/"
                className={`${focus} inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3.5 text-xs font-medium text-white/90 transition hover:bg-white/15 hover:text-white md:text-sm`}
              >
                <Home className="h-4 w-4 text-[#2DD4BF]" />
                <span className="hidden sm:inline">Ke Beranda</span>
              </Link>
            )}

            {isLoggedIn ? (
              <div ref={accountRef} className="relative">
                {/* Pemicu: avatar + nama + peran */}
                <button
                  type="button"
                  onClick={() => setIsAccountOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={isAccountOpen}
                  aria-label={`Menu akun ${username}`}
                  className={`${focus} flex h-10 items-center gap-2.5 rounded-full bg-white/[0.07] py-1 pl-1 pr-2.5 ring-1 ring-white/15 transition hover:bg-white/[0.13] ${
                    isAccountOpen ? 'bg-white/[0.13]' : ''
                  }`}
                >
                  <Avatar name={username} />
                  <span className="hidden min-w-0 text-left leading-tight md:block">
                    <span className="block max-w-[10rem] truncate text-[13px] font-semibold">{username}</span>
                    <span className="block text-[11px] font-medium text-[#5EEAD4]">{roleLabel}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-white/60 transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Panel menu akun */}
                {isAccountOpen && (
                  <div
                    role="menu"
                    aria-label="Menu akun"
                    className="ormov-pop absolute right-0 top-full z-50 mt-2.5 w-64 origin-top-right overflow-hidden rounded-2xl bg-white text-[#12292D] shadow-2xl ring-1 ring-black/5"
                  >
                    <div className="bg-[#F1F4F2] p-4">
                      <p className="text-[11px] font-medium text-[#7F9296]">Masuk sebagai</p>
                      <div className="mt-2 flex items-center gap-3">
                        <Avatar name={username} size="lg" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{username}</p>
                          <span
                            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              isSuperAdmin ? 'bg-[#10262B] text-[#5EEAD4]' : 'bg-[#DDEBE8] text-[#0B5A52]'
                            }`}
                          >
                            {isSuperAdmin ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            {roleLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsAccountOpen(false);
                          setIsLogoutConfirmOpen(true);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[#B4402B] transition hover:bg-[#FBE8E5] focus-visible:bg-[#FBE8E5] focus-visible:outline-none"
                      >
                        <LogOut className="h-4 w-4" />
                        Keluar dari akun
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Tombol Masuk yang Diperbarui (Lebih rapi, rounded proporsional, dan efek interaktif halus) */
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={`${focus} group inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0D645D] hover:shadow-md hover:ring-2 hover:ring-[#2DD4BF]/40 active:scale-[0.98] md:text-sm`}
              >
                <LogIn className="h-4 w-4 text-[#5EEAD4] transition-transform duration-200 group-hover:translate-x-0.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Komponen Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Komponen Modal Login */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* Modal Konfirmasi Logout */}
      {isLogoutConfirmOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4 text-[#12292D]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
        >
          <button
            aria-label="Tutup modal"
            onClick={() => setIsLogoutConfirmOpen(false)}
            className="ormov-fade absolute inset-0 cursor-default bg-[#10262B]/50 backdrop-blur-[2px]"
          />
          <div className="ormov-pop relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FBE8E5] text-[#B4402B]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                aria-label="Tutup"
                className="grid h-8 w-8 place-items-center rounded-lg text-[#5B7276] hover:bg-[#F1F4F2]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <h3 id="logout-title" className={`${display.className} text-xl font-bold`}>Keluar dari Akun?</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#5B7276]">
                Kamu perlu masuk kembali untuk melakukan tindakan seperti membuat, mengubah, atau menghapus SPK.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="rounded-lg border border-[#C5D1CE] px-4 py-2 text-sm font-medium text-[#2B4045] transition hover:bg-[#F1F4F2]"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="rounded-lg bg-[#B4402B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#963321]"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}