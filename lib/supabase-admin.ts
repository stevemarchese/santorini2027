import { createClient } from '@supabase/supabase-js';
import type { AdminResponse } from './payload';

export function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function getAllResponses(): Promise<AdminResponse[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminResponse[];
}

export async function deleteResponse(id: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from('responses').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function updateResponseName(id: string, name: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from('responses').update({ name }).eq('id', id);
  return { error: error?.message ?? null };
}
