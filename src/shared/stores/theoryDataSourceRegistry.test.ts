import { describe, expect, it, vi } from 'vitest';
import type { TheoryChapterMeta } from '@/shared/types/theoryDataSource';
import {
  getTheoryDataSource,
  registerTheoryDataSource,
  subscribeTheoryDataSource,
} from './theoryDataSourceRegistry';

/**
 * 理论学院数据源注册表契约（单元层，Node）。
 *
 * 锁定的行为：
 * - late registration 自愈：注册前订阅的调用方在注册完成时收到一次刷新通知
 * - 注册后订阅：桥接数据源 subscribe，取消订阅后不再回调
 * - 重复注册：替换数据源并重绑订阅（旧源通知不再转发）
 * progress 模块只依赖本注册表接口，因此这里的语义漂移会直接影响每日训练计划。
 */

function meta(chapterId: string): TheoryChapterMeta {
  return {
    chapterId,
    levelId: 't1',
    title: chapterId,
    titleKey: `theory.chapterTitle.${chapterId}`,
    route: `/theory/chapter/${chapterId}`,
    estimatedMinutes: 10,
  };
}

describe('theoryDataSourceRegistry', () => {
  it('注册前订阅：注册完成后立即收到一次通知（late registration 自愈）', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTheoryDataSource(listener);
    expect(listener).not.toHaveBeenCalled();
    expect(getTheoryDataSource()).toBeUndefined();

    registerTheoryDataSource({ findNextChapter: () => null });

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('注册后订阅：转发数据源 subscribe，取消订阅后不再回调', () => {
    let fireSource: (() => void) | undefined;
    registerTheoryDataSource({
      findNextChapter: () => null,
      subscribe: (listener) => {
        fireSource = listener;
        return () => {
          fireSource = undefined;
        };
      },
    });

    const listener = vi.fn();
    const unsubscribe = subscribeTheoryDataSource(listener);

    fireSource?.();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    fireSource?.();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('重复注册替换数据源并重绑订阅：查询取最新实现，旧源解绑', () => {
    const first: { fire?: () => void } = {};
    registerTheoryDataSource({
      findNextChapter: () => null,
      subscribe: (listener) => {
        first.fire = listener;
        return () => {
          first.fire = undefined;
        };
      },
    });

    const second: { fire?: () => void } = {};
    registerTheoryDataSource({
      findNextChapter: () => meta('t1-outs'),
      subscribe: (listener) => {
        second.fire = listener;
        return () => {
          second.fire = undefined;
        };
      },
    });

    expect(getTheoryDataSource()?.findNextChapter([])?.chapterId).toBe('t1-outs');
    // 旧数据源已被解绑，不再向注册表转发
    expect(first.fire).toBeUndefined();

    const listener = vi.fn();
    const unsubscribe = subscribeTheoryDataSource(listener);
    second.fire?.();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
