import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/request';

type Props = { params: Promise<{ locale: string }> | undefined };
// NOTE: no generateStaticParams here — the [locale] layout's generateStaticParams
// already fills the locale param for ALL nested routes. Re-declaring it in a child
// segment makes Next 15.5 prerender this page with params=undefined.

export default async function StyleguidePage({ params }: Props) {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') notFound();
  setRequestLocale(locale as Locale);
  const ar = locale === 'ar';


  const headingSizes = [
    ['Display', 'text-5xl'],
    ['H1', 'text-4xl'],
    ['H2', 'text-2xl'],
    ['H3', 'text-xl'],
  ] as const;

  const colors = [
    ['ink', 'bg-ink'],
    ['navy', 'bg-navy'],
    ['blue', 'bg-blue'],
    ['gold', 'bg-gold'],
    ['teal', 'bg-teal'],
    ['paper', 'bg-paper'],
    ['line', 'bg-line'],
  ] as const;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12" dir={ar ? 'rtl' : 'ltr'}>
      <p className="text-sm text-ink/60">
        {ar ? 'صفحة العرض المرجعي — بانتظار موافقة المالك' : 'Styleguide — awaiting owner approval'}
      </p>
      <h1 className="mt-2 text-4xl font-bold">{ar ? 'النظام البصري' : 'Design System'}</h1>

      {/* Type scale with real text, in the current locale's fonts. */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold">{ar ? 'مقياس الخطوط' : 'Type Scale'}</h2>
        <div className="mt-4 space-y-4 hairline border-t pt-4">
          {headingSizes.map(([name, cls]) => (
            <div key={name}>
              <span className="text-xs uppercase tracking-wide text-ink/50">{name}</span>
              <p className={`${cls} font-bold`}>
                {ar ? 'المعلم المناسب... مستقبل أفضل.' : 'The right tutor. A brighter future.'}
              </p>
            </div>
          ))}
          <div>
            <span className="text-xs uppercase tracking-wide text-ink/50">Body</span>
            <p className="text-base">
              {ar
                ? 'جلسات تعليمية مجانية عبر الإنترنت، يقدّمها متطوعون مؤهلون وموثوقون لطلاب المرحلة الابتدائية والمتوسطة والثانوية.'
                : 'Free online educational sessions, delivered by verified qualified volunteers to primary, intermediate, and secondary students.'}
            </p>
          </div>
        </div>
      </section>

      {/* Color tokens. */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold">{ar ? 'الألوان' : 'Colors'}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {colors.map(([name, cls]) => (
            <div key={name} className="w-24">
              <div className={`h-16 rounded border hairline ${cls}`} />
              <span className="mt-1 block text-xs text-ink/70">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Buttons. */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold">{ar ? 'الأزرار' : 'Buttons'}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="rounded border border-navy bg-navy px-5 py-3 font-semibold text-paper hover:bg-blue">
            {ar ? 'زر أساسي' : 'Primary'}
          </button>
          <button className="rounded border border-navy px-5 py-3 font-semibold text-navy hover:bg-line">
            {ar ? 'زر ثانوي' : 'Secondary'}
          </button>
          <button className="rounded px-5 py-3 font-medium text-blue underline underline-offset-4">
            {ar ? 'رابط نصي' : 'Text link'}
          </button>
          <button disabled className="cursor-not-allowed rounded border border-line px-5 py-3 font-semibold text-ink/40">
            {ar ? 'غير متاح' : 'Disabled'}
          </button>
        </div>
      </section>

      {/* Form fields. */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold">{ar ? 'حقول النماذج' : 'Form Fields'}</h2>
        <div className="mt-4 grid max-w-md gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{ar ? 'البريد الإلكتروني' : 'Email'}</span>
            <input
              type="email"
              className="w-full rounded border border-line bg-white px-3 py-2.5 text-base"
              placeholder={ar ? 'you@example.com' : 'you@example.com'}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{ar ? 'رسالتك' : 'Your message'}</span>
            <textarea rows={3} className="w-full rounded border border-line bg-white px-3 py-2.5 text-base" />
            <span className="mt-1 block text-xs text-red-700">{ar ? 'هذا الحقل مطلوب.' : 'This field is required.'}</span>
          </label>
        </div>
      </section>

      {/* Card — 8px radius, hairline border, no shadow (§5B locked). */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold">{ar ? 'بطاقة' : 'Card'}</h2>
        <div className="mt-4 max-w-sm rounded border hairline bg-white p-5">
          <h3 className="text-lg font-bold">{ar ? 'جلسة رياضيات' : 'Math session'}</h3>
          <p className="mt-1 text-sm text-ink/75">
            {ar ? 'متطوع موثّق · المرحلة الثانوية · عن بُعد' : 'Verified volunteer · Secondary · Online'}
          </p>
        </div>
      </section>

      {/* Step list — vertical numbered sequence (§5B locked layout). */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold">{ar ? 'قائمة الخطوات' : 'Step List'}</h2>
        <ol className="mt-4 space-y-4">
          {(ar
            ? ['تسجيل المتطوع', 'التقييم والتحقق', 'تصنيف المتطوع']
            : ['Volunteer registration', 'Evaluation & verification', 'Volunteer classification']
          ).map((label, i) => (
            <li key={label} className="flex items-start gap-4">
              <span className="font-heading text-4xl font-bold text-gold" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="pt-2 text-base">{label}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Empty state. */}

      <section className="mt-10">
        <h2 className="text-2xl font-bold">{ar ? 'حالة فارغة' : 'Empty State'}</h2>
        <div className="mt-4 rounded border hairline bg-white p-8 text-center">
          <p className="text-ink/70">
            {ar ? 'لا يوجد متطوعون يطابقون عوامل التصفية الحالية.' : 'No volunteers match your current filters.'}
          </p>
          <button className="mt-3 rounded border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-line">
            {ar ? 'مسح عوامل التصفية' : 'Clear filters'}
          </button>
        </div>
      </section>
    </main>
  );
}
