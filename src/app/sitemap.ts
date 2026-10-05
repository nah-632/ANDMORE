import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://andmore.onrender.com';
  const pages = ['', '/about', '/how', '/subjects', '/find', '/volunteer', '/impact', '/safety', '/contact'];
  return ['ar', 'en'].flatMap((locale) =>
    pages.map((p) => ({
      url: `${base}/${locale}${p}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : 0.7,
      alternates: {
        languages: {
          ar: `${base}/ar${p}`,
          en: `${base}/en${p}`,
        },
      },
    }))
  );
}
