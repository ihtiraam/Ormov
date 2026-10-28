'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

const pad = (n: number) => String(n).padStart(2, '0');

export interface DateFilterValue {
  start: string;
  end: string;
}

export interface DateRangeFilterProps {
  value: DateFilterValue | null;
  onChange: (val: DateFilterValue | null) => void;
  todayStr: string;
  yesterdayStr?: string; // <-- Tambahan agar tidak error TS di build Vercel
  tomorrowStr?: string;  // <-- Tambahan agar tidak error TS di build Vercel
  formatLabel: (dateStr: string) => string;
  taskDates?: string[];
  placeholder?: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function DateRangeFilter({
  value,
  onChange,
  todayStr,
  formatLabel,
  taskDates = [],
  placeholder = 'Filter Tanggal',
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'month-year'>('days');

  const [tempStart, setTempStart] = useState<string | null>(null);
  const [tempEnd, setTempEnd] = useState<string | null>(null);

  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(0);
  const [yearPageStart, setYearPageStart] = useState<number>(2020);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (todayStr) {
      const [y, m] = todayStr.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setCalYear(y);
        setCalMonth(m - 1);
        setYearPageStart(Math.floor(y / 12) * 12);
        return;
      }
    }
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
    setYearPageStart(Math.floor(now.getFullYear() / 12) * 12);
  }, [todayStr]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setViewMode('days');
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleDayClick = (iso: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(iso);
      setTempEnd(null);
    } else {
      if (iso < tempStart) {
        setTempEnd(tempStart);
        setTempStart(iso);
      } else {
        setTempEnd(iso);
      }
    }
  };

  const handleApply = () => {
    if (!tempStart) return;
    onChange({
      start: tempStart,
      end: tempEnd || tempStart,
    });
    setOpen(false);
    setViewMode('days');
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange(null);
    setTempStart(null);
    setTempEnd(null);
    setOpen(false);
    setViewMode('days');
  };

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Tombol Utama Filter */}
      <div
        onClick={() => {
          if (!open) {
            setTempStart(value ? value.start : null);
            setTempEnd(value ? value.end : null);
            setViewMode('days');
          }
          setOpen((v) => !v);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
          value
            ? 'bg-[#0F766E] text-white hover:bg-[#0D645D]'
            : 'bg-white text-[#10262B] ring-1 ring-[#D5DEDB] hover:bg-[#F1F4F2]'
        }`}
      >
        <Calendar className="h-4 w-4 shrink-0" />
        <span>
          {value
            ? value.start === value.end
              ? formatLabel(value.start)
              : `${formatLabel(value.start)} - ${formatLabel(value.end)}`
            : placeholder}
        </span>

        {/* Tombol Silang Terpadu di Sisi Kanan */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            title="Hapus filter tanggal"
            aria-label="Hapus filter tanggal"
            className="ml-1 -mr-1 grid h-4 w-4 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Popover Kalender */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10">
          {viewMode === 'days' ? (
            <>
              {/* Header Kalender Hari */}
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setYearPageStart(Math.floor(calYear / 12) * 12);
                    setViewMode('month-year');
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-[#10262B] transition hover:bg-[#F1F4F2]"
                >
                  <span>{MONTH_NAMES[calMonth]} {calYear}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#5B7276]" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="grid h-7 w-7 place-items-center rounded-lg text-[#5B7276] hover:bg-[#F1F4F2]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="grid h-7 w-7 place-items-center rounded-lg text-[#5B7276] hover:bg-[#F1F4F2]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Grid Hari */}
              <div className="mb-1.5 grid grid-cols-7 text-center text-[11px] font-semibold text-[#7F9296]">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                  <div key={d} className="py-0.5">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const currentIso = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
                  const isToday = currentIso === todayStr;
                  const hasItems = taskDates.includes(currentIso);

                  const isStart = tempStart === currentIso;
                  const isEnd = tempEnd === currentIso;
                  const isInRange = tempStart && tempEnd && currentIso > tempStart && currentIso < tempEnd;
                  const isEndpoint = isStart || isEnd;

                  return (
                    <div
                      key={currentIso}
                      className={`relative flex items-center justify-center py-0.5 ${
                        isInRange ? 'bg-[#E1ECE9]' : ''
                      } ${isStart && tempEnd ? 'rounded-l-lg bg-[#E1ECE9]' : ''} ${
                        isEnd && tempStart ? 'rounded-r-lg bg-[#E1ECE9]' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleDayClick(currentIso)}
                        className={`relative flex h-8 w-8 items-center justify-center rounded-lg text-xs transition ${
                          isEndpoint
                            ? 'bg-[#0F766E] font-bold text-white shadow-sm'
                            : isInRange
                            ? 'font-semibold text-[#0F766E]'
                            : isToday
                            ? 'bg-[#F1F4F2] font-bold text-[#0F766E]'
                            : 'text-[#12292D] hover:bg-[#F1F4F2]'
                        }`}
                      >
                        {d}
                        {hasItems && !isEndpoint && !isInRange && (
                          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#0F766E]" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Bar Konfirmasi Bawah */}
              <div className="mt-3 border-t border-[#EEF2F0] pt-3">
                <div className="mb-2 text-center text-[11px] text-[#5B7276]">
                  {tempStart && !tempEnd && (
                    <span>Terpilih: <b>{formatLabel(tempStart)}</b> (klik tanggal kedua untuk rentang)</span>
                  )}
                  {tempStart && tempEnd && (
                    <span>Rentang: <b>{formatLabel(tempStart)}</b> s/d <b>{formatLabel(tempEnd)}</b></span>
                  )}
                  {!tempStart && <span>Pilih tanggal untuk memfilter</span>}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleClear()}
                    className="text-xs font-medium text-[#7F9296] hover:text-[#10262B]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    disabled={!tempStart}
                    onClick={handleApply}
                    className="rounded-xl bg-[#0F766E] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0D645D] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Mode Pemilih Bulan & Tahun */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#EEF2F0] pb-2.5">
                <span className="text-xs font-bold text-[#10262B]">Pilih Bulan & Tahun</span>
                <button
                  type="button"
                  onClick={() => setViewMode('days')}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-[#0F766E] hover:bg-[#E1ECE9]"
                >
                  Kembali ke Kalender
                </button>
              </div>

              {/* Pemilih Tahun dengan Navigasi Paginated */}
              <div>
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold text-[#7F9296]">
                    Tahun ({yearPageStart} - {yearPageStart + 11})
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setYearPageStart((y) => y - 12)}
                      className="grid h-6 w-6 place-items-center rounded text-[#5B7276] hover:bg-[#F1F4F2]"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setYearPageStart((y) => y + 12)}
                      className="grid h-6 w-6 place-items-center rounded text-[#5B7276] hover:bg-[#F1F4F2]"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const y = yearPageStart + i;
                    const isSelected = calYear === y;
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setCalYear(y)}
                        className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-[#10262B] text-white shadow-sm'
                            : 'bg-[#F8FAF9] text-[#44595D] hover:bg-[#E6EBE9]'
                        }`}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pemilih Bulan */}
              <div>
                <p className="mb-2 px-1 text-[11px] font-semibold text-[#7F9296]">Bulan</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_NAMES.map((mName, idx) => {
                    const isSelected = calMonth === idx;
                    return (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => {
                          setCalMonth(idx);
                          setViewMode('days');
                        }}
                        className={`rounded-lg py-2 text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-[#0F766E] text-white shadow-sm'
                            : 'bg-[#F8FAF9] text-[#44595D] hover:bg-[#E6EBE9]'
                        }`}
                      >
                        {mName.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}