/**
 * persistStorage 单元测试（unit 项目，Node 环境）。
 *
 * persistStorage.createSafeStorage 在首次创建时读取 window.localStorage；
 * Node 环境没有 window，因此用 vi.hoisted 在模块求值前注入一个可控的
 * window.localStorage 桩（含 ok / quota / security / unavailable 四种行为模式），
 * 使存储包装层在真实调用中命中对应分支。
 *
 * 通知语义（P1 持久化切片）：
 * - 持续故障期间同一 reason 只通知一次；
 * - 一次成功写入即复位去重表并触发成功回调，之后的同类失败可再次通知。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => {
  const state = {
    mode: 'ok' as 'ok' | 'quota' | 'security' | 'unavailable',
    writes: [] as string[],
  };
  const ls = {
    getItem: (_key: string): string | null => {
      if (state.mode === 'unavailable') throw new Error('The operation is insecure');
      return null;
    },
    setItem: (_key: string, value: string): void => {
      if (state.mode === 'quota') {
        const err = new Error('QuotaExceededError: storage quota exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      }
      if (state.mode === 'security') {
        const err = new Error('The operation is insecure');
        err.name = 'SecurityError';
        throw err;
      }
      if (state.mode === 'unavailable') throw new Error('The operation is insecure');
      state.writes.push(value);
    },
    removeItem: (_key: string): void => {
      if (state.mode === 'unavailable') throw new Error('The operation is insecure');
    },
  };
  (globalThis as { window?: unknown }).window = { localStorage: ls };
  return { state, ls };
});

import {
  progressPersistStorage,
  setPersistFailureHandler,
  setPersistSuccessHandler,
  __resetPersistFailureDedup,
} from './persistStorage';

describe('persistStorage', () => {
  beforeEach(() => {
    fake.state.mode = 'ok';
    fake.state.writes = [];
    setPersistFailureHandler(null);
    setPersistSuccessHandler(null);
    __resetPersistFailureDedup();
  });

  it('createJSONStorage 包裹后不为 undefined（getStorage 恒返回有效对象）', () => {
    expect(progressPersistStorage).toBeDefined();
    expect(progressPersistStorage?.getItem).toBeInstanceOf(Function);
    expect(progressPersistStorage?.setItem).toBeInstanceOf(Function);
    expect(progressPersistStorage?.removeItem).toBeInstanceOf(Function);
  });

  it('正常写入路径仍落到 localStorage', () => {
    progressPersistStorage?.setItem('test-key', { state: { test: true }, version: 1 });

    expect(fake.state.writes).toHaveLength(1);
    const parsed = JSON.parse(fake.state.writes[0] as string);
    expect(parsed).toEqual({ state: { test: true }, version: 1 });
  });

  it('setItem 抛 QuotaExceededError 时不向外传播异常', () => {
    fake.state.mode = 'quota';
    expect(() => {
      progressPersistStorage?.setItem('quota-key', { state: { data: 1 } });
    }).not.toThrow();
    expect(fake.state.writes).toHaveLength(0);
  });

  it('写失败时 handler 收到 reason === "quota"', () => {
    const handler = vi.fn();
    setPersistFailureHandler(handler);
    fake.state.mode = 'quota';

    progressPersistStorage?.setItem('quota-key', { state: { data: 1 } });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'quota', at: expect.any(Number) }),
    );
  });

  it('同一 reason 只通知 handler 一次（持续故障去重）', () => {
    const handler = vi.fn();
    setPersistFailureHandler(handler);
    fake.state.mode = 'quota';

    progressPersistStorage?.setItem('quota-key-1', { state: { a: 1 } });
    progressPersistStorage?.setItem('quota-key-2', { state: { b: 2 } });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('写成功后通知成功回调；同类失败可再次通知（可重复通知）', () => {
    const failure = vi.fn();
    const success = vi.fn();
    setPersistFailureHandler(failure);
    setPersistSuccessHandler(success);

    fake.state.mode = 'quota';
    progressPersistStorage?.setItem('k1', { state: { a: 1 } });
    expect(failure).toHaveBeenCalledTimes(1);

    fake.state.mode = 'ok';
    progressPersistStorage?.setItem('k2', { state: { a: 2 } });
    expect(success).toHaveBeenCalledTimes(1);

    fake.state.mode = 'quota';
    progressPersistStorage?.setItem('k3', { state: { a: 3 } });
    expect(failure).toHaveBeenCalledTimes(2);
  });

  it('handler 设为 null 后不再触发通知', () => {
    const handler = vi.fn();
    setPersistFailureHandler(handler);
    fake.state.mode = 'quota';

    progressPersistStorage?.setItem('key-1', { state: { a: 1 } });
    expect(handler).toHaveBeenCalledTimes(1);

    setPersistFailureHandler(null);
    __resetPersistFailureDedup();
    progressPersistStorage?.setItem('key-2', { state: { b: 2 } });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('getItem 遇到 localStorage 不可用时返回 null 并通知 handler', () => {
    const handler = vi.fn();
    setPersistFailureHandler(handler);
    fake.state.mode = 'unavailable';

    const result = progressPersistStorage?.getItem('test-key');
    expect(result).toBeNull();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'unavailable', at: expect.any(Number) }),
    );
  });

  it('setItem 抛 SecurityError 时归类为 unavailable', () => {
    const handler = vi.fn();
    setPersistFailureHandler(handler);
    fake.state.mode = 'security';

    progressPersistStorage?.setItem('security-key', { state: { a: 1 } });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'unavailable' }),
    );
  });
});
