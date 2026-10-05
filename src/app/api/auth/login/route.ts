import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/auth/validation';
import { getSupabaseServer } from '@/lib/auth/server';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

/** POST /api/auth/login — generic errors, per-IP+per-email rate limits (§13). */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'auth.bad_request' }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'auth.validation_failed' }, { status: 400 });
  }
  const { email, password } = parsed.data;

  // Rate limit AFTER parsing so the key includes the attempted email.
  const rl = rateLimit(`login:${ip}`, 10, 10 * 60_000);
  const rlEmail = rateLimit(`login:e:${email.toLowerCase()}`, 8, 10 * 60_000);
  if (!rl.allowed || !rlEmail.allowed) {
    return NextResponse.json(
      { error: 'auth.rate_limited' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // One generic message for wrong email / wrong password / unconfirmed (§13).
    return NextResponse.json({ error: 'auth.invalid_credentials' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
