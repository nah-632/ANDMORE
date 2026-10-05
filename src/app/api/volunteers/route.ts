import { NextResponse } from 'next/server';
import { svc } from '@/lib/db/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/volunteers — public directory (§16.5, §7 visibility gate).
 * First name + last initial only; headline; subjects/stages names.
 * Unapproved volunteers are invisible (§2.5 Verified rule).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'ar';

  const db = svc();
  const { data, error } = await db
    .from('volunteer_profiles')
    .select(
      'id, user_id, headline_ar, headline_en, profiles!inner(first_name, last_initial)'
    )
    .eq('status', 'active')
    .eq('coc_accepted', true)
    .in('ref_check_status', ['not_required', 'passed'])
    .eq('is_seed', false)
    .limit(50);

  if (error) return NextResponse.json({ error: 'app.server_error' }, { status: 500 });

  const items = (data ?? []).map((v: Record<string, unknown>) => {
    const p = v.profiles as { first_name: string; last_initial: string | null };
    return {
      id: v.id,
      first_name: p.first_name,
      last_initial: p.last_initial,
      headline: locale === 'ar' ? v.headline_ar : v.headline_en,
      subjects: [] as string[],
      stages: [] as string[],
    };
  });

  return NextResponse.json({ items });
}
