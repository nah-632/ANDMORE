'use client';

/**
 * Public volunteer directory (§16.5): only approved+active volunteers,
 * first name + last initial, verified badge, no sensitive data.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Row = {
  id: string;
  first_name: string;
  last_initial: string | null;
  headline: string | null;
  subjects: string[];
  stages: string[];
};

export function FindDirectory({ locale }: { locale: string }) {
  const t = useTranslations('find');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/volunteers?locale=${locale}`)
      .then((r) => r.json())
      .then((b) => setRows(b.items ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [locale]);

  if (loading) {
    return (
      <div className="mt-8 space-y-3" aria-live="polite" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded border hairline bg-line/50" />
        ))}
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded border hairline bg-white p-8 text-center">
        <p className="text-ink/70">{t('empty')}</p>
      </div>
    );
  }

  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {rows.map((v) => (
        <li key={v.id} className="rounded border hairline bg-white p-5">
          <p className="font-bold">
            {v.first_name} {v.last_initial ? `${v.last_initial}.` : ''}
            <span className="ms-2 rounded-full bg-teal/15 px-2 py-0.5 text-xs font-semibold text-navy">
              ✓ {t('verified')}
            </span>
          </p>
          {v.headline && <p className="mt-1 text-sm text-ink/75">{v.headline}</p>}
          <p className="mt-2 text-xs text-ink/60">
            {v.subjects.join(' · ')} — {v.stages.join(' · ')}
          </p>
        </li>
      ))}
    </ul>
  );
}
