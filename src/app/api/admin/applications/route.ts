import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/auth/server';
import { svc } from '@/lib/db/server';

export const dynamic = 'force-dynamic';

/** GET /api/admin/applications?status= — reviewer queue (§7 evaluation). */
export async function GET(req: Request) {
  const auth = await requireRoles(['reviewer', 'moderator', 'super_admin']);
  if (!auth.ok) return NextResponse.json({ error: 'auth.forbidden' }, { status: auth.status });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  let q = svc()
    .from('volunteer_applications')
    .select('id, reference_code, full_name, email, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'app.server_error' }, { status: 500 });
  return NextResponse.json({ items: data });
}
