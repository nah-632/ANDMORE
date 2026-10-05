import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/request';
import { ContentPage } from '@/components/public/ContentPage';

type Props = { params: Promise<{ locale: Locale }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <ContentPage slug="privacy" locale={locale} />
    </main>
  );
}
