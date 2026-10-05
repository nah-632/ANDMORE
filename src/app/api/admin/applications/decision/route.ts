import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRoles } from '@/lib/auth/server';
import { svc } from '@/lib/db/server';
import { canTransitionApplication } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/applications/decision — approve/reject/needs_more_info (§7).
 * The DB trigger enforces the transition; this layer checks intent + writes audit.
 * Approval also creates the volunteer_profiles row (visibility gate enforced by RLS).
 */
const decisionSchema = z.object({
  applicationId: z.string().uuid(),
  decision: z.enum(['under_review', 'interview_scheduled', 'approved', 'rejected', 'needs_more_info']),
  rejectionReason: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const auth = await requireRoles(['reviewer', 'super_admin']);
  if (!auth.ok) return NextResponse.json({ error: 'auth.forbidden' }, { status: auth.status });

  const parsed = decisionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'app.validation_failed' }, { status: 400 });
  }
  const { applicationId, decision, rejectionReason } = parsed.data;

  if (decision === 'rejected' && !rejectionReason) {
    return NextResponse.json({ error: 'app.rejection_reason_required' }, { status: 400 });
  }

  const db = svc();
  const { data: app, error: fetchErr } = await db
    .from('volunteer_applications')
    .select('id, user_id, status')
    .eq('id', applicationId)
    .single();
  if (fetchErr || !app) return NextResponse.json({ error: 'app.not_found' }, { status: 404 });

  // Intent check first (DB trigger is the backstop).
  if (!canTransitionApplication(app.status as never, decision as never)) {
    return NextResponse.json({ error: 'app.invalid_transition' }, { status: 422 });
  }

  const { error: updateErr } = await db
    .from('volunteer_applications')
    .update({
      status: decision,
      rejection_reason: rejectionReason ?? null,
      decided_by: auth.user.id,
      decided_at: new Date().toISOString(),
    })
    .eq('id', applicationId);
  if (updateErr) return NextResponse.json({ error: 'app.server_error' }, { status: 500 });

  // On approval: create the volunteer profile (CoC already recorded at submit).
  if (decision === 'approved') {
    const { error: profileErr } = await db.from('volunteer_profiles').upsert(
      { user_id: app.user_id, status: 'active', coc_accepted: true },
      { onConflict: 'user_id' }
    );
    if (profileErr) return NextResponse.json({ error: 'app.server_error' }, { status: 500 });
  }

  await db.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: `application.${decision}`,
    entity_type: 'volunteer_application',
    entity_id: applicationId,
    after_state: { decision, rejectionReason: rejectionReason ?? null },
  });

  return NextResponse.json({ ok: true });
}
