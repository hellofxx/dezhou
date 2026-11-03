import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { useTheoryLevel } from './useTheoryLevel';

/**
 * 章节页按 Level 懒加载契约（jsdom）。
 * - 已缓存：同步返回 Level（章节间切换不闪骨架）
 * - 未缓存：先返回 undefined（骨架），解析后返回 Level
 * - 加载失败 / Level 不存在：返回 null（调用方回目录）
 * - levelId 变化：不等旧任务，先回骨架再给新 Level
 * - levelId 为空：直接 null，不触发加载
 *
 * 懒加载边界（data/levels/loaders）被打桩以强制缓存未命中，真实数据仍由原实现提供。
 */

const control = vi.hoisted(() => ({ misses: 0, fail: false, calls: [] as string[] }));

vi.mock('../data/levels/loaders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/levels/loaders')>();
  return {
    ...actual,
    getLoadedTheoryLevel: (levelId: string) => {
      if (control.misses > 0) {
        control.misses -= 1;
        return undefined;
      }
      return actual.getLoadedTheoryLevel(levelId);
    },
    loadTheoryLevelById: (levelId: string) => {
      control.calls.push(levelId);
      if (control.fail) return Promise.reject(new Error('chunk 加载失败'));
      return actual.loadTheoryLevelById(levelId);
    },
  };
});

beforeEach(() => {
  control.misses = 0;
  control.fail = false;
  control.calls = [];
});

afterEach(() => {
  cleanup();
});

describe('useTheoryLevel', () => {
  it('已缓存时同步返回 Level，不触发加载', () => {
    const { result } = renderHook(() => useTheoryLevel('t2'));

    expect(result.current?.id).toBe('t2');
    expect(result.current?.chapters.length ?? 0).toBeGreaterThan(0);
    expect(control.calls).toEqual([]);
  });

  it('未缓存时先返回 undefined，加载完成后返回该 Level', async () => {
    control.misses = 99;
    const { result } = renderHook(() => useTheoryLevel('t3'));
    expect(result.current).toBeUndefined();

    await waitFor(() => {
      expect(result.current).not.toBeUndefined();
    });
    expect(result.current?.id).toBe('t3');
    expect(control.calls).toEqual(['t3']);
  });

  it('挂载期间缓存已就绪时走 effect 缓存分支，不发起加载', () => {
    // 首帧两次查询（初始 state + 渲染末尾）强制未命中，effect 内的查询命中
    control.misses = 2;
    const { result } = renderHook(() => useTheoryLevel('t4'));

    expect(result.current?.id).toBe('t4');
    expect(control.calls).toEqual([]);
    expect(control.misses).toBe(0);
  });

  it('加载失败返回 null（调用方回目录）', async () => {
    control.misses = 99;
    control.fail = true;
    const { result } = renderHook(() => useTheoryLevel('t2'));
    expect(result.current).toBeUndefined();

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it('Level 不存在时返回 null', async () => {
    control.misses = 99;
    const { result } = renderHook(() => useTheoryLevel('t99'));

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
    expect(control.calls).toEqual(['t99']);
  });

  it('切换 Level 时不返回上一个 Level 的数据', async () => {
    control.misses = 99;
    const { result, rerender } = renderHook(({ levelId }) => useTheoryLevel(levelId), {
      initialProps: { levelId: 't2' },
    });
    await waitFor(() => {
      expect(result.current?.id).toBe('t2');
    });

    rerender({ levelId: 't5' });
    expect(result.current).toBeUndefined();

    await waitFor(() => {
      expect(result.current?.id).toBe('t5');
    });
    expect(control.calls).toEqual(['t2', 't5']);
  });

  it('levelId 为空时返回 null 且不触发加载', () => {
    const { result } = renderHook(() => useTheoryLevel(undefined));

    expect(result.current).toBeNull();
    expect(control.calls).toEqual([]);
  });
});
