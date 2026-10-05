import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Reveal } from '@/components/motion/Reveal';
import { svc } from '@/lib/db/server';
import { locales, type Locale } from '@/i18n/request';

type Props = { params: Promise<{ locale: Locale }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('impact') };
}

export const revalidate = 60;

/**
 * Impact page (§16.8): database-driven real numbers only, small-count
 * suppression (§11), honest empty states, mission imagery.
 */
export default async function ImpactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ar = locale === 'ar';
  const t = await getTranslations({ locale, namespace: 'impact' });

  const db = svc();
  // Aggregate real data — never fabricate (§2.3). Suppress counts < 5 (§11).
  const [{ data: sessions }, { data: hours }, { data: volunteers }] = await Promise.all([
    db.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('volunteer_hours_ledger').select('minutes', { head: true }),
    db.from('volunteer_profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  const totalMinutes = (hours ?? []).reduce((acc, r) => acc + (r.minutes ?? 0), 0);
  const sessionCount = sessions ?? 0;
  const volunteerCount = volunteers ?? 0;
  const suppress = (n: number) => (n > 0 && n < 5 ? null : n); // small-number suppression

  const stats = [
    { label: ar ? 'جلسة مكتملة' : 'completed sessions', value: suppress(sessionCount) },
    { label: ar ? 'ساعة تطوع موثقة' : 'documented volunteer hours', value: suppress(Math.floor(totalMinutes / 60)) },
    { label: ar ? 'متطوع نشط' : 'active volunteers', value: suppress(volunteerCount) },
  ];

  return (
    <main className="bg-paper">
      {/* Mission hero with image */}
      <section className="bg-navy text-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[6fr_5fr] md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sand">
              {ar ? 'قياس الأثر' : 'Measuring impact'}
            </p>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
              {ar ? 'معًا نصنع مستقبلهم المشرق' : 'Together, we create a brighter future'}
            </h1>
            <p className="mt-4 max-w-prose text-paper/85">
              {ar
                ? 'وقت المتطوع + مشاركة المعرفة + دعم الطالب = أثر تعليمي حقيقي. كل رقم هنا يُحتسب من قاعدة البيانات — لا تقديرات ولا أرقام تسويقية.'
                : 'Volunteer time + knowledge sharing + student support = real educational impact. Every number here is computed from the database — no estimates, no marketing figures.'}
            </p>
          </div>
          <figure className="overflow-hidden rounded-lg">
            <Image
              src="/assets/brand/mission-clean.webp"
              alt={ar ? 'معًا نصنع مستقبلهم المشرق' : 'Together, we create a brighter future'}
              width={1125}
              height={327}
              sizes="(max-width: 768px) 100vw, 40vw"
              className="h-auto w-full object-cover"
            />
          </figure>
        </div>
      </section>

      {/* Real numbers — animated counters (CSS-free count via Reveal + format) */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <Reveal className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded border hairline bg-white p-8 text-center">
              <p className="font-heading text-5xl font-bold text-navy">
                {s.value === null ? '—' : s.value.toLocaleString(ar ? 'ar-SA' : 'en-US')}
              </p>
              <p className="mt-2 text-sm text-ink/70">{s.label}</p>
            </div>
          ))}
        </Reveal>

        {stats.every((s) => s.value === null) && (
          <p className="mx-auto mt-8 max-w-2xl text-center text-ink/70">
            {ar
              ? 'الأرقام ستظهر هنا مع أول الجلسات المكتملة. نبدأ من الصفر بصدق.'
              : 'Numbers will appear here with the first completed sessions. We start from zero, honestly.'}
          </p>
        )}
      </section>

      {/* Formula band */}
      <section className="border-t hairline bg-paper">
        <div className="mx-auto max-w-4xl px-5 py-14 text-center">
          <Reveal className="flex flex-wrap items-center justify-center gap-3 text-lg font-bold text-navy">
            <span className="rounded bg-sand/30 px-4 py-2">{ar ? 'وقت المتطوع' : 'Volunteer time'}</span>
            <span aria-hidden="true">+</span>
            <span className="rounded bg-sand/30 px-4 py-2">{ar ? 'مشاركة المعرفة' : 'Knowledge sharing'}</span>
            <span aria-hidden="true">+</span>
            <span className="rounded bg-sand/30 px-4 py-2">{ar ? 'دعم الطالب' : 'Student support'}</span>
            <span aria-hidden="true">=</span>
            <span className="rounded bg-navy px-4 py-2 text-paper">{ar ? 'أثر حقيقي' : 'Real impact'}</span>
          </Reveal>
          <a
            href={`/${locale}/apply`}
            className="mt-10 inline-block rounded bg-blue px-6 py-3 font-semibold text-paper transition-colors hover:bg-navy"
          >
            {ar ? 'كن جزءًا من الأثر' : 'Be part of the impact'}
          </a>
        </div>
      </section>
    </main>
  );
}
