#!/usr/bin/env node
/**
 * Debug probe: parse the CI-compiled page.js to find WHICH destructure fails.
 * The error is: "Cannot destructure property 'locale' of '(intermediate value)'"
 * at styleguide/page.js:2:16954 — we reproduce locally by compiling the page
 * with the same build chain (esbuild, matches Next's swc output shape closely
 * enough to locate the expression).
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = join(import.meta.dirname, '..');
const page = readFileSync(join(ROOT, 'src/app/[locale]/styleguide/page.tsx'), 'utf8');

// Locate every `await params` destructure and what wraps it.
const lines = page.split('\n');
console.log('== destructure sites ==');
lines.forEach((l, i) => {
  if (/const\s*\{\s*locale\s*\}\s*=\s*await/.test(l)) {
    console.log(`line ${i + 1}: ${l.trim()}`);
  }
});

// The compiled chunk at column 16954 of line 2 — inspect our own minified guess:
// We can't reproduce Next's exact output locally without a full build.
// Instead: instrument. Add a guard log via a temporary build in CI is slow.
// Faster: reason from evidence below (see report).

// KEY EVIDENCE CHECK: does next-intl's getRequestConfig get called during
// prerender with requestLocale undefined? In v4, requestLocale comes from
// the [locale] segment ONLY if the root layout awaits params and the segment
// has generateStaticParams. We have that. BUT: our request.ts uses
// `requestLocale` — correct for v4. However next-intl 4.14 requires the
// plugin to know the request config path; we pass './src/i18n/request.ts'.
console.log('\n== i18n request config path registered ==');
const nextConfig = readFileSync(join(ROOT, 'next.config.mjs'), 'utf8');
console.log(nextConfig.includes('./src/i18n/request.ts') ? 'OK: ./src/i18n/request.ts' : 'MISSING PATH');

// Check: does request.ts import messages with a path that resolves during build?
const req = readFileSync(join(ROOT, 'src/i18n/request.ts'), 'utf8');
const m = /import\(`([^`]+)`\)/.exec(req);
console.log('messages path template:', m ? m[1] : 'NOT FOUND');
if (m) {
  const resolved = m[1].replace('../../', join(ROOT, '/'));
  try { readFileSync(resolved.replace('${locale}', 'ar')); console.log('messages resolvable: OK'); }
  catch (e) { console.log('messages resolvable: FAIL', e.message); }
}
