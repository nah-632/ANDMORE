'use client';

/**
 * Volunteer application wizard (§7): 3 steps, autosave to localStorage,
 * client-side Zod-lite checks; server action validates authoritatively.
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

  // Autosave draft (§17: preserved input on error / resume)
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
    // Client pre-check: CoC required (§7 HARD)
    if (form.coc !== 'yes') {
      setError(t('coc_required'));
      return;
    }
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
      <div className="mt-8 rounded border hairline bg-white p-8 text-center">
        <h2 className="text-2xl font-bold">{t('success_title')}</h2>
        <p className="mt-2 text-ink/75">{t('success_body')}</p>
        <a
          href={`https://wa.me/966508342500?text=${encodeURIComponent(t('wa_prefill'))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded border border-navy bg-navy px-5 py-3 font-semibold text-paper hover:bg-blue"
        >
          {t('wa_button')}
        </a>
        <p className="mt-3 text-xs text-ink/60">{t('wa_notice')}</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Progress: numbered steps (§5B: numerals, not icon cards) */}
      <ol className="flex items-center gap-2" aria-label={t('progress')}>
        {[1, 2, 3].map((s) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                s === step ? 'bg-navy text-paper' : s < step ? 'bg-gold text-ink' : 'border hairline text-ink/50'
              }`}
              aria-current={s === step ? 'step' : undefined}
            >
              {s}
            </span>
            <span className="text-sm">{t(`step${s}`)}</span>
            {s < 3 && <span className="mx-1 h-px w-6 bg-line" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded border hairline bg-white p-6">
        {step === 1 && (
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('full_name')}</span>
              <input value={form.fullName ?? ''} onChange={set('fullName')} className="w-full rounded border border-line bg-white px-3 py-2.5" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('email')}</span>
              <input type="email" value={form.email ?? ''} onChange={set('email')} className="w-full rounded border border-line bg-white px-3 py-2.5" dir="ltr" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('phone')}</span>
              <input value={form.phone ?? ''} onChange={set('phone')} className="w-full rounded border border-line bg-white px-3 py-2.5" dir="ltr" />
            </label>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('education')}</span>
              <textarea value={form.education ?? ''} onChange={set('education')} rows={3} className="w-full rounded border border-line bg-white px-3 py-2.5" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('qualification')}</span>
              <input value={form.qualification ?? ''} onChange={set('qualification')} className="w-full rounded border border-line bg-white px-3 py-2.5" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('experience_years')}</span>
              <input type="number" min={0} max={60} value={form.experienceYears ?? ''} onChange={set('experienceYears')} className="w-full rounded border border-line bg-white px-3 py-2.5" dir="ltr" />
            </label>
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('bio')}</span>
              <textarea value={form.bio ?? ''} onChange={set('bio')} rows={4} maxLength={1000} className="w-full rounded border border-line bg-white px-3 py-2.5" />
            </label>
            <label className="flex items-start gap-3 rounded border hairline bg-paper p-4">
              <input
                type="checkbox"
                checked={form.coc === 'yes'}
                onChange={(e) => setForm((f) => ({ ...f, coc: e.target.checked ? 'yes' : 'no' }))}
                className="mt-1 h-5 w-5"
              />
              <span className="text-sm">{t('coc_text')}</span>
            </label>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
            className="rounded border border-navy px-4 py-2 text-sm font-semibold text-navy disabled:opacity-40 hover:bg-line"
          >
            {t('back')}
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s < 3 ? ((s + 1) as Step) : s))}
              className="rounded border border-navy bg-navy px-5 py-2 text-sm font-semibold text-paper hover:bg-blue"
            >
              {t('next')}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              className="rounded border border-navy bg-navy px-5 py-2 text-sm font-semibold text-paper hover:bg-blue"
            >
              {t('submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
