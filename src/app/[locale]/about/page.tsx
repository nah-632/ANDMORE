import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/request';
import { ContentPage } from '@/components/public/ContentPage';

type Props = { params: Promise<{ locale: Locale }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('about') };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <ContentPage slug="about" locale={locale} />
    </main>
  );
}
