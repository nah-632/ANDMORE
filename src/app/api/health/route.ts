import { NextResponse } from 'next/server';

/**
 * Liveness probe (§3B rule 7): zero dependencies.
 * Never touches DB, Supabase, or env secrets. Render health-check path.
 */
export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json({ status: 'ok' });
}
