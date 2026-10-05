'use client';

/**
 * Subjects directory (§16.4): live from /api/taxonomy, client-side search,
 * editorial grid (typography-first, no icon circles), honest empty state.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

type Row = { id: string; name_ar: string; name_en: string };

export function SubjectsDirectory({ locale }: { locale: string }) {
  const t = useTranslations('subjects');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/taxonomy')
      .then((r) => r.json())
      .then((b) => setRows(b.subjects ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (!q.trim()) return true;
        const needle = q.trim().toLowerCase();
        return r.name_ar.includes(needle) || r.name_en.toLowerCase().includes(needle);
      }),
    [rows, q]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded border hairline bg-line/40" />
        ))}
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div>
      <label className="block max-w-md">
        <span className="sr-only">{t('search')}</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search')}
          className="field-input"
        />
      </label>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded border hairline bg-white p-8 text-center">
          <p className="text-ink/70">{t('empty')}</p>
          {q && (
            <button
              onClick={() => setQ('')}
              className="mt-3 rounded border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-sand/30"
            >
              {t('clear')}
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((s, i) => (
            <li key={s.id}>
              <a
                href={`/${locale}/book`}
                className="group flex h-full flex-col justify-between rounded border hairline bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue hover:shadow-float"
              >
                <span className="font-bold text-navy transition-colors group-hover:text-blue">
                  {locale === 'ar' ? s.name_ar : s.name_en}
                </span>
                <span className="mt-3 text-xs text-ink/50" dir="ltr">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
