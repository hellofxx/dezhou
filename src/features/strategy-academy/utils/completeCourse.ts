/**
 * 课程/Drill 完成辅助函数
 *
 * 封装 handleDrillComplete / handleQuizComplete 的公共逻辑：
 * recordQuizScore → recordAttemptScore → completeLesson → trainingEvents.emit
 * → createReviewItem → addReviewItem → recordTrainingDay
 *
 * P2-01: 从 CourseView 提取，用于消除两个高度重复的完成回调。
 */
import { useAcademyStore } from '../store';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { useProgressStore, createReviewItem, toLocalDateString } from '@/features/progress';
import type { Lesson } from '../types';
import type { DrillResult } from '../components/drills/types';

export interface CompleteCourseParams {
  /** 课程/Drill ID */
  lessonId: string;
  /** 0-100 分数 */
  score: number;
  /** 完成模式 */
  mode: 'drill' | 'quiz';
  /** 课程对象（可选；用于 quiz 题数统计与复习项创建） */
  lesson?: Lesson;
  /** Drill 结果（仅 drill 模式需要） */
  drillResult?: DrillResult;
}

/**
 * 完成课程/Drill 的统一处理函数。
 *
 * 行为等价于原始 handleDrillComplete / handleQuizComplete 的公共部分：
 * - 记录分数到 academy store（recordQuizScore + recordAttemptScore）
 * - 标记课程完成（completeLesson）
 * - 发射训练事件（trainingEvents.emit，mode 区分 drill/quiz）
 * - 创建复习项（高分调整 interval 为 3 天）
 * - 记录训练日（recordTrainingDay，幂等）
 *
 * 注意：本函数不负责 setPhase / setQuizScore / setDrillResult 等 UI 状态更新，
 * 调用方需自行处理。
 */
export function completeCourse(params: CompleteCourseParams): void {
  const { lessonId, score, mode, lesson, drillResult } = params;
  const store = useAcademyStore.getState();

  store.recordQuizScore(lessonId, score);
  store.recordAttemptScore(lessonId, score);
  store.completeLesson(lessonId);

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
        averageTime: drillResult.timeTaken / 1000 / Math.max(drillResult.total, 1),
        timestamp: Date.now(),
        details: [],
      },
      createdAt: Date.now(),
    });
  } else {
    // quiz 模式
    const qLen = lesson?.quiz.length ?? 0;
    trainingEvents.emit({
      id: `academy-${lessonId}-${Date.now()}`,
      module: 'strategy-academy',
      mode: 'quiz',
      result: {
        sessionId: `academy-${lessonId}`,
        module: 'strategy-academy',
        totalQuestions: qLen,
        correctAnswers: Math.round((score / 100) * qLen),
        accuracy: score / 100,
        averageTime: 0,
        timestamp: Date.now(),
        details: [],
      },
      createdAt: Date.now(),
    });
  }

  // 创建/更新复习项（仅当 lesson 对象存在时）
  if (lesson) {
    const reviewItem = createReviewItem(lesson.id, lesson.title, 'strategy');
    if (score >= 90) {
      reviewItem.interval = 3;
      const date = new Date();
      date.setDate(date.getDate() + 3);
      reviewItem.nextReviewDate = toLocalDateString(date);
    }
    useProgressStore.getState().addReviewItem(reviewItem);
  }

  // 记录训练日（幂等，同日重复安全）
  useProgressStore.getState().recordTrainingDay();
}