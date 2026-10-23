'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Lock, User, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
import { useAuth } from '@/context/AuthContext'; // Import hook autentikasi global

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth(); // Mengambil fungsi login global dari AuthContext
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [capsOn, setCapsOn] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);

  // Reset form saat modal ditutup, fokuskan kolom username saat dibuka
  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setPassword('');
      setErrorMessage('');
      setShowPassword(false);
      setCapsOn(false);
    } else {
      userRef.current?.focus();
    }
  }, [isOpen]);

  // Handle tombol ESC untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Username dan kata sandi wajib diisi');
      return;
    }

    setIsLoading(true);

    try {
      // Memanggil fungsi login yang mengecek ke tabel staff di Supabase
      const result = await login(username, password);

      if (result.success) {
        onClose(); // Tutup modal jika autentikasi berhasil
      } else {
        setErrorMessage(result.message || 'Gagal masuk. Periksa kembali akun Anda.');
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2';
  const field = `${focus} w-full rounded-xl bg-white py-3 pl-10 text-sm ring-1 placeholder:text-[#8FA0A3] transition disabled:bg-[#F1F4F2] ${
    errorMessage ? 'ring-[#B4402B]' : 'ring-[#C5D1CE] hover:ring-[#9DB0B3]'
  }`;

  return (
    <div
      className={`${body.className} fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 text-[#12292D]`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <style>{`
        @keyframes ormov-pop { from { transform: translateY(14px) scale(.98); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes ormov-fade { from { opacity: 0 } to { opacity: 1 } }
        .ormov-pop { animation: ormov-pop .24s ease-out }
        .ormov-fade { animation: ormov-fade .18s ease-out }
        @media (prefers-reduced-motion: reduce) { .ormov-pop, .ormov-fade { animation: none } }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} className="ormov-fade fixed inset-0 bg-[#10262B]/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="ormov-pop relative my-auto grid w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl md:max-w-3xl md:grid-cols-[1fr_1.05fr]">
        {/* Panel merek (hanya di layar lebar) */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#10262B] p-8 text-white md:flex">
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
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#2DD4BF]/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-[#3F63D6]/25 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <span className={`${display.className} text-2xl font-extrabold tracking-tight`}>ormov</span>
            <span className="h-5 w-px bg-white/20" />
            <span className="text-sm text-white/70">PT Eka Ormed Indonesia</span>
          </div>

          <div className="relative">
            <h3 className={`${display.className} text-3xl font-extrabold leading-tight tracking-tight`}>
              Pantau setiap SPK sampai tuntas.
            </h3>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/65">
              Status penyerahan barang, catatan progres, dan arsip dalam satu tempat.
            </p>

            {/* Contoh tampilan SPK (dekoratif) */}
            <div aria-hidden className="mt-7 space-y-3">
              <div className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className={`${display.className} text-base font-bold`}>ROMWO0031</span>
                  <span className="rounded-full bg-[#3F63D6]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#B9C8FA]">
                    Hampir selesai
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/55">Pengiriman sterilisasi ke PT Symmex</p>
                <div className="mt-3 flex gap-1">
                  <span className="h-1.5 w-8 rounded-full bg-[#7B97F0]" />
                  <span className="h-1.5 w-8 rounded-full bg-[#7B97F0]" />
                  <span className="h-1.5 w-8 rounded-full bg-white/15" />
                </div>
              </div>
              <div className="ml-6 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-3">
                  <span className={`${display.className} text-base font-bold text-white/80`}>ROMWO0028</span>
                  <span className="rounded-full bg-[#D98E1F]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#F3CB87]">
                    Belum selesai
                  </span>
                </div>
                <div className="mt-3 flex gap-1">
                  <span className="h-1.5 w-8 rounded-full bg-[#E3A94A]" />
                  <span className="h-1.5 w-8 rounded-full bg-white/15" />
                  <span className="h-1.5 w-8 rounded-full bg-white/15" />
                </div>
              </div>
            </div>
          </div>

          <p className="relative inline-flex items-center gap-2 text-xs text-white/55">
            <ShieldCheck className="h-4 w-4 text-[#2DD4BF]" /> Akses terbatas untuk staf internal
          </p>
        </aside>

        {/* Panel formulir */}
        <div className="relative flex flex-col p-7 sm:p-9">
          <button
            onClick={onClose}
            aria-label="Tutup"
            className={`${focus} absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-[#5B7276] transition hover:bg-[#EEF2F0] hover:text-[#12292D]`}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Merek versi HP */}
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <span className={`${display.className} rounded-lg bg-[#10262B] px-2.5 py-1 text-lg font-extrabold tracking-tight text-white`}>
              ormov
            </span>
            <span className="text-sm text-[#5B7276]">PT Eka Ormed Indonesia</span>
          </div>

          <div className="mt-1">
            <h2 id="login-modal-title" className={`${display.className} text-3xl font-extrabold leading-tight tracking-tight`}>
              Masuk ke Ormov
            </h2>
            <p className="mt-1.5 text-sm text-[#5B7276]">Gunakan akun staf Anda untuk melanjutkan.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl bg-[#FBE8E5] p-3 text-sm font-medium text-[#B4402B] ring-1 ring-[#F2D6D0]"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="modal-username" className="mb-1.5 block text-sm font-semibold text-[#44595D]">
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F9296]" />
                <input
                  id="modal-username"
                  ref={userRef}
                  type="text"
                  autoComplete="username"
                  placeholder="Masukkan username Anda"
                  value={username}
                  disabled={isLoading}
                  aria-invalid={!!errorMessage}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`${field} pr-4`}
                />
              </div>
            </div>

            {/* Kata sandi */}
            <div>
              <label htmlFor="modal-password" className="mb-1.5 block text-sm font-semibold text-[#44595D]">
                Kata sandi
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7F9296]" />
                <input
                  id="modal-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  disabled={isLoading}
                  aria-invalid={!!errorMessage}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => setCapsOn(e.getModifierState('CapsLock'))}
                  onKeyUp={(e) => setCapsOn(e.getModifierState('CapsLock'))}
                  onBlur={() => setCapsOn(false)}
                  className={`${field} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`${focus} absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#7F9296] transition hover:bg-[#EEF2F0] hover:text-[#2B4045]`}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {capsOn && <p className="mt-1.5 text-xs font-medium text-[#9A5B0B]">Caps Lock sedang aktif.</p>}
            </div>

            <div className="space-y-3 pt-1">
              {/* Tombol Login (Utama) */}
              <button
                type="submit"
                disabled={isLoading}
                className={`${focus} group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_-8px_rgba(15,118,110,0.75)] transition hover:bg-[#0D645D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              {/* Tombol Tetap Lanjut (Ghost / Minimalist Secondary) */}
              <button
                type="button"
                onClick={onClose}
                className={`${focus} group flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium text-[#5B7276] transition hover:bg-[#F7F9F8] hover:text-[#12292D] active:scale-[0.98]`}
              >
                <span>Atau tetap lanjut tanpa masuk</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-[#7F9296] md:hidden">
            Akses terbatas hanya untuk staf internal PT Eka Ormed Indonesia.
          </p>
        </div>
      </div>
    </div>
  );
}