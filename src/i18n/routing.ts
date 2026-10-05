import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale, type Locale } from './request';

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export type RouterLocale = Locale;
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
