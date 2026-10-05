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
  return { title: t('how') };
}

/**
 * How It Works (§16.3): five-step journey with connecting line,
 * scroll reveals, and a CTA into the real flows (apply/book).
 */
export default async function HowPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const ar = locale === 'ar';

  const steps = [1, 2, 3, 4, 5] as const;

  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-5 pt-14 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue">
          {ar ? 'الرحلة' : 'The journey'}
        </p>
        <h1 className="mt-3 text-4xl font-bold text-navy sm:text-5xl">{t('howTitle')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink/75">
          {ar
            ? 'من التطوع إلى الأثر: خمس خطوات واضحة، كل واحدة محمية بالتحقق والتنظيم.'
            : 'From volunteering to impact: five clear steps, each protected by verification and structure.'}
        </p>
      </header>

      {/* Journey: numbered steps with a connecting vertical line (logo visual language) */}
      <ol className="relative mx-auto mt-14 max-w-3xl px-5 pb-20">
        {/* connecting line */}
        <span
          className="absolute bottom-8 start-[calc(2.75rem+1.25rem)] top-8 w-px bg-line md:start-[4.25rem]"
          aria-hidden="true"
        />
        {steps.map((n, i) => (
          <Reveal key={n} as="li" delay={i * 60} className="relative flex items-start gap-6 pb-12 last:pb-0">
            <span
              className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-sand bg-paper font-heading text-xl font-bold text-navy"
              aria-hidden="true"
            >
              {String(n).padStart(2, '0')}
            </span>
            <div className="pt-2">
              <h2 className="text-xl font-bold text-navy">{t(`how${n}_title`)}</h2>
              <p className="mt-2 max-w-prose text-ink/75">{t(`how${n}_body`)}</p>
            </div>
          </Reveal>
        ))}
      </ol>

      {/* CTA band: into the two real entry flows */}
      <section className="bg-navy text-paper">
        <div className="mx-auto max-w-4xl px-5 py-14 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {ar ? 'اختر مكانك في الرحلة' : 'Choose your place in the journey'}
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={`/${locale}/apply`}
              className="rounded bg-paper px-6 py-3 font-semibold text-navy transition-colors hover:bg-sand"
            >
              {ar ? 'أنا متطوع' : 'I want to volunteer'}
            </a>
            <a
              href={`/${locale}/book`}
              className="rounded border border-paper/60 px-6 py-3 font-semibold text-paper transition-colors hover:bg-paper/10"
            >
              {ar ? 'أنا طالب/ولي أمر' : 'I am a student / guardian'}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
