'use client';

/**
 * ApplyWizard — 3-step volunteer application (§7): autosave draft, CoC gate,
 * wa.me handoff on success. Restyled with the unified field system.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Step = 1 | 2 | 3;

const DRAFT_KEY = 'andmore-apply-draft';

export function ApplyWizard() {
  const t = useTranslations('apply');
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setForm(JSON.parse(raw) as Record<string, string>);
    } catch { /* corrupted draft — start fresh */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch { /* storage full/blocked — non-fatal */ }
  }, [form]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setError(null);
    if (form.coc !== 'yes') {
      setError(t('coc_required'));
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: form.fullName ?? '',
        email: form.email ?? '',
        phone: form.phone ?? '',
        educationBackground: form.education ?? '',
        qualification: form.qualification ?? '',
        institution: form.institution ?? '',
        experienceYears: Number(form.experienceYears ?? 0),
        subjectIds: [],
        stageIds: [],
        languages: ['ar'],
        bio: form.bio ?? '',
        cocAccepted: form.coc === 'yes',
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      localStorage.removeItem(DRAFT_KEY);
      setDone(true);
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'app.server_error');
    }
  }

  if (done) {
    return (
      <div className="mt-10 rounded border hairline bg-white p-8 text-center shadow-float">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sand/30 text-2xl" aria-hidden="true">
          ✓
        </span>
        <h2 className="mt-4 text-2xl font-bold text-navy">{t('success_title')}</h2>
        <p className="mt-2 text-ink/75">{t('success_body')}</p>
        <a
          href="https://wa.me/966508342500"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded bg-navy px-6 py-3 font-semibold text-paper transition-colors hover:bg-blue"
        >
          {t('wa_button')}
        </a>
        <p className="mt-3 text-xs text-ink/60">{t('wa_notice')}</p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      {/* Progress: numbered circles with connecting line */}
      <ol className="flex items-center" aria-label={t('progress')}>
        {[1, 2, 3].map((s) => (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 ${
                s === step
                  ? 'bg-navy text-paper'
                  : s < step
                    ? 'bg-sand text-navy'
                    : 'border border-line bg-white text-ink/40'
              }`}
              aria-current={s === step ? 'step' : undefined}
            >
              {s < step ? '✓' : s}
            </span>
            {s < 3 && (
              <span
                className={`mx-2 h-0.5 flex-1 transition-colors duration-300 ${s < step ? 'bg-sand' : 'bg-line'}`}
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-sm font-medium text-ink/60">{t(`step${step}`)}</p>

      <div className="mt-5 rounded border hairline bg-white p-6 sm:p-8">
        {step === 1 && (
          <div className="grid gap-5">
            <label className="block">
              <span className="field-label">{t('full_name')}</span>
              <input value={form.fullName ?? ''} onChange={set('fullName')} className="field-input" autoComplete="name" />
            </label>
            <label className="block">
              <span className="field-label">{t('email')}</span>
              <input type="email" value={form.email ?? ''} onChange={set('email')} className="field-input" dir="ltr" autoComplete="email" />
            </label>
            <label className="block">
              <span className="field-label">{t('phone')}</span>
              <input value={form.phone ?? ''} onChange={set('phone')} className="field-input" dir="ltr" inputMode="tel" autoComplete="tel" />
            </label>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-5">
            <label className="block">
              <span className="field-label">{t('education')}</span>
              <textarea value={form.education ?? ''} onChange={set('education')} rows={3} className="field-input" />
            </label>
            <label className="block">
              <span className="field-label">{t('qualification')}</span>
              <input value={form.qualification ?? ''} onChange={set('qualification')} className="field-input" />
            </label>
            <label className="block">
              <span className="field-label">{t('experience_years')}</span>
              <input type="number" min={0} max={60} value={form.experienceYears ?? ''} onChange={set('experienceYears')} className="field-input" dir="ltr" inputMode="numeric" />
            </label>
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-5">
            <label className="block">
              <span className="field-label">{t('bio')}</span>
              <textarea value={form.bio ?? ''} onChange={set('bio')} rows={4} maxLength={1000} className="field-input" />
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded border hairline bg-paper p-4 transition-colors hover:bg-sand/15">
              <input
                type="checkbox"
                checked={form.coc === 'yes'}
                onChange={(e) => setForm((f) => ({ ...f, coc: e.target.checked ? 'yes' : 'no' }))}
                className="mt-1 h-5 w-5 accent-[#102A56]"
              />
              <span className="text-sm">{t('coc_text')}</span>
            </label>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded border border-terra/40 bg-terra/10 px-4 py-3 text-sm text-terra">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
            className="rounded border border-navy px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-sand/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('back')}
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s < 3 ? ((s + 1) as Step) : s))}
              className="rounded bg-navy px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-blue"
            >
              {t('next')}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded bg-navy px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-blue disabled:opacity-60"
            >
              {submitting ? '…' : t('submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
