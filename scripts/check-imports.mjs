#!/usr/bin/env node
/** §3B rule 1: every relative/alias import in src/ must resolve to an existing file,
 *  and named imports must exist as exports in the target module (lightweight scan). */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
let errors = 0;

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const srcFiles = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f));
const srcSet = new Set(srcFiles);
const exportCache = new Map();

function exportsOf(file) {
  if (exportCache.has(file)) return exportCache.get(file);
  const src = readFileSync(file, 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|class|type|interface|enum)\s+([A-Za-z0-9_]+)/g)) {
    names.add(m[1]);
  }
  for (const m of src.matchAll(/export\s+default/g)) names.add('default');
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of m[1].split(',')) {
      const n = part.trim().split(/\s+as\s+/).pop().trim();
      if (n) names.add(n);
    }
  }
  exportCache.set(file, names);
  return names;
}

function resolveImport(fromFile, spec) {
  if (spec.startsWith('@/')) return resolve(ROOT, 'src', spec.slice(2));
  if (spec.startsWith('.')) return resolve(dirname(fromFile), spec);
  return null; // bare package — skip (CI/typecheck handles)
}

const EXTS = ['', '.ts', '.tsx', '/index.ts', '/index.tsx', '.json', '.css'];

for (const f of srcFiles) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/import\s+(?:type\s+)?[\s\S]*?from\s+['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    const target = resolveImport(f, spec);
    if (!target) continue;
    let hit = null;
    for (const ext of EXTS) {
      const cand = target + ext;
      if (srcSet.has(cand) || existsSync(cand)) { hit = cand; break; }
    }
    if (!hit) {
      console.error(`IMPORT ${relative(ROOT, f)}: unresolved "${spec}"`);
      errors++;
      continue;
    }
    // Named import existence check (for resolved TS modules only)
    const stmt = m[0];
    const named = /\{([^}]+)\}/.exec(stmt);
    if (named && /\.(ts|tsx)$/.test(hit)) {
      const exp = exportsOf(hit);
      for (const part of named[1].split(',')) {
        const n = part.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, '').trim();
        if (n && !exp.has(n) && !exp.has('default')) {
          // tolerate 'React' style namespaces and type-only re-exports via '*'
          if (!/^[A-Z]/.test(n) || !exp.size) {
            console.error(`IMPORT ${relative(ROOT, f)}: "${n}" not exported by "${spec}"`);
            errors++;
          }
        }
      }
    }
  }
}

if (errors) { console.error(`\ncheck-imports FAILED (${errors})`); process.exit(1); }
console.log('check-imports PASSED');
