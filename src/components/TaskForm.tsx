'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Clock, Pin } from 'lucide-react';
import { Bricolage_Grotesque } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PRESETS = ['09:00', '12:00', '15:00', '17:00'];
const ITEM_H = 40;

function Wheel({
  values,
  selected,
  onSelect,
  label,
}: {
  values: string[];
  selected: string;
  onSelect: (v: string) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const internal = useRef(false);
  const ignoreUntil = useRef(0);
  const drag = useRef<{ y: number; top: number } | null>(null);
  const moved = useRef(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ignoreUntil.current = Date.now() + 300;
    el.scrollTop = values.indexOf(selected) * ITEM_H;
  }, [values, selected]);

  useEffect(() => {
    if (internal.current) {
      internal.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    const top = values.indexOf(selected) * ITEM_H;
    if (Math.abs(el.scrollTop - top) > 1) {
      ignoreUntil.current = Date.now() + 500;
      el.scrollTo({ top, behavior: 'smooth' });
    }
  }, [selected, values]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el || Date.now() < ignoreUntil.current) return;
    const idx = Math.min(values.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
    const v = values[idx];
    if (v !== selected) {
      internal.current = true;
      onSelect(v);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    drag.current = { y: e.clientY, top: el.scrollTop };
    moved.current = false;
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const el = ref.current;
      if (!el || !drag.current) return;
      const dy = e.clientY - drag.current.y;
      if (Math.abs(dy) > 4) moved.current = true;
      el.scrollTop = drag.current.top - dy;
    };
    const up = () => {
      drag.current = null;
      setDragging(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging]);

  const handleItemClick = (v: string) => {
    if (moved.current) {
      moved.current = false;
      return;
    }
    onSelect(v);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const i = values.indexOf(selected) + (e.key === 'ArrowDown' ? 1 : -1);
    onSelect(values[Math.min(values.length - 1, Math.max(0, i))]);
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onScroll={handleScroll}
      className={`ormov-noscroll h-full w-24 overflow-y-auto rounded-lg py-[52px] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] ${
        dragging ? 'cursor-grabbing' : 'cursor-grab snap-y snap-mandatory'
      }`}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {values.map((v) => (
        <div
          key={v}
          role="option"
          aria-selected={v === selected}
          onClick={() => handleItemClick(v)}
          className={`flex h-10 snap-center items-center justify-center transition-all duration-150 ${
            v === selected ? 'text-2xl font-bold text-[#5EEAD4]' : 'text-base font-medium text-white/35 hover:text-white/65'
          }`}
        >
          {v}
        </div>
      ))}
    </div>
  );
}

export default function TaskForm({
  onAdd,
  focusClass,
}: {
  onAdd: (title: string, time: string, isPinned: boolean) => Promise<void>;
  focusClass: string;
}) {
  const [titleInput, setTitleInput] = useState('');
  const [selectedHour, setSelectedHour] = useState('17');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [pinInput, setPinInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const timeLabel = `${selectedHour}:${selectedMinute}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || submitting) return;

    setSubmitting(true);
    await onAdd(titleInput.trim(), timeLabel, pinInput);
    
    setTitleInput('');
    setPinInput(false);
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      onMouseUp={() => {}}
      onMouseMove={() => {}}
      className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(16,38,43,0.06)] ring-1 ring-[#D5DEDB] lg:sticky lg:top-6"
    >
      <style>{`.ormov-noscroll::-webkit-scrollbar { display: none }`}</style>
      <h2 className={`${display.className} text-lg font-bold`}>Agenda baru</h2>

      <label htmlFor="task-title" className="mb-1.5 mt-4 block text-sm font-semibold text-[#44595D]">
        Nama agenda
      </label>
      <input
        id="task-title"
        type="text"
        placeholder="Contoh: Kirim laporan sterilisasi"
        value={titleInput}
        onChange={(e) => setTitleInput(e.target.value)}
        className={`${focusClass} w-full rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-[#C5D1CE] placeholder:text-[#8FA0A3]`}
        required
      />

      {/* Terpadu: Wheel Time Picker */}
      <div className="mt-5 rounded-2xl bg-[#10262B] p-4 text-white">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#5EEAD4]">
            <Clock className="h-3.5 w-3.5" /> Target jam selesai
          </span>
          <span className={`${display.className} text-2xl font-extrabold tracking-wider text-white`}>{timeLabel}</span>
        </div>

        <div className="relative h-36 select-none overflow-hidden rounded-xl bg-[#0B1D21] ring-1 ring-white/10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-1/2 h-10 -translate-y-1/2 rounded-lg bg-white/10 ring-1 ring-[#2DD4BF]/40"
          />
          <div className="relative z-10 flex h-full items-center justify-center gap-1">
            <Wheel values={HOURS} selected={selectedHour} onSelect={setSelectedHour} label="Pilih jam" />
            <span className="pb-1 text-xl font-bold text-white/40">:</span>
            <Wheel values={MINUTES} selected={selectedMinute} onSelect={setSelectedMinute} label="Pilih menit" />
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-12 bg-gradient-to-b from-[#0B1D21] to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-t from-[#0B1D21] to-transparent" />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const active = p === timeLabel;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  const [h, m] = p.split(':');
                  setSelectedHour(h);
                  setSelectedMinute(m);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF] ${
                  active ? 'bg-[#2DD4BF] text-[#06302B]' : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Saklar rutinitas */}
      <button
        type="button"
        role="switch"
        aria-checked={pinInput}
        onClick={() => setPinInput((v) => !v)}
        className={`${focusClass} mt-4 flex w-full items-center justify-between gap-3 rounded-xl bg-[#FBF3E0] px-3.5 py-3 text-left ring-1 ring-[#F0D9A8] transition hover:bg-[#FBEFD5]`}
      >
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#FBEFD5] text-[#9A5B0B]">
            <Pin className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#12292D]">Rutinitas harian</span>
            <span className="block text-xs text-[#9A5B0B]">Alarm setiap hari di jam yang dipilih</span>
          </span>
        </span>
        <span className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${pinInput ? 'bg-[#D98E1F]' : 'bg-[#C5D1CE]'}`}>
          <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${pinInput ? 'translate-x-5' : ''}`} />
        </span>
      </button>

      <button
        type="submit"
        disabled={!titleInput.trim() || submitting}
        className={`${focusClass} mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_-8px_rgba(15,118,110,0.75)] transition hover:bg-[#0D645D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <Plus className="h-4 w-4" /> {submitting ? 'Menyimpan...' : 'Simpan agenda'}
      </button>
    </form>
  );
}