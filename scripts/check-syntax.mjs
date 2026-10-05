#!/usr/bin/env node
/**
 * §3B: what plain Node CAN verify locally — node --check for .mjs/.js,
 * JSON validity, and simple structural checks. TS/TSX correctness is CI's job.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
let errors = 0;

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'andmore-v1-archive'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT);
for (const f of files) {
  if (f.endsWith('.mjs') || f.endsWith('.js')) {
    try {
      execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
    } catch (e) {
      console.error(`SYNTAX ${relative(ROOT, f)}: ${e.stderr.toString().trim()}`);
      errors++;
    }
  }
  if (f.endsWith('.json')) {
    try {
      JSON.parse(readFileSync(f, 'utf8'));
    } catch (e) {
      console.error(`JSON ${relative(ROOT, f)}: ${e.message}`);
      errors++;
    }
  }
}

// Structural: every page.tsx under src/app must export default.
for (const f of files) {
  if (f.includes(`${join('src', 'app')}`) && f.endsWith('page.tsx')) {
    const src = readFileSync(f, 'utf8');
    if (!/export\s+default/.test(src)) {
      console.error(`STRUCTURE ${relative(ROOT, f)}: no default export`);
      errors++;
    }
  }
}

if (errors) {
  console.error(`\ncheck-syntax FAILED (${errors} error(s))`);
  process.exit(1);
}
console.log('check-syntax PASSED');
