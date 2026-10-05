import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/en/styleguide', '/ar/styleguide', '/admin', '/dashboard'],
      },
    ],
  };
}
