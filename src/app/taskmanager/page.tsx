'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ListTodo, Trash2, Calendar, Clock, CheckCircle2, Circle, Pin, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
import { getTasks, createTask, updateTask, deleteTask as removeTaskService, Task } from '@/services/taskServices';
import TaskForm from '@/components/TaskForm';
import DateRangeFilter, { DateFilterValue } from '@/components/DateRangeFilter';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700', '800'] });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseLocal = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatFullDate = (dateStr: string) =>
  parseLocal(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const deadlineMs = (t: Task) => new Date(`${t.deadlineDate}T${t.deadlineTime || '23:59'}`).getTime();

function TaskCheck({ done, onClick, title }: { done: boolean; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      aria-label={done ? `Tandai belum selesai: ${title}` : `Tandai selesai: ${title}`}
      className="mt-0.5 shrink-0 rounded-full text-[#0F766E] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
    >
      {done ? (
        <CheckCircle2 className="h-6 w-6 fill-[#0F766E] text-white" />
      ) : (
        <Circle className="h-6 w-6 text-[#9DB0B3] transition hover:text-[#0F766E]" />
      )}
    </button>
  );
}

function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#95A5A8] transition hover:bg-[#FBE8E5] hover:text-[#B4402B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4402B]"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export default function TaskManagerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateWindow, setDateWindow] = useState<{ yesterday: string; today: string; tomorrow: string }>({
    yesterday: '',
    today: '',
    tomorrow: '',
  });

  const [appliedFilter, setAppliedFilter] = useState<DateFilterValue | null>(null);
  const lastCheckedDateRef = useRef('');

  const computeDateWindow = () => {
    const now = new Date();
    const y = new Date();
    y.setDate(now.getDate() - 1);
    const tm = new Date();
    tm.setDate(now.getDate() + 1);

    return {
      yesterday: toLocalISO(y),
      today: toLocalISO(now),
      tomorrow: toLocalISO(tm),
    };
  };

  useEffect(() => {
    const win = computeDateWindow();
    setDateWindow(win);
    lastCheckedDateRef.current = win.today;
    loadTasks(win.today);
  }, []);

  const formatDateLabel = (dateStr: string) => {
    if (dateWindow.yesterday && dateStr === dateWindow.yesterday) return 'Kemarin';
    if (dateWindow.today && dateStr === dateWindow.today) return 'Hari Ini';
    if (dateWindow.tomorrow && dateStr === dateWindow.tomorrow) return 'Besok';
    return parseLocal(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const loadTasks = async (overrideToday?: string) => {
    setLoading(true);
    try {
      const data = await getTasks();
      const todayStr = overrideToday || toLocalISO(new Date());

      const updatedTasks = await Promise.all(
        data.map(async (task) => {
          if (task.isPinned && task.completed && task.deadlineDate !== todayStr) {
            await updateTask(task.id, { completed: false, deadlineDate: todayStr });
            return { ...task, completed: false, deadlineDate: todayStr };
          }
          return task;
        })
      );

      setTasks(updatedTasks);
    } catch (error) {
      console.error('Gagal memuat tugas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentIsoDate = toLocalISO(now);

      if (lastCheckedDateRef.current && currentIsoDate !== lastCheckedDateRef.current) {
        lastCheckedDateRef.current = currentIsoDate;
        const win = computeDateWindow();
        setDateWindow(win);
        loadTasks(currentIsoDate);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAddTask = async (title: string, time: string, isPinned: boolean) => {
    const currentToday = dateWindow.today || toLocalISO(new Date());
    try {
      const created = await createTask(title, currentToday, time, isPinned);
      if (created) {
        setTasks((prev) => [created, ...prev]);
      }
    } catch (error) {
      console.error('Gagal menambah tugas:', error);
    }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !currentStatus } : t)));
    try {
      await updateTask(id, { completed: !currentStatus });
    } catch (error) {
      console.error('Gagal update status:', error);
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    try {
      await removeTaskService(id);
    } catch (error) {
      console.error('Gagal menghapus tugas:', error);
    }
  };

  const handleRolloverToTomorrow = async (id: string) => {
    const tomorrowStr = dateWindow.tomorrow || toLocalISO(new Date(Date.now() + 86400000));

    setTasks(tasks.map((t) => (t.id === id ? { ...t, deadlineDate: tomorrowStr, completed: false } : t)));
    try {
      await updateTask(id, { deadlineDate: tomorrowStr, completed: false });
    } catch (error) {
      console.error('Gagal memindahkan jadwal:', error);
    }
  };

  type Urgency = 'done' | 'overdue' | 'soon' | 'later';
  const urgencyOf = (task: Task): Urgency => {
    if (task.completed) return 'done';
    const diffMs = deadlineMs(task) - Date.now();
    if (diffMs < 0) return 'overdue';
    if (diffMs < 24 * 3600 * 1000) return 'soon';
    return 'later';
  };

  const renderDeadlineStatus = (task: Task) => {
    const kind = urgencyOf(task);

    if (kind === 'done') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#DDF3EA] px-2.5 py-1 text-xs font-semibold text-[#0B6B4F]">
          <CheckCircle2 className="h-3 w-3" /> Selesai
        </span>
      );
    }

    if (kind === 'overdue') {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FBE8E5] px-2.5 py-1 text-xs font-semibold text-[#B4402B]">
            <AlertTriangle className="h-3 w-3" /> Terlewat
          </span>
          <button
            type="button"
            onClick={() => handleRolloverToTomorrow(task.id)}
            className="inline-flex items-center gap-1 rounded-full bg-[#10262B] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
          >
            Jadwalkan besok <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      );
    }

    if (kind === 'soon') {
      const diffMs = deadlineMs(task) - Date.now();
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FBEFD5] px-2.5 py-1 text-xs font-semibold text-[#9A5B0B]">
          <Clock className="h-3 w-3" /> Kurang {h} jam {m} menit lagi
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#E4EAFB] px-2.5 py-1 text-xs font-semibold text-[#2D4FB3]">
        <Clock className="h-3 w-3" /> Deadline jam {task.deadlineTime}
      </span>
    );
  };

  const accentOf = (task: Task) => {
    const kind = urgencyOf(task);
    if (kind === 'overdue') return 'bg-[#B4402B]';
    if (kind === 'soon') return 'bg-[#D98E1F]';
    return '';
  };

  const focus =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F4F2]';

  const pinnedTasks = tasks.filter((t) => t.isPinned);
  const normalTasks = tasks.filter((t) => !t.isPinned);

  const filteredNormalTasks = normalTasks.filter((t) => {
    if (appliedFilter) {
      return t.deadlineDate >= appliedFilter.start && t.deadlineDate <= appliedFilter.end;
    }
    if (!dateWindow.today) return true;
    return (
      t.deadlineDate === dateWindow.yesterday ||
      t.deadlineDate === dateWindow.today ||
      t.deadlineDate === dateWindow.tomorrow
    );
  });

  const groupedNormalTasks = filteredNormalTasks.reduce((acc, task) => {
    (acc[task.deadlineDate] ||= []).push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const sortedDateKeys = Object.keys(groupedNormalTasks).sort();

  const activeCount = filteredNormalTasks.filter((t) => !t.completed).length;
  const overdueCount = filteredNormalTasks.filter((t) => urgencyOf(t) === 'overdue').length;
  const doneCount = filteredNormalTasks.filter((t) => t.completed).length;

  const stats = [
    { label: 'Agenda aktif', value: activeCount, tone: 'text-white' },
    { label: 'Terlewat', value: overdueCount, tone: overdueCount > 0 ? 'text-[#FF9B8A]' : 'text-white' },
    { label: 'Selesai', value: doneCount, tone: 'text-[#5EEAD4]' },
  ];

  const taskDates = Array.from(new Set(normalTasks.map((t) => t.deadlineDate)));

  return (
    <div className={`${body.className} min-h-screen bg-[#F1F4F2] text-[#12292D]`}>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-[#10262B] p-6 text-white md:p-8">
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
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#2DD4BF]/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 right-0 h-60 w-60 rounded-full bg-[#3F63D6]/25 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#5EEAD4] ring-1 ring-white/15">
                <ListTodo className="h-6 w-6" />
              </div>
              <div>
                <h1 className={`${display.className} text-3xl font-extrabold tracking-tight md:text-4xl`}>Task Manager</h1>
                <p className="mt-1 max-w-md text-sm text-white/65">
                  Kelola agenda harian dan rutinitas dengan pemilih waktu gulir interaktif.
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-2.5 md:w-96">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/[0.07] px-4 py-3 ring-1 ring-white/10">
                  <dt className="text-xs text-white/55">{s.label}</dt>
                  <dd className={`${display.className} mt-0.5 text-2xl font-extrabold ${s.tone}`}>{loading ? '–' : s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <TaskForm onAdd={handleAddTask} focusClass={focus} />

          <div className="min-w-0 space-y-8">
            {loading ? (
              <ul aria-busy="true" className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex animate-pulse items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-[#D5DEDB]">
                    <div className="h-6 w-6 rounded-full bg-[#E4EAE7]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-[#E4EAE7]" />
                      <div className="h-3 w-1/3 rounded bg-[#EEF2F0]" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                {/* Rutinitas Pinned */}
                {pinnedTasks.length > 0 && (
                  <section className="rounded-3xl bg-[#FBF3E0] p-4 ring-1 ring-[#F0D9A8] md:p-5">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <h2 className={`${display.className} flex items-center gap-2 text-base font-bold`}>
                        <Pin className="h-4 w-4 fill-[#9A5B0B] text-[#9A5B0B]" /> Rutinitas harian
                      </h2>
                      <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-[#9A5B0B]">
                        {pinnedTasks.length}
                      </span>
                    </div>

                    <ul className="space-y-2.5">
                      {pinnedTasks.map((task) => (
                        <li
                          key={task.id}
                          className={`flex items-start justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#F0D9A8] transition ${
                            task.completed ? 'opacity-70' : ''
                          }`}
                        >
                          <div className="flex min-w-0 items-start gap-3.5">
                            <TaskCheck done={task.completed} onClick={() => toggleTask(task.id, task.completed)} title={task.title} />
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${task.completed ? 'text-[#7F9296] line-through' : ''}`}>{task.title}</p>
                              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#FBEFD5] px-2.5 py-1 text-xs font-semibold text-[#9A5B0B]">
                                <Clock className="h-3 w-3" /> Jam aktif {task.deadlineTime} setiap hari
                              </span>
                            </div>
                          </div>
                          <DeleteButton onClick={() => deleteTask(task.id)} label={`Hapus rutinitas ${task.title}`} />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Agenda Berdasarkan Tanggal */}
                <section className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                    <div>
                      <h2 className={`${display.className} text-lg font-bold`}>Agenda berdasarkan tanggal</h2>
                      <p className="text-xs text-[#5B7276]">
                        {appliedFilter ? (
                          <span className="font-semibold text-[#0F766E]">
                            {appliedFilter.start === appliedFilter.end
                              ? `Tanggal: ${formatDateLabel(appliedFilter.start)}`
                              : `Rentang: ${formatDateLabel(appliedFilter.start)} s/d ${formatDateLabel(appliedFilter.end)}`}
                          </span>
                        ) : (
                          'Menampilkan 3 hari (Kemarin, Hari Ini, Besok)'
                        )}
                      </p>
                    </div>

                    {/* Komponen Filter Tanggal yang Baru Dipisah */}
                    <DateRangeFilter
                      value={appliedFilter}
                      onChange={setAppliedFilter}
                      todayStr={dateWindow.today}
                      yesterdayStr={dateWindow.yesterday}
                      tomorrowStr={dateWindow.tomorrow}
                      formatLabel={formatDateLabel}
                      taskDates={taskDates}
                    />
                  </div>

                  {sortedDateKeys.length === 0 ? (
                    <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-[#D5DEDB]">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-[#E6EFEC] text-[#0F766E]">
                        <ListTodo className="h-6 w-6" />
                      </div>
                      <p className={`${display.className} mt-4 text-lg font-bold`}>
                        {appliedFilter
                          ? 'Tidak ada agenda pada rentang tanggal ini'
                          : normalTasks.length === 0
                          ? 'Belum ada agenda'
                          : 'Tidak ada agenda untuk 3 hari terdekat'}
                      </p>
                      <p className="mt-1 max-w-xs text-sm text-[#5B7276]">
                        {appliedFilter
                          ? 'Coba pilih tanggal lain dari kalender atau kembali ke 3 hari default.'
                          : 'Tambahkan agenda pertama Anda lewat formulir.'}
                      </p>
                    </div>
                  ) : (
                    sortedDateKeys.map((dateKey) => {
                      const items = [...groupedNormalTasks[dateKey]].sort((a, b) =>
                        (a.deadlineTime || '').localeCompare(b.deadlineTime || ''),
                      );
                      const done = items.filter((t) => t.completed).length;
                      return (
                        <div key={dateKey} className="space-y-2.5">
                          <div className="flex items-end justify-between gap-3 px-1">
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#E1ECE9] text-[#0F766E]">
                                <Calendar className="h-4 w-4" />
                              </span>
                              <div>
                                <h3 className={`${display.className} text-base font-bold leading-tight`}>
                                  {formatDateLabel(dateKey)}
                                </h3>
                                <p className="text-xs text-[#7F9296]">{formatFullDate(dateKey)}</p>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-[#7F9296]">
                              {done}/{items.length} selesai
                            </span>
                          </div>

                          <ul className="space-y-2.5">
                            {items.map((task) => (
                              <li
                                key={task.id}
                                className={`group relative flex items-start justify-between gap-3 overflow-hidden rounded-2xl bg-white p-4 pl-5 ring-1 transition ${
                                  task.completed ? 'opacity-70 ring-[#E4EAE7]' : 'ring-[#D5DEDB] hover:ring-[#9DB0B3]'
                                }`}
                              >
                                {accentOf(task) && <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${accentOf(task)}`} />}

                                <div className="flex min-w-0 items-start gap-3.5">
                                  <TaskCheck done={task.completed} onClick={() => toggleTask(task.id, task.completed)} title={task.title} />
                                  <div className="min-w-0">
                                    <p className={`text-sm font-semibold ${task.completed ? 'text-[#7F9296] line-through' : ''}`}>{task.title}</p>
                                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#5B7276]">
                                      <Clock className="h-3.5 w-3.5 text-[#0F766E]" /> Deadline {task.deadlineTime}
                                    </p>
                                    <div className="mt-2">{renderDeadlineStatus(task)}</div>
                                  </div>
                                </div>

                                <DeleteButton onClick={() => deleteTask(task.id)} label={`Hapus tugas ${task.title}`} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}