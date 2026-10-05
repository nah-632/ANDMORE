import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/request';
import {
  fontAmiri,
  fontPlexArabic,
  fontSourceSerif,
  fontSourceSans,
} from '@/lib/fonts';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LocaleProps = { params: Promise<{ locale: Locale }> };

export async function generateMetadata(props: LocaleProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'footer' });
  return {
    title: { default: 'AND MORE', template: '%s — AND MORE' },
    description: t('rights'),
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }> | undefined;
}>) {
  // TEMPORARY DIAGNOSTIC (remove after root-cause found): log what params actually
  // is during prerender. Evidence for "Cannot destructure 'locale'" bug.
  let locale: string | undefined;
  if (params === undefined) {
    console.error('[prerender-probe] layout: params is UNDEFINED');
    locale = 'ar';
  } else {
    const p = await params;
    console.error('[prerender-probe] layout: params =', JSON.stringify(p));
    locale = p?.locale ?? 'ar';
  }
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body
        className={`${fontAmiri.variable} ${fontPlexArabic.variable} ${fontSourceSerif.variable} ${fontSourceSans.variable} min-h-dvh antialiased`}
      >
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
