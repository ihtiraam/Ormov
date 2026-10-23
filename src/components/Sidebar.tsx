'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Hash, Archive, CalendarCheck, ChevronDown } from 'lucide-react';
import { Bricolage_Grotesque } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type IconType = typeof Home;

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2DD4BF]';

function NavLink({
  href, icon: Icon, label, active, onNavigate,
}: { href: string; icon: IconType; label: string; active: boolean; onNavigate: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`${focus} group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active ? 'bg-white/[0.09] text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      {active && <span aria-hidden className="absolute -left-4 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#2DD4BF]" />}
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
          active ? 'bg-[#2DD4BF]/20 text-[#5EEAD4]' : 'bg-white/5 text-white/60 group-hover:text-[#5EEAD4]'
        }`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span>{label}</span>
    </Link>
  );
}

function SubLink({
  href, icon: Icon, label, active, focusable, onNavigate,
}: { href: string; icon: IconType; label: string; active: boolean; focusable: boolean; onNavigate: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      tabIndex={focusable ? 0 : -1}
      aria-current={active ? 'page' : undefined}
      className={`${focus} flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
        active ? 'bg-[#2DD4BF]/15 text-[#7FE9DA]' : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">{children}</p>;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDashboardGroupActive = pathname === '/dashboard' || pathname === '/history';

  // State untuk mengontrol dropdown (langsung terbuka jika halaman aktif ada di dalam grup)
  const [isDropdownOpen, setIsDropdownOpen] = useState(isDashboardGroupActive);

  useEffect(() => {
    if (isDashboardGroupActive) setIsDropdownOpen(true);
  }, [isDashboardGroupActive]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  // Deteksi klik di luar sidebar untuk menutupnya
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        const hamburgerBtn = document.getElementById('hamburger-toggle-btn');
        if (hamburgerBtn && hamburgerBtn.contains(event.target as Node)) {
          return;
        }
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Hover untuk pengguna PC (hanya untuk mouse, bukan sentuhan)
  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || isDashboardGroupActive) return;
    timeoutRef.current = setTimeout(() => setIsDropdownOpen(false), 150);
  };

  // Klik: di PC hanya memastikan terbuka (agar tidak bentrok dengan hover), di HP / keyboard membuka-menutup
  const handleToggleClick = (e: React.MouseEvent) => {
    const canHover = window.matchMedia('(hover: hover)').matches;
    if (canHover && e.detail > 0 && !isDashboardGroupActive) {
      setIsDropdownOpen(true);
      return;
    }
    setIsDropdownOpen((prev) => !prev);
  };

  const is = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Latar redup di HP saat sidebar terbuka */}
      {isOpen && <div aria-hidden className="fixed inset-x-0 bottom-0 top-[73px] z-30 bg-[#10262B]/40 md:hidden" />}

      <aside
        ref={sidebarRef}
        className={`fixed bottom-0 left-0 top-[73px] z-40 flex w-64 flex-col border-r border-white/10 bg-[#16363D] text-white shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen ? 'visible translate-x-0 opacity-100' : 'invisible pointer-events-none -translate-x-full opacity-0'
        }`}
        aria-label="Sidebar Menu"
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-white/10 px-6 py-5">
          <div aria-hidden className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-[#2DD4BF]/15 blur-2xl" />
          <p className="relative text-[11px] font-semibold uppercase tracking-wider text-[#2DD4BF]">Navigasi</p>
          <p className={`${display.className} relative mt-0.5 text-xl font-extrabold tracking-tight`}>Menu Ormov</p>
          <p className="relative text-xs text-white/55">PT Eka Ormed Indonesia</p>
        </div>

        {/* Daftar menu */}
        <nav className="flex-1 space-y-5 overflow-y-auto p-4" aria-label="Menu utama">
          <div className="space-y-1">
            <SectionLabel>Utama</SectionLabel>
            <NavLink href="/" icon={Home} label="Beranda / Hub" active={pathname === '/'} onNavigate={onClose} />
          </div>

          <div className="space-y-1">
            <SectionLabel>Operasional</SectionLabel>

            {/* Grup Dashboard (hover untuk PC, klik untuk HP) */}
            <div onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
              <button
                type="button"
                onClick={handleToggleClick}
                aria-expanded={isDropdownOpen}
                aria-controls="sidebar-dashboard-group"
                className={`${focus} group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isDashboardGroupActive ? 'bg-white/[0.05] text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
                      isDashboardGroupActive
                        ? 'bg-[#2DD4BF]/20 text-[#5EEAD4]'
                        : 'bg-white/5 text-white/60 group-hover:text-[#5EEAD4]'
                    }`}
                  >
                    <LayoutDashboard className="h-[18px] w-[18px]" />
                  </span>
                  Dashboard SPK
                </span>
                <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <div
                id="sidebar-dashboard-group"
                aria-hidden={!isDropdownOpen}
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
                  isDropdownOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="ml-7 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                    <SubLink href="/dashboard" icon={LayoutDashboard} label="Monitoring" active={is('/dashboard')} focusable={isDropdownOpen} onNavigate={onClose} />
                    <SubLink href="/history" icon={Archive} label="Arsip" active={is('/history')} focusable={isDropdownOpen} onNavigate={onClose} />
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Baru: PPIC Planning & Progress */}
            <NavLink
              href="/ppic"
              icon={CalendarCheck}
              label="PPIC Planning & Progress"
              active={is('/ppic')}
              onNavigate={onClose}
            />

            {/* Menu Lot Produksi */}
            <NavLink href="/lot" icon={Hash} label="Nomor Lot Produksi" active={is('/lot')} onNavigate={onClose} />
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/10">
            <span className={`${display.className} grid h-8 w-8 place-items-center rounded-lg bg-[#2DD4BF]/15 text-base font-extrabold text-[#5EEAD4]`}>
              o
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/85">ORMOV System</p>
              <p className="truncate text-[11px] text-white/45">&copy; 2026 PT Eka Ormed Indonesia</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}