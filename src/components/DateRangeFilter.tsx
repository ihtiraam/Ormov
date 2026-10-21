'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, X, Check } from 'lucide-react';
import { Bricolage_Grotesque } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700'] });

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export default function DateRangeFilter({ startDate, endDate, onChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApply = () => {
    let finalStart = tempStart;
    let finalEnd = tempEnd;
    if (finalStart && !finalEnd) finalEnd = finalStart;
    if (!finalStart && finalEnd) finalStart = finalEnd;

    onChange(finalStart, finalEnd);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempStart('');
    setTempEnd('');
    onChange('', '');
    setIsOpen(false);
  };

  const hasFilter = startDate || endDate;

  const getLabel = () => {
    if (!startDate && !endDate) return 'Filter Tanggal';
    if (startDate && (!endDate || startDate === endDate)) {
      return new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return `${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — ${new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const focus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${focus} inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-[#44595D] ring-1 ring-[#D5DEDB] transition hover:ring-[#9DB0B3]`}
      >
        <Calendar className="h-4 w-4 text-[#0F766E]" />
        <span className="truncate max-w-[150px] sm:max-w-[180px]">{getLabel()}</span>
        {hasFilter && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="ml-1 rounded-full p-0.5 hover:bg-[#EEF2F0] text-[#7F9296] hover:text-[#B4402B]"
            title="Reset Filter"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {isOpen && (
        /* Perbaikan posisi mobile: Menggunakan fixed/centering di mobile, dan absolute di md ke atas */
        <div className="ormov-fade fixed inset-x-4 top-20 z-50 mx-auto w-auto max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-[#D5DEDB] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:shadow-xl">
          <div className="flex items-center justify-between border-b border-[#E4EAE7] pb-3">
            <h4 className={`${display.className} text-base font-bold text-[#12292D]`}>Pilih Rentang Tanggal</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-[#7F9296] hover:bg-[#EEF2F0] hover:text-[#12292D]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#5B7276] mb-1.5">Dari Tanggal (Mulai)</label>
              <input
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className={`${focus} w-full rounded-xl bg-[#F7F9F8] px-3.5 py-2 text-sm text-[#12292D] ring-1 ring-[#D5DEDB]`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5B7276] mb-1.5">Sampai Tanggal (Selesai)</label>
              <input
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                min={tempStart}
                className={`${focus} w-full rounded-xl bg-[#F7F9F8] px-3.5 py-2 text-sm text-[#12292D] ring-1 ring-[#D5DEDB]`}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-[#E4EAE7]">
            <button
              onClick={handleReset}
              className={`${focus} rounded-xl px-3.5 py-2 text-xs font-semibold text-[#5B7276] hover:bg-[#EEF2F0]`}
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className={`${focus} inline-flex items-center gap-1.5 rounded-xl bg-[#10262B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B3A40]`}
            >
              <Check className="h-3.5 w-3.5" /> Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}