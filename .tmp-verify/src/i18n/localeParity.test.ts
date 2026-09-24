import { describe, expect, it } from 'vitest';
import { ALL_MODULES, type I18nLanguage } from './moduleRegistry';

/**
 * i18n 双语对称冒烟测试（AGENTS.md 硬性要求）：
 * 新增 i18n key 必须同时更新 zh 与 en，任一侧缺键即失败。
 * 拆分为模块文件后按顶层 key 逐模块扫描，缺失键按模块精确报告。
 * 通过 import.meta.glob（eager）静态收集所有模块文件，无需 node fs/path。
 */

const zhModules = import.meta.glob<Record<string, unknown>>('./locales/zh/*.json', {
  import: 'default',
  eager: true,
});
const enModules = import.meta.glob<Record<string, unknown>>('./locales/en/*.json', {
  import: 'default',
  eager: true,
});

function moduleName(filePath: string): string {
  return filePath.split('/').pop()!.replace(/\.json$/, '');
}

function loadModule(lng: I18nLanguage, key: string): Record<string, unknown> {
  const modules = lng === 'zh' ? zhModules : enModules;
  const entry = Object.entries(modules).find(([p]) => p.endsWith(`/${key}.json`))?.[1];
  if (!entry) throw new Error(`缺失模块文件: ${lng}/${key}.json`);
  return entry;
}

function flattenKeys(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix];
  return Object.entries(node).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key)
  );
}

describe('i18n 模块文件完整性', () => {
  it('zh/ 与 en/ 下的文件集合均与 ALL_MODULES 完全一致（无缺失、无多余）', () => {
    for (const lng of ['zh', 'en'] as const) {
      const modules = lng === 'zh' ? zhModules : enModules;
      const files = Object.keys(modules).map(moduleName).sort();
      const expected = [...ALL_MODULES].sort();
      expect(files, `${lng}/ 文件集合应与注册表 ALL_MODULES 一致`).toEqual(expected);
    }
  });

  it('每个模块文件均为普通 JSON 对象（注入时包裹 { [key]: data }）', () => {
    for (const lng of ['zh', 'en'] as const) {
      for (const key of ALL_MODULES) {
        const node = loadModule(lng, key);
        expect(typeof node, `${lng}/${key}.json 应为 JSON 对象`).toBe('object');
        expect(Array.isArray(node), `${lng}/${key}.json 不应为数组`).toBe(false);
        // 避免与 translation 命名空间保留语义冲突
        expect('translation' in node, `${lng}/${key}.json 不应含 translation 顶层 key`).toBe(false);
      }
    }
  });
});

describe('i18n locale parity (zh ↔ en，逐模块)', () => {
  for (const key of ALL_MODULES) {
    it(`${key}.json 扁平化键集合 zh ↔ en 一致`, () => {
      const zhKeys = new Set(flattenKeys(loadModule('zh', key)));
      const enKeys = new Set(flattenKeys(loadModule('en', key)));
      const onlyInZh = [...zhKeys].filter((k) => !enKeys.has(k));
      const onlyInEn = [...enKeys].filter((k) => !zhKeys.has(k));
      // 失败信息直接列出缺失键，便于定位
      expect({ onlyInZh, onlyInEn }).toEqual({ onlyInZh: [], onlyInEn: [] });
    });
  }
});
