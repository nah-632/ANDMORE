'use client';

/**
 * Admin console (§15): application review queue with approve/reject actions.
 * Rejection requires a reason (§7). Every decision is audited server-side.
 */
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type App = {
  id: string;
  reference_code: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
};

const TABS = ['submitted', 'under_review', 'interview_scheduled', 'needs_more_info', 'approved', 'rejected'] as const;

export function AdminConsole({ locale }: { locale: string }) {
  const t = useTranslations('admin');
  const [tab, setTab] = useState<(typeof TABS)[number]>('submitted');
  const [items, setItems] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  async function load(status: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/applications?status=${status}`);
    const body = await res.json().catch(() => ({}));
    setItems(body.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function decide(id: string, decision: string) {
    if (decision === 'rejected' && !(reason[id]?.trim())) {
      alert(t('reason_required'));
      return;
    }
    setActing(id);
    const res = await fetch('/api/admin/applications/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: id, decision, rejectionReason: reason[id] ?? undefined }),
    });
    setActing(null);
    if (res.ok) load(tab);
    else alert(t('decision_failed'));
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('queue')}>
        {TABS.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={tab === s}
            onClick={() => setTab(s)}
            className={`rounded border px-3 py-1.5 text-sm font-medium ${
              tab === s ? 'border-navy bg-navy text-paper' : 'border-line text-ink/70 hover:bg-line'
            }`}
          >
            {t(`status_${s}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-ink/60">{t('loading')}</p>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded border hairline bg-white p-8 text-center">
          <p className="text-ink/70">{t('empty')}</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((a) => (
            <li key={a.id} className="rounded border hairline bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{a.full_name}</p>
                  <p className="text-sm text-ink/60">
                    <bdi dir="ltr">{a.reference_code}</bdi> · <bdi dir="ltr">{a.email}</bdi>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(tab === 'submitted' || tab === 'needs_more_info') && (
                    <button
                      disabled={acting === a.id}
                      onClick={() => decide(a.id, 'under_review')}
                      className="rounded border border-navy px-3 py-1.5 text-sm font-semibold text-navy hover:bg-line"
                    >
                      {t('start_review')}
                    </button>
                  )}
                  {tab === 'under_review' && (
                    <>
                      <button
                        disabled={acting === a.id}
                        onClick={() => decide(a.id, 'approved')}
                        className="rounded border border-navy bg-navy px-3 py-1.5 text-sm font-semibold text-paper hover:bg-blue"
                      >
                        {t('approve')}
                      </button>
                      <button
                        disabled={acting === a.id}
                        onClick={() => decide(a.id, 'needs_more_info')}
                        className="rounded border border-navy px-3 py-1.5 text-sm font-semibold text-navy hover:bg-line"
                      >
                        {t('needs_info')}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {(tab === 'under_review' || tab === 'needs_more_info') && (
                <div className="mt-3">
                  <input
                    value={reason[a.id] ?? ''}
                    onChange={(e) => setReason((r) => ({ ...r, [a.id]: e.target.value }))}
                    placeholder={t('rejection_reason')}
                    className="w-full rounded border border-line bg-white px-3 py-2 text-sm"
                  />
                  {tab === 'under_review' && (
                    <button
                      disabled={acting === a.id}
                      onClick={() => decide(a.id, 'rejected')}
                      className="mt-2 rounded border border-red-700 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      {t('reject')}
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
