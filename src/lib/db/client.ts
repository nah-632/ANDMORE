/**
 * Browser Supabase client (§3B module map: lib/db/client.ts).
 * Anon key only — RLS applies. Never the service role.
 */
import { createBrowserClient } from '@supabase/ssr';

export function browserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  );
}
