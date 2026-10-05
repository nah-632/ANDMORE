import type { Config } from 'tailwindcss';

/**
 * AND MORE — design tokens (§5B locked decisions).
 * Color values sampled from the owner's official logo assets
 * (scripts/sample-brand-colors.py, 2026-10-05):
 *   navy  #082748  (lockup dominant dark)
 *   blue  #114E8B  (lockup mid blue)
 *   gold  #D5A66A  (lockup warm accent — THE accent per §5B)
 *   teal  #5C9C9D  (supporting tone only)
 *   paper #FAF9F5  (warm off-white)
 *   ink   #0F192B  (graphite text)
 *   line  #E4E1D8  (warm hairline)
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F192B',
        navy: '#082748',
        blue: '#114E8B',
        gold: '#D5A66A',
        teal: '#5C9C9D',
        paper: '#FAF9F5',
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
