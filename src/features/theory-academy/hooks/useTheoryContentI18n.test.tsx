import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import i18n from '@/i18n/config';
import { findLevelSummaryById } from '../utils/theoryMeta';
import { useTheoryContentI18n } from './useTheoryContentI18n';

/**
 * 章节内容语言包就绪态契约（jsdom）。
 * - 空章节列表：视为就绪（无内容需求）
 * - zh：数据层原文即中文，立即就绪，内容包在后台注入
 * - en：等待该 level 内容包注入后才就绪（避免中文原文闪现）
 * - 已就绪的 level 同步返回 true，且不重复发起加载
 * - 请求的章节 id 去重且排序稳定，就绪判定不随调用方顺序变化
 * - 语言切换后按目标语言重新判定
 *
 * i18n 内容包加载属懒加载边界，此处打桩以控制「未就绪 → 注入完成」的时机；
 * 真实 JSON 加载由 i18n 层自身测试覆盖。
 */

const control = vi.hoisted(() => ({
  loaded: false,
  loads: [] as { ids: string[]; lng: string }[],
  resolve: null as null | (() => void),
}));

vi.mock('@/i18n/preload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/i18n/preload')>();
  return {
    ...actual,
    isTheoryContentLoaded: (): boolean => control.loaded,
    loadTheoryContentForChapters: (chapterIds: readonly string[], lng?: string) => {
      control.loads.push({ ids: [...chapterIds], lng: lng ?? 'unknown' });
      return new Promise<void>((resolve) => {
        control.resolve = () => {
          control.loaded = true;
          resolve();
        };
      });
    },
  };
});

function chapterIdsOf(levelId: string): string[] {
  const level = findLevelSummaryById(levelId);
  if (!level) throw new Error(`目录缺少 Level ${levelId}`);
  const ids = level.chapters.map((chapter) => chapter.id);
  if (ids.length < 2) throw new Error(`Level ${levelId} 章节不足两章`);
  return ids;
}

beforeEach(() => {
  control.loaded = false;
  control.loads = [];
  control.resolve = null;
});

afterEach(async () => {
  cleanup();
  if (i18n.language !== 'zh') await i18n.changeLanguage('zh');
});

describe('useTheoryContentI18n', () => {
  it('空章节列表视为就绪且不触发加载', () => {
    const { result } = renderHook(() => useTheoryContentI18n([]));

    expect(result.current).toBe(true);
    expect(control.loads).toHaveLength(0);
  });

  it('zh 环境立即就绪，同时后台加载内容包', () => {
    const ids = chapterIdsOf('t3');
    const { result } = renderHook(() => useTheoryContentI18n(ids));

    expect(result.current).toBe(true);
    expect(control.loads).toHaveLength(1);
    expect(control.loads[0]!.lng).toBe('zh');
  });

  it('en 环境先不就绪，内容包注入后就绪', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    const ids = chapterIdsOf('t3');
    const { result } = renderHook(() => useTheoryContentI18n(ids));

    expect(result.current).toBe(false);
    expect(control.loads).toHaveLength(1);
    expect(control.loads[0]!.lng).toBe('en');

    await act(async () => {
      control.resolve!();
    });
    expect(result.current).toBe(true);
  });

  it('已就绪的 level 同步返回 true 且不重复加载', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    control.loaded = true;

    const { result } = renderHook(() => useTheoryContentI18n(chapterIdsOf('t3')));

    expect(result.current).toBe(true);
    expect(control.loads).toHaveLength(0);
  });

  it('请求的章节 id 去重且排序稳定，顺序不影响就绪判定', async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    const ids = chapterIdsOf('t4');
    const first = renderHook(() => useTheoryContentI18n([ids[1]!, ids[0]!, ids[0]!]));

    expect(first.result.current).toBe(false);
    const requested = control.loads[0]!.ids;
    expect(requested).toEqual([...new Set(requested)]);
    expect(requested).toEqual(requested.toSorted());

    await act(async () => {
      control.resolve!();
    });
    expect(first.result.current).toBe(true);

    cleanup();
    const second = renderHook(() => useTheoryContentI18n([ids[0]!, ids[1]!]));
    expect(second.result.current).toBe(true);
    expect(control.loads).toHaveLength(1);
  });

  it('语言切换后按目标语言重新判定就绪', async () => {
    const ids = chapterIdsOf('t5');
    const { result } = renderHook(() => useTheoryContentI18n(ids));
    expect(result.current).toBe(true);

    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(result.current).toBe(false);

    await act(async () => {
      control.resolve!();
    });
    expect(result.current).toBe(true);

    await act(async () => {
      await i18n.changeLanguage('zh');
    });
    expect(result.current).toBe(true);
  });
});
