import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

/**
 * strategy-academy store 门禁 / 认证 / 轨道 / 进步回放契约：
 * - Level 门禁按 LevelInfo 条目判定（l4a/l4b 不互相放行，调试解锁旁路）
 * - 同 level 数字的多条目（L4A+L4B）按合并口径统计完成度
 * - 认证过期视为未达成（ACAD-02）；轨道完成按课程集合判定
 * - resetProgress 联动清理全部派生状态（ACAD-08）
 *
 * 课程/练习 action 见 store.actions.test.ts。
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function makePracticeResult() {
  return {
    lessonId: 'l1-basics',
    totalQuestions: 4,
    correctAnswers: 3,
    accuracy: 0.75,
    averageTime: 2.5,
    weakPoints: [],
    timestamp: Date.now(),
  };
}

describe('strategy-academy store gates', () => {
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
    const debugMod = await import('@/shared/stores/debugMode');
    const tracksMod = await import('./data/learningTracks');
    return { ...storeMod, ...metaMod, ...debugMod, ...tracksMod };
  }

  it('Level 门禁：L1 需完成基础入门；完成 L1 全部课程解锁 L2', async () => {
    const { useAcademyStore, getLevelSummariesByNumber } = await load();
    expect(useAcademyStore.getState().isLevelEntryUnlocked('l1')).toBe(false);
    expect(useAcademyStore.getState().isLevelUnlocked(1)).toBe(false);

    useAcademyStore.getState().completeBasics();
    expect(useAcademyStore.getState().isLevelEntryUnlocked('l1')).toBe(true);
    expect(useAcademyStore.getState().isLevelUnlocked(1)).toBe(true);

    for (const lesson of getLevelSummariesByNumber(1).flatMap((entry) => entry.lessons)) {
      useAcademyStore.getState().completeLesson(lesson.id);
    }
    expect(useAcademyStore.getState().isLevelEntryUnlocked('l2')).toBe(true);
  });

  it('未知 Level 条目返回 false（不误放行）', async () => {
    const { useAcademyStore } = await load();
    expect(useAcademyStore.getState().isLevelEntryUnlocked('l99')).toBe(false);
    expect(useAcademyStore.getState().isLevelUnlocked(99)).toBe(false);
  });

  it('调试解锁激活时 Level 门禁全部放行', async () => {
    const { useAcademyStore, useDebugModeStore, DEBUG_UNLOCK_CODE } = await load();
    expect(useAcademyStore.getState().isLevelEntryUnlocked('l8')).toBe(false);
    expect(useDebugModeStore.getState().activateWithCode(DEBUG_UNLOCK_CODE)).toBe(true);
    expect(useAcademyStore.getState().isLevelEntryUnlocked('l8')).toBe(true);
    expect(useAcademyStore.getState().isLevelUnlocked(8)).toBe(true);
  });

  it('getLevelProgress / getTotalProgress 按已完成课程占比四舍五入', async () => {
    const { useAcademyStore, getLevelSummaries, getLevelSummariesByNumber } = await load();
    const level1Lessons = getLevelSummariesByNumber(1).flatMap((entry) => entry.lessons);
    expect(useAcademyStore.getState().getLevelProgress(1)).toBe(0);
    expect(useAcademyStore.getState().getLevelProgress(99)).toBe(0);
    expect(useAcademyStore.getState().getTotalProgress()).toBe(0);

    useAcademyStore.getState().completeLesson(level1Lessons[0]!.id);
    useAcademyStore.getState().completeLesson(level1Lessons[1]!.id);
    expect(useAcademyStore.getState().getLevelProgress(1)).toBe(
      Math.round((2 / level1Lessons.length) * 100),
    );

    const total = getLevelSummaries().flatMap((entry) => entry.lessons).length;
    expect(useAcademyStore.getState().getTotalProgress()).toBe(Math.round((2 / total) * 100));
  });

  it('resetProgress 清空全部进度派生状态（ACAD-08）', async () => {
    const { useAcademyStore } = await load();
    const s = useAcademyStore.getState();
    s.completeLesson('l1-basics');
    s.recordQuizScore('l1-basics', 90);
    s.recordPracticeScore(makePracticeResult() as never);
    s.updateAbility({ isCorrect: true, timeTaken: 5, difficulty: 'beginner' });
    s.attemptCertification(1, 90);
    s.setActiveTrack('track-beginner');
    s.recordAttemptScore('l1-basics', 80);
    s.refreshDailyPlan();

    useAcademyStore.getState().resetProgress();
    const reset = useAcademyStore.getState();
    expect(reset.progress.completedLessons).toEqual([]);
    expect(reset.progress.quizScores).toEqual({});
    expect(reset.practiceResults).toEqual([]);
    expect(reset.recentPracticeResults).toEqual([]);
    expect(reset.certifications).toEqual({});
    expect(reset.activeTrackId).toBeNull();
    expect(reset.firstAttemptScores).toEqual({});
    expect(reset.lastAttemptScores).toEqual({});
    expect(reset.dailyPlan).toBeNull();
    expect(reset.basicsProgress).toEqual({ currentStep: 0, completed: false });
    expect(reset.abilityAssessment.rangeKnowledge).toBe(50);
  });

  it('isLevelLessonsCompleted 按合并 level 数字判定全部课程完成', async () => {
    const { useAcademyStore, getLevelSummariesByNumber } = await load();
    const level1 = getLevelSummariesByNumber(1).flatMap((entry) => entry.lessons);
    expect(useAcademyStore.getState().isLevelLessonsCompleted(1)).toBe(false);
    for (const lesson of level1.slice(0, -1)) {
      useAcademyStore.getState().completeLesson(lesson.id);
    }
    expect(useAcademyStore.getState().isLevelLessonsCompleted(1)).toBe(false);
    useAcademyStore.getState().completeLesson(level1.at(-1)!.id);
    expect(useAcademyStore.getState().isLevelLessonsCompleted(1)).toBe(true);
    expect(useAcademyStore.getState().isLevelLessonsCompleted(99)).toBe(false);
  });

  it('areAllLevelsCertified 需全部 Level 认证且未过期（ACAD-02）', async () => {
    const { useAcademyStore, getLevelNumbers } = await load();
    expect(useAcademyStore.getState().areAllLevelsCertified()).toBe(false);
    for (const level of getLevelNumbers()) {
      useAcademyStore.getState().attemptCertification(level, 90);
    }
    expect(useAcademyStore.getState().areAllLevelsCertified()).toBe(true);

    vi.setSystemTime(Date.now() + 31 * DAY_MS);
    expect(useAcademyStore.getState().areAllLevelsCertified()).toBe(false);
  });

  it('isTrackCompleted：指定轨道 / any / 未知轨道', async () => {
    const { useAcademyStore, LEARNING_TRACKS } = await load();
    const track = LEARNING_TRACKS[0]!;
    expect(useAcademyStore.getState().isTrackCompleted(track.id)).toBe(false);
    expect(useAcademyStore.getState().isTrackCompleted('any')).toBe(false);
    expect(useAcademyStore.getState().isTrackCompleted('not-a-track')).toBe(false);

    for (const lessonId of track.lessonIds) {
      useAcademyStore.getState().completeLesson(lessonId);
    }
    expect(useAcademyStore.getState().isTrackCompleted(track.id)).toBe(true);
    expect(useAcademyStore.getState().isTrackCompleted('any')).toBe(true);
  });

  it('setActiveTrack / switchVariant 更新 UI 上下文', async () => {
    const { useAcademyStore } = await load();
    useAcademyStore.getState().setActiveTrack('track-gto');
    expect(useAcademyStore.getState().activeTrackId).toBe('track-gto');

    useAcademyStore.getState().switchVariant('short-deck');
    expect(useAcademyStore.getState().activeVariant).toBe('short-deck');
    useAcademyStore.getState().switchVariant('standard');
    expect(useAcademyStore.getState().activeVariant).toBe('standard');
  });

  it('recordAttemptScore 保留首次分数、刷新最近分数；getProgressForLesson 给出提升幅度', async () => {
    const { useAcademyStore } = await load();
    expect(useAcademyStore.getState().getProgressForLesson('l1-basics')).toBeNull();

    useAcademyStore.getState().recordAttemptScore('l1-basics', 40);
    expect(useAcademyStore.getState().getProgressForLesson('l1-basics')).toEqual({
      first: 40,
      last: 40,
      improvement: 0,
    });

    useAcademyStore.getState().recordAttemptScore('l1-basics', 75);
    expect(useAcademyStore.getState().firstAttemptScores['l1-basics']).toBe(40);
    expect(useAcademyStore.getState().lastAttemptScores['l1-basics']).toBe(75);
    expect(useAcademyStore.getState().getProgressForLesson('l1-basics')).toEqual({
      first: 40,
      last: 75,
      improvement: 35,
    });
  });
});
