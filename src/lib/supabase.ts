import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;

export async function checkSupabaseConnection(): Promise<void> {
  if (!supabase) throw new Error('Supabase configuration is missing.');
  const { error } = await supabase.from('workers').select('id').limit(0);
  if (error) throw error;
}

