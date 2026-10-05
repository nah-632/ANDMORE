import { getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export default async function NotFoundPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-5 text-center">
      <p className="font-heading text-7xl font-bold text-gold">404</p>
      <h1 className="mt-4 text-2xl font-bold">
        {locale === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}
      </h1>
      <p className="mt-2 text-ink/70">
        {locale === 'ar' ? 'قد يكون الرابط قديمًا أو فيه خطأ إملائي.' : 'The link may be old or mistyped.'}
      </p>
      <a href={`/${locale}`} className="mt-6 rounded border border-navy bg-navy px-5 py-3 font-semibold text-paper hover:bg-blue">
        {t('home')}
      </a>
    </main>
  );
}
