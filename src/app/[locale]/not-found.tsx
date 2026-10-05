import { getTranslations } from 'next-intl/server';

type Props = { params?: Promise<{ locale?: string }> };

/**
 * Locale-scoped not-found. During prerender Next.js renders this boundary
 * WITHOUT params (await undefined) — destructuring `{ locale }` directly
 * crashes the build (lesson learned 2026-10-05). Guard everything.
 */
export default async function NotFoundPage({ params }: Props) {
  const p = params ? await params : undefined;
  const locale = p?.locale === 'en' ? 'en' : 'ar';
  const t = await getTranslations({ locale, namespace: 'nav' });
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-5 text-center">
      <p className="font-heading text-7xl font-bold text-sand">404</p>
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
