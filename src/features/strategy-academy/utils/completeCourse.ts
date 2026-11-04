/**
 * 课程/Drill 完成辅助函数
 *
 * 封装 handleDrillComplete / handleQuizComplete 的公共逻辑：
 * recordQuizScore → completeLesson → recordLessonAttempt
 * → trainingEvents.emit → 题级/课时级 SRS → recordTrainingDay
 *
 * P0 学习闭环口径（TDD §5.8）：
 * - 每次作答（含重考）都写 attempts 与训练日（Streak 口径不变），并照常 emit 训练事件；
 * - 题级 SRS：本次答错的题逐条入队（`strategy:<questionId>`，回链所属课时）；
 * - 课时级复习项只保留给「满分（无错题）」或 Drill 课，避免与题级重复占用人注意力。
 */
import { useAcademyStore } from '../store';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { useProgressStore } from '@/features/progress/store';
import { createReviewItem, toLocalDateString } from '@/shared/utils/spacedRepetition';
import { lessonTitleKey } from './titleKeys';
import { buildStrategyQuestionReviewItems } from './strategySrs';
import type { Lesson } from '../types';
import type { DrillResult } from '../components/drills/types';

export interface CompleteCourseParams {
  /** 课程/Drill ID */
  lessonId: string;
  /** 0-100 分数 */
  score: number;
  /** 完成模式 */
  mode: 'drill' | 'quiz';
  /** 课程对象（可选；用于 quiz 题库过滤与课时级复习项创建） */
  lesson?: Lesson;
  /** Drill 结果（仅 drill 模式需要） */
  drillResult?: DrillResult;
  /** 本次答错的题 id（quiz 模式；缺省视为未上报，按满分口径保留课时级复习项） */
  wrongQuestionIds?: string[];
  /** 本次实际答题量与答对数（缺省按分数与题量推算） */
  correctCount?: number;
  totalQuestions?: number;
}

/**
 * 完成课程/Drill 的统一处理函数（不负责 setPhase / setQuizScore 等 UI 状态，调用方自理）。
 */
export function completeCourse(params: CompleteCourseParams): void {
  const { lessonId, score, mode, lesson, drillResult, wrongQuestionIds } = params;
  const store = useAcademyStore.getState();

  const totalQuestions = params.totalQuestions ?? (mode === 'drill' ? drillResult?.total ?? 0 : lesson?.quiz.length ?? 0);
  const correctCount = params.correctCount
    ?? (mode === 'drill' ? drillResult?.correct ?? 0 : Math.round((score / 100) * totalQuestions));

  store.recordQuizScore(lessonId, score);
  store.completeLesson(lessonId);
  // 尝试记录：首次写 firstScore/firstCorrect/firstTotal（掌握度口径），每次更新 best/last
  store.recordLessonAttempt(lessonId, { score, correct: correctCount, total: totalQuestions });

  // 发射训练事件（mode 区分 drill/quiz，字段与原始回调完全一致）
  if (mode === 'drill' && drillResult) {
    trainingEvents.emit({
      id: `academy-${lessonId}-${Date.now()}`,
      module: 'strategy-academy',
      mode: 'drill',
      result: {
        sessionId: `academy-${lessonId}`,
        module: 'strategy-academy',
        totalQuestions: drillResult.total,
        correctAnswers: drillResult.correct,
        accuracy: drillResult.total > 0 ? drillResult.correct / drillResult.total : 0,
        averageTime: drillResult.timeTaken / Math.max(drillResult.total, 1),
        timestamp: Date.now(),
        details: [],
      },
      createdAt: Date.now(),
    });
  } else {
    // quiz 模式：题量/对题数用实际抽题口径（抽 5 题时不再按全量题库计）
    trainingEvents.emit({
      id: `academy-${lessonId}-${Date.now()}`,
      module: 'strategy-academy',
      mode: 'quiz',
      result: {
        sessionId: `academy-${lessonId}`,
        module: 'strategy-academy',
        totalQuestions,
        correctAnswers: correctCount,
        accuracy: totalQuestions > 0 ? correctCount / totalQuestions : score / 100,
        averageTime: 0,
        timestamp: Date.now(),
        details: [],
      },
      createdAt: Date.now(),
    });
  }

  const progressStore = useProgressStore.getState();
  const wrongIds = wrongQuestionIds ?? [];

  // 题级 SRS：本次答错的每一道题一条复习项（id = strategy:<questionId>）
  if (lesson && wrongIds.length > 0) {
    for (const item of buildStrategyQuestionReviewItems(lesson.id, lesson.quiz, wrongIds)) {
      progressStore.addReviewItem(item);
    }
  }

  // 课时级复习项：仅满分（无错题）或 Drill 课保留，避免与题级条目重复
  if (lesson && (mode === 'drill' || wrongIds.length === 0)) {
    // label 存 i18n key（academy.lessonTitle.<id>）而非中文原文：复习队列渲染 t(item.label)，
    // 存原文会让英文界面回显中文（契约见 AGENTS.md / PRD §12.4.3「复习态必须存 key」）
    const reviewItem = createReviewItem(lesson.id, lessonTitleKey(lesson.id), 'strategy');
    if (score >= 90) {
      reviewItem.interval = 3;
      const date = new Date();
      date.setDate(date.getDate() + 3);
      reviewItem.nextReviewDate = toLocalDateString(date);
    }
    progressStore.addReviewItem(reviewItem);
  }

  // 记录训练日（幂等，同日重复安全；重考同样计入——每次作答都是真实学习）
  progressStore.recordTrainingDay();
}
