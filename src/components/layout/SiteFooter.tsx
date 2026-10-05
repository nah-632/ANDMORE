/**
 * SiteFooter: tagline, legal links, WhatsApp contact (§14B official number).
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <footer className="bg-navy text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[5fr_7fr]">
        <div>
          <p className="text-2xl font-bold">
            AND MORE <span className="text-gold">|</span> <span lang="ar">وأكثر</span>
          </p>
          <p className="mt-2 text-paper/80">{t('tagline')}</p>
          <p className="mt-4 text-sm text-paper/60">
            <a href="https://wa.me/966508342500" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" dir="ltr">
              +966 50 834 2500
            </a>
          </p>
        </div>
        <nav aria-label={locale === 'ar' ? 'روابط' : 'Links'} className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <Link href={`/${locale}/about`} className="text-paper/80 hover:text-paper hover:underline">{tNav('about')}</Link>
          <Link href={`/${locale}/how`} className="text-paper/80 hover:text-paper hover:underline">{tNav('how')}</Link>
          <Link href={`/${locale}/subjects`} className="text-paper/80 hover:text-paper hover:underline">{tNav('subjects')}</Link>
          <Link href={`/${locale}/find`} className="text-paper/80 hover:text-paper hover:underline">{tNav('find')}</Link>
          <Link href={`/${locale}/apply`} className="text-paper/80 hover:text-paper hover:underline">{tNav('volunteer')}</Link>
          <Link href={`/${locale}/impact`} className="text-paper/80 hover:text-paper hover:underline">{tNav('impact')}</Link>
          <Link href={`/${locale}/child-safety`} className="text-paper/80 hover:text-paper hover:underline">{tNav('safety')}</Link>
          <Link href={`/${locale}/privacy`} className="text-paper/80 hover:text-paper hover:underline">{t('privacy')}</Link>
          <Link href={`/${locale}/terms`} className="text-paper/80 hover:text-paper hover:underline">{t('terms')}</Link>
          <Link href={`/${locale}/contact`} className="text-paper/80 hover:text-paper hover:underline">{tNav('contact')}</Link>
        </nav>
      </div>
      <div className="border-t border-paper/15">
        <p className="mx-auto max-w-6xl px-5 py-4 text-xs text-paper/60">{t('rights')}</p>
      </div>
    </footer>
  );
}
