import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServer, getUser } from '@/lib/auth/server';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

/** POST /api/report — simple report form (§10 v2). Rate-limited; high severity notifies admins. */
const schema = z.object({
  category: z.enum(['inappropriate_conduct', 'safety_concern', 'content', 'technical', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(10).max(2000),
  entityType: z.string().max(50).optional(),
  entityId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`report:${ip}`, 5, 24 * 60 * 60_000);
  if (!rl.allowed) return NextResponse.json({ error: 'report.rate_limited' }, { status: 429 });

  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'auth.required' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'report.validation_failed' }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      category: parsed.data.category,
      severity: parsed.data.severity,
      entity_type: parsed.data.entityType ?? null,
      entity_id: parsed.data.entityId ?? null,
      description: parsed.data.description,
    })
    .select('id')
    .single();

  if (error || !data) return NextResponse.json({ error: 'report.server_error' }, { status: 500 });

  // High/critical severity → admin notification (in-app outbox).
  if (parsed.data.severity === 'high' || parsed.data.severity === 'critical') {
    await supabase.from('notifications').insert({
      user_id: user.id, // placeholder: admin fan-out happens in P7; record exists
      event_type: 'safeguarding_alert',
      payload: { report_id: data.id, severity: parsed.data.severity },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
