/**
 * SiteHeader — official logo asset (ADR-0002: no text substitutes),
 * clean bilingual nav, language switch, prominent CTA.
 */
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'nav' });
  const links = [
    ['about', `/${locale}/about`],
    ['how', `/${locale}/how`],
    ['find', `/${locale}/find`],
    ['impact', `/${locale}/impact`],
    ['safety', `/${locale}/child-safety`],
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b hairline bg-paper">
      {/* design-ok: solid sticky header, no translucency — ADR-0002 (no glassmorphism) */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <a href={`/${locale}`} className="flex items-center" aria-label="AND MORE — وأكثر">
          <Image
            src="/assets/brand/logo-official.png"
            alt="AND MORE | وأكثر"
            width={66}
            height={60}
            priority
            className="h-12 w-auto sm:h-14"
          />
        </a>

        <nav
          aria-label={locale === 'ar' ? 'التنقل الرئيسي' : 'Primary'}
          className="hidden items-center gap-x-6 text-sm font-medium lg:flex"
        >
          {links.map(([key, href]) => (
            <a key={key} href={href} className="text-ink/80 transition-colors hover:text-blue">
              {t(key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={locale === 'ar' ? '/en' : '/ar'}
            className="rounded border border-navy px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-sand/30"
          >
            {locale === 'ar' ? 'English' : 'العربية'}
          </a>
          <a
            href={`/${locale}/apply`}
            className="hidden rounded bg-navy px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-blue sm:block"
          >
            {t('volunteer')}
          </a>
          {/* Mobile menu trigger (progressive: links collapse under lg) */}
          <details className="relative lg:hidden">
            <summary
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded border border-line"
              aria-label={locale === 'ar' ? 'القائمة' : 'Menu'}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </summary>
            <nav
              aria-label={locale === 'ar' ? 'قائمة الجوال' : 'Mobile'}
              className="absolute end-0 mt-2 w-56 rounded border hairline bg-paper p-2 shadow-float"
            >
              {links.map(([key, href]) => (
                <a key={key} href={href} className="block rounded px-3 py-2 text-sm text-ink/85 hover:bg-sand/20">
                  {t(key)}
                </a>
              ))}
              <a href={`/${locale}/book`} className="mt-1 block rounded px-3 py-2 text-sm font-semibold text-blue hover:bg-sand/20">
                {locale === 'ar' ? 'احجز جلسة' : 'Book a session'}
              </a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
