import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'f:/code/dezhou';
const SRC = path.join(ROOT, 'src');
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts')) {
      files.push(path.relative(ROOT, p).split(path.sep).join('/'));
    }
  }
}
walk(SRC);
const fileSet = new Set(files);
const isTest = (f) => /(?:\.test|\.spec)\.[jt]sx?$/.test(f);
const BACKSLASH = String.fromCharCode(92);

function strip(s) {
  let o = '', q = null, i = 0;
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (q) {
      o += c;
      if (c === BACKSLASH) { o += n ?? ''; i += 2; continue; }
      if (c === q) q = null;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { q = c; o += c; i++; continue; }
    if (c === '/' && n === '/') { while (i < s.length && s[i] !== '\n') { o += ' '; i++; } continue; }
    if (c === '/' && n === '*') {
      o += '  '; i += 2;
      while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) { o += s[i] === '\n' ? '\n' : ' '; i++; }
      if (i < s.length) { o += '  '; i += 2; }
      continue;
    }
    o += c; i++;
  }
  return o;
}

const STATIC = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const DYN = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolve(from, spec) {
  let base;
  if (spec.startsWith('@/')) base = 'src/' + spec.slice(2);
  else if (spec.startsWith('.')) base = path.posix.join(path.posix.dirname(from), spec);
  else return null;
  for (const c of [base, base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx']) {
    if (fileSet.has(c)) return c;
  }
  return null;
}

const edges = new Map();
for (const f of files) {
  const src = strip(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const specs = new Set();
  STATIC.lastIndex = 0; let m;
  while ((m = STATIC.exec(src))) specs.add(m[1]);
  DYN.lastIndex = 0;
  while ((m = DYN.exec(src))) specs.add(m[1]);
  const targets = [];
  for (const s of specs) { const r = resolve(f, s); if (r) targets.push(r); }
  edges.set(f, [...new Set(targets)]);
}

const reverse = new Map();
for (const [f, ts] of edges) for (const t of ts) {
  if (!reverse.has(t)) reverse.set(t, []);
  reverse.get(t).push(f);
}

const consumerId = (f) => {
  if (f.startsWith('src/shared/')) return null;
  const fm = /^src\/features\/([^/]+)\//.exec(f); if (fm) return 'feature:' + fm[1];
  if (f.startsWith('src/app/')) return 'shell:app';
  if (f.startsWith('src/layouts/')) return 'shell:layouts';
  if (f.startsWith('src/i18n/')) return 'shell:i18n';
  if (f === 'src/main.ts' || f === 'src/main.tsx' || f === 'src/App.tsx') return 'shell:main';
  const top = /^src\/([^/]+)\//.exec(f); return top ? 'shell:' + top[1] : null;
};

const memo = new Map(), visiting = new Set();
function collect(f) {
  if (memo.has(f)) return memo.get(f);
  if (visiting.has(f)) return { prod: [], test: [] };
  visiting.add(f);
  const prod = new Set(), test = new Set();
  for (const imp of reverse.get(f) ?? []) {
    if (isTest(imp)) { test.add('test'); continue; }
    if (imp.startsWith('src/shared/')) {
      const inner = collect(imp);
      inner.prod.forEach((x) => prod.add(x));
      inner.test.forEach((x) => test.add(x));
    } else {
      const id = consumerId(imp);
      if (id) prod.add(id);
    }
  }
  visiting.delete(f);
  const r = { prod: [...prod].sort(), test: [...test].sort() };
  memo.set(f, r); return r;
}

const sharedRuntime = files.filter(
  (f) => f.startsWith('src/shared/') && !isTest(f) && !/\/index\.tsx?$/.test(f),
);
const sharedTargets = files.filter((f) => f.startsWith('src/shared/') && !isTest(f));
const admission = {};
for (const f of sharedRuntime) admission[f] = collect(f);

const internal = [];
for (const f of sharedRuntime) {
  for (const t of edges.get(f) ?? []) {
    if (sharedRuntime.includes(t)) internal.push([f, t]);
  }
}
const projectToShared = [];
for (const f of files) {
  if (isTest(f)) continue;
  if (f.startsWith('src/shared/')) continue;
  for (const t of edges.get(f) ?? []) {
    if (sharedTargets.includes(t)) projectToShared.push([f, t]);
  }
}

const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
console.log(JSON.stringify({
  counts: {
    files: files.length,
    sharedRuntime: sharedRuntime.length,
    internalEdges: internal.length,
    projectToSharedEdges: projectToShared.length,
  },
  admission: sortObj(admission),
  internal,
  projectToShared,
}, null, 2));
