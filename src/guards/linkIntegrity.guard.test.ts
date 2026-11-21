/**
 * 静态链接完整性守卫。
 *
 * 目的：收编路由时曾出现「AcademyHome 工具九宫格指向已删路由」这类静默死链；
 * 路由快照测试只校验路由表本身，不校验页面里的链接目标。本守卫把
 * 「源码里的站内链接字面量」与 `src/app/routes.tsx` 的事实源对齐：
 *
 * - 未注册路径 → 失败；
 * - 使用旧重定向源（如 /range-trainer）→ 失败，除非仍在迁移 allowlist 中；
 * - 每个 redirect() 目标必须是已注册 canonical；
 * - 迁移 allowlist 只减不增，条目失效（已无使用）同样失败。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));
const ROOT = path.resolve(SRC_DIR, '..');
const ROUTES_FILE = path.join(SRC_DIR, 'app/routes.tsx');

const SCAN_ROOTS = ['features', 'layouts', 'shared', 'app'];
const SKIP_FILES = new Set(['app/routes.tsx', 'app/legacyRedirects.tsx']);

/** 静态资源 / 部署前缀，不是站内路由 */
const STATIC_PREFIXES = [
  '/assets/',
  '/fonts/',
  '/icons/',
  '/images/',
  '/dezhou/',
  '/manifest',
  '/favicon',
  '/apple-touch-icon',
  '/sw.js',
];

/**
 * 迁移期旧重定向源 allowlist（只减不增）。
 * 每项在对应 Wave 统一为 canonical 后删除；条目失效即守卫变红。
 */
const REDIRECT_SOURCE_ALLOWLIST: Record<string, string> = {
  '/academy/lesson': '旧课时深链；Wave 3 统一为 /lesson/:lessonId',
  '/academy/quick-drill': '旧速训入口；Wave 2 统一为 /quick',
  '/range-trainer': '旧模块根；Wave 1 统一为 /drill/range',
  '/pot-odds': '旧模块根；Wave 1 统一为 /drill/odds',
  '/puzzle': '旧模块根；Wave 1 统一为 /drill/puzzle',
};

interface RouteManifest {
  canonical: string[];
  redirectSources: Map<string, string>;
}

interface LinkHit {
  file: string;
  line: number;
  literal: string;
  target: string;
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function walk(dirPath: string, collected: string[] = []): string[] {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, collected);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      collected.push(fullPath);
    }
  }
  return collected;
}

function normalizePathname(value: string): string {
  const withoutQuery = value.split('?')[0]!.split('#')[0]!;
  const withWildcards = withoutQuery.replace(/\$\{[^}]*\}/g, '*');
  if (withWildcards === '/') return '/';
  return withWildcards.replace(/\/+$/, '');
}

function segments(value: string): string[] {
  return value.split('/').filter(Boolean);
}

/** 目标路径是否匹配 canonical 模式（:param 或 * 匹配任意单段） */
export function matchesRoute(target: string, pattern: string): boolean {
  if (target === pattern) return true;
  const targetParts = segments(target);
  const patternParts = segments(pattern);
  if (targetParts.length !== patternParts.length) return false;
  return patternParts.every(
    (part, index) => part.startsWith(':') || part === '*' || part === targetParts[index],
  );
}

/** 目标是否落在旧重定向源（精确 / 前缀 / 动态段模式） */
function matchesRedirectSource(target: string, source: string): boolean {
  return target === source || target.startsWith(`${source}/`) || matchesRoute(target, source);
}

function collectRouteManifest(source: string): RouteManifest {
  const canonical = new Set<string>();
  const redirectSources = new Map<string, string>();

  // canonical / legacy 路径：path: '...'
  for (const match of source.matchAll(/path:\s*'([^']+)'/g)) {
    canonical.add(`/${match[1]}`);
  }
  if (/index:\s*true/.test(source)) canonical.add('/');

  // redirect('...') 源 → 目标
  for (const match of source.matchAll(/path:\s*'([^']+)',\s*element:\s*redirect\('([^']+)'\)/g)) {
    const from = `/${match[1]}`;
    redirectSources.set(from, match[2]!);
    canonical.delete(from);
  }

  // LegacyLessonRedirect：同样属于旧重定向源
  if (source.includes('LegacyLessonRedirect')) {
    redirectSources.set('/academy/lesson/:lessonId', '/lesson/:lessonId');
    canonical.delete('/academy/lesson/:lessonId');
  }

  return { canonical: [...canonical].sort(), redirectSources };
}

const LINK_PATTERNS: RegExp[] = [
  /(?:to|href)\s*=\s*"([^"]*)"/g,
  /(?:to|href)\s*=\s*'([^']*)'/g,
  /(?:to|href)\s*=\s*\{\s*'([^']*)'\s*\}/g,
  /(?:to|href)\s*=\s*\{\s*`([^`]*)`\s*\}/g,
  /\bnavigate\s*\(\s*'([^']*)'/g,
  /\bnavigate\s*\(\s*"([^"]*)"/g,
  /\bnavigate\s*\(\s*`([^`]*)`/g,
  /\broute\s*:\s*'([^']*)'/g,
  /\broute\s*:\s*"([^"]*)"/g,
  /\bmodulePath\s*:\s*'([^']*)'/g,
  /\bmodulePath\s*:\s*"([^"]*)"/g,
];

function lineAt(source: string, index: number): number {
  return source.slice(0, index).split(/\r?\n/).length;
}

function isStaticOrExternal(literal: string): boolean {
  if (!literal.startsWith('/') || literal.startsWith('//')) return true;
  return STATIC_PREFIXES.some((prefix) => literal.startsWith(prefix));
}

function collectLinks(filePath: string): LinkHit[] {
  const source = fs.readFileSync(filePath, 'utf8');
  const relative = toPosix(path.relative(ROOT, filePath));
  const hits = new Map<string, LinkHit>();

  for (const pattern of LINK_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const literal = match[1];
      if (!literal || isStaticOrExternal(literal)) continue;
      const target = normalizePathname(literal);
      if (!target.startsWith('/') || target === '/') {
        if (target !== '/') continue;
      }
      const line = lineAt(source, match.index ?? 0);
      const key = `${relative}:${line}:${literal}`;
      if (!hits.has(key)) hits.set(key, { file: relative, line, literal, target });
    }
  }

  return [...hits.values()];
}

const routeSource = fs.readFileSync(ROUTES_FILE, 'utf8');
const manifest = collectRouteManifest(routeSource);
const scannedFiles = SCAN_ROOTS.flatMap((root) => walk(path.join(SRC_DIR, root)))
  .map((file) => toPosix(path.relative(ROOT, file)))
  .filter((file) => !SKIP_FILES.has(file))
  .sort();
const links = scannedFiles.flatMap((relative) => collectLinks(path.join(ROOT, relative)));

function matchesCanonical(target: string): boolean {
  return manifest.canonical.some((pattern) => matchesRoute(target, pattern));
}

function redirectSourceFor(target: string): string | undefined {
  return [...manifest.redirectSources.keys()].find((source) =>
    matchesRedirectSource(target, source),
  );
}

function allowlistPrefixFor(target: string): string | undefined {
  return Object.keys(REDIRECT_SOURCE_ALLOWLIST).find((prefix) =>
    matchesRedirectSource(target, prefix),
  );
}

const usedAllowlist = new Set<string>();
const violations: string[] = [];

for (const link of links) {
  if (matchesCanonical(link.target)) continue;

  const redirectSource = redirectSourceFor(link.target);
  if (redirectSource) {
    const prefix = allowlistPrefixFor(link.target);
    if (prefix) {
      usedAllowlist.add(prefix);
      continue;
    }
    violations.push(
      `${link.file}:${link.line} ${link.literal} → 使用旧重定向源 ${redirectSource}，请改 canonical`,
    );
    continue;
  }

  violations.push(`${link.file}:${link.line} ${link.literal} → 未注册路由`);
}

describe('静态链接完整性（路由表单源）', () => {
  it('扫描面自检：文件 / 路由 / 链接数量达到下限', () => {
    expect(scannedFiles.length).toBeGreaterThanOrEqual(300);
    expect(manifest.canonical.length).toBeGreaterThanOrEqual(40);
    expect(links.length).toBeGreaterThanOrEqual(100);

    // 哨兵：关键路由必须被解析到
    expect(manifest.canonical).toContain('/drill/range');
    expect(manifest.canonical).toContain('/quick');
    expect(manifest.canonical).toContain('/lesson/:lessonId');
    expect(links.some((link) => link.file.endsWith('DrillHub.tsx'))).toBe(true);
    expect(links.some((link) => link.file.endsWith('helpContent.ts'))).toBe(true);
  });

  it('所有 redirect() 目标都是已注册 canonical', () => {
    const bad: string[] = [];
    for (const [from, to] of manifest.redirectSources) {
      if (!matchesCanonical(to)) bad.push(`${from} → ${to}`);
    }
    expect(bad, `redirect 目标未注册：\n${bad.join('\n')}`).toEqual([]);
  });

  it('源码中的站内链接没有死链 / 未登记的旧重定向源', () => {
    expect(violations, `链接完整性问题：\n${violations.join('\n')}`).toEqual([]);
  });

  it('迁移 allowlist 只减不增：每个条目都必须仍被使用', () => {
    const stale = Object.keys(REDIRECT_SOURCE_ALLOWLIST).filter(
      (prefix) => !usedAllowlist.has(prefix),
    );
    expect(stale, `以下 allowlist 条目已无使用，请删除：\n${stale.join('\n')}`).toEqual([]);
  });

  it('匹配器自检：静态 / 动态 / 段数 / query 归一', () => {
    expect(matchesRoute('/academy/checkpoint/3', '/academy/checkpoint/:level')).toBe(true);
    expect(matchesRoute('/academy/checkpoint/3', '/academy/checkpoint')).toBe(false);
    expect(matchesRoute('/academy/checkpoint/3/edit', '/academy/checkpoint/:level')).toBe(false);
    expect(matchesRoute('/hand-history/abc', '/hand-history/:handId')).toBe(true);
    expect(matchesRoute('/drill/range', '/drill/range')).toBe(true);
    expect(normalizePathname('/x/${id}?a=1#h')).toBe('/x/*');
    expect(normalizePathname('/x/')).toBe('/x');
    expect(normalizePathname('/')).toBe('/');
  });
});
