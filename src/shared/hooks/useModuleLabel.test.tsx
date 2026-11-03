/**
 * useModuleLabel 契约：模块标识 → 本地化显示名。
 * 优先级：MODULE_LABEL_KEYS 的 i18n key → MODULE_LABELS_FALLBACK 中文兜底 → 原样返回 moduleId。
 * 最后一个分支是「未知模块不显示空白」的护栏（统计页/仪表盘会遍历历史记录里的模块名）。
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { useModuleLabel } from './useModuleLabel';
import {
  MODULE_LABEL_KEYS,
  MODULE_LABELS_FALLBACK,
} from '@/shared/constants/moduleLabels';

const FALLBACK_ONLY_ID = '__fallback-only-module__';

describe('useModuleLabel', () => {
  afterEach(() => {
    delete (MODULE_LABELS_FALLBACK as Record<string, string>)[FALLBACK_ONLY_ID];
    cleanup();
  });

  it('已注册模块返回 zh 本地化显示名', () => {
    const { result } = renderHook(() => useModuleLabel());
    const labelOf = result.current;

    expect(labelOf('range-trainer')).toBe('手牌范围训练');
    expect(labelOf('strategy-academy')).toBe('策略学院');
    expect(labelOf('puzzle-trainer')).toBe('扑克谜题');
  });

  it('全部注册模块都能解析为真实文案（不是回退成 key）', () => {
    const { result } = renderHook(() => useModuleLabel());
    const labelOf = result.current;

    const unresolved = Object.entries(MODULE_LABEL_KEYS)
      .map(([moduleId, key]) => ({ moduleId, key, label: labelOf(moduleId) }))
      .filter(({ key, label }) => label === key || label.trim() === '');

    expect(Object.keys(MODULE_LABEL_KEYS).length).toBeGreaterThan(0);
    expect(unresolved).toEqual([]);
  });

  it('无 i18n key 但有中文兜底名时使用兜底名', () => {
    (MODULE_LABELS_FALLBACK as Record<string, string>)[FALLBACK_ONLY_ID] = '历史模块';
    const { result } = renderHook(() => useModuleLabel());

    expect(result.current(FALLBACK_ONLY_ID)).toBe('历史模块');
  });

  it('完全未知的模块原样返回 moduleId（不显示空白）', () => {
    const { result } = renderHook(() => useModuleLabel());

    expect(result.current('legacy-unknown-module')).toBe('legacy-unknown-module');
    expect(result.current('')).toBe('');
  });
});
