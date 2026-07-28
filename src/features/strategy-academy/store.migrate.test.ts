import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub, buildPersistPayload } from '@/shared/utils/localStorageStub';

/**
 * strategy-academy store persist migrate 冒烟测试（v0 → v1）。
 * 通过预置旧版本 localStorage 数据触发 rehydrate 验证迁移。
 */
describe('strategy-academy store migrate (v0 → v1)', () => {
  it('v0 数据注入进步回放得分记录默认值，已有字段不被触碰', async () => {
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-hand-rankings'],
            completedDrills: [],
            currentLevel: 1,
            totalStudyMinutes: 0,
          },
        },
        0
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();

    // v1: 注入进步回放得分记录
    expect(state.firstAttemptScores).toEqual({});
    expect(state.lastAttemptScores).toEqual({});
    // 已有字段不被触碰
    expect(state.progress.completedLessons).toEqual(['l1-hand-rankings']);
  });
});
