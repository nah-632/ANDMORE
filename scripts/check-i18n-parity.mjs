#!/usr/bin/env node
/** §6: fail if any i18n key exists in one locale but not the other. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const ar = JSON.parse(readFileSync(join(ROOT, 'messages', 'ar.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(ROOT, 'messages', 'en.json'), 'utf8'));

function keys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );
}

const arKeys = new Set(keys(ar));
const enKeys = new Set(keys(en));
const missingInEn = [...arKeys].filter((k) => !enKeys.has(k));
const missingInAr = [...enKeys].filter((k) => !arKeys.has(k));

let bad = false;
for (const k of missingInEn) { console.error(`i18n: key only in ar.json: ${k}`); bad = true; }
for (const k of missingInAr) { console.error(`i18n: key only in en.json: ${k}`); bad = true; }

if (bad) { console.error('\ncheck-i18n-parity FAILED'); process.exit(1); }
console.log(`check-i18n-parity PASSED (${arKeys.size} keys, ar/en parity)`);
