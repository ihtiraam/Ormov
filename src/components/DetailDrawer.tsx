'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Bricolage_Grotesque } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });

interface SPKSimple {
  id: string;
  doc_number: string;
  handover_date: string;
  purpose_notes: string | null;
  completion_notes: string | null;
  item_status: 'BELUM_SELESAI' | 'HAMPIR_SELESAI' | 'SELESAI';
  is_finished: boolean;
  created_at: string;
}

interface DetailDrawerProps {
  item: SPKSimple | null;
  onClose: () => void;
  onOpenConfig: (item: SPKSimple) => void;
}

const STATUS_CONFIG = {
  HAMPIR_SELESAI: { label: 'Hampir selesai', text: 'text-[#2D4FB3]', bg: 'bg-[#E4EAFB]' },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';

export default function DetailDrawer({ item, onClose, onOpenConfig }: DetailDrawerProps) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item) return null;

  const s = STATUS_CONFIG.HAMPIR_SELESAI;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Rincian ${item.doc_number}`}>
      <button
        aria-label="Tutup rincian"
        onClick={onClose}
        className="ormov-fade absolute inset-0 cursor-default bg-[#10262B]/50 backdrop-blur-[2px]"
      />
      <aside className="ormov-drawer absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E4EAE7] p-6">
          <div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
              {s.label}
            </span>
            <h3 className={`${display.className} mt-3 text-2xl font-extrabold leading-tight`}>{item.doc_number}</h3>
            <p className="mt-1 text-sm text-[#5B7276]">Diserahkan {fmtDate(item.handover_date)}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className={`${focus} grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#44595D] hover:bg-[#EEF2F0]`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div>
            <h4 className="text-sm font-semibold text-[#44595D]">Tujuan SPK</h4>
            <p className="mt-1.5 text-sm leading-relaxed">{item.purpose_notes || '–'}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#44595D]">Barang yang sudah selesai diproses</h4>
            <div className="mt-2 whitespace-pre-line rounded-xl bg-[#F1F4F2] p-4 text-sm leading-relaxed">
              {item.completion_notes || 'Belum ada catatan rincian barang.'}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-[#E4EAE7] p-4">
          <button
            onClick={onClose}
            className={`${focus} flex-1 rounded-lg px-4 py-2.5 text-sm font-medium ring-1 ring-[#C5D1CE] hover:bg-[#F1F4F2]`}
          >
            Tutup
          </button>
          <button
            onClick={() => {
              onOpenConfig(item);
              onClose();
            }}
            className={`${focus} flex-1 rounded-lg bg-[#10262B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1B3A40]`}
          >
            Ubah status
          </button>
        </div>
      </aside>
    </div>
  );
}