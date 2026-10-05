import { NextResponse } from 'next/server';
import { getSupabaseServer, getUser } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/** GET /api/me — caller's own requests + sessions (RLS-scoped, own JWT). */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'auth.required' }, { status: 401 });

  const supabase = await getSupabaseServer();
  const [{ data: requests }, { data: sessions }] = await Promise.all([
    supabase
      .from('session_requests')
      .select('id, reference_code, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('sessions')
      .select('id, status, scheduled_start, scheduled_end, meeting_url')
      .order('scheduled_start', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({ requests: requests ?? [], sessions: sessions ?? [] });
}
