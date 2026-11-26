import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 测试体系自身的不变式守卫。
 *
 * 规范源：docs/TDD.md §18；守卫清单源：src/guards/README.md。
 * 本文件保护“测试能否被收集、是否会被静默跳过、关键契约是否至少有一条测试”：
 * - 测试文件只使用 .test.ts / .test.tsx（.spec / __tests__ 不会被双项目收集）
 * - 禁止 focused / skipped / todo / expected-failure 测试
 * - 每个 feature 模块至少有一个测试文件
 * - 每个 persist store（任意含 persist( 的非测试源码）有 <store>.persist-shape 测试；version > 1 还有 <store>.migrate 测试
 * - src/guards 下的文件与 README 清单双向一致
 * - 根 e2e/ 的 Playwright 用例：非空发现、禁止 only/skip/fixme/预期失败、配置收集口径正确
 *
 * 扫描面自检是硬要求：路径解析失效时，数量下限断言必须先失败，禁止空洞通过。
 */

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));
const GUARDS_DIR = path.join(SRC_DIR, 'guards');
const GUARDS_README = path.join(GUARDS_DIR, 'README.md');
/** 仓库根（本文件位于 src/guards/，距根两层） */
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const E2E_DIR = path.join(REPO_ROOT, 'e2e');
const PLAYWRIGHT_CONFIG = path.join(REPO_ROOT, 'playwright.config.ts');

/** 最低测试文件数（棘轮下限，只增不减；防止 glob / 路径失效导致空洞通过） */
const MIN_TEST_FILES = 150;

/** 最低守卫文件数（同上） */
const MIN_GUARD_FILES = 5;

/** 最低 README 登记数（同上） */
const MIN_REGISTERED_GUARDS = 5;

/** 最低 E2E 用例文件数（同上；当前为训练闭环 + 离线冒烟） */
const MIN_E2E_TEST_FILES = 2;

type SourceFile = {
  absolutePath: string;
  relativePath: string;
  content: string;
};

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function walk(dirPath: string): string[] {
  const files: string[] = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function readSource(absolutePath: string): SourceFile {
  return {
    absolutePath,
    relativePath: toPosix(path.relative(SRC_DIR, absolutePath)),
    content: fs.readFileSync(absolutePath, 'utf8'),
  };
}

const ALL_SRC_FILES = walk(SRC_DIR);
const TEST_FILES = ALL_SRC_FILES
  .filter((file) => /\.test\.(ts|tsx)$/.test(file))
  .map(readSource);

/** Playwright 用例文件（根 e2e/，后缀 .test.ts；与 Vitest 双项目互不交叉） */
const E2E_TEST_FILES: SourceFile[] = fs.existsSync(E2E_DIR)
  ? walk(E2E_DIR)
      .filter((file) => file.endsWith('.test.ts'))
      .map((file) => ({
        absolutePath: file,
        relativePath: toPosix(path.relative(REPO_ROOT, file)),
        content: fs.readFileSync(file, 'utf8'),
      }))
  : [];

// 动态拼接标记，避免守卫自身源码命中自己的扫描
const FORBIDDEN_MARKERS = ['only', 'skip', 'todo', 'fails'].map((name) => `.${name}(`);
/** Playwright 的静默失效标记：聚焦 / 跳过 / 待办 / 预期失败 */
const E2E_FORBIDDEN_MARKERS = ['only', 'skip', 'fixme', 'fail'].map((name) => `.${name}(`);

describe('测试体系守卫（test system invariants）', () => {
  it('扫描自检：测试文件数量达到下限', () => {
    expect(TEST_FILES.length).toBeGreaterThanOrEqual(MIN_TEST_FILES);
  });

  it('测试文件只使用 .test.ts / .test.tsx，且不放在 __tests__ 目录', () => {
    const specFiles = ALL_SRC_FILES
      .filter((file) => /\.spec\.(ts|tsx)$/.test(file))
      .map((file) => toPosix(path.relative(SRC_DIR, file)));

    const testDirs = ALL_SRC_FILES
      .filter((file) => path.basename(path.dirname(file)) === '__tests__')
      .map((file) => toPosix(path.relative(SRC_DIR, file)));

    expect(specFiles, '使用 .spec.ts(x) 的文件不会被 Vitest 双项目收集').toEqual([]);
    expect(testDirs, '放在 __tests__ 目录的文件不会被 Vitest 双项目收集').toEqual([]);
  });

  it('测试文件不得包含 focused / skipped / todo / expected-failure 标记', () => {
    const violations: string[] = [];

    for (const file of TEST_FILES) {
      for (const marker of FORBIDDEN_MARKERS) {
        if (file.content.includes(marker)) {
          violations.push(`${file.relativePath} → ${marker}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('每个测试文件至少包含一个测试声明', () => {
    const emptyFiles = TEST_FILES
      .filter((file) => !/\b(?:it|test)(?:\.\w+)?\s*\(/.test(file.content))
      .map((file) => file.relativePath);

    expect(emptyFiles, '以下测试文件没有 it/test 声明，不会被 Vitest 执行').toEqual([]);
  });

  it('含 describe/it 声明的源码必须使用 .test.ts(x) 后缀，避免测试未被收集', () => {
    const uncollected = ALL_SRC_FILES
      .filter((file) => /\.tsx?$/.test(file) && !/\.test\.(ts|tsx)$/.test(file))
      .map(readSource)
      .filter((file) => /\bdescribe\s*\(/.test(file.content) && /\bit\s*\(/.test(file.content))
      .map((file) => file.relativePath);

    expect(uncollected, '以下文件含测试声明但不会被 Vitest 双项目收集').toEqual([]);
  });

  it('每个 feature 模块至少有一个测试文件', () => {
    const featuresDir = path.join(SRC_DIR, 'features');
    const modules = fs
      .readdirSync(featuresDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    const covered = new Set(
      TEST_FILES.map((file) => file.relativePath.match(/^features\/([^/]+)\//)?.[1]).filter(
        (name): name is string => Boolean(name),
      ),
    );

    const missing = modules.filter((name) => !covered.has(name));
    expect(missing, '以下 feature 模块没有任何测试文件').toEqual([]);
  });

  it('每个 persist store 有 persist-shape 测试；version > 1 还有 migrate 测试', () => {
    const persistStores = ALL_SRC_FILES
      .filter((file) => /\.tsx?$/.test(file) && !/\.test\.(ts|tsx)$/.test(file))
      .map(readSource)
      .filter((file) => file.content.includes('persist('));

    const violations: string[] = [];

    for (const store of persistStores) {
      const dir = path.dirname(store.absolutePath);
      const baseName = path.basename(store.absolutePath, path.extname(store.absolutePath));
      const shapeTestName = `${baseName}.persist-shape.test.ts`;
      const migrateTestName = `${baseName}.migrate.test.ts`;
      const shapeTest = path.join(dir, shapeTestName);
      const migrateTest = path.join(dir, migrateTestName);

      if (!fs.existsSync(shapeTest)) {
        violations.push(`${store.relativePath}: 缺少 ${shapeTestName}`);
      }

      const version = Number(store.content.match(/version:\s*(\d+)/)?.[1] ?? 0);
      if (version > 1 && !fs.existsSync(migrateTest)) {
        violations.push(`${store.relativePath}: persist version v${version}，缺少 ${migrateTestName}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('src/guards 下的守卫文件与 README 清单双向一致', () => {
    const guardFiles = TEST_FILES.filter((file) => file.relativePath.startsWith('guards/')).map(
      (file) => path.basename(file.absolutePath),
    );
    expect(guardFiles.length).toBeGreaterThanOrEqual(MIN_GUARD_FILES);

    const readme = fs.readFileSync(GUARDS_README, 'utf8');
    const registered = readme
      .split('\n')
      .map((line) => line.match(/^\|\s*`([^`]+\.test\.tsx?)`\s*\|/)?.[1])
      .filter((name): name is string => Boolean(name));
    expect(registered.length).toBeGreaterThanOrEqual(MIN_REGISTERED_GUARDS);

    const missingInReadme = guardFiles.filter((name) => !registered.includes(name));
    const staleInReadme = registered.filter((name) => !guardFiles.includes(name));

    expect(missingInReadme, '以下守卫未登记到 src/guards/README.md').toEqual([]);
    expect(staleInReadme, 'README 登记了不存在的守卫文件').toEqual([]);
  });

  it('守卫层使用 Node 环境（.test.ts），不引入 jsdom 依赖', () => {
    const jsdomGuards = TEST_FILES.filter(
      (file) => file.relativePath.startsWith('guards/') && file.relativePath.endsWith('.test.tsx'),
    ).map((file) => file.relativePath);

    expect(jsdomGuards).toEqual([]);
  });
});

describe('E2E 体系守卫（Playwright）', () => {
  it('扫描自检：根 e2e/ 与 playwright.config.ts 存在，用例文件数达到下限', () => {
    expect(fs.existsSync(E2E_DIR), '缺少根 e2e/ 目录：Playwright 用例无处安放').toBe(true);
    expect(fs.existsSync(PLAYWRIGHT_CONFIG), '缺少 playwright.config.ts').toBe(true);
    expect(E2E_TEST_FILES.length).toBeGreaterThanOrEqual(MIN_E2E_TEST_FILES);
  });

  it('Playwright 配置只收集 e2e 下的 .test.ts，且禁止 only / 重试', () => {
    const config = fs.readFileSync(PLAYWRIGHT_CONFIG, 'utf8');
    const testDir = config.match(/testDir:\s*'([^']+)'/)?.[1];
    const testMatch = config.match(/testMatch:\s*'([^']+)'/)?.[1];

    expect(testDir, 'playwright.config.ts 必须用 testDir 限定收集目录').toBe('./e2e');
    expect(testMatch, 'playwright.config.ts 必须用 testMatch 限定用例后缀').toBe('**/*.test.ts');
    expect(config, 'forbidOnly 必须为 true（禁止 .only 静默缩小门禁）').toContain('forbidOnly: true');
    expect(config, 'retries 必须为 0（禁止用重试变绿）').toContain('retries: 0');
  });

  it('Playwright 用例不得包含 only / skip / fixme / expected-failure 标记', () => {
    const violations: string[] = [];

    for (const file of E2E_TEST_FILES) {
      for (const marker of E2E_FORBIDDEN_MARKERS) {
        if (file.content.includes(marker)) {
          violations.push(`${file.relativePath} → ${marker}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('每个 Playwright 用例文件至少包含一个 test 声明（非空发现）', () => {
    const emptyFiles = E2E_TEST_FILES
      .filter((file) => !/\btest(?:\.\w+)?\s*\(/.test(file.content))
      .map((file) => file.relativePath);

    expect(emptyFiles, '以下 E2E 文件没有 test 声明，Playwright 不会执行任何用例').toEqual([]);
  });

  it('E2E 用例不绕过 UI 直写持久层（禁 localStorage / IndexedDB 注入）', () => {
    const violations: string[] = [];

    for (const file of E2E_TEST_FILES) {
      for (const bypass of ['localStorage.setItem', 'indexedDB.open']) {
        if (file.content.includes(bypass)) {
          violations.push(`${file.relativePath} → ${bypass}`);
        }
      }
    }

    expect(violations, 'E2E 必须走真实 UI；绕过 store / 持久层会让门禁失去回归意义').toEqual([]);
  });
});
