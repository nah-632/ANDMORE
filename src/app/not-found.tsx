import Link from 'next/link';

export default function NotFoundGlobal() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-5 text-center">
      <p className="font-heading text-7xl font-bold text-gold">404</p>
      <h1 className="mt-4 text-2xl font-bold">الصفحة غير موجودة — Page not found</h1>
      <Link href="/ar" className="mt-6 rounded border border-navy bg-navy px-5 py-3 font-semibold text-paper hover:bg-blue">
        الرئيسية / Home
      </Link>
    </main>
  );
}
