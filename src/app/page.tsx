'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, ListTodo, CalendarCheck, ArrowRight, Lock } from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
import LoginModal from '@/components/LoginModal';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

type ModuleDef = {
  title: string;
  desc: string;
  cta: string;
  icon: typeof ListTodo;
  tint: string;
};

const MODULES = {
  spk: {
    title: 'Monitoring SPK & Mutasi',
    desc: 'Pantau status pengerjaan Work Order (SPK) dan dokumen mutasi aktif secara real-time.',
    cta: 'Buka Dashboard',
    icon: LayoutDashboard,
    tint: 'bg-[#E1ECE9] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white',
  },
  ppic: {
    title: 'PPIC & Production Planning',
    desc: 'Monitoring perencanaan dan progres target PPIC.',
    cta: 'Pantau Progres',
    icon: CalendarCheck,
    tint: 'bg-[#FBEFD5] text-[#9A5B0B] group-hover:bg-[#D98E1F] group-hover:text-white',
  },
  tasks: {
    title: 'Task Manager',
    desc: 'Catat urutan agenda pekerjaan harianmu.',
    cta: 'Buka Agenda',
    icon: ListTodo,
    tint: 'bg-[#E4EAFB] text-[#2D4FB3] group-hover:bg-[#3F63D6] group-hover:text-white',
  },
} satisfies Record<string, ModuleDef>;

const cardClass =
  'group relative flex h-full w-full flex-col rounded-2xl bg-white p-6 text-left shadow-[0_1px_2px_rgba(16,38,43,0.06)] ring-1 ring-[#D5DEDB] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_-16px_rgba(16,38,43,0.35)] hover:ring-[#0F766E]';

function CardBody({ m, chip }: { m: ModuleDef; chip?: React.ReactNode }) {
  const Icon = m.icon;
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl transition-colors duration-200 ${m.tint}`}>
          <Icon className="h-6 w-6" />
        </span>
        {chip}
      </div>

      <h2 className={`${display.className} mt-5 text-xl font-bold leading-snug tracking-tight text-[#12292D]`}>{m.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#5B7276]">{m.desc}</p>

      <div className="mt-auto flex items-center justify-between border-t border-[#EEF2F0] pt-4">
        <span className="text-sm font-semibold text-[#0F766E]">{m.cta}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F4F2] text-[#0F766E] transition-colors duration-200 group-hover:bg-[#0F766E] group-hover:text-white">
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </>
  );
}

export default function OrmovHomeHub() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [todayLabel, setTodayLabel] = useState('');

  useEffect(() => {
    const hasLoggedInSession = sessionStorage.getItem('ormov_session_active');

    if (!hasLoggedInSession) {
      setIsLoginModalOpen(true);
    }

    setTodayLabel(
      new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    );
  }, []);

  const handleCloseModal = () => {
    sessionStorage.setItem('ormov_session_active', 'true');
    setIsLoginModalOpen(false);
  };

  const handlePPICClick = (e: React.MouseEvent) => {
    e.preventDefault();

    const userRole = sessionStorage.getItem('ormov_user_role') || localStorage.getItem('ormov_user_role');
    const normalizedRole = userRole ? userRole.toLowerCase().replace(/[\s_-]/g, '') : '';

    if (normalizedRole === 'superadmin') {
      router.push('/ppic');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Diubah mengarah ke /taskmanager
  const handleTasksClick = (e: React.MouseEvent) => {
    e.preventDefault();

    const userRole = sessionStorage.getItem('ormov_user_role') || localStorage.getItem('ormov_user_role');
    const normalizedRole = userRole ? userRole.toLowerCase().replace(/[\s_-]/g, '') : '';

    if (normalizedRole === 'superadmin') {
      router.push('/taskmanager');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const focus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';

  return (
    <div className={`${body.className} min-h-screen bg-[#F1F4F2] text-[#12292D]`}>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:px-8 md:pt-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-[#10262B] px-6 pb-24 pt-10 text-white md:px-12 md:pb-28 md:pt-14">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
              maskImage: 'radial-gradient(ellipse at top left, black 10%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at top left, black 10%, transparent 75%)',
            }}
          />
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#2DD4BF]/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-[#3F63D6]/25 blur-3xl" />

          <div className="relative max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#5EEAD4] ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4BF]" /> PT Eka Ormed Indonesia
            </p>
            <h1 className={`${display.className} mt-5 text-5xl font-extrabold tracking-tight md:text-6xl`}>Ormov Hub</h1>
            {todayLabel && <p className="mt-8 text-sm text-white/45">{todayLabel}</p>}
          </div>
        </section>

        {/* Kartu modul */}
        <div className="relative z-10 -mt-14 grid gap-5 px-2 sm:px-4 md:-mt-16 md:grid-cols-2 md:px-6 lg:grid-cols-3">
          <Link href="/dashboard" className={`${focus} ${cardClass}`}>
            <CardBody
              m={MODULES.spk}
              chip={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF3EA] px-2.5 py-1 text-[11px] font-semibold text-[#0B6B4F]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16976F]" /> Real-time
                </span>
              }
            />
          </Link>

          <button type="button" onClick={handlePPICClick} className={`${focus} ${cardClass} cursor-pointer`}>
            <CardBody
              m={MODULES.ppic}
              chip={
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FBEFD5] px-2.5 py-1 text-[11px] font-semibold text-[#9A5B0B] ring-1 ring-[#F0D9A8]">
                  <Lock className="h-3 w-3" /> Super Admin
                </span>
              }
            />
          </button>

          <button type="button" onClick={handleTasksClick} className={`${focus} ${cardClass} cursor-pointer`}>
            <CardBody
              m={MODULES.tasks}
              chip={
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FBEFD5] px-2.5 py-1 text-[11px] font-semibold text-[#9A5B0B] ring-1 ring-[#F0D9A8]">
                  <Lock className="h-3 w-3" /> Super Admin
                </span>
              }
            />
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-[#7F9296]">Modul baru akan ditambahkan secara berkala.</p>
      </main>

      <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseModal} />
    </div>
  );
}