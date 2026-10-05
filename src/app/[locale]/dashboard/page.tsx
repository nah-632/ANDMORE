import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/server';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { locales, type Locale } from '@/i18n/request';

type Props = { params: Promise<{ locale: Locale }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getUser();
  if (!user) redirect(`/${locale}`);

  const t = await getTranslations({ locale, namespace: 'dashboard' });
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-sm text-ink/60">{t('eyebrow')}</p>
      <h1 className="mt-2 text-4xl font-bold">{t('title')}</h1>
      <Dashboard locale={locale} />
    </main>
  );
}
