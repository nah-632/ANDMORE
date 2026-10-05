'use client';

/**
 * Session request form (§8) — restyled with the unified field system.
 * Order per §14B: DB first → reference code → WhatsApp handoff.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { sessionWhatsAppMessage } from '@/lib/booking/session';
import { waLink } from '@/lib/volunteer/application';

type Taxonomy = { id: string; name_ar: string; name_en: string };

export function BookForm({ locale }: { locale: string }) {
  const t = useTranslations('book');
  const [stages, setStages] = useState<Taxonomy[]>([]);
  const [subjects, setSubjects] = useState<Taxonomy[]>([]);
  const [form, setForm] = useState({ stageId: '', subjectId: '', need: '', date: '', time: '', notes: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    reference: string;
    stage: string;
    subject: string;
    firstName: string;
    preferredTime: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/taxonomy')
      .then((r) => r.json())
      .then((b) => {
        setStages(b.stages ?? []);
        setSubjects(b.subjects ?? []);
      })
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setError(null);
    if (!form.stageId || !form.subjectId || form.need.trim().length < 10 || !form.date || !form.time) {
      setError(t('fill_required'));
      return;
    }
    setSubmitting(true);
    const start = new Date(`${form.date}T${form.time}:00`);
    const end = new Date(start.getTime() + 60 * 60_000);
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stageId: form.stageId,
        subjectId: form.subjectId,
        learningNeed: form.need,
        preferredWindow: { start: start.toISOString(), end: end.toISOString() },
        notes: form.notes,
      }),
    });
    setSubmitting(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? 'booking.server_error');
      return;
    }
    setResult({
      reference: body.reference,
      stage: locale === 'ar' ? body.stage?.name_ar : body.stage?.name_en,
      subject: locale === 'ar' ? body.subject?.name_ar : body.subject?.name_en,
      firstName: body.firstName,
      preferredTime: body.preferredTime,
    });
  }

  if (result) {
    const message = sessionWhatsAppMessage({
      locale: locale as 'ar' | 'en',
      reference: result.reference,
      stage: result.stage ?? '',
      subject: result.subject ?? '',
      preferredTime: result.preferredTime,
      firstName: result.firstName,
    });
    return (
      <div className="mt-10 rounded border hairline bg-white p-8 text-center shadow-float">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sand/30 text-2xl" aria-hidden="true">
          ✓
        </span>
        <h2 className="mt-4 text-2xl font-bold text-navy">{t('success_title')}</h2>
        <p className="mt-2 text-ink/75">{t('success_body')}</p>
        <p className="mt-5 inline-block rounded bg-paper px-5 py-2.5 font-mono text-lg font-bold text-navy" dir="ltr">
          {result.reference}
        </p>
        <div className="mt-6">
          <a
            href={waLink('966508342500', message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded bg-navy px-6 py-3 font-semibold text-paper transition-colors hover:bg-blue"
          >
            {t('wa_button')}
          </a>
        </div>
        <p className="mt-3 text-xs text-ink/60">{t('wa_notice')}</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded border hairline bg-white p-6 sm:p-8">
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">{t('stage')}</span>
            <select value={form.stageId} onChange={set('stageId')} className="field-input">
              <option value="">{t('choose')}</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {locale === 'ar' ? s.name_ar : s.name_en}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">{t('subject')}</span>
            <select value={form.subjectId} onChange={set('subjectId')} className="field-input">
              <option value="">{t('choose')}</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {locale === 'ar' ? s.name_ar : s.name_en}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="field-label">{t('need')}</span>
          <textarea value={form.need} onChange={set('need')} rows={3} maxLength={1000} className="field-input" />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">{t('date')}</span>
            <input type="date" value={form.date} onChange={set('date')} className="field-input" dir="ltr" />
          </label>
          <label className="block">
            <span className="field-label">{t('time')}</span>
            <input type="time" value={form.time} onChange={set('time')} className="field-input" dir="ltr" />
          </label>
        </div>
        <label className="block">
          <span className="field-label">{t('notes')}</span>
          <textarea value={form.notes} onChange={set('notes')} rows={2} maxLength={500} className="field-input" />
          <span className="field-hint">{t('no_contact_hint')}</span>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded border border-terra/40 bg-terra/10 px-4 py-3 text-sm text-terra">
          {error}
        </p>
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
