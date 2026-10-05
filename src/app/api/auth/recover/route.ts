import { NextResponse } from 'next/server';
import { recoverSchema } from '@/lib/auth/validation';
import { getSupabaseServer } from '@/lib/auth/server';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

/** POST /api/auth/recover — ALWAYS 200 (no account enumeration, §13). */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`recover:${ip}`, 5, 15 * 60_000);
  if (!rl.allowed) {
    // Still 200 to avoid oracle; Retry-After slows abuse.
    return NextResponse.json({ ok: true }, { status: 200, headers: { 'Retry-After': String(rl.retryAfterSec) } });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // same response, no detail
  }

  const parsed = recoverSchema.safeParse(body);
  if (parsed.success) {
    const supabase = await getSupabaseServer();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/ar/auth/reset`,
    });
  }

  return NextResponse.json({ ok: true });
}
