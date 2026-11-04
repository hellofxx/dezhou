import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

describe('strategy-academy store P2 tools', () => {
  beforeEach(() => {
    vi.resetModules();
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function load() {
    return import('./store');
  }

  it('placement 只放宽 L1-L4B 条目，不写 completedLessons，L5+ 仍需实际完成', async () => {
    const { useAcademyStore } = await load();
    const store = useAcademyStore.getState();
    store.recordPlacement({
      recommendedLevelId: 'l4b',
      creditLevels: ['l1', 'l2', 'l3', 'l4a', 'l4b'],
      correct: 15,
      total: 16,
    });

    expect(useAcademyStore.getState().progress.completedLessons).toEqual([]);
    expect(useAcademyStore.getState().isLevelEntryUnlocked('l2')).toBe(true);
    expect(useAcademyStore.getState().isLevelEntryUnlocked('l4b')).toBe(true);
    // L5 的上一级 l4b 在 credit 中，但 L5 不接受 credit 旁路
    expect(useAcademyStore.getState().isLevelEntryUnlocked('l5')).toBe(false);
  });

  it('checkpoint 首次/重考与书签/笔记持久化', async () => {
    const { useAcademyStore, MAX_LESSON_NOTE_LENGTH } = await load();
    const store = useAcademyStore.getState();

    expect(store.recordCheckpointAttempt(1, { score: 60, questionIds: ['q1'] })).toEqual({
      isFirstAttempt: true,
    });
    expect(useAcademyStore.getState().recordCheckpointAttempt(1, { score: 90, questionIds: ['q2'] })).toEqual({
      isFirstAttempt: false,
    });
    expect(useAcademyStore.getState().checkpoints[1]).toMatchObject({
      attempts: 2,
      firstScore: 60,
      bestScore: 90,
      lastScore: 90,
    });

    useAcademyStore.getState().toggleLessonBookmark('l1-basics');
    expect(useAcademyStore.getState().bookmarkedLessons).toEqual(['l1-basics']);
    useAcademyStore.getState().toggleLessonBookmark('l1-basics');
    expect(useAcademyStore.getState().bookmarkedLessons).toEqual([]);

    useAcademyStore.getState().saveLessonNote('l1-basics', `  ${'x'.repeat(2100)}  `);
    expect(useAcademyStore.getState().lessonNotes['l1-basics']?.text).toHaveLength(
      MAX_LESSON_NOTE_LENGTH,
    );
    useAcademyStore.getState().saveLessonNote('l1-basics', '   ');
    expect(useAcademyStore.getState().lessonNotes['l1-basics']).toBeUndefined();
  });
});
