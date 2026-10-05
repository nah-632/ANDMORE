#!/usr/bin/env node
/**
 * §3B rule 5: Next.js 15 conventions — params/searchParams/cookies()/headers()
 * must be awaited. Also validates lib/fonts.ts against the §5B locked allowlist.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
let errors = 0;
const fail = (m) => { console.error(`NEXT ${m}`); errors++; };

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// 1) await params / searchParams / cookies() / headers()
for (const f of walk(join(ROOT, 'src')).filter((f) => /\.(ts|tsx)$/.test(f))) {
  const src = readFileSync(f, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    // sync access patterns: params.something / searchParams.something without await
    if (/\bparams\s*\.\s*(?!map\b)\w/.test(line) && !/await|Promise|\.then|function|type\s|interface|extends|as\s+Promise/.test(line)) {
      // allow type-position lines and destructuring from awaited values
      const before = lines.slice(Math.max(0, i - 3), i).join(' ');
      if (!/await\s+params/.test(before) && !/^\s*(type|export type|\*)/.test(line) && !line.includes('*')) {
        if (!/:\s|interface|Props|=>|\{|type/.test(line)) {
          fail(`${relative(ROOT, f)}:${i + 1}: possible sync params access — "${line.trim().slice(0, 70)}"`);
        }
      }
    }
    if (/(?<!await\s)\bcookies\(\)|(?<!await\s)\bheaders\(\)/.test(line) && !/await/.test(line) && !line.includes('//') && !line.includes('*')) {
      if (/\breturn\b|\bconst\b|\blet\b|\bif\s*\(/.test(line)) {
        fail(`${relative(ROOT, f)}:${i + 1}: cookies()/headers() must be awaited — "${line.trim().slice(0, 70)}"`);
      }
    }
  });
}

// 2) font allowlist (§5B locked set only)
const FONTS_ALLOWLIST = {
  Amiri: ['arabic', 'latin'],
  IBM_Plex_Sans_Arabic: ['arabic', 'latin'],
  Source_Serif_4: ['latin'],
  Source_Sans_3: ['latin'],
};
const fontsPath = join(ROOT, 'src', 'lib', 'fonts.ts');
try {
  const src = readFileSync(fontsPath, 'utf8');
  for (const m of src.matchAll(/import\s+\{\s*([^}]+)\s*\}\s+from\s+'next\/font\/google'/g)) {
    for (const raw of m[1].split(',')) {
      const fam = raw.trim();
      if (fam && !(fam in FONTS_ALLOWLIST)) {
        fail(`fonts.ts: family "${fam}" not in §5B locked allowlist`);
      }
    }
  }
  // requested subsets must be within the allowlist for the family
  for (const fam of Object.keys(FONTS_ALLOWLIST)) {
    const blockRe = new RegExp(`const\\s+\\w+\\s*=\\s*${fam}\\(\\{([\\s\\S]*?)\\}\\)`);
    const block = blockRe.exec(src);
    if (!block) continue;
    const subsets = /subsets:\s*\[([^\]]*)\]/.exec(block[1]);
    if (subsets) {
      for (const s of subsets[1].split(',').map((x) => x.trim().replace(/['"]/g, ''))) {
        if (s && !FONTS_ALLOWLIST[fam].includes(s)) {
          fail(`fonts.ts: ${fam} requests subset "${s}" — not supported (allowlist: ${FONTS_ALLOWLIST[fam].join(', ')})`);
        }
      }
    }
  }
} catch {
  fail('fonts.ts missing or unreadable');
}

if (errors) { console.error(`\ncheck-next-conventions FAILED (${errors})`); process.exit(1); }
console.log('check-next-conventions PASSED');
