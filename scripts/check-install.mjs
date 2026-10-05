#!/usr/bin/env node
/** §3B rule 9: verify node_modules exists and key packages resolve.
 *  Warning locally (no lockfile/install guarantee on the phone), error in CI. */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const isCI = Boolean(process.env.CI);
const nm = join(ROOT, 'node_modules');

if (!existsSync(nm)) {
  const msg = 'check-install: node_modules missing — install deps or rely on CI.';
  if (isCI) { console.error(msg); process.exit(1); }
  console.warn(`WARN ${msg}`);
  process.exit(0);
}

const keyPkgs = ['next', 'react', '@supabase/supabase-js', 'next-intl', 'zod', 'typescript'];
let missing = 0;
for (const p of keyPkgs) {
  if (!existsSync(join(nm, p))) {
    console.error(`check-install: package not resolvable: ${p}`);
    missing++;
  }
}
if (missing && isCI) process.exit(1);
if (missing) { console.warn('WARN check-install: some packages missing (local only)'); process.exit(0); }
console.log('check-install PASSED');
