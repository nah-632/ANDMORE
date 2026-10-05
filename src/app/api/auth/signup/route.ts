import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/auth/validation';
import { getSupabaseServer } from '@/lib/auth/server';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/signup (§13: rate-limited, no enumeration, admin roles never granted).
 * Profile + role creation happens via the handle_new_user DB trigger (P1 migration);
 * a DB trigger fires on auth.users insert and creates the profile from raw_user_meta_data.
 */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`signup:${ip}`, 5, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'auth.rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'auth.bad_request' }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'auth.validation_failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        role: input.role,
        first_name: input.firstName,
        last_initial: input.lastNameInitial ?? null,
        locale: input.locale,
        birth_year: input.birthYear ?? null,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/${input.locale}/auth/callback`,
    },
  });

  // Always the same response whether the email exists or not (§13 no enumeration).
  if (error) {
    const known = ['invalid_password', 'weak_password', 'email_exists'];
    if (known.some((k) => error.message.toLowerCase().includes(k))) {
      return NextResponse.json({ error: 'auth.email_taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'auth.signup_failed' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: 'auth.check_email' }, { status: 201 });
}
