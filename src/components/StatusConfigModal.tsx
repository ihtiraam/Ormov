'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle2, X, Archive } from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

type ItemStatus = 'BELUM_SELESAI' | 'HAMPIR_SELESAI' | 'SELESAI';

interface StatusConfigModalProps {
  item: { doc_number: string; item_status: ItemStatus; completion_notes: string | null } | null;
  onClose: () => void;
  onSave: (status: ItemStatus, notes: string) => void;
}

const OPTIONS: { key: ItemStatus; label: string; Icon: typeof Clock; on: string; icon: string }[] = [
  { key: 'BELUM_SELESAI', label: 'Belum selesai', Icon: Clock, on: 'border-[#D98E1F] bg-[#FBEFD5] text-[#7A4708]', icon: 'text-[#D98E1F]' },
  { key: 'HAMPIR_SELESAI', label: 'Hampir selesai', Icon: AlertCircle, on: 'border-[#3F63D6] bg-[#E4EAFB] text-[#223F96]', icon: 'text-[#3F63D6]' },
  { key: 'SELESAI', label: 'Sudah selesai', Icon: CheckCircle2, on: 'border-[#16976F] bg-[#DDF3EA] text-[#0B5A42]', icon: 'text-[#16976F]' },
];

export default function StatusConfigModal({ item, onClose, onSave }: StatusConfigModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus>('BELUM_SELESAI');
  const [completionNotesInput, setCompletionNotesInput] = useState('');
  const [notesError, setNotesError] = useState(false);

  useEffect(() => {
    if (item) {
      setSelectedStatus(item.item_status);
      setCompletionNotesInput(item.completion_notes || '');
      setNotesError(false);
    }
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item) return null;

  const handleSave = () => {
    if (selectedStatus === 'HAMPIR_SELESAI' && !completionNotesInput.trim()) {
      setNotesError(true);
      return;
    }
    onSave(selectedStatus, completionNotesInput);
  };

  const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]';

  return (
    <div
      className={`${body.className} fixed inset-0 z-50 grid place-items-center p-4 text-[#12292D]`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-title"
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

      <div className="ormov-pop relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E4EAE7] p-6">
          <div>
            <h3 id="status-title" className={`${display.className} text-xl font-extrabold leading-tight`}>
              Ubah status {item.doc_number}
            </h3>
            <p className="mt-1 text-sm text-[#5B7276]">Pilih tahap pengerjaan barang saat ini.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className={`${focus} grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#44595D] hover:bg-[#EEF2F0]`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-[#44595D]">Status barang</legend>
            <div className="grid grid-cols-3 gap-2">
              {OPTIONS.map(({ key, label, Icon, on, icon }) => {
                const active = selectedStatus === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSelectedStatus(key);
                      setNotesError(false);
                    }}
                    className={`${focus} flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition ${
                      active ? on : 'border-transparent bg-[#F1F4F2] text-[#44595D] hover:bg-[#E6EBE9]'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? icon : 'text-[#7F9296]'}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {selectedStatus === 'HAMPIR_SELESAI' && (
            <div>
              <label htmlFor="status-notes" className="mb-1.5 block text-sm font-semibold text-[#44595D]">
                Barang yang sudah selesai (wajib diisi)
              </label>
              <textarea
                id="status-notes"
                rows={3}
                value={completionNotesInput}
                onChange={(e) => {
                  setCompletionNotesInput(e.target.value);
                  setNotesError(false);
                }}
                placeholder="Contoh: Barang A, D, I, F sudah selesai diproses"
                aria-invalid={notesError}
                aria-describedby={notesError ? 'status-notes-error' : undefined}
                className={`${focus} w-full resize-none rounded-xl bg-white p-3 text-sm leading-relaxed ring-1 placeholder:text-[#8FA0A3] ${
                  notesError ? 'ring-2 ring-[#B4402B]' : 'ring-[#C5D1CE]'
                }`}
              />
              {notesError && (
                <p id="status-notes-error" className="mt-1.5 text-sm text-[#B4402B]">
                  Isi barang yang sudah selesai sebelum menyimpan status hampir selesai.
                </p>
              )}
            </div>
          )}

          {selectedStatus === 'SELESAI' && (
            <div className="flex items-start gap-3 rounded-xl bg-[#DDF3EA] p-3.5 text-sm leading-relaxed text-[#0B5A42]">
              <Archive className="mt-0.5 h-4 w-4 shrink-0" />
              <p>SPK ditandai selesai 100% dan dipindahkan dari halaman monitoring ke arsip.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#E4EAE7] p-4">
          <button
            type="button"
            onClick={onClose}
            className={`${focus} rounded-lg px-4 py-2.5 text-sm font-medium ring-1 ring-[#C5D1CE] hover:bg-[#F1F4F2]`}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`${focus} rounded-lg bg-[#10262B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1B3A40] focus-visible:ring-offset-2`}
          >
            {selectedStatus === 'SELESAI' ? 'Simpan dan arsipkan' : 'Simpan perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}