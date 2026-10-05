'use client';

/** Simple report form (§10 v2): category + severity + description. Rate-limited server-side. */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

const CATEGORIES = ['inappropriate_conduct', 'safety_concern', 'content', 'technical', 'other'] as const;

export function ReportForm({ locale }: { locale: string }) {
  const t = useTranslations('report');
  const [category, setCategory] = useState<string>('safety_concern');
  const [severity, setSeverity] = useState<string>('medium');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    if (description.trim().length < 10) {
      setError(t('desc_required'));
      return;
    }
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, severity, description }),
    });
    if (res.ok) setDone(true);
    else setError(t('submit_failed'));
  }

  if (done) {
    return (
      <div className="mt-8 rounded border hairline bg-white p-8 text-center">
        <h2 className="text-2xl font-bold">{t('success_title')}</h2>
        <p className="mt-2 text-ink/75">{t('success_body')}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded border hairline bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('category')}</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded border border-line bg-white px-3 py-2.5">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`cat_${c}`)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('severity')}</span>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full rounded border border-line bg-white px-3 py-2.5">
            {['low', 'medium', 'high', 'critical'].map((s) => (
              <option key={s} value={s}>{t(`sev_${s}`)}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium">{t('description')}</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000} className="w-full rounded border border-line bg-white px-3 py-2.5" />
      </label>
      {error && (
        <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <button type="button" onClick={submit} className="mt-6 rounded border border-navy bg-navy px-5 py-3 font-semibold text-paper hover:bg-blue">
        {t('submit')}
      </button>
    </div>
  );
}
