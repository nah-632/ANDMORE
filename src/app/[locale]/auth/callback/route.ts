import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

/**
 * GET /auth/callback — exchanges the Supabase email-verification/recovery code
 * for a session, then redirects to the locale home.
 */
export async function GET(req: Request, ctx: { params: Promise<{ locale: string }> }) {
  const { locale } = await ctx.params;
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (code) {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(`/${locale}`, url.origin));
    }
  }
  return NextResponse.redirect(new URL(`/${locale}/auth/verify-failed`, url.origin));
}
