#!/usr/bin/env node
// 文档门禁：本地链接有效性、Current 文档索引覆盖、历史文档索引覆盖、状态声明。
// 历史文档（docs/history/**、docs/changelog/**）的断链只告警，不阻断；history/README.md 作为索引仍严格校验。
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const LOG = '[docs:check]';
const SKIP_DIRS = new Set([
  'node_modules', 'dist', '.git', '.archive', '.qoder', '.trae', '.codebuddy',
  'coverage', 'coverage-unit', 'coverage-component', 'coverage-tmp', '.solomd',
]);
const HISTORICAL_PREFIXES = ['docs/history/', 'docs/changelog/'];

const toPosix = (p) => p.split(sep).join('/');
const isHistorical = (file) => HISTORICAL_PREFIXES.some((prefix) => file.startsWith(prefix));

function gitMarkdownFiles() {
  const out = execFileSync('git', ['ls-files', '-z', '*.md'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split('\0').filter(Boolean);
}

function walkMarkdown(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walkMarkdown(full, acc);
    } else if (entry.name.endsWith('.md')) {
      acc.push(toPosix(relative(ROOT, full)));
    }
  }
  return acc;
}

function collectLinks(file) {
  const text = readFileSync(resolve(ROOT, file), 'utf8');
  const lines = text.split(/\r?\n/);
  const links = [];
  let inFrontmatter = false;
  let inFence = false;
  let fence = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (i === 0 && line.trim() === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (line.trim() === '---') inFrontmatter = false;
      continue;
    }
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fence = fenceMatch[1];
      } else if (line.trim().startsWith(fence)) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    const cleaned = line.replace(/`[^`]*`/g, '').replace(/<!--.*?-->/g, '');
    const re = /\[[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = re.exec(cleaned)) !== null) {
      links.push({ line: i + 1, raw: match[1].trim() });
    }
  }
  return links;
}

function parseTarget(raw) {
  if (!raw || /^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(raw)) return null;
  if (/[<>{}]/.test(raw)) return null;
  let target = raw.split(/\s+/)[0];
  if (!target || target.startsWith('#')) return null;
  if (/^[a-zA-Z]:[\\/]/.test(target)) return null;
  const hash = target.indexOf('#');
  if (hash >= 0) target = target.slice(0, hash);
  const query = target.indexOf('?');
  if (query >= 0) target = target.slice(0, query);
  if (!target) return null;
  try {
    target = decodeURIComponent(target);
  } catch {
    // 保留原值，由存在性检查给出明确报错
  }
  return target;
}

function resolveTarget(file, target) {
  const base = dirname(resolve(ROOT, file));
  const resolved = target.startsWith('/') ? resolve(ROOT, target.slice(1)) : resolve(base, target);
  const rel = toPosix(relative(ROOT, resolved));
  if (rel.startsWith('..')) return null;
  return { resolved, rel };
}

function linkTargets(file) {
  const out = new Map();
  for (const { line, raw } of collectLinks(file)) {
    const target = parseTarget(raw);
    if (!target) continue;
    const resolved = resolveTarget(file, target);
    if (!resolved) continue;
    out.set(resolved.rel, { line, raw, resolved: resolved.resolved, rel: resolved.rel });
  }
  return out;
}

function expectStatus(file, pattern, errors) {
  const text = readFileSync(resolve(ROOT, file), 'utf8');
  if (!pattern.test(text)) {
    errors.push(`${file}: 缺少状态声明（期望 ${pattern.source}）`);
  }
}

function main() {
  const files = [...new Set([...gitMarkdownFiles(), ...walkMarkdown('docs')])].sort();
  const errors = [];
  const warnings = [];
  let linkCount = 0;

  for (const file of files) {
    for (const { line, raw } of collectLinks(file)) {
      const target = parseTarget(raw);
      if (!target) continue;
      linkCount += 1;
      const resolved = resolveTarget(file, target);
      if (!resolved || existsSync(resolved.resolved)) continue;
      const message = `${file}:${line}: 断链 -> ${raw}`;
      if (isHistorical(file) && file !== 'docs/history/README.md') warnings.push(message);
      else errors.push(message);
    }
  }

  const indexTargets = linkTargets('docs/README.md');
  const rootDocs = readdirSync(join(ROOT, 'docs'))
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .map((name) => `docs/${name}`);
  for (const doc of rootDocs) {
    if (!indexTargets.has(doc)) errors.push(`${doc}: 未登记到 docs/README.md`);
  }

  const dirReadmes = readdirSync(join(ROOT, 'docs'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `docs/${entry.name}/README.md`)
    .filter((file) => existsSync(resolve(ROOT, file)));
  for (const doc of dirReadmes) {
    if (!indexTargets.has(doc)) errors.push(`${doc}: 未登记到 docs/README.md`);
  }

  const historyIndex = linkTargets('docs/history/README.md');
  for (const file of files.filter((item) => item.startsWith('docs/history/') && item !== 'docs/history/README.md')) {
    if (!historyIndex.has(file)) errors.push(`${file}: 未登记到 docs/history/README.md`);
  }

  const adrIndex = linkTargets('docs/adr/README.md');
  for (const file of walkMarkdown('docs/adr').filter((item) => item !== 'docs/adr/README.md')) {
    if (!adrIndex.has(file)) errors.push(`${file}: 未登记到 docs/adr/README.md`);
    expectStatus(file, /状态：(Proposed|Accepted|Superseded|Deprecated)/, errors);
  }

  const howToIndex = linkTargets('docs/how-to/README.md');
  for (const file of walkMarkdown('docs/how-to').filter((item) => item !== 'docs/how-to/README.md')) {
    if (!howToIndex.has(file)) errors.push(`${file}: 未登记到 docs/how-to/README.md`);
  }

  for (const doc of rootDocs.filter((item) => item !== 'docs/CHANGELOG.md')) {
    expectStatus(doc, /状态：Current/, errors);
  }
  expectStatus('docs/CHANGELOG.md', /状态：Historical/, errors);
  for (const doc of dirReadmes) {
    expectStatus(doc, /状态：(Current|Snapshot|Historical)/, errors);
  }
  for (const file of walkMarkdown('docs/how-to').filter((item) => item !== 'docs/how-to/README.md')) {
    expectStatus(file, /状态：Current/, errors);
  }

  if (warnings.length > 0) {
    console.warn(`${LOG} 历史文档告警（不阻断）：`);
    for (const warning of warnings) console.warn(`  - ${warning}`);
  }

  if (errors.length > 0) {
    console.error(`${LOG} 未通过，共 ${errors.length} 项：`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(
    `${LOG} 通过：${files.length} 个 Markdown，${linkCount} 个本地链接，` +
      `${rootDocs.length} 份根文档 + ${dirReadmes.length} 份目录索引，状态声明齐全。`,
  );
}

main();
