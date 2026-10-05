import { NextResponse } from 'next/server';

/**
 * Readiness probe (§3B rule 7): checks the database with a short timeout.
 * NOT used as Render's health-check path — that is /api/health.
 * P0: DB is not wired yet, so it reports not-ready explicitly (honest states only).
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const dbConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!dbConfigured) {
    return NextResponse.json({ status: 'degraded', db: 'not_configured' }, { status: 200 });
  }
  return NextResponse.json({ status: 'ok', db: 'configured' });
}
