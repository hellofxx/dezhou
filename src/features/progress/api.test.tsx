import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { useProgressState, progressCommands } from './api';

describe('progress 读模型 hook', () => {
  beforeEach(() => {
    vi.resetModules();
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('返回声明字段的当前值', () => {
    const { result } = renderHook(() =>
      useProgressState((state) => state.settings.language),
    );
    expect(result.current).toBe('zh');
  });

  it('命令更新后重新渲染读取新值', () => {
    const { result, rerender } = renderHook(() =>
      useProgressState((state) => state.mentorStyle),
    );
    const before = result.current;
    progressCommands.setMentorStyle(before === 'strict-math' ? 'encouraging' : 'strict-math');
    rerender();
    expect(result.current).not.toBe(before);
  });
});
