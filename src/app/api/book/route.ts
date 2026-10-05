import { NextResponse } from 'next/server';
import { sessionRequestSchema } from '@/lib/booking/session';
import { assertNoSensitiveData } from '@/lib/volunteer/application';
import { getSupabaseServer, getUser } from '@/lib/auth/server';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { nextSessionRef } from '@/lib/db/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/book — session request (§8 + §14B).
 * Order: validate → save to DB (source of truth) → reference → audit.
 * WhatsApp link is built by the CLIENT from the returned reference
 * (number from platform_settings, message from template).
 */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`book:${ip}`, 5, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'booking.rate_limited' }, { status: 429 });
  }

  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'auth.required' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'booking.bad_request' }, { status: 400 });
  }

  const parsed = sessionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'booking.validation_failed', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Sanitize free text: instruct users not to share contacts — and enforce it.
  const combined = `${data.learningNeed} ${data.notes ?? ''}`;
  try {
    assertNoSensitiveData(combined);
  } catch {
    return NextResponse.json({ error: 'booking.no_contact_details' }, { status: 400 });
  }

  const supabase = await getSupabaseServer();

  // Guardian link: if the user is a student with a guardian, attach it.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name')
    .eq('id', user.id)
    .single();

  const { data: glink } = await supabase
    .from('guardian_links')
    .select('guardian_id')
    .eq('student_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const reference = await nextSessionRef(supabase);

  // Resolve stage/subject names for the response (used in the WA template).
  const [{ data: stage }, { data: subject }] = await Promise.all([
    supabase.from('educational_stages').select('name_ar, name_en').eq('id', data.stageId).single(),
    supabase.from('subjects').select('name_ar, name_en').eq('id', data.subjectId).single(),
  ]);

  const window = `[${data.preferredWindow.start},${data.preferredWindow.end})`;
  const { data: created, error } = await supabase
    .from('session_requests')
    .insert({
      reference_code: reference,
      student_id: user.id,
      guardian_id: glink?.guardian_id ?? null,
      stage_id: data.stageId,
      subject_id: data.subjectId,
      learning_need: data.learningNeed,
      format: 'individual',
      preferred_windows: [window],
      notes: data.notes || null,
      status: 'requested',
    })
    .select('id, reference_code')
    .single();

  if (error || !created) {
    return NextResponse.json({ error: 'booking.server_error' }, { status: 500 });
  }

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'session.requested',
    entity_type: 'session_request',
    entity_id: created.id,
  });

  return NextResponse.json(
    {
      ok: true,
      reference: created.reference_code,
      id: created.id,
      stage: stage ?? null,
      subject: subject ?? null,
      firstName: profile?.first_name ?? '',
      preferredTime: data.preferredWindow.start,
    },
    { status: 201 }
  );
}
