import { describe, expect, it } from 'vitest';
// 全量遍历的 key↔原文单源（与 contentAlignment.test.ts 共用，禁止两处各写一份遍历逻辑）
import { generateContentEntries, CONTENT_KEY_PREFIXES } from './contentKeyEntries';

/**
 * 课程内容 i18n 守卫（阶段三·全量断言）。
 *
 * 覆盖对象：渲染层 key 覆盖的课程内容 key 命名空间 ——
 * strategy-academy（academy.lessonContent / basicsContent / unitTitle / lessonQuiz /
 * lessonExample / lessonPractice / drill / opponentDrill / term / opponent）与
 * theory-academy（theory.content / quiz / chapterObjectives）。
 *
 * 双重视角：
 * 1. 双语对称：zh 与 en 的内容 key 集合完全对称（onlyZh / onlyEn = 0），
 *    即新增内容 key 必须同步双语，任一侧缺键即失败。
 * 2. 全量遍历：遍历全部课程数据（standard / short-deck / heads-up / localLessons /
 *    basics / terms / opponents / opponentDrill / theory 全变体），key 集合由
 *    contentKeyEntries.generateContentEntries() 单源产出，断言双语 JSON 均包含 ——
 *    兜底「数据有内容但漏注册 key 前缀」。
 *
 * 内容是否**陈旧**（locale 落后于数据原文）不在本文件职责内，见 contentAlignment.test.ts。
 */

const CONTENT_MODULES = ['academy', 'theory'] as const;

const zhModules = import.meta.glob<Record<string, unknown>>('./locales/zh/*.json', {
  import: 'default',
  eager: true,
});
const enModules = import.meta.glob<Record<string, unknown>>('./locales/en/*.json', {
  import: 'default',
  eager: true,
});

// 课程内容按 Level/变体拆分于 academy-course/ 子目录（对齐 data/lessons/variants 课程代码文件），
// 经 config.ts 的 import.meta.glob deep 合并注入 academy 命名空间 —— 守卫须同步遍历子目录。
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

function collectContentKeys(
  modules: Record<string, Record<string, unknown>>,
  courseModules: Record<string, Record<string, unknown>>,
): string[] {
  const keys: string[] = [];
  for (const file of Object.keys(modules)) {
    const moduleName = file.split('/').pop()!.replace(/\.json$/, '') as string;
    if (!(CONTENT_MODULES as readonly string[]).includes(moduleName)) continue;
    // 主文件（academy.json / theory.json）根对象即命名空间：flatten 结果须前置 module 前缀
    for (const key of flattenKeys(modules[file])) {
      const fullKey = `${moduleName}.${key}`;
      if (CONTENT_KEY_PREFIXES.some((p) => fullKey.startsWith(p))) keys.push(fullKey);
    }
  }
  // 课程子目录文件内部无 academy. 前缀（注入后才是完整 key），须前置补齐再判定
  for (const file of Object.keys(courseModules)) {
    for (const key of flattenKeys(courseModules[file])) {
      const fullKey = `academy.${key}`;
      if (CONTENT_KEY_PREFIXES.some((p) => fullKey.startsWith(p))) keys.push(fullKey);
    }
  }
  return keys;
}

const zhKeys = new Set(collectContentKeys(zhModules, zhCourseModules));
const enKeys = new Set(collectContentKeys(enModules, enCourseModules));

describe('课程内容 i18n key 双语对称（渲染层 key 覆盖）', () => {
  it('zh 与 en 的内容 key 集合完全一致（只加单语立即失败）', () => {
    const onlyInZh = [...zhKeys].filter((k) => !enKeys.has(k));
    const onlyInEn = [...enKeys].filter((k) => !zhKeys.has(k));
    expect({ onlyInZh, onlyInEn }).toEqual({ onlyInZh: [], onlyInEn: [] });
  });

  it('内容 key 命名空间前缀已登记（新增命名空间须同步 contentKeyEntries 清单）', () => {
    const unique = new Set(CONTENT_KEY_PREFIXES);
    expect(unique.size).toBe(CONTENT_KEY_PREFIXES.length);
    expect(CONTENT_KEY_PREFIXES.length).toBeGreaterThan(0);
  });

  it('全量遍历：课程数据推导的每个内容 key 在 zh 与 en 双语 JSON 中均存在', () => {
    const expectedKeys = [...generateContentEntries().keys()];

    const missingInZh = [...new Set(expectedKeys.filter((k) => !zhKeys.has(k)))];
    const missingInEn = [...new Set(expectedKeys.filter((k) => !enKeys.has(k)))];

    // 若数据含内容但任一语言 JSON 缺失 key，即为漏注册 —— 兜底内容 key 化遗漏。
    expect({
      expectedCount: expectedKeys.length,
      missingInZh: missingInZh.slice(0, 20),
      missingInZhCount: missingInZh.length,
      missingInEn: missingInEn.slice(0, 20),
      missingInEnCount: missingInEn.length,
    }).toEqual({
      expectedCount: expect.any(Number),
      missingInZh: [],
      missingInZhCount: 0,
      missingInEn: [],
      missingInEnCount: 0,
    });
    // 防「推导为空 → 三条断言集体空转」
    expect(expectedKeys.length).toBeGreaterThan(5000);
  });
});
