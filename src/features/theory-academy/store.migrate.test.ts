import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createLocalStorageStub, buildPersistPayload } from '@/shared/utils/localStorageStub';

/**
 * theory-academy store persist migrate 冒烟测试（v0 → v1）。
 * 通过预置旧版本 localStorage 数据触发 rehydrate 验证迁移。
 */
describe('theory-academy store migrate (v0 → v1)', () => {
  it('v0 数据 progress 部分缺失时防御性合并默认值，已有字段不被触碰', async () => {
    const storageStub = createLocalStorageStub({
      'theory-academy-progress': buildPersistPayload(
        {
          // 模拟异常旧数据：progress 只有部分字段
          progress: {
            completedChapters: ['t1-combinatorics'],
            quizScores: { 't1-combinatorics': 80 },
          },
        },
        0
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useTheoryStore } = await import('./store');
    const state = useTheoryStore.getState();

    // v1: 缺失字段被注入默认值
    expect(state.progress.currentChapter).toBeNull();
    expect(state.progress.startedAt).toBe(0);
    // 已有字段不被触碰
    expect(state.progress.completedChapters).toEqual(['t1-combinatorics']);
    expect(state.progress.quizScores).toEqual({ 't1-combinatorics': 80 });
    // 迁移后 action 可正常读取旧数据
    expect(state.isChapterCompleted('t1-combinatorics')).toBe(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });
});

/**
 * theory-academy store persist migrate 测试（v1 → v2）。
 * 预置 v1 数据（无 flaggedQuestions 字段）触发 rehydrate，
 * 验证 migrate 注入默认值且原有进度不丢失。
 */
describe('theory-academy store migrate (v1 → v2)', () => {
  let storageStub: ReturnType<typeof createLocalStorageStub>;

  beforeEach(() => {
    storageStub = createLocalStorageStub({
      'theory-academy-progress': buildPersistPayload(
        {
          progress: {
            completedChapters: ['t1-combinatorics'],
            quizScores: { 't1-combinatorics': 80 },
            currentChapter: 't1-combinatorics',
            startedAt: 1000,
          },
        },
        1
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('v1 数据迁移后注入 flaggedQuestions 默认值且保留原有进度', async () => {
    const { useTheoryStore } = await import('./store');
    const { progress } = useTheoryStore.getState();
    expect(progress.flaggedQuestions).toEqual([]);
    expect(progress.completedChapters).toEqual(['t1-combinatorics']);
    expect(progress.quizScores['t1-combinatorics']).toBe(80);
    expect(progress.currentChapter).toBe('t1-combinatorics');
    expect(progress.startedAt).toBe(1000);
  });

  it('toggleFlagQuestion 幂等切换', async () => {
    const { useTheoryStore } = await import('./store');
    const { toggleFlagQuestion } = useTheoryStore.getState();
    toggleFlagQuestion('t1-combinatorics-q1');
    expect(useTheoryStore.getState().progress.flaggedQuestions).toEqual(['t1-combinatorics-q1']);
    toggleFlagQuestion('t1-combinatorics-q1');
    expect(useTheoryStore.getState().progress.flaggedQuestions).toEqual([]);
    // 迁移数据不受 toggle 影响（flag 后原有字段保持）
    expect(useTheoryStore.getState().progress.completedChapters).toEqual(['t1-combinatorics']);
  });
});

/**
 * theory-academy store persist migrate 测试（v2 → v3）。
 * 预置 v2 数据（无 activeVariant / variantMetadata 字段）触发 rehydrate，
 * 验证 migrate 注入变体上下文字段默认值且原有进度不丢失。
 */
describe('theory-academy store migrate (v2 → v3)', () => {
  let storageStub: ReturnType<typeof createLocalStorageStub>;

  beforeEach(() => {
    storageStub = createLocalStorageStub({
      'theory-academy-progress': buildPersistPayload(
        {
          progress: {
            completedChapters: ['t1-combinatorics', 't1-outs'],
            quizScores: { 't1-combinatorics': 80, 't1-outs': 100 },
            currentChapter: 't1-outs',
            startedAt: 2000,
            flaggedQuestions: ['t1-combinatorics-q2'],
          },
        },
        2
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('v2 数据迁移后注入 activeVariant=standard 与 variantMetadata 默认值且保留原有进度', async () => {
    const { useTheoryStore } = await import('./store');
    const { progress } = useTheoryStore.getState();
    expect(progress.activeVariant).toBe('standard');
    expect(progress.variantMetadata).toEqual({
      standard: { lastViewedAt: expect.any(Number), preferredOrder: 0 },
      'short-deck': { lastViewedAt: 0, preferredOrder: 1 },
      'heads-up': { lastViewedAt: 0, preferredOrder: 2 },
    });
    // 原有进度完整保留
    expect(progress.completedChapters).toEqual(['t1-combinatorics', 't1-outs']);
    expect(progress.quizScores['t1-outs']).toBe(100);
    expect(progress.currentChapter).toBe('t1-outs');
    expect(progress.startedAt).toBe(2000);
    expect(progress.flaggedQuestions).toEqual(['t1-combinatorics-q2']);
  });
});
