/**
 * AND MORE — font configuration (§3B rule 6 + §5B locked set).
 *
 * Locked four families:
 *   - Amiri                (Arabic headings, 24px+)      subsets: arabic, latin
 *   - IBM Plex Sans Arabic (Arabic body + UI)            subsets: arabic, latin
 *   - Source Serif 4       (English headings)            subsets: latin
 *   - Source Sans 3        (English body + UI)           subsets: latin
 *
 * Subset allowlist (validated by check-next-conventions.mjs):
 *   Amiri                -> ['arabic', 'latin']
 *   IBM_Plex_Sans_Arabic -> ['arabic', 'latin']
 *   Source_Serif_4       -> ['latin']
 *   Source_Sans_3        -> ['latin']
 */
import { Amiri, IBM_Plex_Sans_Arabic, Source_Serif_4, Source_Sans_3 } from 'next/font/google';

export const fontAmiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-heading-ar',
  display: 'swap',
});

export const fontPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body-ar',
  display: 'swap',
});

export const fontSourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-heading-en',
  display: 'swap',
});

export const fontSourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body-en',
  display: 'swap',
});
