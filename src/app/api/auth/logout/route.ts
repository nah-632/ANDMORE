import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/** GET /api/auth/logout — clears the session cookie. */
export async function POST() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
