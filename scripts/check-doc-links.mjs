#!/usr/bin/env node
// 文档门禁：本地链接、内联路径、锚点、新鲜度、pnpm 脚本、孤儿文档、索引覆盖与状态声明。
// 历史记录（docs/CHANGELOG.md）的断链与内联路径只告警，不阻断；
// 若存在归档 / 快照目录（docs/history、docs/changelog、docs/architecture、docs/adr），只校验链接，不校验内联路径。
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const LOG = '[docs:check]';
const SKIP_DIRS = new Set([
  'node_modules', 'dist', '.git', '.archive', '.qoder', '.trae', '.codebuddy',
  'coverage', 'coverage-unit', 'coverage-component', 'coverage-tmp', '.solomd',
]);
const HISTORICAL_PREFIXES = ['docs/history/', 'docs/changelog/'];
const INLINE_PATH_SKIP_PREFIXES = ['docs/history/', 'docs/changelog/', 'docs/architecture/', 'docs/adr/'];
const INLINE_PATH_ROOTS = ['src/', 'docs/', 'scripts/', 'e2e/', 'public/', '.github/', '.git-hooks/', 'poker-ui-demo/'];
const ROOT_FILES = new Set([
  'README.md', 'AGENTS.md', 'CLAUDE.md', 'claude.md', 'DESIGN.md', 'CONTRIBUTING.md',
  'SECURITY.md', 'LICENSE', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json',
  'tsconfig.e2e.json', 'vite.config.ts', 'vitest.config.ts', 'playwright.config.ts',
  'eslint.config.js', 'components.json', '.nvmrc', '.gitattributes', '.gitignore',
]);
const IGNORED_INLINE_PATH_PREFIXES = [
  '.qoder/', '.archive/', '.claude/', '.codebuddy/', '.codegraph/', '.solomd/',
  '.visual-check/', '.impeccable/', 'node_modules/', 'dist/', 'coverage',
  'playwright-report/', 'test-results/', '.playwright/',
];
const FILE_EXTENSIONS = new Set([
  '.md', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.yml',
  '.yaml', '.html', '.dot', '.dsl', '.txt', '.csv', '.jpg', '.jpeg', '.png',
  '.svg', '.ps1', '.sh',
]);
const PNPM_BUILTINS = new Set([
  'install', 'add', 'remove', 'rm', 'update', 'up', 'exec', 'dlx', 'create', 'init',
  'import', 'link', 'unlink', 'list', 'ls', 'outdated', 'publish', 'pack', 'patch',
  'prune', 'rebuild', 'root', 'store', 'why', 'licenses', 'audit', 'config', 'help',
]);
const PNPM_BINARIES = new Set(['tsc', 'eslint', 'vitest', 'vite', 'playwright', 'node', 'pwsh', 'prettier']);
const ANCHOR_STRICT = true;

const textCache = new Map();
const toPosix = (p) => p.split(sep).join('/');
const isHistorical = (file) =>
  file === 'docs/CHANGELOG.md' || HISTORICAL_PREFIXES.some((prefix) => file.startsWith(prefix));

function readText(file) {
  if (!textCache.has(file)) textCache.set(file, readFileSync(resolve(ROOT, file), 'utf8'));
  return textCache.get(file);
}

function gitMarkdownFiles() {
  const out = execFileSync('git', ['ls-files', '-z', '*.md'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  // 路径式提交（git commit -- <paths>）会用临时索引：索引里可能仍登记着已从工作区移走的文件，
  // 过滤掉缺失项，避免「部分暂存 + 重命名」时门禁以 ENOENT 误报失败。
  return out.split('\0').filter((file) => file && existsSync(resolve(ROOT, file)));
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

function scanMarkdown(file, visitor) {
  const lines = readText(file).split(/\r?\n/);
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
    visitor(line, i + 1);
  }
}

function collectLinks(file) {
  const links = [];
  scanMarkdown(file, (line, lineNumber) => {
    const cleaned = line.replace(/`[^`]*`/g, '').replace(/<!--.*?-->/g, '');
    const re = /\[[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = re.exec(cleaned)) !== null) {
      links.push({ line: lineNumber, raw: match[1].trim() });
    }
  });
  return links;
}

function collectInlineCode(file) {
  const tokens = [];
  scanMarkdown(file, (line, lineNumber) => {
    const cleaned = line.replace(/<!--.*?-->/g, '');
    const re = /`([^`\n]+)`/g;
    let match;
    while ((match = re.exec(cleaned)) !== null) {
      tokens.push({ line: lineNumber, raw: match[1].trim() });
    }
  });
  return tokens;
}

function markdownHeadings(file) {
  const headings = [];
  scanMarkdown(file, (line) => {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (match) headings.push(match[2]);
  });
  return headings;
}

function slugify(text) {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

function anchorSet(file) {
  const seen = new Map();
  const anchors = new Set();
  for (const heading of markdownHeadings(file)) {
    const base = slugify(heading);
    if (!base) continue;
    const count = seen.get(base) ?? 0;
    anchors.add(count === 0 ? base : `${base}-${count}`);
    seen.set(base, count + 1);
  }
  return anchors;
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
  const text = readText(file);
  if (!pattern.test(text)) {
    errors.push(`${file}: 缺少状态声明（期望 ${pattern.source}）`);
  }
}

function isGovernedDoc(file) {
  return (
    file === 'README.md' ||
    file === 'AGENTS.md' ||
    file === 'DESIGN.md' ||
    file === 'CLAUDE.md' ||
    file === 'claude.md' ||
    file === 'CONTRIBUTING.md' ||
    file === 'SECURITY.md' ||
    file.startsWith('docs/') ||
    file.startsWith('.github/') ||
    (file.startsWith('src/') && (file.endsWith('/AGENTS.md') || file === 'src/guards/README.md'))
  );
}

function parseInlinePath(raw) {
  let token = raw.trim();
  if (!token) return null;
  if (/^(https?:|mailto:|tel:|data:|#)/i.test(token)) return null;
  if (/[<>{}*|?"'`\s]/.test(token)) return null;
  if (token.includes('...')) return null;
  token = token.replace(/^\.\//, '');
  if (token.startsWith('/')) token = token.slice(1);
  if (IGNORED_INLINE_PATH_PREFIXES.some((prefix) => token.startsWith(prefix))) return null;
  const isRepoPath = INLINE_PATH_ROOTS.some((prefix) => token.startsWith(prefix));
  if (!isRepoPath && !ROOT_FILES.has(token)) return null;
  const hash = token.indexOf('#');
  if (hash >= 0) token = token.slice(0, hash);
  const query = token.indexOf('?');
  if (query >= 0) token = token.slice(0, query);
  token = token.replace(/:\d+(?:-\d+)?$/, '');
  token = token.replace(/[),.;:]+$/, '');
  if (!token) return null;
  const hasExtension = FILE_EXTENSIONS.has(extname(token).toLowerCase());
  const isDirectory = token.endsWith('/');
  if (!hasExtension && !isDirectory) return null;
  return token;
}

function checkLinks(files, errors, warnings) {
  let linkCount = 0;
  for (const file of files) {
    for (const { line, raw } of collectLinks(file)) {
      const target = parseTarget(raw);
      if (!target) continue;
      linkCount += 1;
      const resolved = resolveTarget(file, target);
      if (!resolved || existsSync(resolved.resolved)) continue;
      const message = `${file}:${line}: 断链 -> ${raw}`;
      if (isHistorical(file)) warnings.push(message);
      else errors.push(message);
    }
  }
  return linkCount;
}

function checkIndexCoverage(files, errors) {
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

  return { rootDocs, dirReadmes };
}

function checkStatuses(rootDocs, dirReadmes, errors) {
  for (const doc of rootDocs.filter((item) => item !== 'docs/CHANGELOG.md')) {
    expectStatus(doc, /状态：Current/, errors);
  }
  expectStatus('docs/CHANGELOG.md', /状态：Historical/, errors);
  for (const doc of dirReadmes) {
    expectStatus(doc, /状态：(Current|Generated|Snapshot|Historical)/, errors);
  }
}

function checkInlinePaths(files, errors) {
  let checked = 0;
  for (const file of files) {
    if (!isGovernedDoc(file) || isHistorical(file)) continue;
    if (INLINE_PATH_SKIP_PREFIXES.some((prefix) => file.startsWith(prefix))) {
      continue;
    }
    for (const { line, raw } of collectInlineCode(file)) {
      const token = parseInlinePath(raw);
      if (!token) continue;
      checked += 1;
      const resolved = resolve(ROOT, token);
      if (existsSync(resolved)) continue;
      errors.push(`${file}:${line}: 内联路径不存在 -> ${raw}`);
    }
  }
  return checked;
}

function checkPnpmScripts(files, errors) {
  const scripts = JSON.parse(readText('package.json')).scripts ?? {};
  for (const file of files) {
    if (!isGovernedDoc(file) || isHistorical(file)) continue;
    for (const { line, raw } of collectInlineCode(file)) {
      const re = /\bpnpm(?:\s+run)?\s+([a-zA-Z0-9:_-]+)/g;
      let match;
      while ((match = re.exec(raw)) !== null) {
        const name = match[1];
        if (PNPM_BUILTINS.has(name) || PNPM_BINARIES.has(name)) continue;
        if (Object.hasOwn(scripts, name)) continue;
        errors.push(`${file}:${line}: pnpm 脚本不存在 -> ${name}`);
      }
    }
  }
}

function parseAnchorTarget(file, raw) {
  if (!raw || /^(https?:|mailto:|tel:|data:|\/\/)/i.test(raw)) return null;
  let target = raw.split(/\s+/)[0];
  if (!target) return null;
  const hashIndex = target.indexOf('#');
  if (hashIndex < 0) return null;
  const hash = target.slice(hashIndex + 1);
  if (!hash) return null;
  const pathPart = target.slice(0, hashIndex);
  if (pathPart && /[<>{}]/.test(pathPart)) return null;
  if (!pathPart) return { file, hash };
  if (!/\.md$/i.test(pathPart)) return null;
  const resolved = resolveTarget(file, pathPart);
  if (!resolved) return null;
  return { file: resolved.rel, hash };
}

function checkAnchors(files, errors, warnings) {
  let checked = 0;
  for (const file of files) {
    if (!isGovernedDoc(file) || isHistorical(file)) continue;
    for (const { line, raw } of collectLinks(file)) {
      const target = parseAnchorTarget(file, raw);
      if (!target) continue;
      if (!existsSync(resolve(ROOT, target.file))) continue;
      if (!target.file.endsWith('.md')) continue;
      checked += 1;
      let hash = target.hash;
      try {
        hash = decodeURIComponent(hash);
      } catch {
        // 保留原值
      }
      if (anchorSet(target.file).has(hash)) continue;
      const message = `${file}:${line}: 锚点不存在 -> ${raw}`;
      if (ANCHOR_STRICT) errors.push(message);
      else warnings.push(message);
    }
  }
  return checked;
}

function lastCommitDate(file) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function checkFreshness(files, warnings) {
  for (const file of files) {
    if (isHistorical(file) || !isGovernedDoc(file)) continue;
    const header = readText(file).split(/\r?\n/).slice(0, 8).join('\n');
    const match = header.match(/(?:最后复核|最后更新)：\s*(\d{4}-\d{2}-\d{2})/);
    if (!match) continue;
    const committed = lastCommitDate(file);
    if (!committed) continue;
    if (match[1] < committed) {
      warnings.push(`${file}: 文档头日期 ${match[1]} 早于最后提交 ${committed}，请复核后更新`);
    }
  }
}

function checkOrphans(files, warnings) {
  const docsFiles = files.filter(
    (file) => file.startsWith('docs/') && file.endsWith('.md') && !isHistorical(file),
  );
  const readmes = docsFiles.filter((file) => basename(file) === 'README.md');
  const linked = new Set();
  for (const readme of readmes) {
    for (const { raw } of collectLinks(readme)) {
      const target = parseTarget(raw);
      if (!target) continue;
      const resolved = resolveTarget(readme, target);
      if (resolved && resolved.rel.endsWith('.md')) linked.add(resolved.rel);
    }
  }
  for (const doc of docsFiles) {
    if (basename(doc) === 'README.md') continue;
    if (linked.has(doc)) continue;
    warnings.push(`${doc}: 未登记到任何 README（孤儿文档）`);
  }
}

function main() {
  const files = [...new Set([...gitMarkdownFiles(), ...walkMarkdown('docs')])].sort();
  const errors = [];
  const warnings = [];

  const linkCount = checkLinks(files, errors, warnings);
  const { rootDocs, dirReadmes } = checkIndexCoverage(files, errors);
  checkStatuses(rootDocs, dirReadmes, errors);
  const inlinePathCount = checkInlinePaths(files, errors);
  checkPnpmScripts(files, errors);
  const anchorCount = checkAnchors(files, errors, warnings);
  checkFreshness(files, warnings);
  checkOrphans(files, warnings);

  if (warnings.length > 0) {
    console.warn(`${LOG} 告警（不阻断，共 ${warnings.length} 项）：`);
    for (const warning of warnings) console.warn(`  - ${warning}`);
  }

  if (errors.length > 0) {
    console.error(`${LOG} 未通过，共 ${errors.length} 项：`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(
    `${LOG} 通过：${files.length} 个 Markdown，${linkCount} 个本地链接，` +
      `${inlinePathCount} 个内联路径，${anchorCount} 个锚点，` +
      `${rootDocs.length} 份根文档 + ${dirReadmes.length} 份目录索引，状态声明齐全。` +
      `${warnings.length > 0 ? ` 另有 ${warnings.length} 项告警。` : ''}`,
  );
}

main();