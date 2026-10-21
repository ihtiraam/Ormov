'use client';

import { useEffect } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { Bricolage_Grotesque } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700', '800'] });

interface DeleteConfirmModalProps {
  isOpen: boolean;
  docNumber: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  docNumber,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const focus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4402B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Konfirmasi hapus ${docNumber}`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="ormov-fade absolute inset-0 cursor-default bg-[#10262B]/50 backdrop-blur-[2px]"
      />

      {/* Pop-up Card */}
      <div className="ormov-pop relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-[#D5DEDB]">
        <button
          onClick={onClose}
          aria-label="Tutup modal"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[#7F9296] transition hover:bg-[#EEF2F0] hover:text-[#12292D]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FBE8E5] text-[#B4402B]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className={`${display.className} text-xl font-bold text-[#12292D]`}>
              Hapus SPK / Mutasi?
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#5B7276]">
              Anda yakin ingin menghapus dokumen <strong className="text-[#12292D]">{docNumber}</strong>? Tindakan ini permanen dan data tidak dapat dikembalikan.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[#E4EAE7]">
          <button
            type="button"
            onClick={onClose}
            className={`${focus} rounded-xl px-4 py-2.5 text-sm font-medium text-[#44595D] ring-1 ring-[#C5D1CE] transition hover:bg-[#F1F4F2]`}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${focus} inline-flex items-center gap-2 rounded-xl bg-[#B4402B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8E3221] shadow-sm`}
          >
            <Trash2 className="h-4 w-4" /> Hapus Permanen
          </button>
        </div>
      </div>
    </div>
  );
}