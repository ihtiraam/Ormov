import { supabase } from '@/lib/supabaseClient';

export type Task = {
  id: string;
  title: string;
  deadlineDate: string;
  deadlineTime: string;
  isPinned: boolean;
  completed: boolean;
  created_at?: string;
};

// Mapping dari database (snake_case) ke frontend (camelCase)
const mapRowToTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  deadlineDate: row.deadline_date,
  deadlineTime: row.deadline_time,
  isPinned: row.is_pinned,
  completed: row.completed,
  created_at: row.created_at,
});

// 1. Ambil Semua Task
export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapRowToTask);
}

// 2. Buat Task Baru
export async function createTask(
  title: string,
  deadlineDate: string,
  deadlineTime: string,
  isPinned: boolean
): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        title: title.trim(),
        deadline_date: deadlineDate,
        deadline_time: deadlineTime,
        is_pinned: isPinned,
        completed: false,
      },
    ])
    .select();

  if (error) throw new Error(error.message);
  return data?.[0] ? mapRowToTask(data[0]) : null;
}

// 3. Update Status / Data Task
export async function updateTask(
  id: string,
  updates: Partial<{
    title: string;
    deadlineDate: string;
    deadlineTime: string;
    isPinned: boolean;
    completed: boolean;
  }>
) {
  const dbUpdates: any = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.deadlineDate !== undefined) dbUpdates.deadline_date = updates.deadlineDate;
  if (updates.deadlineTime !== undefined) dbUpdates.deadline_time = updates.deadlineTime;
  if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
  if (updates.completed !== undefined) dbUpdates.completed = updates.completed;

  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
  if (error) throw new Error(error.message);
}

// 4. Hapus Task
export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
}