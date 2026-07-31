import { describe, expect, it, vi } from 'vitest';
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
});
