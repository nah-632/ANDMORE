import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getRoles, getUser } from '@/lib/auth/server';
import { AdminConsole } from '@/components/admin/AdminConsole';
import { locales, type Locale } from '@/i18n/request';

type Props = { params: Promise<{ locale: Locale }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getUser();
  if (!user) redirect(`/${locale}`);
  const roles = await getRoles();
  const allowed = roles.some((r) => ['reviewer', 'moderator', 'super_admin'].includes(r));
  if (!allowed) redirect(`/${locale}`);

  const t = await getTranslations({ locale, namespace: 'admin' });
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-sm text-ink/60">{t('eyebrow')}</p>
      <h1 className="mt-2 text-4xl font-bold">{t('title')}</h1>
      <AdminConsole locale={locale} />
    </main>
  );
}
