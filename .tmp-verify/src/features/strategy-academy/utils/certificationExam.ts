/**
 * P1E-09: 认证考试题目集构建（种子化纯函数）。
 *
 * 从 LevelCertification 组件中抽出：题池洗牌由 Math.random 改为
 * shuffleBySeed（会话种子），使"重试重洗"可控且可测试 —
 * handleRetry 重置 sessionSeed 后，题目集/题序/选项均重新洗牌。
 */
import { shuffleBySeed } from '@/shared/utils/seededShuffle';
import { orderQuizQuestion } from './quizShuffle';
import type { Lesson, QuizQuestion } from '../types';

/** 认证考试最大题数（与 AGENTS 认证口径一致：min(合并题池, 20)） */
export const CERTIFICATION_MAX_QUESTIONS = 20;

/**
 * 构建认证考试题目集：
 * 1. 合并全部课程的测验题为题池
 * 2. 按会话种子洗牌题序，取最多 20 题
 * 3. 每题用 `seed + index` 派生种子重排选项（correctIndex 同步重映射）
 *
 * 同一 seed 输出完全一致（考试过程中稳定）；不同 seed 重洗题目集与选项顺序。
 */
export function buildCertificationExam(lessons: Lesson[], sessionSeed: number): QuizQuestion[] {
  if (lessons.length === 0) return [];
  const pool: QuizQuestion[] = lessons.flatMap((lesson) => lesson.quiz);
  return shuffleBySeed(pool, sessionSeed)
    .slice(0, CERTIFICATION_MAX_QUESTIONS)
    .map((q, index) => orderQuizQuestion(q, sessionSeed + index));
}
