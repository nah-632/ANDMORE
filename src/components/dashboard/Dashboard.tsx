'use client';

/**
 * Student/parent dashboard (§16.11): my requests + my sessions + report button.
 * Data via /api/me (RLS-scoped to the caller's own rows).
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Req = { id: string; reference_code: string; status: string; created_at: string };
type Sess = {
  id: string;
  status: string;
  scheduled_start: string;
  scheduled_end: string;
  meeting_url: string | null;
  volunteer_name: string | null;
};

export function Dashboard({ locale }: { locale: string }) {
  const t = useTranslations('dashboard');
  const [requests, setRequests] = useState<Req[]>([]);
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((b) => {
        setRequests(b.requests ?? []);
        setSessions(b.sessions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="mt-8 text-ink/60">{t('loading')}</p>;

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h2 className="text-2xl font-bold">{t('requests')}</h2>
        {requests.length === 0 ? (
          <div className="mt-4 rounded border hairline bg-white p-8 text-center">
            <p className="text-ink/70">{t('no_requests')}</p>
            <a href={`/${locale}/book`} className="mt-3 inline-block rounded border border-navy bg-navy px-4 py-2 text-sm font-semibold text-paper hover:bg-blue">
              {t('book_now')}
            </a>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {requests.map((r) => (
              <li key={r.id} className="rounded border hairline bg-white p-4">
                <p className="font-bold" dir="ltr">{r.reference_code}</p>
                <p className="text-sm text-ink/60">{r.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold">{t('sessions')}</h2>
        {sessions.length === 0 ? (
          <div className="mt-4 rounded border hairline bg-white p-8 text-center">
            <p className="text-ink/70">{t('no_sessions')}</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {sessions.map((s) => (
              <li key={s.id} className="rounded border hairline bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{s.volunteer_name ?? t('volunteer_tbd')}</p>
                    <p className="text-sm text-ink/60">
                      {new Date(s.scheduled_start).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', { timeZone: 'Asia/Riyadh' })}
                      {' · '}{s.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {s.meeting_url && (
                      <a href={s.meeting_url} target="_blank" rel="noopener noreferrer" className="rounded border border-navy bg-navy px-3 py-1.5 text-sm font-semibold text-paper hover:bg-blue">
                        {t('join')}
                      </a>
                    )}
                    <a href={`/${locale}/report?session=${s.id}`} className="rounded border border-navy px-3 py-1.5 text-sm font-semibold text-navy hover:bg-line">
                      {t('report')}
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
