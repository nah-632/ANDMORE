import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Reveal } from '@/components/motion/Reveal';
import { SubjectsDirectory } from '@/components/subjects/SubjectsDirectory';
import { locales, type Locale } from '@/i18n/request';

type Props = { params: Promise<{ locale: Locale }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('subjects') };
}

/** Subjects directory (§16.4): DB-driven via /api/taxonomy, client filter. */
export default async function SubjectsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <main className="bg-paper">
      <header className="mx-auto max-w-4xl px-5 pt-14 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue">
          {locale === 'ar' ? 'ماذا ندرّس' : 'What we teach'}
        </p>
        <h1 className="mt-3 text-4xl font-bold text-navy sm:text-5xl">{t('subjects')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink/75">
          {locale === 'ar'
            ? 'المواد المُدرّسة على المنصة — من قاعدة البيانات مباشرة، تتحدث تلقائيًا مع إضافة مواد جديدة.'
            : 'Subjects taught on the platform — straight from the database, updating automatically as new ones are added.'}
        </p>
      </header>
      <Reveal className="mx-auto max-w-5xl px-5 pb-20 pt-10">
        <SubjectsDirectory locale={locale} />
      </Reveal>
    </main>
  );
}
