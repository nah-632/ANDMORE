/**
 * SiteHeader: bilingual nav with the official logo lockup (§5).
 * Arabic shows the Arabic lockup text; English shows the English lockup.
 */
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'nav' });
  const links = [
    ['about', `/${locale}/about`],
    ['how', `/${locale}/how`],
    ['subjects', `/${locale}/subjects`],
    ['find', `/${locale}/find`],
    ['volunteer', `/${locale}/apply`],
    ['impact', `/${locale}/impact`],
    ['safety', `/${locale}/child-safety`],
    ['contact', `/${locale}/contact`],
  ] as const;

  return (
    <header className="border-b hairline bg-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href={`/${locale}`} className="flex items-center gap-3" aria-label="AND MORE">
          <Image
            src="/assets/brand/logo-mark.svg"
            alt=""
            width={36}
            height={36}
            priority
          />
          <span className="text-xl font-bold text-navy">
            AND MORE <span className="text-gold">|</span> <span lang="ar">وأكثر</span>
          </span>
        </Link>
        <nav aria-label={locale === 'ar' ? 'التنقل الرئيسي' : 'Primary'} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
          {links.map(([key, href]) => (
            <Link key={key} href={href} className="text-ink/80 hover:text-navy hover:underline hover:underline-offset-4">
              {t(key)}
            </Link>
          ))}
          <Link
            href={locale === 'ar' ? '/en' : '/ar'}
            className="rounded border border-navy px-3 py-1.5 text-navy hover:bg-line"
          >
            {locale === 'ar' ? 'English' : 'العربية'}
          </Link>
        </nav>
      </div>
    </header>
  );
}
