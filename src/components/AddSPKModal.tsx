'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

interface AddSPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (docNumber: string, handoverDate: string, purposeNotes: string) => void;
}

const today = () => new Date().toISOString().split('T')[0];

export default function AddSPKModal({ isOpen, onClose, onSubmit }: AddSPKModalProps) {
  const [docNumber, setDocNumber] = useState('');
  const [handoverDate, setHandoverDate] = useState('');
  const [purposeNotes, setPurposeNotes] = useState('');
  const [docError, setDocError] = useState(false);
  const docRef = useRef<HTMLInputElement>(null);

  // Tanggal default hari ini diset di client setiap modal dibuka, lalu kolom nomor langsung aktif
  useEffect(() => {
    if (!isOpen) return;
    setHandoverDate(today());
    setDocError(false);
    docRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      setDocError(true);
      docRef.current?.focus();
      return;
    }
    onSubmit(docNumber.trim(), handoverDate, purposeNotes);
    setDocNumber('');
    setPurposeNotes('');
  };

  const field =
    'w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-[#C5D1CE] placeholder:text-[#8FA0A3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]';
  const label = 'mb-1.5 block text-sm font-semibold text-[#44595D]';

  return (
    <div
      className={`${body.className} fixed inset-0 z-50 grid place-items-center p-4 text-[#12292D]`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-spk-title"
    >
      <style>{`
        @keyframes ormov-pop { from { transform: translateY(12px) scale(.98); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes ormov-fade { from { opacity: 0 } to { opacity: 1 } }
        .ormov-pop { animation: ormov-pop .2s ease-out }
        .ormov-fade { animation: ormov-fade .18s ease-out }
        @media (prefers-reduced-motion: reduce) { .ormov-pop, .ormov-fade { animation: none } }
      `}</style>

      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="ormov-fade absolute inset-0 cursor-default bg-[#10262B]/50 backdrop-blur-[2px]"
      />

      <div className="ormov-pop relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E4EAE7] p-6">
          <div>
            <h3 id="add-spk-title" className={`${display.className} text-xl font-extrabold leading-tight`}>
              Buat SPK / WO baru
            </h3>
            <p className="mt-1 text-sm text-[#5B7276]">Status awal otomatis belum selesai.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#44595D] hover:bg-[#EEF2F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5 p-6">
            <div>
              <label htmlFor="doc-number" className={label}>Nomor SPK / MUTASI</label>
              <input
                id="doc-number"
                ref={docRef}
                type="text"
                value={docNumber}
                onChange={(e) => {
                  setDocNumber(e.target.value);
                  setDocError(false);
                }}
                aria-invalid={docError}
                aria-describedby={docError ? 'doc-error' : undefined}
                className={`${field} ${docError ? '!ring-2 !ring-[#B4402B]' : ''}`}
              />
              {docError && (
                <p id="doc-error" className="mt-1.5 text-sm text-[#B4402B]">
                  Isi nomor SPK / WO sebelum menyimpan.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="handover-date" className={label}>Tanggal penyerahan</label>
              <input
                id="handover-date"
                type="date"
                value={handoverDate}
                onChange={(e) => setHandoverDate(e.target.value)}
                className={field}
                required
              />
            </div>

            <div>
              <label htmlFor="purpose" className={label}>Tujuan penyerahan</label>
              <textarea
                id="purpose"
                rows={3}
                placeholder="Contoh: Pengiriman sterilisasi ke PT Symmex"
                value={purposeNotes}
                onChange={(e) => setPurposeNotes(e.target.value)}
                className={`${field} resize-none leading-relaxed`}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#E4EAE7] p-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium ring-1 ring-[#C5D1CE] hover:bg-[#F1F4F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#10262B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1B3A40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" /> Simpan SPK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}