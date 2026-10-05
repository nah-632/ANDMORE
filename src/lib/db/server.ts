/**
 * Service-role client + audited helpers (§3B module map: lib/db/server.ts).
 * SERVER ONLY — never import from client components. Every write is audited.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function svc(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

/** Next volunteer reference via the DB sequence function (migration 0006). */
export async function nextVolunteerRef(client?: SupabaseClient): Promise<string> {
  const c = client ?? svc();
  const { data, error } = await c.rpc('next_volunteer_ref');
  if (error || !data) throw new Error('ref_generation_failed');
  return data as string;
}

/** Next session reference via the DB sequence function (migration 0006). */
export async function nextSessionRef(client?: SupabaseClient): Promise<string> {
  const c = client ?? svc();
  const { data, error } = await c.rpc('next_session_ref');
  if (error || !data) throw new Error('ref_generation_failed');
  return data as string;
}
