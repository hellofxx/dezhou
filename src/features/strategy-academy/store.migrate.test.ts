import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub, buildPersistPayload } from '@/shared/utils/localStorageStub';

/**
 * strategy-academy store persist migrate 冒烟测试（v0 → v1 / v3 → v4）。
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

describe('strategy-academy store migrate (v3 → v4)', () => {
  it('v3 数据补齐 completedUnits 默认空映射，已有字段不被触碰', async () => {
    vi.resetModules();
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-hand-rankings'],
            quizScores: { 'l1-hand-rankings': 90 },
            currentLesson: null,
            startedAt: 1700000000000,
          },
        },
        3
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();

    // v4: 注入小节完成记录默认空映射
    expect(state.progress.completedUnits).toEqual({});
    // 已有字段不被触碰
    expect(state.progress.completedLessons).toEqual(['l1-hand-rankings']);
    expect(state.progress.quizScores).toEqual({ 'l1-hand-rankings': 90 });
  });

  it('v4 数据已有 completedUnits 不被 migrate 覆盖', async () => {
    vi.resetModules();
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-hand-rankings'],
            quizScores: {},
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: { 'l1-hand-rankings': ['u1', 'u2'] },
          },
        },
        4
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();

    expect(state.progress.completedUnits).toEqual({ 'l1-hand-rankings': ['u1', 'u2'] });
  });
});

describe('strategy-academy store migrate (v4 → v5)', () => {
  it('v4 数据注入 activeVariant 默认值 standard，已有字段不被触碰', async () => {
    vi.resetModules();
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-hand-rankings'],
            quizScores: {},
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: {},
          },
        },
        4
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();

    // v5: 注入变体上下文默认值
    expect(state.activeVariant).toBe('standard');
    // 已有字段不被触碰
    expect(state.progress.completedLessons).toEqual(['l1-hand-rankings']);
  });

  it('v5 数据已有 activeVariant 不被 migrate 覆盖', async () => {
    vi.resetModules();
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: [],
            quizScores: {},
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: {},
          },
          activeVariant: 'short-deck',
        },
        5
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();

    expect(state.activeVariant).toBe('short-deck');
  });
});
