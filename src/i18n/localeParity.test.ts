import { describe, expect, it } from 'vitest';
import zh from './locales/zh.json';
import en from './locales/en.json';

/**
 * i18n 双语对称冒烟测试（AGENTS.md 硬性要求）：
 * 新增 i18n key 必须同时更新 zh 与 en，任一侧缺键即失败。
 */
function flattenKeys(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix];
  return Object.entries(node).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key)
  );
}

describe('i18n locale parity (zh ↔ en)', () => {
  it('zh.json 与 en.json 的扁平化键集合完全一致', () => {
    const zhKeys = new Set(flattenKeys(zh));
    const enKeys = new Set(flattenKeys(en));
    const onlyInZh = [...zhKeys].filter((k) => !enKeys.has(k));
    const onlyInEn = [...enKeys].filter((k) => !zhKeys.has(k));
    // 失败信息直接列出缺失键，便于定位
    expect({ onlyInZh, onlyInEn }).toEqual({ onlyInZh: [], onlyInEn: [] });
  });
});
