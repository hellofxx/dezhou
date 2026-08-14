import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub, buildPersistPayload } from '@/shared/utils/localStorageStub';

/**
 * puzzle-trainer store persist migrate 冒烟测试（v2→v3：清理已迁出的 quickDrillBest）。
 * 通过预置旧版本 localStorage 数据触发 rehydrate 验证迁移。
 */
describe('puzzle-trainer store migrate (v2→v3, P2-02 cleanup)', () => {
  it('旧数据中的 quickDrillBest 在 v2→v3 migrate 中被清除', async () => {
    const storageStub = createLocalStorageStub({
      'puzzle-trainer-store': buildPersistPayload(
        {
          rushBest: null,
          dailyBest: null,
          themeBest: {},
          dailyCompleted: { '2024-01-15': true },
          history: [],
          quickDrillBest: { bestScore: 85, bestAccuracy: 0.8, bestTime: 30000, achievedAt: 1700000000000 },
        },
        2
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { usePuzzleStore, getBestRecord } = await import('./store');
    const state = usePuzzleStore.getState();

    // quickDrillBest 被清除（已迁至 progress store）
    expect('quickDrillBest' in (state as unknown as Record<string, unknown>)).toBe(false);
    // 已有字段不被触碰
    expect(state.dailyCompleted).toEqual({ '2024-01-15': true });

    // 顺带验证导出纯函数 getBestRecord
    expect(getBestRecord(state, 'rush')).toBeNull();
    expect(getBestRecord(state, 'theme')).toBeNull();
  });
});
