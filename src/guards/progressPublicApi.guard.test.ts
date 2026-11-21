/**
 * progress 公共入口守卫（深引禁令）。
 *
 * 背景：progress 是跨模块状态中枢，但它同时是完整的页面/组件/store 模块。
 * 一旦外部模块深引 `store` / `components/*` / `utils/*` / `types` / `data/*`，
 * 公共入口（index / api / ui）就失去收敛意义：任何内部重构都会外溢成跨模块破坏，
 * 装配点也会被复制到各 feature（重复订阅、重复下标、重复 bootstrap）。
 *
 * 规则（AGENTS.md §跨模块复用契约）：
 * - 生产代码只允许 `@/features/progress`（index）、`/api`、`/api.types`、`/ui`；
 * - 精确装配例外仅两处：
 *   1) `src/main.tsx` 的 `@/features/progress/store.bootstrap`（启动引导只能由入口触发）；
 *   2) `src/app/routes.tsx` 的页面 lazy import（`components/**` 仅允许出现在 lazyPage 的 import() 里）；
 * - 扫描面排除 `src/features/progress/**` 自身、所有测试文件、`src/test-utils/**`；
 *   `tests/` 与根 `e2e/` 不参与（不在 src 下）。
 *
 * 解析能力单源：去注释与路径解析（`@/` 别名 / 相对路径 / index barrel）复用
 * `@/test-utils/admissionGraph`，本守卫不引入第三套解析器；specifier 提取沿用该模块的
 * 同一组 import 正则口径（该模块未导出正则常量，故按位镜像，解析仍走单源）。
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isTestPath,
  normalizePath,
  resolveSpecifier,
  stripComments,
} from '@/test-utils/admissionGraph';

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));
const REPO_ROOT = path.resolve(SRC_DIR, '..');

const PROGRESS_PREFIX = 'src/features/progress/';
/** 公共入口（含其依赖的 api.types / ui）：外部只允许触达这四个文件 */
const PUBLIC_MODULES = new Set([
  'src/features/progress/index.ts',
  'src/features/progress/api.ts',
  'src/features/progress/api.types.ts',
  'src/features/progress/ui.ts',
  'src/features/progress/sessionLimit.ts',
]);
/** 别名形式的公共子路径（解析失败时用于兜底判定，避免"文件不存在"绕过守卫） */
const PUBLIC_SUBPATHS = new Set(['api', 'api.types', 'ui', 'sessionLimit']);
const ALIAS_PREFIX = '@/features/progress/';
const LAZY_ROUTE_FILE = 'src/app/routes.tsx';

/** 精确装配例外：逐条登记理由，条目失效（目标文件消失 / 不再被引用）时由自检变红 */
const ASSEMBLY_EXCEPTIONS: ReadonlyArray<{ file: string; target: string; reason: string }> = [
  {
    file: 'src/main.tsx',
    target: 'src/features/progress/store.bootstrap.ts',
    reason: '应用启动引导（hydration 等待 + 事件总线订阅 + 成就 debounce）只能由入口装配层触发',
  },
];

/** 扫描面下限（棘轮，防止路径失效后空洞通过） */
const MIN_SCANNED_FILES = 200;

interface ImportHit {
  specifier: string;
  index: number;
  dynamic: boolean;
}

const STATIC_IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT_RE = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

/** 收集 src 下全部 .ts/.tsx（repo-root 相对 posix 路径，排除 .d.ts） */
function walk(dirPath: string, collected: string[] = []): string[] {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(full, collected);
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      collected.push(toPosix(path.relative(REPO_ROOT, full)));
    }
  }
  return collected;
}

const ALL_FILES = walk(SRC_DIR);
const FILE_SET = new Set(ALL_FILES);

function isScanned(file: string): boolean {
  if (!file.startsWith('src/')) return false;
  if (isTestPath(file)) return false;
  if (file.startsWith(PROGRESS_PREFIX)) return false;
  if (file.startsWith('src/test-utils/')) return false;
  return true;
}

const SCANNED_FILES = ALL_FILES.filter(isScanned);

function extractImports(source: string): ImportHit[] {
  const hits: ImportHit[] = [];
  let match: RegExpExecArray | null;

  STATIC_IMPORT_RE.lastIndex = 0;
  while ((match = STATIC_IMPORT_RE.exec(source))) {
    hits.push({ specifier: match[1]!, index: match.index, dynamic: false });
  }
  DYNAMIC_IMPORT_RE.lastIndex = 0;
  while ((match = DYNAMIC_IMPORT_RE.exec(source))) {
    hits.push({ specifier: match[1]!, index: match.index, dynamic: true });
  }
  return hits;
}

/** 命中的 progress 内部目标（null = 允许：非 progress 或公共入口） */
function forbiddenTarget(file: string, specifier: string): string | null {
  const resolved = resolveSpecifier(file, specifier, FILE_SET, 'src');
  if (resolved) {
    if (!resolved.startsWith(PROGRESS_PREFIX)) return null;
    return PUBLIC_MODULES.has(resolved) ? null : resolved;
  }
  // 无法解析（目录 / 拼写错误 / 尚未创建）：回落到别名前缀判定，禁止借此绕过
  if (!specifier.startsWith(ALIAS_PREFIX)) return null;
  const subPath = specifier.slice(ALIAS_PREFIX.length);
  return PUBLIC_SUBPATHS.has(subPath) ? null : `${PROGRESS_PREFIX}${subPath}`;
}

function lineAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function lineTextAt(source: string, index: number): string {
  const start = source.lastIndexOf('\n', index) + 1;
  const end = source.indexOf('\n', index);
  return source.slice(start, end === -1 ? source.length : end);
}

function exceptionReason(file: string, hit: ImportHit, target: string, source: string): string | null {
  const registered = ASSEMBLY_EXCEPTIONS.find(
    (entry) => entry.file === file && entry.target === target,
  );
  if (registered) return registered.reason;

  const isRouteComponentImport =
    file === LAZY_ROUTE_FILE &&
    hit.dynamic &&
    target.startsWith(`${PROGRESS_PREFIX}components/`) &&
    /lazyPage(?:WithFeature)?\(/.test(lineTextAt(source, hit.index));
  return isRouteComponentImport ? '路由页面懒加载（lazyPage 的 import()）' : null;
}

/** 单文件深引清单：`file:line → 目标`（纯函数，便于用合成用例自检正则未失效） */
function collectViolations(file: string, rawSource: string): string[] {
  const source = stripComments(rawSource);
  const violations: string[] = [];

  for (const hit of extractImports(source)) {
    const target = forbiddenTarget(file, hit.specifier);
    if (!target) continue;
    if (exceptionReason(file, hit, target, source)) continue;
    violations.push(`${file}:${lineAt(source, hit.index)} → ${target}`);
  }
  return violations;
}

describe('progress 公共入口守卫（禁深引 store / components / utils / types / data）', () => {
  it('扫描面自检：覆盖 shell 与各 feature 生产代码', () => {
    expect(SCANNED_FILES.length).toBeGreaterThanOrEqual(MIN_SCANNED_FILES);
    expect(SCANNED_FILES).toContain('src/main.tsx');
    expect(SCANNED_FILES).toContain(LAZY_ROUTE_FILE);
    expect(SCANNED_FILES).toContain('src/layouts/BlankLayout.tsx');
    expect(
      SCANNED_FILES.filter((file) => file.startsWith('src/features/')).length,
    ).toBeGreaterThanOrEqual(100);
    expect(SCANNED_FILES.some((file) => file.startsWith(PROGRESS_PREFIX))).toBe(false);
    expect(SCANNED_FILES.some((file) => file.startsWith('src/test-utils/'))).toBe(false);
    expect(SCANNED_FILES.every((file) => !isTestPath(file))).toBe(true);
  });

  it('公共入口文件齐备（index / api / api.types / ui）', () => {
    for (const entry of PUBLIC_MODULES) {
      expect(FILE_SET.has(entry), `缺少 progress 公共入口：${entry}`).toBe(true);
    }
  });

  it('装配例外登记的目标真实存在', () => {
    for (const entry of ASSEMBLY_EXCEPTIONS) {
      expect(FILE_SET.has(entry.target), `例外目标不存在：${entry.target}`).toBe(true);
      expect(SCANNED_FILES, `例外来源未被扫描：${entry.file}`).toContain(entry.file);
    }
  });

  it('判定逻辑自检：公共入口放行、内部实现拦截、两处装配例外生效', () => {
    const consumer = 'src/features/range-trainer/utils/demo.ts';

    expect(collectViolations(consumer, "import { progressCommands } from '@/features/progress/api';")).toEqual([]);
    expect(collectViolations(consumer, "import { composeDailyMix } from '@/features/progress';")).toEqual([]);
    expect(collectViolations(consumer, "import { useSessionLimitReached } from '@/features/progress/ui';")).toEqual([]);
    expect(collectViolations(consumer, "import type { ProgressReadModel } from '@/features/progress/api.types';")).toEqual([]);

    expect(collectViolations(consumer, "import { useProgressStore } from '@/features/progress/store';")).toEqual([
      `${consumer}:1 → src/features/progress/store.ts`,
    ]);
    expect(collectViolations(consumer, "import type { UserSettings } from '@/features/progress/types';")).toEqual([
      `${consumer}:1 → src/features/progress/types.ts`,
    ]);
    expect(collectViolations(consumer, "import { calculateElo } from '@/features/progress/utils/elo';")).toEqual([
      `${consumer}:1 → src/features/progress/utils/elo.ts`,
    ]);
    expect(collectViolations(consumer, "import x from '@/features/progress/components/PersistErrorNotice';")).toEqual([
      `${consumer}:1 → src/features/progress/components/PersistErrorNotice.tsx`,
    ]);

    expect(
      collectViolations('src/main.tsx', "import { initProgressStore } from '@/features/progress/store.bootstrap';"),
    ).toEqual([]);
    expect(
      collectViolations(consumer, "import { initProgressStore } from '@/features/progress/store.bootstrap';"),
    ).toEqual([`${consumer}:1 → src/features/progress/store.bootstrap.ts`]);

    expect(
      collectViolations(
        LAZY_ROUTE_FILE,
        "const JourneyHome = lazyPage(() => import('@/features/progress/components/path/JourneyHome'), '/');",
      ),
    ).toEqual([]);
    expect(
      collectViolations(LAZY_ROUTE_FILE, "import JourneyHome from '@/features/progress/components/path/JourneyHome';"),
    ).toEqual([`${LAZY_ROUTE_FILE}:1 → src/features/progress/components/path/JourneyHome.tsx`]);
  });

  it('除公共入口与登记例外外，生产代码不深引 progress 内部实现', () => {
    const violations = SCANNED_FILES.flatMap((file) =>
      collectViolations(file, fs.readFileSync(path.join(REPO_ROOT, normalizePath(file)), 'utf8')),
    );

    expect(
      violations,
      [
        'progress 只经公共入口消费：`@/features/progress`（index）/ `/api` / `/api.types` / `/ui`。',
        '深引 store / components / utils / types / data 会让内部重构外溢成跨模块破坏；',
        '需要新能力时在 api.ts / ui.ts 增补导出，装配点只在 src/main.tsx 与 src/app/routes.tsx。',
        ...violations,
      ].join('\n'),
    ).toEqual([]);
  });
});
