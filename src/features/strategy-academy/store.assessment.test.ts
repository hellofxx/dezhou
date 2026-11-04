import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('strategy-academy store assessment', () => {
  beforeEach(() => {
    vi.resetModules();
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T08:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function load() {
    const storeMod = await import('./store');
    const metaMod = await import('./utils/academyMeta');
    return { ...storeMod, ...metaMod };
  }

  async function completeAllLevel1Lessons() {
    const { useAcademyStore, getLevelSummariesByNumber } = await load();
    const store = useAcademyStore;
    for (const lesson of getLevelSummariesByNumber(1).flatMap((entry) => entry.lessons)) {
      store.getState().completeLesson(lesson.id);
    }
    return store;
  }

  it('recordLessonAttempt：首考定掌握度，重考只更新 best/last', async () => {
    const { useAcademyStore } = await load();
    const store = useAcademyStore.getState();

    expect(store.recordLessonAttempt('l1-basics', { score: 80, correct: 4, total: 5 })).toEqual({
      isFirstAttempt: true,
    });
    expect(store.getLessonAttempt('l1-basics')).toMatchObject({
      attempts: 1,
      firstScore: 80,
      firstCorrect: 4,
      firstTotal: 5,
      bestScore: 80,
      lastScore: 80,
    });
    expect(useAcademyStore.getState().lessonAttempts['l1-basics']?.firstScore).toBe(80);

    expect(
      useAcademyStore.getState().recordLessonAttempt('l1-basics', {
        score: 60,
        correct: 3,
        total: 5,
      }),
    ).toEqual({ isFirstAttempt: false });
    expect(useAcademyStore.getState().getLessonAttempt('l1-basics')).toMatchObject({
      attempts: 2,
      firstScore: 80,
      bestScore: 80,
      lastScore: 60,
    });
    expect(useAcademyStore.getState().lessonAttempts['l1-basics']?.lastScore).toBe(60);
    expect(useAcademyStore.getState().lessonAttempts['l1-basics']?.firstScore).toBe(80);
  });

  it('cert：完成 Level 才能提交；通过后有效期内不可重考', async () => {
    const store = await completeAllLevel1Lessons();
    const state = store.getState();

    expect(state.getCertificationState(1)).toEqual({ status: 'available' });
    const accepted = state.submitCertificationAttempt(1, {
      score: 75,
      totalQuestions: 20,
      questionIds: ['q1'],
    });
    expect(accepted).toEqual({ accepted: true });
    expect(store.getState().certifications[1]).toMatchObject({
      variant: 'standard',
      questionCount: 20,
      totalQuestions: 20,
      poolSize: 20,
      questionIds: ['q1'],
      attempts: 1,
    });
    expect(store.getState().isCertified(1)).toBe(true);
    expect(store.getState().getCertificationState(1).status).toBe('valid');
    expect(
      store.getState().submitCertificationAttempt(1, { score: 90, totalQuestions: 20 }),
    ).toEqual({ accepted: false, reason: 'already-certified' });
  });

  it('cert：未完成 Level 拒绝；变体模式拒绝', async () => {
    const { useAcademyStore } = await load();
    expect(
      useAcademyStore.getState().submitCertificationAttempt(1, {
        score: 90,
        totalQuestions: 20,
      }),
    ).toEqual({ accepted: false, reason: 'not-completed' });

    const store = await completeAllLevel1Lessons();
    store.getState().switchVariant('heads-up');
    expect(
      store.getState().submitCertificationAttempt(1, { score: 90, totalQuestions: 20 }),
    ).toEqual({ accepted: false, reason: 'wrong-variant' });
  });

  it('cert：失败 24h 冷却，冷却结束可再考；过期可续期', async () => {
    const store = await completeAllLevel1Lessons();
    const first = store.getState().submitCertificationAttempt(1, {
      score: 50,
      totalQuestions: 20,
    });
    expect(first).toEqual({ accepted: true });
    expect(store.getState().getCertificationState(1).status).toBe('cooldown');
    expect(
      store.getState().submitCertificationAttempt(1, { score: 80, totalQuestions: 20 }),
    ).toMatchObject({ accepted: false, reason: 'cooldown' });

    vi.advanceTimersByTime(DAY_MS + 1000);
    expect(store.getState().getCertificationState(1).status).toBe('available');
    expect(
      store.getState().submitCertificationAttempt(1, { score: 80, totalQuestions: 20 }),
    ).toEqual({ accepted: true });
    expect(store.getState().isCertified(1)).toBe(true);

    vi.advanceTimersByTime(31 * DAY_MS);
    expect(store.getState().isCertified(1)).toBe(false);
    expect(store.getState().getCertificationState(1).status).toBe('expired');
    expect(
      store.getState().submitCertificationAttempt(1, { score: 80, totalQuestions: 20 }),
    ).toEqual({ accepted: true });
  });
});
