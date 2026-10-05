/**
 * SiteFooter — Academic Navy, official logo, brand statement, full links (ADR-0002 §16).
 */
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const cols: Array<[string, Array<[string, string]>]> = [
    [
      locale === 'ar' ? 'المنصة' : 'Platform',
      [
        [tNav('about'), `/${locale}/about`],
        [tNav('how'), `/${locale}/how`],
        [tNav('subjects'), `/${locale}/subjects`],
        [tNav('find'), `/${locale}/find`],
      ],
    ],
    [
      locale === 'ar' ? 'شارك' : 'Get involved',
      [
        [tNav('volunteer'), `/${locale}/apply`],
        [tNav('impact'), `/${locale}/impact`],
        [locale === 'ar' ? 'احجز جلسة' : 'Book a session', `/${locale}/book`],
        [tNav('contact'), `/${locale}/contact`],
      ],
    ],
    [
      locale === 'ar' ? 'الثقة' : 'Trust',
      [
        [tNav('safety'), `/${locale}/child-safety`],
        [t('privacy'), `/${locale}/privacy`],
        [t('terms'), `/${locale}/terms`],
      ],
    ],
  ];

  return (
    <footer className="bg-navy text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[4fr_8fr]">
        <div>
          <Image
            src="/assets/brand/logo-official.png"
            alt="AND MORE | وأكثر"
            width={120}
            height={110}
            className="h-24 w-auto brightness-0 invert"
          />
          <p className="mt-4 max-w-xs text-paper/85">{t('tagline')} — {t('brand_line')}</p>
          <a
            href="https://wa.me/966508342500"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded border border-paper/40 px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-paper hover:text-navy"
            dir="ltr"
          >
            +966 50 834 2500
          </a>
        </div>
        <nav
          aria-label={locale === 'ar' ? 'روابط التذييل' : 'Footer links'}
          className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3"
        >
          {cols.map(([title, items]) => (
            <div key={title}>
              <p className="text-sm font-bold text-sand">{title}</p>
              <ul className="mt-3 space-y-2">
                {items.map(([label, href]) => (
                  <li key={href}>
                    <a href={href} className="text-sm text-paper/80 transition-colors hover:text-paper hover:underline hover:underline-offset-4">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-paper/15">
        <p className="mx-auto max-w-6xl px-5 py-4 text-xs text-paper/60">{t('rights')}</p>
      </div>
    </footer>
  );
}
