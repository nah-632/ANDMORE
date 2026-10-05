import { NextResponse } from 'next/server';
import { applicationSchema } from '@/lib/volunteer/application';
import { getSupabaseServer, getUser } from '@/lib/auth/server';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';
import { nextVolunteerRef } from '@/lib/db/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/apply — volunteer application submit (§7).
 * Order per §14B: validate → save to DB → reference code → wa.me handoff (client builds link).
 */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`apply:${ip}`, 5, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'app.rate_limited' }, { status: 429 });
  }

  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'auth.required' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'app.bad_request' }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'app.validation_failed', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const supabase = await getSupabaseServer();

  // One active application per user (DB unique constraint is the backstop).
  const { data: existing } = await supabase
    .from('volunteer_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', ['draft', 'submitted', 'under_review', 'interview_scheduled', 'needs_more_info'])
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'app.already_submitted' }, { status: 409 });
  }

  const reference = await nextVolunteerRef(supabase);

  const { data: created, error } = await supabase
    .from('volunteer_applications')
    .insert({
      user_id: user.id,
      reference_code: reference,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone || null,
      education_background: data.educationBackground,
      qualification: data.qualification,
      institution: data.institution || null,
      experience_years: data.experienceYears,
      languages: data.languages,
      bio: data.bio || null,
      status: 'submitted',
    })
    .select('id, reference_code')
    .single();

  if (error || !created) {
    return NextResponse.json({ error: 'app.server_error' }, { status: 500 });
  }

  // Record CoC acceptance (§7 v2: mandatory before approval).
  await supabase.from('consents').insert({
    user_id: user.id,
    consent_type: 'code_of_conduct',
    version: 'v1',
  });

  // Audit trail.
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'application.submitted',
    entity_type: 'volunteer_application',
    entity_id: created.id,
  });

  return NextResponse.json(
    { ok: true, reference: created.reference_code, id: created.id },
    { status: 201 }
  );
}
