import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import type { TrainingRecord } from '@/shared/types/training';

/**
 * strategy-academy store 课程/练习 action 契约：
 * - 课程进度 action 的幂等与状态派生（start / complete / quiz / practice）
 * - recordPracticeScore 入库前剥离 answers 并发出训练事件（fire-and-forget）
 * - 基础入门 / 自适应难度窗口 / 自适应配置的推进
 *
 * 认证 / 门禁 / 轨道 / 进步回放见 store.gates.test.ts。
 * 每例 resetModules + 空 localStorage，避免模块单例状态串扰。
 */

function makePracticeResult(overrides: Record<string, unknown> = {}) {
  return {
    lessonId: 'l1-basics',
    totalQuestions: 4,
    correctAnswers: 3,
    accuracy: 0.75,
    averageTime: 2.5,
    weakPoints: [],
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('strategy-academy store actions', () => {
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
    const eventsMod = await import('@/shared/stores/trainingEvents');
    return { ...storeMod, ...eventsMod };
  }

  it('初始形状：空进度 + 默认配置 + standard 变体', async () => {
    const { useAcademyStore } = await load();
    const s = useAcademyStore.getState();
    expect(s.progress).toEqual({
      completedLessons: [],
      quizScores: {},
      currentLesson: null,
      startedAt: 0,
      completedUnits: {},
    });
    expect(s.practiceResults).toEqual([]);
    expect(s.basicsProgress).toEqual({ currentStep: 0, completed: false });
    expect(s.adaptiveConfig.enabled).toBe(true);
    expect(s.activeVariant).toBe('standard');
    expect(s.dailyPlan).toBeNull();
    expect(s.certifications).toEqual({});
  });

  it('startLesson 记录当前课程，startedAt 只取首次时间', async () => {
    const { useAcademyStore } = await load();
    const { startLesson } = useAcademyStore.getState();
    const first = Date.now();
    startLesson('l1-basics');
    expect(useAcademyStore.getState().progress.currentLesson).toBe('l1-basics');
    expect(useAcademyStore.getState().progress.startedAt).toBe(first);

    vi.advanceTimersByTime(5000);
    startLesson('l1-position');
    expect(useAcademyStore.getState().progress.currentLesson).toBe('l1-position');
    expect(useAcademyStore.getState().progress.startedAt).toBe(first);
  });

  it('completeLesson 幂等：重复完成不产生重复 id，并清空 currentLesson', async () => {
    const { useAcademyStore } = await load();
    const s = useAcademyStore.getState();
    s.startLesson('l1-basics');
    s.completeLesson('l1-basics');
    s.completeLesson('l1-basics');
    expect(useAcademyStore.getState().progress.completedLessons).toEqual(['l1-basics']);
    expect(useAcademyStore.getState().progress.currentLesson).toBeNull();
    expect(useAcademyStore.getState().isCompleted('l1-basics')).toBe(true);
    expect(useAcademyStore.getState().isCompleted('l1-position')).toBe(false);
  });

  it('recordQuizScore 写入课程维度分数', async () => {
    const { useAcademyStore } = await load();
    useAcademyStore.getState().recordQuizScore('l1-basics', 90);
    useAcademyStore.getState().recordQuizScore('l1-basics', 80);
    expect(useAcademyStore.getState().progress.quizScores['l1-basics']).toBe(80);
  });

  it('recordPracticeScore 入库前剥离 answers、写 practice-* 分数并发出 practice 事件', async () => {
    const { useAcademyStore, trainingEvents } = await load();
    const received: TrainingRecord[] = [];
    const unsubscribe = trainingEvents.subscribe((record) => received.push(record));

    useAcademyStore.getState().recordPracticeScore(
      makePracticeResult({
        answers: [{ questionId: 'q1', isCorrect: true, timeTaken: 1 }],
      }) as never,
    );
    unsubscribe();

    const stored = useAcademyStore.getState().practiceResults;
    expect(stored).toHaveLength(1);
    expect('answers' in stored[0]!).toBe(false);
    expect(useAcademyStore.getState().progress.quizScores['practice-l1-basics']).toBe(75);

    expect(received).toHaveLength(1);
    const event = received[0]!;
    expect(event.module).toBe('strategy-academy');
    expect(event.mode).toBe('practice');
    expect(event.result).toMatchObject({
      totalQuestions: 4,
      correctAnswers: 3,
      accuracy: 0.75,
      averageTime: 2500,
    });
  });

  it('practiceResults 只保留最近 200 条', async () => {
    const { useAcademyStore } = await load();
    const seeded = Array.from({ length: 199 }, (_, i) =>
      makePracticeResult({ lessonId: `seed-${i}` }),
    );
    useAcademyStore.setState({ practiceResults: seeded as never });

    useAcademyStore.getState().recordPracticeScore(makePracticeResult({ lessonId: 'first' }) as never);
    expect(useAcademyStore.getState().practiceResults).toHaveLength(200);
    expect(useAcademyStore.getState().practiceResults.at(-1)?.lessonId).toBe('first');

    useAcademyStore.getState().recordPracticeScore(makePracticeResult({ lessonId: 'second' }) as never);
    const results = useAcademyStore.getState().practiceResults;
    expect(results).toHaveLength(200);
    expect(results.at(-1)?.lessonId).toBe('second');
    expect(results.some((r) => r.lessonId === 'seed-0')).toBe(false);
  });

  it('基础入门步骤推进 / 完成事件 / 重置', async () => {
    const { useAcademyStore, trainingEvents } = await load();
    const received: TrainingRecord[] = [];
    const unsubscribe = trainingEvents.subscribe((record) => received.push(record));

    useAcademyStore.getState().updateBasicsStep(3);
    expect(useAcademyStore.getState().basicsProgress.currentStep).toBe(3);

    useAcademyStore.getState().completeBasics();
    unsubscribe();
    const basics = useAcademyStore.getState().basicsProgress;
    expect(basics.completed).toBe(true);
    expect(basics.completedAt).toBe(Date.now());
    expect(received).toHaveLength(1);
    expect(received[0]!.mode).toBe('basics');

    useAcademyStore.getState().resetBasics();
    expect(useAcademyStore.getState().basicsProgress).toEqual({
      currentStep: 0,
      completed: false,
    });
  });

  it('recordPracticeResult 只维护自适应难度窗口，recentPracticeResults 只保留最近 50 条', async () => {
    const { useAcademyStore } = await load();
    useAcademyStore.getState().recordPracticeResult({
      isCorrect: true,
      timeTaken: 5,
      difficulty: 'beginner',
    });
    expect(useAcademyStore.getState().recentPracticeResults).toHaveLength(1);
    expect(useAcademyStore.getState()).not.toHaveProperty('abilityAssessment');

    const seeded = Array.from({ length: 50 }, () => ({
      isCorrect: false,
      timeTaken: 5,
      difficulty: 'beginner' as const,
    }));
    useAcademyStore.setState({ recentPracticeResults: seeded });
    useAcademyStore.getState().recordPracticeResult({
      isCorrect: false,
      timeTaken: 5,
      difficulty: 'advanced',
    });
    const recent = useAcademyStore.getState().recentPracticeResults;
    expect(recent).toHaveLength(50);
    expect(recent.at(-1)?.difficulty).toBe('advanced');
  });

  it('setAdaptiveConfig 局部合并，未传字段保持默认', async () => {
    const { useAcademyStore } = await load();
    useAcademyStore.getState().setAdaptiveConfig({ enabled: false, upgradeThreshold: 90 });
    const config = useAcademyStore.getState().adaptiveConfig;
    expect(config.enabled).toBe(false);
    expect(config.upgradeThreshold).toBe(90);
    expect(config.downgradeThreshold).toBe(60);
  });
});
