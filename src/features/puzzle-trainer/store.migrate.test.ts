import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub, buildPersistPayload } from '@/shared/utils/localStorageStub';

/**
 * puzzle-trainer store persist migrate 冒烟测试（v1 → v2）。
 * 通过预置旧版本 localStorage 数据触发 rehydrate 验证迁移。
 */
describe('puzzle-trainer store migrate (v1 → v2)', () => {
  it('v1 数据缺失 quickDrillBest 时注入 null，已有字段不被触碰', async () => {
    const storageStub = createLocalStorageStub({
      'puzzle-trainer-store': buildPersistPayload(
        {
          rushBest: null,
          dailyBest: null,
          themeBest: {},
          dailyCompleted: { '2024-01-15': true },
          history: [],
        },
        1
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { usePuzzleStore, getBestRecord } = await import('./store');
    const state = usePuzzleStore.getState();

    // v2: 注入 quickDrillBest 默认值
    expect(state.quickDrillBest).toBeNull();
    // 已有字段不被触碰
    expect(state.dailyCompleted).toEqual({ '2024-01-15': true });

    // 顺带验证导出纯函数 getBestRecord
    expect(getBestRecord(state, 'rush')).toBeNull();
    expect(getBestRecord(state, 'theme')).toBeNull();
  });
});
