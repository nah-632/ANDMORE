'use client';

/** Report form (§10 v2) — restyled with the unified field system. */
import { useState } from 'react';
import { useTranslations } from 'next-intl';

const CATEGORIES = ['inappropriate_conduct', 'safety_concern', 'content', 'technical', 'other'] as const;

export function ReportForm() {
  const t = useTranslations('report');
  const [category, setCategory] = useState<string>('safety_concern');
  const [severity, setSeverity] = useState<string>('medium');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    if (description.trim().length < 10) {
      setError(t('desc_required'));
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, severity, description }),
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setError(t('submit_failed'));
  }

  if (done) {
    return (
      <div className="mt-10 rounded border hairline bg-white p-8 text-center shadow-float">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sand/30 text-2xl" aria-hidden="true">
          ✓
        </span>
        <h2 className="mt-4 text-2xl font-bold text-navy">{t('success_title')}</h2>
        <p className="mt-2 text-ink/75">{t('success_body')}</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded border hairline bg-white p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">{t('category')}</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="field-input">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`cat_${c}`)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">{t('severity')}</span>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="field-input">
            {['low', 'medium', 'high', 'critical'].map((s) => (
              <option key={s} value={s}>{t(`sev_${s}`)}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-5 block">
        <span className="field-label">{t('description')}</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000} className="field-input" />
      </label>
      {error && (
        <p role="alert" className="mt-5 rounded border border-terra/40 bg-terra/10 px-4 py-3 text-sm text-terra">{error}</p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="mt-8 w-full rounded bg-navy px-6 py-3 font-semibold text-paper transition-colors hover:bg-blue disabled:opacity-60 sm:w-auto"
      >
        {submitting ? '…' : t('submit')}
      </button>
    </div>
  );
}
