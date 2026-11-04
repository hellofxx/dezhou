/**
 * 级别认证题库构建（种子化纯函数）。
 *
 * 题池 = 该 Level **已应用题库**后的全部题目：L4 合并 4A + 4B，L7 含本土课
 * （合并由 `data/lessons/loaders` 完成，组件只传合并后的课程）。
 * 抽题走 shared `drawByAttempt`，键为 `cert-level-<n>` + 会话种子：
 * 同一种子题序稳定（考试过程中不变），换种子（重试 / 下一次进入）重新抽题。
 * 题量口径 = min(题池, 20)，**不再**复用 store 旧公式推导的 questionCount。
 */
import { drawByAttempt } from '@/shared/utils/academyQuizDraw';
import { getQuizCountForLevel } from './academyMeta';
import { orderQuizQuestion } from './quizShuffle';
import type { Lesson, QuizQuestion } from '../types';

/** 认证考试题量上限（题池不足时全量出题） */
export const CERTIFICATION_MAX_QUESTIONS = 20;

/** 抽题稳定键前缀（同 Level 共用键，attempt 位放会话种子） */
export const CERTIFICATION_DRAW_KEY_PREFIX = 'cert-level-';

export function getCertificationDrawKey(level: number): string {
  return `${CERTIFICATION_DRAW_KEY_PREFIX}${level}`;
}

/**
 * 题池大小。
 * - 传入完整课程：按实际题目数统计（唯一真实口径，L4/L7 的合并已由调用方完成）
 * - 未传入：回退目录层 quizCount 汇总（首页/卡片在课程未加载时预览用）
 */
export function getCertificationPoolSize(level: number, lessons?: readonly Lesson[]): number {
  if (lessons && lessons.length > 0) {
    return lessons.reduce((sum, lesson) => sum + lesson.quiz.length, 0);
  }
  return getQuizCountForLevel(level);
}

/** 本次考试题量 = min(题池, 20) */
export function getCertificationQuestionCount(
  level: number,
  lessons?: readonly Lesson[],
): number {
  return Math.min(getCertificationPoolSize(level, lessons), CERTIFICATION_MAX_QUESTIONS);
}

/**
 * 构建认证考试题目集：
 * 1. 汇总全部课程的已应用测验题为题池
 * 2. 按 `cert-level-<n>` + 会话种子抽 20 题（同种子稳定，换种子重洗）
 * 3. 每题用 `会话种子 + index` 派生种子重排选项（correctIndex 同步重映射）
 */
export function buildCertificationExam(
  lessons: readonly Lesson[],
  level: number,
  sessionSeed: number,
): QuizQuestion[] {
  const pool = lessons.flatMap((lesson) => lesson.quiz);
  return drawByAttempt(pool, {
    key: getCertificationDrawKey(level),
    attemptNumber: sessionSeed,
    size: CERTIFICATION_MAX_QUESTIONS,
  }).map((question, index) => orderQuizQuestion(question, sessionSeed + index));
}
