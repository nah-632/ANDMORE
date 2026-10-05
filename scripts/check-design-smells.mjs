#!/usr/bin/env node
/**
 * §5B automated design guard (zero deps).
 * Fails on banned Tailwind classes, decorative animation, gradient text,
 * emoji inside headings, and banned copy phrases in messages/*.json.
 * Exceptions need an inline `design-ok: reason` comment on the same line.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

const CONFIG = {
  bannedClasses: [
    'bg-gradient-', 'backdrop-blur', 'blur-2xl', 'blur-3xl',
    'shadow-xl', 'shadow-2xl', 'rounded-2xl', 'rounded-3xl',
    'animate-pulse', 'animate-bounce', 'animate-ping',
    'text-transparent', 'bg-clip-text',
  ],
  bannedCopy: {
    en: ['unlock your potential', 'empower', 'seamless', 'cutting-edge', 'leverage',
      "in today's fast-paced world", 'revolutionary', 'game-changing', 'next-generation'],
    ar: ['أطلق العنان', 'نقلة نوعية', 'رحلتك نحو', 'احتضن'],
  },
  bannedFontNames: ['inter', 'poppins', 'roboto', 'manrope', 'cairo', 'tajawal'],
};

let violations = 0;
const srcDir = join(ROOT, 'src');

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function fail(msg) { console.error(`DESIGN ${msg}`); violations++; }

// 1b) banned legacy palette hexes (ADR-0002: owner's official palette only)
const bannedHexes = ['#082748', '#114E8B', '#D5A66A', '#5C9C9D', '#FAF9F5', '#0F192B'];
for (const f of walk(srcDir).filter((f) => /\.(tsx|ts|css)$/.test(f))) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const h of bannedHexes) {
      if (line.toLowerCase().includes(h.toLowerCase()) && !line.includes('design-ok:')) {
        fail(`${relative(ROOT, f)}:${i + 1}: legacy palette hex "${h}" — use official palette (ADR-0002)`);
      }
    }
  });
}

// 1) banned classes / fonts in TSX/TS source
for (const f of walk(srcDir).filter((f) => /\.(tsx|ts)$/.test(f))) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const c of CONFIG.bannedClasses) {
      if (line.includes(c) && !line.includes('design-ok:')) {
        fail(`${relative(ROOT, f)}:${i + 1}: banned class "${c}" — ${line.trim().slice(0, 80)}`);
      }
    }
    const lower = line.toLowerCase();
    for (const fam of CONFIG.bannedFontNames) {
      if (new RegExp(`[\'\"]${fam}[\'\"]`, 'i').test(lower) && !f.endsWith('design-guard.config.json')) {
        fail(`${relative(ROOT, f)}:${i + 1}: banned font family "${fam}"`);
      }
    }
  });
}

// 2) emoji inside heading JSX tags (<h1..h4 ...>…emoji…</h1..h4>)
const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
for (const f of walk(srcDir).filter((f) => f.endsWith('.tsx'))) {
  const src = readFileSync(f, 'utf8');
  const headingRe = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/g;
  let m;
  while ((m = headingRe.exec(src)) !== null) {
    const inner = m[1];
    const lineNo = src.slice(0, m.index).split('\n').length;
    if (emojiRe.test(inner) && !inner.includes('design-ok:')) {
      fail(`${relative(ROOT, f)}:${lineNo}: emoji inside heading`);
    }
  }
}

// 3) banned copy phrases in message catalogs and content files
for (const locale of ['ar', 'en']) {
  const file = join(ROOT, 'messages', `${locale}.json`);
  try {
    const text = readFileSync(file, 'utf8').toLowerCase();
    for (const phrase of CONFIG.bannedCopy[locale]) {
      if (text.includes(phrase.toLowerCase())) {
        fail(`messages/${locale}.json: banned phrase "${phrase}"`);
      }
    }
  } catch { /* file may not exist yet in later phases */ }
}

if (violations) {
  console.error(`\ncheck-design-smells FAILED (${violations} violation(s)). Add "design-ok: reason" inline to keep a deliberate exception.`);
  process.exit(1);
}
console.log('check-design-smells PASSED');
