import { describe, expect, it } from 'vitest';

/**
 * i18n 静态 key 引用守卫（补 localeParity「双方都缺 key」盲区）。
 *
 * localeParity.test.ts 只兜底 zh↔en 单边缺失；contentI18n.test.ts 只覆盖课程内容 key。
 * 若代码 t('some.key') 引用了某个 key 但 zh 与 en 双方都未定义，上述两测试均无法发现。
 *
 * 本守卫静态扫描全部业务源码中 t('字面量') / t("字面量") / t(`字面量`)（无插值）
 * 与 i18n.t / i18next.t 调用，断言每个引用的 key 在 zh 与 en 词典均存在。
 * 提取前剥离注释，避免注释中的占位符（如 t('a.b.c')）误报。
 *
 * 已知盲区（无法静态提取，需人工维护）：动态拼接 key（模板插值 / 变量 / 字符串拼接）。
 */

// 通过 Vite raw glob 载入全部业务源码（.test 与 i18n 基础设施在下方过滤）。
// 本测试位于 src/i18n/，故用 ../ 上溯至 src/ 根，与 designTokenGuard（src/ 根）覆盖范围一致。
const SOURCE_FILES = import.meta.glob<string>('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const zhModules = import.meta.glob<Record<string, unknown>>('./locales/zh/*.json', {
  import: 'default',
  eager: true,
});
const enModules = import.meta.glob<Record<string, unknown>>('./locales/en/*.json', {
  import: 'default',
  eager: true,
});
const zhCourseModules = import.meta.glob<Record<string, unknown>>(
  './locales/zh/academy-course/*.json',
  { import: 'default', eager: true },
);
const enCourseModules = import.meta.glob<Record<string, unknown>>(
  './locales/en/academy-course/*.json',
  { import: 'default', eager: true },
);

function flattenKeys(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix];
  return Object.entries(node).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

/** 收集单语词典完整 key 集合（主模块文件加 <module> 前缀；academy-course 子目录加 academy 前缀） */
function collectDictionary(
  modules: Record<string, Record<string, unknown>>,
  courseModules: Record<string, Record<string, unknown>>,
): Set<string> {
  const keys = new Set<string>();
  for (const file of Object.keys(modules)) {
    const moduleName = file.split('/').pop()!.replace(/\.json$/, '');
    for (const key of flattenKeys(modules[file])) keys.add(`${moduleName}.${key}`);
  }
  for (const file of Object.keys(courseModules)) {
    for (const key of flattenKeys(courseModules[file])) keys.add(`academy.${key}`);
  }
  return keys;
}

/** 剥离注释（块注释 + 行注释），避免注释中的占位符 key 误报 */
function stripComments(content: string): string {
  const noBlock = content.replace(/\/\*[\s\S]*?\*\//g, ' ');
  return noBlock
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join('\n');
}

// t('..') / t("..") / t(`..`)（无插值），i18n.t / i18next.t；lookbehind 排除 obj.t / xxxT
const T_CALL_RE =
  /(?:(?<![.\w])t|i18n\.t|i18next\.t)\(\s*(?:'([^'\\]*)'|"([^"\\]*)"|`([^`$]*?)`)\s*[,)]/g;

function extractStaticKeys(content: string): string[] {
  const keys: string[] = [];
  T_CALL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = T_CALL_RE.exec(content)) !== null) {
    const key = m[1] ?? m[2] ?? m[3];
    if (key !== undefined && key.length > 0) keys.push(key);
  }
  return keys;
}

describe('i18n 静态 key 引用守卫（双方都缺 key 的盲区）', () => {
  it('扫描范围有效（应覆盖全部 src 源码文件）', () => {
    expect(Object.keys(SOURCE_FILES).length).toBeGreaterThan(100);
  });

  it('所有静态 t() 字面量 key 在 zh 与 en 词典均存在', () => {
    const zhKeys = collectDictionary(zhModules, zhCourseModules);
    const enKeys = collectDictionary(enModules, enCourseModules);

    const missing = new Set<string>();
    for (const [path, content] of Object.entries(SOURCE_FILES)) {
      // 排除测试文件自身与 i18n 基础设施（词典定义方，非业务消费方）
      if (/\.test\.(ts|tsx)$/.test(path) || path.startsWith('../i18n/')) continue;
      const cleaned = stripComments(content);
      for (const key of extractStaticKeys(cleaned)) {
        if (!zhKeys.has(key) || !enKeys.has(key)) missing.add(`${path} → ${key}`);
      }
    }
    expect([...missing]).toEqual([]);
  });
});
