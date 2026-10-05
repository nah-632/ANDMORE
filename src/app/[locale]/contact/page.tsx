import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Reveal } from '@/components/motion/Reveal';
import { locales, type Locale } from '@/i18n/request';

type Props = { params: Promise<{ locale: Locale }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('contact') };
}

/**
 * Contact page (§16.10): WhatsApp-first (the platform's real channel, §14B),
 * response expectations, plus the report path for safety concerns.
 * No email backend exists yet — we do NOT fake one (§2.4).
 */
export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ar = locale === 'ar';
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-5 pt-14 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue">
          {ar ? 'تواصل' : 'Contact'}
        </p>
        <h1 className="mt-3 text-4xl font-bold text-navy sm:text-5xl">{t('title')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink/75">{t('intro')}</p>
      </header>

      <Reveal className="mx-auto max-w-3xl px-5 pb-20 pt-10">
        {/* WhatsApp — the real, working channel */}
        <a
          href="https://wa.me/966508342500"
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-lg border hairline bg-white p-8 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue hover:shadow-float"
        >
          <div className="flex items-center gap-5">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy text-paper transition-colors group-hover:bg-blue"
              aria-hidden="true"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.83 14.12c-.24.68-1.4 1.3-1.93 1.35-.53.06-1.03.24-2.95-.62-2.29-1.03-3.73-3.4-3.85-3.56-.12-.16-.92-1.23-.92-2.35 0-1.12.59-1.67.8-1.9.2-.24.44-.29.59-.29.15 0 .3 0 .44.01.14.01.33-.05.51.39.19.44.65 1.58.71 1.7.06.12.09.25.01.41-.08.16-.15.26-.29.41-.15.15-.31.33-.44.44-.15.12-.3.25-.13.53.17.28.76 1.26 1.64 2.04 1.12 1 2.07 1.31 2.36 1.46.29.15.46.13.63-.08.17-.21.73-.85.93-1.14.19-.29.39-.24.65-.15.27.1 1.69.8 1.98.94.29.15.48.22.55.34.06.12.06.71-.18 1.4z" />
              </svg>
            </span>
            <div>
              <p className="font-bold text-navy">{t('wa_title')}</p>
              <p className="mt-1 text-sm text-ink/70">{t('wa_body')}</p>
              <p className="mt-2 font-mono text-sm text-blue" dir="ltr">
                +966 50 834 2500
              </p>
            </div>
          </div>
        </a>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded border hairline bg-white p-6">
            <h2 className="font-bold text-navy">{t('hours_title')}</h2>
            <p className="mt-2 text-sm text-ink/70">{t('hours_body')}</p>
          </div>
          <div className="rounded border hairline bg-white p-6">
            <h2 className="font-bold text-navy">{t('safety_title')}</h2>
            <p className="mt-2 text-sm text-ink/70">{t('safety_body')}</p>
            <a
              href={`/${locale}/report`}
              className="mt-3 inline-block font-semibold text-blue underline underline-offset-4"
            >
              {t('safety_link')}
            </a>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
