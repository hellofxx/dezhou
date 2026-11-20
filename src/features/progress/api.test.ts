import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

/**
 * progress 公共 API 契约：
 * - 只暴露显式读模型与业务命令，不泄露完整 store；
 * - 命令委托既有 action（不在 API 层复制业务规则）。
 */
describe('progress 公共 API', () => {
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

  it('不导出完整 store 或底层控制入口', async () => {
    const api = await import('./api');
    expect('useProgressStore' in api).toBe(false);
    expect('openDB' in api).toBe(false);
    expect('saveToStore' in api).toBe(false);
  });

  it('命令委托既有 action；读取快照反映最新状态', async () => {
    const api = await import('./api');
    const { useProgressStore } = await import('./store');

    api.progressCommands.updateSettings({ language: 'en' });
    expect(useProgressStore.getState().settings.language).toBe('en');

    api.progressCommands.setMentorStyle('encouraging');
    expect(useProgressStore.getState().mentorStyle).toBe('encouraging');

    api.progressCommands.switchActiveVariant('short-deck');
    expect(api.progressCommands.getActiveEloRating()).toEqual(
      useProgressStore.getState().eloByVariant['short-deck'],
    );

    expect(api.progressCommands.getStandardEloRating()).toEqual(
      useProgressStore.getState().eloByVariant.standard,
    );
    expect(typeof api.progressCommands.shouldDownshiftDifficulty()).toBe('boolean');
  });
});
