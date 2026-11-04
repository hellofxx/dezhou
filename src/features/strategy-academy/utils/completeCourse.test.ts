import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import type { Lesson } from '../types';
import { lessonTitleKey } from './titleKeys';

/**
 * completeCourse 的 SRS 入队契约用例（PRD §12.4.3「复习/回忆类状态必须存 i18n key」）。
 *
 * 缺陷原型：早期实现把数据层**课时中文原文**写进 reviewItem.label，
 * 而 SpacedRepetitionPanel / ReviewSession 走 t(item.label)，
 * i18next 未命中 key 时原样回显入参 → 英文界面复习队列回显中文课名。
 * 本用例锁定「入队 label 必须是 key、且不得等于 lesson.title」，防止回归。
 *
 * 存量脏数据由 progress store 的 v16→v17 迁移改写
 * （见 @/features/progress/utils/migrateStrategyReviewKeys.ts）。
 */

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'l3-cbet',
    level: 3,
    order: 1,
    title: '持续下注（C-Bet）',
    subtitle: '测试副标题',
    duration: '10 min',
    content: [],
    quiz: [],
    ...overrides,
  };
}

async function loadStores() {
  const { completeCourse } = await import('./completeCourse');
  const { useProgressStore } = await import('@/features/progress/store');
  const { useAcademyStore } = await import('../store');
  return { completeCourse, useProgressStore, useAcademyStore };
}

beforeEach(() => {
  const storageStub = createLocalStorageStub();
  // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
  vi.stubGlobal('localStorage', storageStub);
  vi.stubGlobal('window', { localStorage: storageStub });
});

describe('completeCourse 复习项 label 语言中立', () => {
  it('quiz 完成后入队的 label 为 academy.lessonTitle.<id>，而非中文原文', async () => {
    const { completeCourse, useProgressStore } = await loadStores();
    const lesson = makeLesson();

    completeCourse({ lessonId: lesson.id, score: 80, mode: 'quiz', lesson });

    const item = useProgressStore.getState().reviewItems.find((r) => r.id === lesson.id);
    expect(item).toBeDefined();
    expect(item!.label).toBe(lessonTitleKey(lesson.id));
    expect(item!.label).toBe('academy.lessonTitle.l3-cbet');
    // 关键断言：不得与数据层中文原文同值（英文界面会原样回显）
    expect(item!.label).not.toBe(lesson.title);
    expect(item!.label).not.toMatch(/[一-鿿]/);
    expect(item!.category).toBe('strategy');
  });

  it('高分复习项保留 interval 3 天调整，且 label 仍为 key', async () => {
    const { completeCourse, useProgressStore } = await loadStores();
    const lesson = makeLesson({ id: 'l4-mdf', title: '最小防御频率 (MDF)' });

    completeCourse({ lessonId: lesson.id, score: 95, mode: 'quiz', lesson });

    const item = useProgressStore.getState().reviewItems.find((r) => r.id === lesson.id);
    expect(item!.label).toBe('academy.lessonTitle.l4-mdf');
    expect(item!.interval).toBe(3);
  });

  it('同一课程重复完成不重复入队（addReviewItem 幂等，label 保持 key 形态）', async () => {
    const { completeCourse, useProgressStore } = await loadStores();
    const lesson = makeLesson({ id: 'l2-squeeze', title: 'Squeeze Play' });

    completeCourse({ lessonId: lesson.id, score: 60, mode: 'quiz', lesson });
    completeCourse({ lessonId: lesson.id, score: 90, mode: 'quiz', lesson });

    const items = useProgressStore.getState().reviewItems.filter((r) => r.id === lesson.id);
    expect(items).toHaveLength(1);
    expect(items[0]!.label).toBe('academy.lessonTitle.l2-squeeze');
  });
});

describe('completeCourse：题级 SRS 与尝试记录（P0 学习闭环）', () => {
  beforeEach(async () => {
    const { useProgressStore, useAcademyStore } = await loadStores();
    useProgressStore.setState({ reviewItems: [] });
    useAcademyStore.getState().resetProgress();
  });

  const quiz = [
    { id: 'q1', question: '题目一', options: ['A', 'B'], correctIndex: 0, explanation: '解析一' },
    { id: 'q2', question: '题目二', options: ['A', 'B'], correctIndex: 1, explanation: '解析二' },
  ];

  it('答错题逐条入题级 SRS（strategy:<qid>，label/front/back 为 key，回链所属课时）', async () => {
    const { completeCourse, useProgressStore } = await loadStores();
    const lesson = makeLesson({ quiz });

    completeCourse({
      lessonId: lesson.id,
      score: 50,
      mode: 'quiz',
      lesson,
      wrongQuestionIds: ['q2'],
      correctCount: 1,
      totalQuestions: 2,
    });

    const item = useProgressStore.getState().reviewItems.find((r) => r.id === 'strategy:q2');
    expect(item).toBeDefined();
    expect(item!.label).toBe('academy.lessonQuiz.q2.question');
    expect(item!.metadata?.front).toBe('academy.lessonQuiz.q2.question');
    expect(item!.metadata?.back).toBe('academy.lessonQuiz.q2.explanation');
    expect(item!.metadata?.route).toBe(`/academy/lesson/${lesson.id}`);
    expect(item!.category).toBe('strategy');
    // 有错题时不重复建课时级复习项（避免与题级条目重叠）
    expect(useProgressStore.getState().reviewItems.some((r) => r.id === lesson.id)).toBe(false);
  });

  it('未知题 id 不产生复习项（无死链）', async () => {
    const { completeCourse, useProgressStore } = await loadStores();
    const lesson = makeLesson({ quiz });

    completeCourse({ lessonId: lesson.id, score: 0, mode: 'quiz', lesson, wrongQuestionIds: ['not-in-bank'] });

    expect(useProgressStore.getState().reviewItems.some((r) => r.id.startsWith('strategy:'))).toBe(false);
  });

  it('满分（无错题）与 Drill 完成仍保留课时级复习项', async () => {
    const { completeCourse, useProgressStore } = await loadStores();
    const lesson = makeLesson({ quiz });

    completeCourse({ lessonId: lesson.id, score: 100, mode: 'quiz', lesson, wrongQuestionIds: [], totalQuestions: 2 });
    completeCourse({
      lessonId: 'drill-outs',
      score: 70,
      mode: 'drill',
      lesson: makeLesson({ id: 'drill-outs', type: 'drill', quiz: [] }),
      drillResult: { correct: 7, total: 10, timeTaken: 60 },
      wrongQuestionIds: ['drill-q1'],
    });

    const ids = useProgressStore.getState().reviewItems.map((item) => item.id);
    expect(ids).toContain(lesson.id);
    expect(ids).toContain('drill-outs');
  });

  it('每次完成（含重考）都写尝试记录与训练日，首考分不被重考覆盖', async () => {
    const { completeCourse, useAcademyStore, useProgressStore } = await loadStores();
    const lesson = makeLesson({ quiz });
    // 训练日入口每次完成都必须调用（Streak 口径不变），用 spy 锁定调用次数
    const trainingDaySpy = vi.spyOn(useProgressStore.getState(), 'recordTrainingDay');

    completeCourse({ lessonId: lesson.id, score: 100, mode: 'quiz', lesson, wrongQuestionIds: [], totalQuestions: 2 });
    completeCourse({ lessonId: lesson.id, score: 50, mode: 'quiz', lesson, wrongQuestionIds: ['q1'], correctCount: 1, totalQuestions: 2 });

    expect(trainingDaySpy).toHaveBeenCalledTimes(2);
    trainingDaySpy.mockRestore();

    const attempt = useAcademyStore.getState().lessonAttempts[lesson.id]!;
    expect(attempt.attempts).toBe(2);
    expect(attempt.firstScore).toBe(100);
    expect(attempt.lastScore).toBe(50);
    expect(attempt.bestScore).toBe(100);
  });
});
