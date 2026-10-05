import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BookForm } from '@/components/book/BookForm';
import { locales, type Locale } from '@/i18n/request';

type Props = { params: Promise<{ locale: Locale }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function BookPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'book' });

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-sm text-ink/60">{t('eyebrow')}</p>
      <h1 className="mt-2 text-4xl font-bold">{t('title')}</h1>
      <p className="mt-3 max-w-prose text-ink/75">{t('intro')}</p>
      <BookForm locale={locale} />
    </main>
  );
}
