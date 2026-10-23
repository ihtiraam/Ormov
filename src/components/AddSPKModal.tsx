'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

interface AddSPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (docNumber: string, handoverDate: string, purposeNotes: string, labelText: string, labelColor: string) => void;
}

const today = () => new Date().toISOString().split('T')[0];

// Daftar pilihan warna bervariasi untuk label
const COLOR_OPTIONS = [
  { name: 'Emerald', bg: 'bg-[#DDF3EA]', text: 'text-[#0B6B4F]', ring: 'ring-[#0B6B4F]' },
  { name: 'Blue', bg: 'bg-[#E4EAFB]', text: 'text-[#2D4FB3]', ring: 'ring-[#2D4FB3]' },
  { name: 'Amber', bg: 'bg-[#FBEFD5]', text: 'text-[#9A5B0B]', ring: 'ring-[#9A5B0B]' },
  { name: 'Rose', bg: 'bg-[#FBE8E5]', text: 'text-[#B4402B]', ring: 'ring-[#B4402B]' },
  { name: 'Purple', bg: 'bg-[#F3E8FB]', text: 'text-[#6B21A8]', ring: 'ring-[#6B21A8]' },
  { name: 'Cyan', bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', ring: 'ring-[#0369A1]' },
  { name: 'Dark Charcoal', bg: 'bg-[#10262B]', text: 'text-white', ring: 'ring-[#10262B]' },
];

export default function AddSPKModal({ isOpen, onClose, onSubmit }: AddSPKModalProps) {
  const [docNumber, setDocNumber] = useState('');
  const [handoverDate, setHandoverDate] = useState('');
  const [purposeNotes, setPurposeNotes] = useState('');
  const [labelText, setLabelText] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].bg + '|' + COLOR_OPTIONS[0].text);
  
  const [docError, setDocError] = useState(false);
  const docRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setHandoverDate(today());
    setDocNumber('');
    setPurposeNotes('');
    setLabelText('');
    setSelectedColor(COLOR_OPTIONS[0].bg + '|' + COLOR_OPTIONS[0].text);
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
    onSubmit(docNumber.trim(), handoverDate, purposeNotes, labelText, selectedColor);
  };

  const field =
    'w-full rounded-xl bg-white px-3.5 py-2.5 text-sm ring-1 ring-[#C5D1CE] placeholder:text-[#8FA0A3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]';
  const label = 'mb-1.5 block text-sm font-semibold text-[#44595D]';

  return (
    <div
      className={`${body.className} fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 text-[#12292D]`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-spk-title"
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-[#10262B]/50 backdrop-blur-[2px]"
      />

      <div className="relative my-auto w-full max-w-md rounded-2xl bg-white shadow-2xl">
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
          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
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
                className={`${field} ${docError ? '!ring-2 !ring-[#B4402B]' : ''}`}
              />
              {docError && (
                <p className="mt-1.5 text-sm text-[#B4402B]">
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
                rows={2}
                placeholder="Contoh: Pengiriman sterilisasi ke PT Symmex"
                value={purposeNotes}
                onChange={(e) => setPurposeNotes(e.target.value)}
                className={`${field} resize-none leading-relaxed`}
                required
              />
            </div>

            {/* Bagian Label Kustom & Pemilihan Warna */}
            <div className="rounded-xl border border-[#E4EAE7] bg-[#F7F9F8] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#0F766E]" />
                <label htmlFor="label-text" className="text-sm font-semibold text-[#44595D]">
                  Label Kustom <span className="font-normal text-[#7F9296]">(Opsional)</span>
                </label>
              </div>

              <input
                id="label-text"
                type="text"
                placeholder="Contoh: Urgen, VIP, Garansi"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                className={field}
              />

              {labelText.trim() && (
                <div>
                  <span className="mb-2 block text-xs font-medium text-[#5B7276]">Pilih Warna Label:</span>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((opt) => {
                      const val = `${opt.bg}|${opt.text}`;
                      const isSelected = selectedColor === val;
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => setSelectedColor(val)}
                          className={`h-7 px-3 rounded-full text-xs font-semibold transition ${opt.bg} ${opt.text} ${
                            isSelected ? `ring-2 ring-offset-2 ${opt.ring} scale-105` : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          {opt.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#E4EAE7] p-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium ring-1 ring-[#C5D1CE] hover:bg-[#F1F4F2]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#10262B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1B3A40]"
            >
              <Plus className="h-4 w-4" /> Simpan SPK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}