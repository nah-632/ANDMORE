#!/usr/bin/env node
/**
 * AND MORE — light check runner (§3B).
 * Zero third-party dependencies: runs on bare Node, no node_modules required.
 * Wires: check-syntax, check-i18n-parity, check-design-smells, check-install (warn), check-imports, check-next-conventions.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const checks = [
  'check-syntax.mjs',
  'check-i18n-parity.mjs',
  'check-design-smells.mjs',
  'check-next-conventions.mjs',
  'check-imports.mjs',
  'check-install.mjs',
];

let failed = false;

// SQL migration hygiene (validate-sql.py, zero-dep python)
{
  const r = spawnSync('python3', [join(here, 'validate-sql.py')], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('[verify:light] FAILED: validate-sql.py'); failed = true; }
}

for (const check of checks) {
  const path = join(here, check);
  if (!existsSync(path)) {
    console.error(`[verify:light] MISSING check script: ${check}`);
    failed = true;
    continue;
  }
  const r = spawnSync(process.execPath, [path], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`[verify:light] FAILED: ${check}`);
    failed = true;
  }
}

if (failed) {
  console.error('\nverify:light FAILED — fix the issues above before build/deploy.');
  process.exit(1);
}
console.log('\nverify:light PASSED');
