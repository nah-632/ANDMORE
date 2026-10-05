import type { Config } from 'tailwindcss';

/**
 * AND MORE — design tokens.
 *
 * UPDATE (ADR-0002, owner's official brand guide supersedes sampled values):
 *   navy  #102A56  Academic Navy (primary)
 *   blue  #2563EB  Primary Blue (CTAs, links)
 *   sky   #60A5FA  Light Blue (highlights, hover)
 *   sand  #D6B98A  Sand Beige (warm accent)
 *   terra #C96A3A  Terracotta (selective emphasis only)
 *   paper #FAFBFC  Pearl White (background)
 *   ink   #0F192B  graphite text
 *   line  #E4E1D8  hairline border
 * Fonts UNCHANGED (§5B locked four families) — owner directive #1.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F192B',
        navy: '#102A56',
        blue: '#2563EB',
        sky: '#60A5FA',
        sand: '#D6B98A',
        terra: '#C96A3A',
        paper: '#FAFBFC',
        line: '#E4E1D8',
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        float: '0 2px 10px rgba(15, 25, 43, 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
