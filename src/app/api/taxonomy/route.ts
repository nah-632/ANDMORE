import { NextResponse } from 'next/server';
import { svc } from '@/lib/db/server';

export const dynamic = 'force-dynamic';

/** GET /api/taxonomy — active stages + subjects for forms (public, anon-safe). */
export async function GET() {
  const db = svc();
  const [{ data: stages }, { data: subjects }] = await Promise.all([
    db.from('educational_stages').select('id, name_ar, name_en').eq('is_active', true).order('sort_order'),
    db.from('subjects').select('id, name_ar, name_en').eq('is_active', true).order('name_ar'),
  ]);
  return NextResponse.json({ stages: stages ?? [], subjects: subjects ?? [] });
}
