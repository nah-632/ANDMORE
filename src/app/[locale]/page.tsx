import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/request';

type Props = { params: Promise<{ locale: Locale }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: Props) {
  // TEMPORARY DIAGNOSTIC: probe params shape during prerender.
  let locale: Locale;
  if (params === undefined) {
    console.error('[prerender-probe] home: params is UNDEFINED');
    locale = 'ar';
  } else {
    const p = await params;
    console.error('[prerender-probe] home: params =', JSON.stringify(p));
    locale = (p?.locale as Locale) ?? 'ar';
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <main>
      {/* Hero — asymmetric 7/5 split, start-aligned, text-first (§5B locked). */}
      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:py-20 md:grid-cols-[7fr_5fr] md:items-center">
          <div>
            <h1 className="text-4xl font-bold sm:text-5xl">{t('heroTitle')}</h1>
            <p className="mt-4 max-w-prose text-lg text-ink/80">{t('heroSub')}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={`/${locale}/find`}
                className="rounded border border-navy bg-navy px-5 py-3 font-semibold text-paper transition-colors hover:bg-blue"
              >
                {t('ctaFind')}
              </a>
              <a
                href={`/${locale}/volunteer`}
                className="rounded border border-navy px-5 py-3 font-semibold text-navy transition-colors hover:bg-line"
              >
                {t('ctaVolunteer')}
              </a>
              <a href={`/${locale}/how`} className="px-2 py-3 font-medium text-blue underline underline-offset-4">
                {t('howLink')}
              </a>
            </div>
          </div>
          <div className="hidden justify-end md:flex" aria-hidden="true">
            {/* Ampersand motif placeholder — editorial illustration arrives in P8. */}
            <span className="select-none font-heading text-[11rem] leading-none text-gold">&amp;</span>
          </div>
        </div>
      </section>

      {/* Trust band — navy full-width rhythm band (§5B). */}
      <section className="bg-navy text-paper">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="text-2xl font-bold">{t('trustTitle')}</h2>
          <p className="mt-3 max-w-2xl text-paper/85">{t('trustBody')}</p>
        </div>
      </section>

      {/* Impact snapshot — DB-driven from P8; honest empty state until then. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="text-2xl font-bold">{t('impactTitle')}</h2>
          <p className="mt-3 max-w-2xl text-ink/75">{t('impactEmpty')}</p>
        </div>
      </section>
    </main>
  );
}
