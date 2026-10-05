/**
 * Server-side auth guards (§3B module map: lib/auth/server.ts).
 * Sessions/roles always read as the CALLING user (anon key + their JWT).
 * The service-role client lives ONLY in lib/db/server.ts (§3B rule 1).
 */
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { AppRole } from './roles';

export type AuthUser = { id: string; email: string | undefined };

function supabaseFromCookies() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) cookieStore.set(name, value, options);
          } catch {
            // RSC context can't set cookies — middleware handles refresh.
          }
        },
      },
    }
  );
}

export async function getUser(): Promise<AuthUser | null> {
  const supabase = await supabaseFromCookies();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email };
}

export async function getRoles(): Promise<AppRole[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await supabaseFromCookies();
  const { data, error } = await supabase.from('user_roles').select('role');
  if (error || !data) return [];
  return data.map((r) => r.role as AppRole);
}

export type Guard<T> = { ok: true; user: T } | { ok: false; status: 401 | 403 };

export async function requireUser(): Promise<Guard<AuthUser>> {
  const user = await getUser();
  return user ? { ok: true, user } : { ok: false, status: 401 };
}

export async function requireRoles(needed: readonly AppRole[]): Promise<Guard<AuthUser>> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const roles = await getRoles();
  if (!needed.some((r) => roles.includes(r))) return { ok: false, status: 403 };
  return auth;
}
