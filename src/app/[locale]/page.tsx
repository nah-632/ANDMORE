import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Reveal } from '@/components/motion/Reveal';

/**
 * HomePage — premium editorial redesign (ADR-0002):
 * hero (student visual) → how-it-works strip → volunteer split → mission band → honest impact → CTA.
 * Full-width sections, no card-grid monotony, official imagery integrated.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const ar = locale === 'ar';

  return (
    <main>
      {/* ============ HERO: asymmetric split with the student visual ============ */}
      <section className="relative overflow-hidden bg-paper">
        {/* Logo-inspired decorative arcs (restrained, sand at low opacity) */}
        <svg
          className="pointer-events-none absolute -top-24 end-[-120px] hidden opacity-[0.35] md:block"
          width="480" height="480" viewBox="0 0 480 480" fill="none" aria-hidden="true"
        >
          <circle cx="240" cy="240" r="200" stroke="#D6B98A" strokeWidth="1.5" />
          <circle cx="240" cy="240" r="140" stroke="#D6B98A" strokeWidth="1" />
          <path d="M240 60v360M60 240h360" stroke="#D6B98A" strokeWidth="1" opacity="0.6" />
        </svg>

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-12 md:grid-cols-[6fr_5fr] md:pb-24 md:pt-20">
          <div className="hero-enter">
            <h1 className="text-4xl font-bold leading-tight text-navy sm:text-5xl md:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="mt-5 max-w-prose text-lg text-ink/80">{t('heroSub')}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={`/${locale}/book`}
                className="rounded bg-blue px-6 py-3 font-semibold text-paper transition-colors hover:bg-navy"
              >
                {t('ctaFind')}
              </a>
              <a
                href={`/${locale}/apply`}
                className="rounded border border-navy bg-transparent px-6 py-3 font-semibold text-navy transition-colors hover:bg-sand/30"
              >
                {t('ctaVolunteer')}
              </a>
            </div>
            <p className="mt-6 text-sm text-ink/60">{t('trust_line')}</p>
          </div>

          <figure className="relative">
            <div className="overflow-hidden rounded-lg border hairline bg-white shadow-float">
              <Image
                src="/assets/brand/hero-student.webp"
                alt={ar ? 'طالب يذاكر — المعلم المناسب... مستقبل أفضل.' : 'A student studying — The right tutor. A brighter future.'}
                width={978}
                height={521}
                priority
                sizes="(max-width: 768px) 100vw, 45vw"
                className="h-auto w-full object-cover"
              />
            </div>
            {/* Sand accent bar under the image — logo visual language */}
            <div className="absolute -bottom-3 start-6 h-1.5 w-24 rounded bg-sand" aria-hidden="true" />
          </figure>
        </div>
      </section>

      {/* ============ MISSION BAND: معًا نصنع مستقبلهم المشرق ============ */}
      <section className="bg-navy text-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[5fr_6fr] md:py-24">
          <figure className="order-2 md:order-1">
            <div className="overflow-hidden rounded-lg">
              <Image
                src="/assets/brand/mission-clean.webp"
                alt={ar ? 'معًا نصنع مستقبلهم المشرق' : 'Together, we create a brighter future'}
                width={1125}
                height={327}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="h-auto w-full object-cover"
              />
            </div>
          </figure>
          <Reveal className="order-1 md:order-2">
            <h2 className="text-3xl font-bold sm:text-4xl">{t('missionTitle')}</h2>
            <p className="mt-4 max-w-prose text-paper/85">{t('missionBody')}</p>
            <a
              href={`/${locale}/impact`}
              className="mt-6 inline-block font-semibold text-sand underline underline-offset-8 hover:text-paper"
            >
              {t('missionLink')}
            </a>
          </Reveal>
        </div>
      </section>

      {/* ============ HOW IT WORKS: numbered vertical sequence (no icon cards) ============ */}
      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-5 py-16 md:py-24">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">{t('howTitle')}</h2>
          <ol className="mt-12 space-y-8">
            {[1, 2, 3, 4, 5].map((n) => (
              <li key={n} className="flex items-start gap-5">
                <span className="font-heading text-5xl font-bold leading-none text-sand" aria-hidden="true">
                  {String(n).padStart(2, '0')}
                </span>
                <div className="border-s-2 border-line ps-5">
                  <h3 className="text-lg font-bold text-navy">{t(`how${n}_title`)}</h3>
                  <p className="mt-1 text-ink/75">{t(`how${n}_body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ VOLUNTEER SPLIT: انضم إلى مدرسينا المتطوعين ============ */}
      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl items-stretch gap-0 px-0 md:grid-cols-2">
          <figure className="relative min-h-[280px] md:min-h-[520px]">
            <Image
              src="/assets/brand/volunteers-clean.webp"
              alt={ar ? 'متطوعون معتمدون يقدمون جلسات تعليمية' : 'Verified volunteer tutors delivering educational sessions'}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
            />
          </figure>
          <div className="flex flex-col justify-center bg-sand/20 px-6 py-12 md:px-12 md:py-16">
            <p className="text-sm font-semibold uppercase tracking-wide text-terra">{t('volunteerEyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">{t('volunteerTitle')}</h2>
            <p className="mt-4 max-w-prose text-ink/80">{t('volunteerBody')}</p>
            <ul className="mt-6 space-y-2 text-sm text-ink/80">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-terra" aria-hidden="true" />
                  {t(`volunteerPoint${n}`)}
                </li>
              ))}
            </ul>
            <a
              href={`/${locale}/apply`}
              className="mt-8 inline-block w-fit rounded bg-navy px-6 py-3 font-semibold text-paper transition-colors hover:bg-blue"
            >
              {t('volunteerCta')}
            </a>
          </div>
        </div>
      </section>

      {/* ============ IMPACT SNAPSHOT: honest, DB-driven (currently empty state) ============ */}
      <section className="border-y hairline bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center md:py-20">
          <h2 className="text-3xl font-bold text-navy">{t('impactTitle')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink/70">{t('impactEmpty')}</p>
          {/* Live numbers render here from P8b DB aggregation; honest empty state until data exists */}
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="bg-blue text-paper">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center md:py-20">
          <h2 className="text-3xl font-bold sm:text-4xl">{t('ctaBandTitle')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-paper/90">{t('ctaBandBody')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={`/${locale}/book`} className="rounded bg-paper px-6 py-3 font-semibold text-navy transition-colors hover:bg-sand">
              {t('ctaFind')}
            </a>
            <a href={`/${locale}/apply`} className="rounded border border-paper/60 px-6 py-3 font-semibold text-paper transition-colors hover:bg-paper/10">
              {t('ctaVolunteer')}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
