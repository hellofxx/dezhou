import type { Lesson, PracticeQuestion, QuestionDifficulty } from '../types';
import type { EloDimension } from '@/shared/types/elo';
import { getLessonMeta } from '../data/lessonMeta';

export type QuickDrillMode = 'range' | 'odds' | 'mixed';

const MODE_DIMENSION: Record<Exclude<QuickDrillMode, 'mixed'>, EloDimension> = {
  range: 'preflop',
  odds: 'math',
};

/**
 * 快速训练综合分数：accuracy * 100 + 时间奖励
 * 时间奖励每比 10s/题 快 1s 得 3 分（上限 30 分）。
 */
export function computeQuickDrillScore(accuracy: number, averageTime: number): number {
  const timeBonus = Math.max(0, Math.round((10 - averageTime) * 3));
  return Math.round(accuracy * 100) + timeBonus;
}

/**
 * 从策略课程题库中按模式与难度筛选快速训练题目。
 *
 * range 仅收 preflop，odds 仅收 math，mixed 允许全维度；未登记 lessonMeta 的课时
 * 维度回退 postflop。难度缺省按 beginner，与题库统计口径一致，绝不放宽难度。
 * 合格池内优先级：训练弱项课程 → ELO 弱点维度 → 其他课程题；各层随机排序。
 */
export function getQuickDrillQuestions(
  lessons: readonly Lesson[],
  weakAreas: readonly EloDimension[],
  difficulty: QuestionDifficulty,
  count: number = 10,
  excludeLessons: string[] = [],
  focusLessonIds: readonly string[] = [],
  mode: QuickDrillMode = 'mixed',
): PracticeQuestion[] {
  if (count <= 0) return [];

  const requiredDimension = mode === 'mixed' ? null : MODE_DIMENSION[mode];
  const focusRank = new Map(focusLessonIds.map((lessonId, index) => [lessonId, index]));
  const focused: Array<{ question: PracticeQuestion; rank: number }> = [];
  const weak: PracticeQuestion[] = [];
  const fallback: PracticeQuestion[] = [];

  for (const lesson of lessons) {
    const lessonQuestions = lesson.practice?.questions ?? [];
    if (lessonQuestions.length === 0) continue;

    const dimension = getLessonMeta(lesson.id).eloDimension;
    if (requiredDimension !== null && dimension !== requiredDimension) continue;
    if (excludeLessons.some((id) => lesson.id.startsWith(id))) continue;
    const isFocusLesson = focusLessonIds.includes(lesson.id);
    const matchesWeakArea = weakAreas.length === 0 || weakAreas.includes(dimension);

    for (const question of lessonQuestions) {
      if (excludeLessons.some((id) => question.id.startsWith(id))) {
        continue;
      }

      const matchesDifficulty = (question.difficulty ?? 'beginner') === difficulty;
      if (!matchesDifficulty) continue;

      if (isFocusLesson) {
        focused.push({ question, rank: focusRank.get(lesson.id) ?? focusLessonIds.length });
      } else if (matchesWeakArea) {
        weak.push(question);
      } else {
        fallback.push(question);
      }
    }
  }

  const focusedByRank = new Map<number, PracticeQuestion[]>();
  for (const entry of focused) {
    const questions = focusedByRank.get(entry.rank) ?? [];
    questions.push(entry.question);
    focusedByRank.set(entry.rank, questions);
  }
  // 单节课最多占半套题，保证聚焦层内仍有课程广度
  const perFocusLessonCap = Math.max(1, Math.ceil(count / 2));
  const focusedQuestions = [...focusedByRank.entries()]
    .toSorted(([a], [b]) => a - b)
    .flatMap(([, questions]) => shuffleArray(questions).slice(0, perFocusLessonCap));

  return [
    ...focusedQuestions,
    ...shuffleArray(weak),
    ...shuffleArray(fallback),
  ].slice(0, count);
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
