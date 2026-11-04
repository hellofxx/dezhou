import type { Lesson, PracticeQuestion, QuestionDifficulty } from '../types';
import type { EloDimension } from '@/shared/types/elo';
import { getLessonMeta } from '../data/lessonMeta';

/**
 * 快速训练综合分数：accuracy * 100 + 时间奖励
 * 时间奖励每比 10s/题 快 1s 得 3 分（上限 30 分）。
 */
export function computeQuickDrillScore(accuracy: number, averageTime: number): number {
  const timeBonus = Math.max(0, Math.round((10 - averageTime) * 3));
  return Math.round(accuracy * 100) + timeBonus;
}

/**
 * 从全局题库中按条件筛选快速训练题目
 * 用于"5分钟速训"功能
 *
 * P0 口径：弱点过滤按 ELO 维度（EloDimension）经课时 lessonMeta 映射到题目，
 * 不再使用能力评估五维（自适应难度只消费 recordPracticeResult 维护的练习窗口）。
 * 未登记 lessonMeta 的课时回退 postflop（T3 填充后全量覆盖）。
 */
export function getQuickDrillQuestions(
  lessons: readonly Lesson[],
  weakAreas: readonly EloDimension[],
  difficulty: QuestionDifficulty,
  count: number = 10,
  excludeLessons: string[] = []
): PracticeQuestion[] {
  const candidates: PracticeQuestion[] = [];

  // 1. 优先选择与弱点维度/难度匹配的题目（课时维度由 lessonMeta 决定）
  for (const lesson of lessons) {
    const lessonQuestions = lesson.practice?.questions ?? [];
    if (lessonQuestions.length === 0) continue;
    const dimension = getLessonMeta(lesson.id).eloDimension;
    const lessonExcluded = excludeLessons.some((id) => lesson.id.startsWith(id));

    for (const q of lessonQuestions) {
      if (lessonExcluded || excludeLessons.some((id) => q.id.startsWith(id))) continue;

      const matchesDifficulty = !q.difficulty || q.difficulty === difficulty;
      const matchesWeakArea = weakAreas.length === 0 || weakAreas.includes(dimension);

      if (matchesDifficulty && matchesWeakArea) {
        candidates.push(q);
      }
    }
  }

  // 2. 如果候选不够，放宽条件
  if (candidates.length < count) {
    for (const q of collectAllPracticeQuestions(lessons)) {
      if (candidates.includes(q)) continue;
      if (excludeLessons.some((id) => q.id.startsWith(id))) continue;
      candidates.push(q);
      if (candidates.length >= count * 2) break;
    }
  }

  // 3. 随机抽取指定数量
  return shuffleArray(candidates).slice(0, count);
}

/**
 * 收集所有课程中的 practice questions
 */
export function collectAllPracticeQuestions(
  lessons: readonly Lesson[],
): PracticeQuestion[] {
  const allLessons = lessons;
  const questions: PracticeQuestion[] = [];

  for (const lesson of allLessons) {
    if (lesson.practice && lesson.practice.questions.length > 0) {
      questions.push(...lesson.practice.questions);
    }
  }

  return questions;
}

/**
 * 获取题库统计信息
 */
export function getQuestionPoolStats(
  lessons: readonly Lesson[],
): {
  total: number;
  byDifficulty: Record<QuestionDifficulty, number>;
  byStreet: Record<string, number>;
} {
  const allQuestions = collectAllPracticeQuestions(lessons);
  const byDifficulty: Record<QuestionDifficulty, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  };
  const byStreet: Record<string, number> = {};

  for (const q of allQuestions) {
    const diff = q.difficulty ?? 'beginner';
    byDifficulty[diff]++;
    const street = q.scenario.street;
    byStreet[street] = (byStreet[street] ?? 0) + 1;
  }

  return { total: allQuestions.length, byDifficulty, byStreet };
}

/** Fisher-Yates 洗牌 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}
